/**
 * HackCheck - 阶段1: 选题评审（搜索、翻译、关键词、评分、渲染）
 */

// ============================================
// 阶段1: 选题评审
// ============================================
function initTopicModule() {
  const ta = $('#projectDescription');
  ta.addEventListener('input', () => {
    $('#charCount').textContent = `${ta.value.length} ${t('topic.charCount')}`;
    AppState.topic.description = ta.value;
  });

  if (AppState.topic.description) ta.value = AppState.topic.description;
  $('#charCount').textContent = `${ta.value.length} ${t('topic.charCount')}`;

  $('#searchBtn').addEventListener('click', handleTopicSearch);
}

async function handleTopicSearch() {
  const desc = $('#projectDescription').value.trim();
  if (!desc || desc.length < 10) {
    showToast(t('topic.warn.minLength'), 'warning');
    return;
  }

  AppState.topic.description = desc;
  // 切换到搜索结果子页，让用户看到搜索状态
  switchSubmodule('topic', 'search');
  $('#searchStatus').style.display = 'block';
  $('#multiChannelResults').style.display = 'none';
  $('#topicResults').style.display = 'none';

  // 简洁的加载提示
  $('#searchStatus').innerHTML = '<div class="search-loading"><div class="loading-spinner"></div><span>' + t('topic.loading') + '</span></div>';

  // 1. 后台翻译（不向用户展示翻译过程）
  let translatedText = '';
  let translationSource = 'conceptMap';
  try {
    translatedText = await translateText(desc);
    if (translatedText && translatedText.length > 3) {
      translationSource = 'api';
    }
  } catch(e) {
    console.warn('Translation API failed, falling back to conceptMap:', e);
  }

  // 2. 提取关键词
  let keywordGroups;
  if (translationSource === 'api' && translatedText) {
    keywordGroups = extractKeywordsFromEnglish(translatedText, desc);
  } else {
    keywordGroups = extractKeywordGroups(desc);
  }

  // 3. 提取中文关键词（用于百度搜索和中文结果命中匹配）
  const chineseKeywords = desc.split(/[，。；！？\s,;!?]/).filter(w => w.length >= 2 && /[\u4e00-\u9fa5]/.test(w)).slice(0, 5);
  keywordGroups.allTerms = [...new Set([...keywordGroups.allTerms, ...chineseKeywords])];

  // 4. 并行搜索多个渠道
  const searchQuery = keywordGroups.searchQuery || keywordGroups.searchTerms.slice(0, 3).join(' ');
  const ghPhraseQueries = keywordGroups.ghPhraseQueries || [];
  const channelResults = await multiChannelSearch(searchQuery, keywordGroups.allTerms, desc, ghPhraseQueries);

  // 5. 渲染多渠道搜索结果
  renderMultiChannelResults(channelResults, keywordGroups);

  // 7. 分析稀缺度（基于GitHub结果 + Devpost结果综合计算）
  const ghStats = channelResults.find(c => c.id === 'github')?.stats || { totalCount: 0, repos: [], hitRatio: 0, matchedCount: 0 };
  const dpStats = channelResults.find(c => c.id === 'devpost')?.stats || { totalCount: 0, repos: [], hitRatio: 0, matchedCount: 0 };
  const combinedStats = {
    totalCount: ghStats.totalCount + (dpStats.totalCount || 0),
    repos: [...(ghStats.repos || []), ...(dpStats.repos || [])],
    hitRatio: ghStats.hitRatio,
    matchedCount: ghStats.matchedCount + (dpStats.matchedCount || 0),
    allTerms: keywordGroups.allTerms,
    usedQuery: searchQuery,
    channelResults: channelResults,
  };

  // 8. 社媒需求发现（与稀缺度分析并行）
  let socialDemand = { level: 'weak', modifier: 0, signals: [] };
  try {
    socialDemand = await searchSocialDemand(searchQuery, desc);
  } catch(e) {
    console.warn('Social demand search failed:', e.message);
  }

  // 9. 分析稀缺度（含社媒需求调节）
  const analysis = analyzeTopic(desc, keywordGroups, combinedStats, socialDemand);
  AppState.topic.score = analysis.compositeScore;
  AppState.topic.multiScores = analysis.multiScores;
  AppState.topic.analyzed = true;

  renderTopicResults(analysis, keywordGroups, combinedStats);
  updateOverallScore();
  saveState();

  $('#searchStatus').style.display = 'none';
  // 搜索完成后停留在搜索结果子页
  switchSubmodule('topic', 'search');
  showToast(t('topic.success'), 'success');
}

// 从中文描述中提取关键词（用于百度搜索）
function extractChineseKeywords(desc) {
  if (!desc) return '';
  // 取第一句话或前40个字符
  const firstSentence = desc.split(/[，。；！？\n,;!?]/)[0].trim();
  const query = firstSentence.length > 40 ? firstSentence.substring(0, 40) : firstSentence;
  return query || desc.substring(0, 30);
}

// 代理并发控制：限制同时通过 allorigins.win 的请求数
let _proxyConcurrent = 0;
const _proxyQueue = [];
const MAX_PROXY_CONCURRENT = 2;
async function _acquireProxy() {
  if (_proxyConcurrent < MAX_PROXY_CONCURRENT) { _proxyConcurrent++; return; }
  await new Promise(r => _proxyQueue.push(r));
  _proxyConcurrent++;
}
function _releaseProxy() {
  _proxyConcurrent--;
  if (_proxyQueue.length > 0) _proxyQueue.shift()();
}

// 统一的代理抓取工具：依次尝试多个CORS代理
async function fetchViaProxy(targetUrl, rawHtml = false) {
  await _acquireProxy();
  try {
  const proxies = [
    // 方案1: corsproxy.io（最稳定，支持Bing等搜索引擎，返回原始HTML）
    { url: `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`, type: 'html' },
    // 方案2: r.jina.ai 渲染代理（处理JS动态渲染的网站如Devpost，返回Markdown）
    { url: `https://r.jina.ai/${targetUrl}`, type: 'jina' },
    // 方案3: cors.sh（前缀式代理，部分网站可用）
    { url: `https://proxy.cors.sh/${targetUrl}`, type: 'html' },
    // 方案4: allorigins.win /get（JSON包装，作为备用）
    { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, type: 'json' },
  ];

  for (const proxy of proxies) {
    try {
      const resp = await fetch(proxy.url, { signal: AbortSignal.timeout(12000) });
      if (!resp.ok) continue;
      const text = await resp.text();
      if (!text || text.length < 200) continue;

      let html = text;
      if (proxy.type === 'json') {
        try {
          const json = JSON.parse(text);
          if (!json.contents || json.contents.length < 200) continue;
          html = json.contents;
        } catch { continue; }
      }

      // rawHtml模式：直接返回原始内容（Bing使用DOMParser解析HTML）
      // jina.ai返回的是Markdown，也直接返回（已有Markdown解析器处理）
      if (rawHtml || proxy.type === 'jina') {
        return html;
      }

      // 将HTML转换为类Markdown格式（让现有解析器能处理）
      return html
        // HTML标题 → Markdown标题
        .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
        .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
        .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
        .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
        // 列表项
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
        // 段落和换行
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        // 链接 → Markdown链接
        .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gis, (_, url, text) => {
          const cleanText = text.replace(/<[^>]+>/g, '').trim();
          return cleanText ? `[${cleanText}](${url})` : '';
        })
        // HTML实体解码
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        // 清除剩余HTML标签
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch(e) {
      console.warn(`Proxy [${proxy.type}] failed for ${targetUrl.substring(0, 60)}:`, e.message);
    }
  }

  throw new Error('All proxies failed');
  } finally {
    _releaseProxy();
  }
}

// JSON API 代理工具：先尝试直连，失败后通过 CORS 代理
async function fetchJsonViaProxy(targetUrl) {
  // 方案1: 直连（部分API支持CORS或用户有VPN时可用）
  try {
    const resp = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) });
    if (resp.ok) return await resp.json();
  } catch(e) {
    console.warn(`Direct JSON fetch failed for ${targetUrl.substring(0, 60)}:`, e.message);
  }

  // 方案2-3: 通过 corsproxy.io / cors.sh 代理
  const corsProxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
    `https://proxy.cors.sh/${targetUrl}`,
  ];
  await _acquireProxy();
  try {
    for (const proxyUrl of corsProxies) {
      try {
        const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) continue;
        return await resp.json();
      } catch(e) {
        console.warn(`JSON proxy failed: ${e.message}`);
      }
    }
    // 方案4: allorigins.win /get（备用）
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data.contents) throw new Error('empty contents');
      return JSON.parse(data.contents);
    } catch(e) {
      console.warn(`allorigins JSON proxy failed: ${e.message}`);
    }
    throw new Error('All JSON proxies failed');
  } finally {
    _releaseProxy();
  }
}

// 多渠道并行搜索
async function multiChannelSearch(searchQuery, allTerms, originalDesc, ghPhraseQueries = []) {
  // GitHub: P1优化 — 优先使用短语查询（精准搜），回退到宽泛搜索
  const searchTerms = searchQuery.split(' ');
  let ghQueries = [];
  // 如果有P1优化生成的短语查询，优先使用
  if (ghPhraseQueries.length > 0) {
    ghQueries = ghPhraseQueries;
  } else {
    // 回退到原有逻辑
    if (searchTerms.length >= 3) ghQueries.push(searchTerms.slice(0, 3).join(' '));
    if (searchTerms.length >= 2) ghQueries.push(searchTerms.slice(0, 2).join(' '));
    ghQueries.push(searchTerms[0]);
  }

  // 中文关键词（用于Bing中文搜索）
  const baiduQuery = extractChineseKeywords(originalDesc);

  const channels = [
    { id: 'github', name: 'GitHub', icon: '🐙', searchFn: async () => {
      for (const q of ghQueries) {
        const r = await searchGitHubRepos(q);
        if (r.total_count > 0 && r.items.length > 0) return r;
      }
      return { items: [], total_count: 0 };
    }},
    // JSON API 渠道（通过 cors.sh/cors.eu.org 代理）
    { id: 'wikipedia', name: 'Wikipedia', icon: '📚', searchFn: () => searchWikipedia(searchQuery) },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆', searchFn: () => searchDuckDuckGo(searchQuery) },
    // Bing 搜索渠道（英文+中文合并）
    { id: 'bing', name: 'Bing', icon: '🔍', searchFn: async () => {
      const results = [];
      const seen = new Set();
      // 先搜英文，最多取5条
      try {
        const en = await searchBing(searchQuery);
        en.items.forEach(item => {
          if (results.length < 5 && !seen.has(item.url)) { seen.add(item.url); results.push(item); }
        });
      } catch(e) { console.warn('Bing EN failed:', e.message); }
      // 再搜中文补充至8条
      if (baiduQuery) {
        try {
          const cn = await searchBingCN(baiduQuery);
          cn.items.forEach(item => {
            if (results.length < 8 && !seen.has(item.url)) { seen.add(item.url); results.push(item); }
          });
        } catch(e) { console.warn('Bing CN failed:', e.message); }
      }
      if (results.length === 0) throw new Error('Bing: no results parsed');
      return { items: results, total_count: results.length };
    }},
    { id: 'devpost', name: 'Devpost', icon: '🏆', searchFn: () => searchDevpost(searchQuery) },
    { id: 'producthunt', name: 'ProductHunt', icon: '🚀', searchFn: () => searchProductHunt(searchQuery) },
  ];

  // 并行搜索所有渠道（代理渠道通过信号量串行化，避免代理限流）
  const proxyChannelIds = ['wikipedia', 'duckduckgo', 'bing', 'devpost', 'producthunt'];
  const results = await Promise.allSettled(
    channels.map(async ch => {
      try {
        const data = await ch.searchFn();
        return { ...ch, data, stats: calculateChannelStats(ch.id, data, allTerms, searchQuery), error: null };
      } catch(e) {
        console.warn(`Channel ${ch.id} failed:`, e);
        return { ...ch, data: null, stats: { totalCount: 0, repos: [], hitRatio: 0, matchedCount: 0 }, error: e.message };
      }
    })
  );

  return results.map(r => r.value);
}

// 搜索 Devpost 黑客松项目（通过代理渲染JS后解析Markdown）
async function searchDevpost(searchQuery) {
  const targetUrl = `https://devpost.com/software/search?query=${encodeURIComponent(searchQuery)}`;

  let text = '';
  try {
    text = await fetchViaProxy(targetUrl);
  } catch(e) {
    console.warn('Devpost proxy failed:', e.message);
    throw new Error('Devpost search failed');
  }

  if (!text || text.length < 500) throw new Error('Devpost: empty response');

  // 解析Markdown提取项目信息
  // 格式: [![Image](thumbnail) ##### ProjectName Description...](https://devpost.com/software/slug)
  const projects = [];
  const seen = new Set();

  // 提取所有 Devpost 项目链接
  const linkRegex = /\]\((https:\/\/devpost\.com\/software\/([^)"'?#]+)[^)]*)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null && projects.length < 8) {
    const url = match[1];
    const slug = match[2];
    if (seen.has(slug)) continue;
    seen.add(slug);

    // 在链接附近查找项目名称和描述
    const contextStart = Math.max(0, match.index - 600);
    const contextEnd = Math.min(text.length, match.index + 200);
    const context = text.substring(contextStart, contextEnd);

    // 提取 ##### 后的名称和描述
    const nameMatch = context.match(/#####\s+(.+)/);
    let name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    let desc = '';

    if (nameMatch) {
      const nameAndDesc = nameMatch[1].trim();
      // 名称是前几个词（大写的），描述是后面的内容
      const parts = nameAndDesc.split(/(?<=\S)\s{2,}|\.\s+/);
      if (parts.length >= 2) {
        name = parts[0].trim();
        desc = parts.slice(1).join('. ').trim();
      } else {
        // 尝试另一种方式：名称后面跟着描述
        const descStart = nameAndDesc.indexOf(name) + name.length;
        desc = nameAndDesc.substring(descStart).trim();
      }
    }

    projects.push({
      name: name,
      slug: slug,
      description: desc.substring(0, 200),
      url: url,
      isWinner: false,
      stars: '🏆',
    });
  }

  if (projects.length === 0) throw new Error('Devpost: no results parsed');
  return { items: projects, total_count: projects.length };
}

// 搜索 Wikipedia 相关词条
async function searchWikipedia(searchQuery) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&srlimit=5&origin=*`;
  const data = await fetchJsonViaProxy(url);

  const items = (data.query?.search || []).map(item => ({
    name: item.title,
    description: item.snippet ? item.snippet.replace(/<[^>]+>/g, '') : '',
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
    stars: '📖',
  }));

  return { items, total_count: data.query?.searchinfo?.totalhits || 0 };
}

// 搜索 DuckDuckGo Instant Answer
async function searchDuckDuckGo(searchQuery) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`;
  const data = await fetchJsonViaProxy(url);

  const items = [];

  // 主结果
  if (data.Heading && data.AbstractText) {
    items.push({
      name: data.Heading,
      description: data.AbstractText,
      url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
      stars: '🔗',
    });
  }

  // 相关话题
  if (data.RelatedTopics) {
    data.RelatedTopics.forEach(topic => {
      if (topic.Text && topic.FirstURL && items.length < 5) {
        items.push({
          name: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
          description: topic.Text,
          url: topic.FirstURL,
          stars: '🔗',
        });
      }
    });
  }

  return { items, total_count: items.length };
}

// 搜索 Bing 搜索引擎（通过RSS格式绕过CAPTCHA，用DOMParser解析XML）
async function searchBing(searchQuery) {
  // 使用format=rss绕过Bing的CAPTCHA检测
  const targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&count=10&format=rss`;

  let text = '';
  try {
    text = await fetchViaProxy(targetUrl, true);
  } catch(e) {
    console.warn('Bing proxy failed:', e.message);
    throw new Error('Bing search failed');
  }

  if (!text || text.length < 200) throw new Error('Bing: empty response');

  const results = [];
  const seen = new Set();

  // 解析RSS XML
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const items = doc.querySelectorAll('item');
  items.forEach(item => {
    if (results.length >= 8) return;
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const url = item.querySelector('link')?.textContent?.trim() || '';
    const desc = item.querySelector('description')?.textContent?.trim() || '';
    if (title.length > 2 && url && !seen.has(url)) {
      seen.add(url);
      results.push({ name: title, description: desc, url: url, stars: '🔍' });
    }
  });

  if (results.length === 0) throw new Error('Bing: no results parsed');
  return { items: results, total_count: results.length };
}

// Bing中文搜索（使用RSS格式绕过CAPTCHA，用DOMParser解析XML）
async function searchBingCN(chineseQuery) {
  if (!chineseQuery || chineseQuery.length < 2) throw new Error('BingCN: no Chinese query');

  // 使用format=rss绕过Bing的CAPTCHA检测
  const targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(chineseQuery)}&count=10&format=rss&setlang=zh-CN&cc=CN`;

  let text = '';
  try {
    text = await fetchViaProxy(targetUrl, true);
  } catch(e) {
    console.warn('BingCN proxy failed:', e.message);
    throw new Error('Bing中文搜索失败');
  }

  if (!text || text.length < 200) throw new Error('BingCN: empty response');

  const results = [];
  const seen = new Set();

  // 解析RSS XML
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const items = doc.querySelectorAll('item');
  items.forEach(item => {
    if (results.length >= 8) return;
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const url = item.querySelector('link')?.textContent?.trim() || '';
    const desc = item.querySelector('description')?.textContent?.trim() || '';
    if (title.length > 2 && url && !seen.has(url)) {
      seen.add(url);
      results.push({ name: title, description: desc, url: url, stars: '🔍' });
    }
  });

  if (results.length === 0) throw new Error('BingCN: no results parsed');
  return { items: results, total_count: results.length };
}

// 搜索百度搜索引擎（使用中文关键词，通过代理渲染JS后解析Markdown）
async function searchBaidu(chineseQuery) {
  if (!chineseQuery || chineseQuery.length < 2) throw new Error('Baidu: no Chinese query');

  const targetUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(chineseQuery)}&rn=10`;

  let text = '';
  try {
    text = await fetchViaProxy(targetUrl);
  } catch(e) {
    console.warn('Baidu proxy failed:', e.message);
    throw new Error('Baidu search failed (timeout)');
  }

  if (!text || text.length < 500) throw new Error('Baidu: empty response');

  // 解析Markdown提取搜索结果
  // 百度结果格式多样:
  // 1. ### [Title](baidu_link_url) - 带标题的链接
  // 2. [![Image](img_url)](baidu_link_url) - 图片链接，后跟描述文本
  // 3. 日期 + 描述文本
  const results = [];
  const lines = text.split('\n');
  const seen = new Set();

  for (let i = 0; i < lines.length && results.length < 8; i++) {
    const line = lines[i];

    // 方案1: 匹配 ### [Title](URL) 标题链接
    const headingMatch = line.match(/^#{2,4}\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (headingMatch) {
      const title = headingMatch[1].replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/_/g, '').trim();
      const url = headingMatch[2];
      if (url.includes('baidu.com/s?') || url.includes('baidu.com/?')) continue;
      if (seen.has(url)) continue;
      seen.add(url);

      let desc = '';
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('![') && !nextLine.startsWith('[') && nextLine.length > 10) {
          desc = nextLine.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/_/g, '').trim();
          break;
        }
      }

      if (title && title.length > 2) {
        results.push({ name: title, description: desc, url: url, stars: '🔍' });
      }
      continue;
    }

    // 方案2: 匹配 [![Image](img_url)](baidu_link_url) 图片链接
    const imgLinkMatch = line.match(/\[!\[Image[^\]]*\]\([^)]+\)\]\((https?:\/\/[^)]+)\)/);
    if (imgLinkMatch) {
      const url = imgLinkMatch[1];
      if (url.includes('baidu.com/s?') || seen.has(url)) continue;
      seen.add(url);

      // 查找附近的描述文本（向前和向后搜索）
      let desc = '';
      let title = '';
      for (let j = Math.max(0, i - 3); j <= Math.min(i + 3, lines.length - 1); j++) {
        if (j === i) continue;
        const nearbyLine = lines[j].trim();
        // 日期模式
        const dateMatch = nearbyLine.match(/(\d{4}年\d{1,2}月\d{1,2}日)/);
        // 描述文本（较长的非空行）
        if (nearbyLine && !nearbyLine.startsWith('#') && !nearbyLine.startsWith('![') && !nearbyLine.startsWith('[') && nearbyLine.length > 15) {
          if (!desc) desc = nearbyLine.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/_/g, '').trim();
        }
      }

      // 从描述中提取标题（前20个字符）
      title = desc ? desc.substring(0, 30) + (desc.length > 30 ? '...' : '') : '百度搜索结果';

      if (title && title.length > 2) {
        results.push({ name: title, description: desc, url: url, stars: '🔍' });
      }
    }
  }

  if (results.length === 0) throw new Error('Baidu: no results parsed');
  return { items: results, total_count: results.length };
}

// 搜索 watcha.cn 中文AI产品库（通过代理渲染JS后解析Markdown）
async function searchWatcha(chineseQuery) {
  if (!chineseQuery || chineseQuery.length < 2) throw new Error('Watcha: no query');

  const targetUrl = `https://watcha.cn/search?query=${encodeURIComponent(chineseQuery)}`;

  let text = '';
  try {
    text = await fetchViaProxy(targetUrl);
  } catch(e) {
    console.warn('Watcha proxy failed:', e.message);
    throw new Error('Watcha search failed');
  }

  if (!text || text.length < 500) throw new Error('Watcha: empty response');

  // 解析Markdown提取产品信息
  // watcha.cn产品链接格式: https://watcha.cn/products/<slug>
  const products = [];
  const seen = new Set();
  const lines = text.split('\n');

  for (let i = 0; i < lines.length && products.length < 8; i++) {
    const line = lines[i];

    // 匹配 [产品名](https://watcha.cn/products/slug) 格式
    const productMatch = line.match(/\[([^\]]+)\]\((https:\/\/watcha\.cn\/products\/[^)"'?#]+)[^)]*\)/);
    if (productMatch) {
      const name = productMatch[1].replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim();
      const url = productMatch[2];
      const slug = url.split('/products/')[1];

      // 跳过非产品链接（如 logo、图片等）
      if (name.length < 2 || seen.has(slug)) continue;
      seen.add(slug);

      // 在后续行查找描述
      let desc = '';
      for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('![') &&
            !nextLine.startsWith('[') && !nextLine.startsWith('---') &&
            nextLine.length > 10 && !nextLine.includes('查看更多')) {
          desc = nextLine.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
          break;
        }
      }

      // 提取评分（如果行中有数字评分）
      const ratingMatch = line.match(/(\d+\.?\d*)\s*[猹评]/);
      const rating = ratingMatch ? ratingMatch[1] : '';

      products.push({
        name: name,
        description: desc || `${name} - watcha.cn 上的 AI 产品`,
        url: url,
        stars: rating || '🇨🇳',
      });
    }
  }

  if (products.length === 0) throw new Error('Watcha: no results parsed');
  return { items: products, total_count: products.length };
}

// 搜索 Product Hunt 英文产品库（通过代理渲染JS后解析Markdown）
async function searchProductHunt(searchQuery) {
  const targetUrl = `https://www.producthunt.com/search?q=${encodeURIComponent(searchQuery)}`;

  let text = '';
  try {
    text = await fetchViaProxy(targetUrl);
  } catch(e) {
    console.warn('ProductHunt proxy failed:', e.message);
    throw new Error('ProductHunt search failed');
  }

  if (!text || text.length < 500) throw new Error('ProductHunt: empty response');

  // 解析Markdown提取产品信息
  const products = [];
  const seen = new Set();
  const lines = text.split('\n');

  for (let i = 0; i < lines.length && products.length < 8; i++) {
    const line = lines[i];

    // 匹配 Product Hunt 产品链接
    const productMatch = line.match(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?producthunt\.com\/products\/[^)"'?#]+)[^)]*\)/);
    if (productMatch) {
      const name = productMatch[1].replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim();
      const url = productMatch[2];
      const slug = url.split('/products/')[1];

      if (name.length < 2 || seen.has(slug)) continue;
      seen.add(slug);

      // 在后续行查找描述
      let desc = '';
      for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('![') &&
            !nextLine.startsWith('[') && !nextLine.startsWith('---') &&
            nextLine.length > 10) {
          desc = nextLine.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
          break;
        }
      }

      products.push({
        name: name,
        description: desc || `${name} - Product Hunt product`,
        url: url,
        stars: '🚀',
      });
    }
  }

  if (products.length === 0) throw new Error('ProductHunt: no results parsed');
  return { items: products, total_count: products.length };
}

// 社媒需求发现：搜索 Reddit JSON API / V2EX API 中的真实用户需求表达
async function searchSocialDemand(searchQuery, chineseQuery) {
  const demandSignals = [];

  // Hacker News Algolia API（JSON API，通过 allorigins 代理可达）
  const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchQuery)}&tags=story&hitsPerPage=10`;

  // Reddit JSON API
  const redditQueries = [
    `I wish there was ${searchQuery}`,
    `why is there no ${searchQuery}`,
    `someone should build ${searchQuery}`,
  ];

  // V2EX API
  const v2exUrl = (chineseQuery && chineseQuery.length > 2)
    ? `https://www.v2ex.com/api/topics/search.json?q=${encodeURIComponent(chineseQuery)}`
    : null;

  const allTasks = [
    { url: hnUrl, type: 'hackernews' },
    ...redditQueries.map(q => ({
      url: `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&t=year&limit=10`,
      type: 'reddit',
    })),
  ];
  if (v2exUrl) allTasks.push({ url: v2exUrl, type: 'v2ex' });

  const results = await Promise.allSettled(
    allTasks.map(async (task) => {
      try {
        const data = await fetchJsonViaProxy(task.url);

        if (task.type === 'hackernews') {
          return (data?.hits || []).slice(0, 8).map(item => ({
            source: 'Hacker News',
            title: item.title || item.story_title || '',
            content: item.story_text || item.comment_text || item.title || '',
            url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          }));
        }

        if (task.type === 'v2ex') {
          return (data || []).slice(0, 5).map(item => ({
            source: 'V2EX',
            title: item.title || '',
            content: item.content || item.title || '',
            url: `https://www.v2ex.com/t/${item.id}`,
          }));
        }

        // Reddit JSON API: data.data.children[]
        const posts = (data?.data?.children || []).map(c => c?.data).filter(Boolean);
        return posts.map(post => ({
          source: `Reddit r/${post.subreddit || 'all'}`,
          title: post.title || '',
          content: post.selftext || post.title || '',
          url: `https://www.reddit.com${post.permalink || ''}`,
        }));
      } catch(e) {
        console.warn(`Social demand [${task.type}] failed:`, e.message);
        return [];
      }
    })
  );

  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) demandSignals.push(...r.value);
  });

  // 用正则匹配需求信号短语
  const demandPatterns = [
    /I wish there (?:was|were|is) [^.!?]{5,}/i,
    /why is there no [^.!?]{5,}/i,
    /someone (?:should|needs to|ought to) (?:build|make|create|develop) [^.!?]{5,}/i,
    /would (?:love|pay) (?:to )?(?:see|have) [^.!?]{5,}/i,
    /(?:need|looking for) (?:a |an |the )?[^.!?]{5,}/i,
    /ask hn.*(?:wish|want|need|looking)/i,
    /what (?:tool|app|service) do you (?:wish|want|need)/i,
    /is there (?:a |an |any )?[^.!?]{5,}/i,
    /要是有一个 [^。！？]{5,}/,
    /希望有 [^。！？]{5,}/,
  ];

  // 筛选包含需求信号的帖子
  const matchedSignals = demandSignals.filter(s => {
    const text = `${s.title} ${s.content}`;
    return demandPatterns.some(p => p.test(text));
  });

  // 如果匹配到的信号不够，也保留前几个帖子作为弱信号
  const finalSignals = matchedSignals.length > 0
    ? matchedSignals.slice(0, 5)
    : demandSignals.slice(0, 3);

  // 评估需求强度
  let level = 'weak';
  let modifier = 0;
  if (finalSignals.length >= 3) {
    level = 'strong';
    modifier = 10;
  } else if (finalSignals.length >= 1) {
    level = 'medium';
    modifier = 5;
  }

  // 检测伪需求
  const falseDemandPatterns = /already (?:exists|have|good enough)|已经(?:有|够用)|不需要再/i;
  const hasFalseDemand = finalSignals.some(s => falseDemandPatterns.test(s.content || s.title || ''));
  if (hasFalseDemand && finalSignals.length < 3) {
    level = 'false_demand';
    modifier = -10;
  }

  return { level, modifier, signals: finalSignals };
}

// 计算各渠道搜索统计
function calculateChannelStats(channelId, data, allTerms, usedQuery) {
  if (!data || !data.items || data.items.length === 0) {
    return { totalCount: 0, repos: [], hitRatio: 0, matchedCount: 0 };
  }

  const repos = data.items;
  const totalCount = data.total_count || repos.length;

  // 命中率计算
  const usedQueryTerms = (usedQuery || '').toLowerCase().split(/\s+/);
  const specificTerms = allTerms.filter(t => !usedQueryTerms.includes(t.toLowerCase()));
  const checkTerms = specificTerms.length > 0 ? specificTerms : allTerms;

  let matched = 0;
  repos.forEach(repo => {
    const text = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase();
    const matchCount = checkTerms.filter(term => text.includes(term.toLowerCase())).length;
    if (matchCount >= 1) matched++;
  });

  return {
    totalCount,
    repos,
    matchedCount: matched,
    hitRatio: repos.length > 0 ? matched / repos.length : 0,
  };
}

// 渲染多渠道搜索结果
function renderMultiChannelResults(channelResults, keywordGroups) {
  const container = $('#multiChannelResults');
  const hasAnyResult = channelResults.some(ch => ch.data && ch.data.items && ch.data.items.length > 0);

  if (!hasAnyResult) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  // 1. 渲染统计总览
  const statsHTML = channelResults.map(ch => {
    const stats = ch.stats || { totalCount: 0, matchedCount: 0, hitRatio: 0 };
    const hasResult = stats.repos && stats.repos.length > 0;
    const hitPct = Math.round((stats.hitRatio || 0) * 100);
    return `
      <div class="channel-stat-card ${hasResult ? '' : 'empty'}">
        <div class="channel-stat-icon">${ch.icon}</div>
        <div class="channel-stat-name">${ch.name}</div>
        <div class="channel-stat-num">${stats.totalCount}</div>
        <div class="channel-stat-label">${hasResult ? `${stats.matchedCount}/${stats.repos.length} ${t('search.hitShort')} · ${hitPct}%` : (ch.error ? t('search.networkLimited') : t('search.noResults'))}</div>
      </div>
    `;
  }).join('');
  $('#searchChannelStats').innerHTML = `<div class="channel-stats-grid">${statsHTML}</div>`;

  // 2. 渲染Tab
  const tabsHTML = channelResults.map((ch, i) => {
    const count = ch.stats?.repos?.length || 0;
    const hasResult = count > 0;
    return `
      <button class="channel-tab ${i === 0 && hasResult ? 'active' : ''} ${hasResult ? '' : 'disabled'}" data-channel="${ch.id}">
        ${ch.icon} ${ch.name} ${hasResult ? `(${count})` : ''}
      </button>
    `;
  }).join('');
  $('#channelTabs').innerHTML = tabsHTML;

  // 3. 默认显示第一个有结果的渠道
  const firstWithResult = channelResults.find(ch => ch.stats?.repos?.length > 0);
  if (firstWithResult) {
    renderChannelContent(firstWithResult, keywordGroups.allTerms);
  }

  // 4. 绑定Tab切换
  $$('.channel-tab').forEach(tab => {
    if (tab.classList.contains('disabled')) return;
    tab.addEventListener('click', () => {
      $$('.channel-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const chId = tab.dataset.channel;
      const ch = channelResults.find(c => c.id === chId);
      if (ch) renderChannelContent(ch, keywordGroups.allTerms);
    });
  });
}

// 渲染单个渠道的内容
function renderChannelContent(channel, allTerms) {
  const repos = channel.stats?.repos || [];
  if (repos.length === 0) {
    $('#channelContent').innerHTML = '<div class="channel-empty">' + t('search.noResult') + '</div>';
    return;
  }

  const totalCount = channel.stats.totalCount;
  const matchedCount = channel.stats.matchedCount || 0;
  const hitRatio = Math.round((channel.stats.hitRatio || 0) * 100);
  const totalCountLabel = totalCount > 1000 ? `${(totalCount/1000).toFixed(1)}k` : totalCount;

  let statsHTML = `<div class="search-stats">`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${totalCountLabel}</span><span class="stat-label">${channel.name}${t('search.totalResults')}</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${matchedCount}/${repos.length}</span><span class="stat-label">${t('search.matched')}</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${hitRatio}%</span><span class="stat-label">${t('search.hitRate')}</span></div>`;
  statsHTML += `</div>`;

  const reposHTML = repos.map((repo, idx) => {
    const repoText = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase();
    const isHit = allTerms.some(t => repoText.includes(t.toLowerCase()));
    const hidden = idx >= 3 ? 'style="display:none;"' : '';
    const desc = repo.description || t('search.noDesc');
    return `
    <div class="repo-card ${isHit ? 'hit' : 'miss'} repo-item-${idx >= 3 ? 'extra' : 'visible'}" ${hidden}>
      <div class="repo-header">
        <a href="${repo.url || repo.html_url || '#'}" target="_blank" class="repo-name">${repo.name || repo.full_name}</a>
        <span class="repo-stars">${repo.stars || (repo.stargazers_count ? '⭐ ' + repo.stargazers_count : '')}</span>
      </div>
      <p class="repo-desc">${desc}</p>
      <div class="repo-meta">
        ${repo.language ? `<span class="repo-lang">${repo.language}</span>` : ''}
        ${repo.updated_at ? `<span class="repo-updated">${t('search.updatedAt')} ${new Date(repo.updated_at).toLocaleDateString(getLang() === 'zh' ? 'zh-CN' : 'en-US')}</span>` : ''}
        ${isHit ? `<span class="repo-hit">${t('search.hit')}</span>` : `<span class="repo-miss">${t('search.miss')}</span>`}
      </div>
    </div>
  `;
  }).join('');

  // 超过3条结果时添加展开/折叠按钮
  const expandBtn = repos.length > 3
    ? `<div class="repo-expand-btn" id="repoExpandBtn" onclick="toggleRepoExpand()">
         <span class="expand-text">${t('search.expandRemaining')} ${repos.length - 3} ${t('search.results')}</span>
         <span class="expand-icon">▼</span>
       </div>`
    : '';

  $('#channelContent').innerHTML = statsHTML + reposHTML + expandBtn;
  checkDescTruncation($('#channelContent'));
}

// 展开/折叠搜索结果
function toggleRepoExpand() {
  const extras = document.querySelectorAll('.repo-item-extra');
  const btn = $('#repoExpandBtn');
  const text = btn?.querySelector('.expand-text');
  const icon = btn?.querySelector('.expand-icon');
  const isHidden = extras.length > 0 && extras[0].style.display === 'none';

  extras.forEach(el => { el.style.display = isHidden ? '' : 'none'; });
  if (text) text.textContent = isHidden ? t('search.collapseAll') : `${t('search.expandRemaining')} ${extras.length} ${t('search.results')}`;
  if (icon) icon.textContent = isHidden ? '▲' : '▼';
  // 展开后检测新显示的描述是否需要折叠
  if (isHidden) {
    requestAnimationFrame(() => checkDescTruncation($('#channelContent')));
  }
}

// 渲染后检测描述是否超过3行，超过则添加折叠
function checkDescTruncation(container) {
  if (!container) return;
  const descs = container.querySelectorAll('.repo-desc:not(.collapsed):not(.checked)');
  descs.forEach(desc => {
    // 跳过隐藏元素（display:none 时 scrollHeight=0 无法测量）
    if (desc.offsetParent === null) return;
    desc.classList.add('checked');
    // 测量实际高度是否超过3行
    const style = getComputedStyle(desc);
    const lineHeight = parseFloat(style.lineHeight) || 19.5; // fallback: 13px * 1.5
    const fullHeight = desc.scrollHeight;
    const threshold = lineHeight * 3 + 2; // 3行 + 2px容差
    if (fullHeight > threshold) {
      // 超过3行，添加折叠
      desc.classList.add('collapsed');
      desc.setAttribute('onclick', 'toggleDescExpand(this)');
      // 在描述后插入展开按钮
      const toggle = document.createElement('span');
      toggle.className = 'repo-desc-toggle';
      toggle.setAttribute('onclick', 'toggleDescExpand(this)');
      toggle.textContent = t('search.expand');
      desc.after(toggle);
    }
  });
}

// 展开/折叠单条搜索结果的描述
function toggleDescExpand(el) {
  const card = el.closest('.repo-card');
  if (!card) return;
  const desc = card.querySelector('.repo-desc');
  const toggle = card.querySelector('.repo-desc-toggle');
  if (!desc) return;

  const isCollapsed = desc.classList.contains('collapsed');
  desc.classList.toggle('collapsed');
  if (toggle) toggle.textContent = isCollapsed ? t('search.collapse') : t('search.expand');
}

// 调用 MyMemory 翻译API（免费、CORS支持、无需API Key）
async function translateText(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh|en`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Translation API error');
  const data = await resp.json();
  if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error('Translation failed: ' + (data.responseDetails || 'unknown'));
}

// P1优化：最长匹配分词 — 按词长降序匹配，跳过已匹配区间，支持多次出现
// 返回 [{cn, en, type, positions: [idx,...]}]
function longestMatchConcepts(text, conceptMap) {
  const lower = text.toLowerCase();
  const sortedKeys = Object.keys(conceptMap).sort((a, b) => b.length - a.length);
  const matchedPositions = new Set();
  const matched = [];

  const techConcepts = ['语音识别','自然语言','AI','人工智能','区块链','IoT','物联网','AR','VR','数据可视化','机器学习','深度学习','大模型','计算机视觉','图像识别','目标检测','人脸识别','OCR','知识图谱','RAG','Agent','智能体','多模态','生成式','大语言模型','向量数据库','微调','提示词','嵌入','手势识别','表情识别','情感计算','脑机接口','语音助手','低代码','数字孪生','元宇宙','Web3','NFT','智能合约','去中心化','大数据','数据挖掘','微服务','容器','自动化','虚拟现实','增强现实','语音合成','语音转文字','文字转语音','机器翻译','情感分析','图像生成','视频生成','代码生成','边缘计算','联邦学习','差分隐私','区块链溯源'];
  const domainConcepts = ['老年人','老人','适老','儿童','学生','乡村','盲人','聋','残障','无障碍','隐私','安全','环保','心理','情绪','压力','应急','灾害','法律','保险','税务','能源','制造','零售','影视','艺术','设计','建筑','出版','体育','科研','天文','生物','化学','地理','孕妇','婴儿','母婴','青少年','大学生','教师','医生','护士','农民','司机','外卖','快递','留学生','职场','远程办公','自由职业','创业者','公益','志愿','扶贫','社区','慈善','文化遗产','非遗','方言','古籍','博物馆','罕见病','多动症','溯源','供应链','仓储','冷链','考试','考研','留学','编程','代码','面试','打卡','签到','报销','审批','考勤','选课','抢票','投票','拍卖','租赁'];

  sortedKeys.forEach(cn => {
    const cnLower = cn.toLowerCase();
    let searchStart = 0;
    let idx;
    while ((idx = lower.indexOf(cnLower, searchStart)) >= 0) {
      // 检查是否与已匹配的概念重叠
      let overlap = false;
      for (let i = idx; i < idx + cnLower.length; i++) {
        if (matchedPositions.has(i)) { overlap = true; break; }
      }
      if (!overlap) {
        for (let i = idx; i < idx + cnLower.length; i++) matchedPositions.add(i);
        let type = 'feature';
        if (techConcepts.includes(cn)) type = 'tech';
        else if (domainConcepts.includes(cn)) type = 'domain';
        matched.push({ cn, en: conceptMap[cn], type });
      }
      searchStart = idx + cnLower.length;
    }
  });

  return matched;
}

// P1优化：从英文文本中提取有意义的短语（bigram + trigram + conceptMap短语）
// 返回 [{phrase, score, source}] 按分数降序排列
// source: 'concept' = conceptMap已知短语, 'trigram' = 三词短语, 'bigram' = 两词短语
function extractEnglishPhrases(text, conceptMap) {
  const stopWords = new Set(['a','an','the','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','to','of','in','on','at','by','for','with','about','as','into','like','through','after','over','between','out','against','during','without','before','under','around','among','and','but','or','nor','not','so','yet','both','either','neither','each','every','all','any','few','more','most','other','some','such','no','only','own','same','than','too','very','just','also','now','then','here','there','when','where','why','how','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','whose','my','your','his','her','its','our','their','me','him','us','them','app','application','system','platform','tool','website','project','product','based','using','via','build','develop','create','make','use','new','one','two','automatically','also','then','well','way','many','much','some','any','all','both','each','few','more','most','other','some','such','no','only','own','same','than','too','very','just','now','then','here','there']);

  // 动词/副词黑名单：这些词出现在trigram中间时，说明跨越了语义边界
  const verbAdverbBlacklist = new Set(['generates','generating','created','creating','makes','making','uses','using','includes','including','contains','containing','provides','providing','allows','allowing','supports','supporting','enables','enabling','helps','helping','wants','wanting','needs','needing','understands','understanding','automatically','dynamically','simply','easily','quickly','directly']);

  const lower = text.toLowerCase();
  const candidates = [];
  const seen = new Set();
  const conceptPhrases = []; // 收集已检测到的conceptMap短语，用于后续子串过滤

  // --- 1. conceptMap 已知多词短语检测（最高优先级，+100 bonus确保排名最高） ---
  if (conceptMap) {
    Object.values(conceptMap).flat().forEach(en => {
      const enLower = en.toLowerCase();
      if (enLower.includes(' ')) {
        if (lower.includes(enLower)) {
          const phraseWords = enLower.split(' ');
          if (phraseWords.every(w => w.length > 1)) {
            if (!seen.has(enLower)) {
              seen.add(enLower);
              conceptPhrases.push(enLower);
              const score = phraseWords.length * 3 + enLower.replace(/\s/g, '').length + 100;
              candidates.push({ phrase: enLower, score, source: 'concept', words: phraseWords });
            }
          }
        }
      }
    });
  }

  // --- 2. 按句子/分句切分，防止跨边界提取短语 ---
  // 先按标点切分成子句，每个子句内单独提取ngram
  const segments = lower.split(/[.,;:!?()\[\]{}\n\r]+/).map(s => s.trim()).filter(s => s.length > 5);

  segments.forEach(segment => {
    const segWords = segment.split(/[^a-z0-9]+/).filter(w => w.length > 1);
    if (segWords.length < 2) return;

    // --- 2-prep. 标记conceptMap短语在当前segment中的词位置 ---
    // 被标记的位置不参与trigram/bigram提取，防止边界重叠
    const conceptPositions = new Set(); // 被concept短语占用的词索引
    conceptPhrases.forEach(cp => {
      const cpWords = cp.split(' ');
      // 在segWords中查找concept短语的所有出现位置
      for (let i = 0; i <= segWords.length - cpWords.length; i++) {
        let match = true;
        for (let j = 0; j < cpWords.length; j++) {
          if (segWords[i + j] !== cpWords[j]) { match = false; break; }
        }
        if (match) {
          for (let j = 0; j < cpWords.length; j++) conceptPositions.add(i + j);
        }
      }
    });

    // --- 2a. Trigram 提取（三词短语） ---
    for (let i = 0; i < segWords.length - 2; i++) {
      const w1 = segWords[i], w2 = segWords[i + 1], w3 = segWords[i + 2];
      // 跳过与concept短语重叠的trigram（位置级精确过滤）
      if (conceptPositions.has(i) || conceptPositions.has(i + 1) || conceptPositions.has(i + 2)) continue;
      const stopCount = [stopWords.has(w1), stopWords.has(w2), stopWords.has(w3)].filter(Boolean).length;
      // 三个词中最多一个是停用词，且至少一个长度>4
      if (stopCount <= 1 && (w1.length > 4 || w2.length > 4 || w3.length > 4)) {
        // 排除中间词是动词/副词的trigram（跨越语义边界）
        if (verbAdverbBlacklist.has(w2)) continue;
        const phrase = w1 + ' ' + w2 + ' ' + w3;
        if (!seen.has(phrase)) {
          seen.add(phrase);
          const nonStopCount = 3 - stopCount;
          const score = (w1.length + w2.length + w3.length) + nonStopCount * 2;
          candidates.push({ phrase, score, source: 'trigram', words: [w1, w2, w3] });
        }
      }
    }

    // --- 2b. Bigram 提取（两词短语） ---
    for (let i = 0; i < segWords.length - 1; i++) {
      const w1 = segWords[i], w2 = segWords[i + 1];
      // 跳过与concept短语重叠的bigram
      if (conceptPositions.has(i) || conceptPositions.has(i + 1)) continue;
      if (!stopWords.has(w1) && !stopWords.has(w2) && (w1.length > 3 || w2.length > 3)) {
        const phrase = w1 + ' ' + w2;
        if (!seen.has(phrase)) {
          seen.add(phrase);
          const score = (w1.length + w2.length) + 2;
          candidates.push({ phrase, score, source: 'bigram', words: [w1, w2] });
        }
      }
    }
  });

  // --- 3. 去重：如果bigram是某个trigram/concept短语的子串，则移除 ---
  const longPhrases = candidates.filter(c => c.words.length >= 3);
  const result = candidates.filter(c => {
    if (c.words.length >= 3) return true;
    const isSubsumed = longPhrases.some(lp =>
      lp.words.join(' ').includes(c.phrase)
    );
    return !isSubsumed;
  });

  // --- 4. 按分数降序排列 ---
  result.sort((a, b) => b.score - a.score);

  return result.map(r => r.phrase);
}

// 从翻译后的英文文本提取搜索关键词（P1优化：最长匹配+短语提取）
function extractKeywordsFromEnglish(translatedText, originalDesc) {
  const stopWords = new Set(['a','an','the','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','to','of','in','on','at','by','for','with','about','as','into','like','through','after','over','between','out','against','during','without','before','under','around','among','and','but','or','nor','not','so','yet','both','either','neither','each','every','all','any','few','more','most','other','some','such','no','only','own','same','than','too','very','just','also','now','then','here','there','when','where','why','how','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','whose','my','your','his','her','its','our','their','me','him','us','them','myself','yourself','himself','herself','itself','ourself','themselves','what','whatever','whoever','whomever']);

  // 1. P1优化：用最长匹配分词从中文原文提取概念（替代naive includes）
  const conceptMap = TOPIC_DATA.conceptMap || {};
  const matchedConcepts = longestMatchConcepts(originalDesc, conceptMap);
  const groups = matchedConcepts.map(m => ({ cn: m.cn, en: m.en, type: m.type }));
  const conceptTerms = [];
  matchedConcepts.forEach(m => {
    m.en.forEach(en => {
      if (!conceptTerms.includes(en.toLowerCase())) conceptTerms.push(en.toLowerCase());
    });
  });

  // 2. 从翻译文本提取单个有意义的词
  const words = translatedText.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1 && !stopWords.has(w));

  // 3. P1优化：从翻译文本提取英文短语（bigram + trigram + conceptMap短语，按分数排序）
  const phrases = extractEnglishPhrases(translatedText, conceptMap);

  // 4. 合并所有词：翻译词 + 词典词
  const allTerms = [...new Set([...words.map(w => w.toLowerCase()), ...conceptTerms])];

  // 5. P1优化：构建搜索查询 — 优先使用排名最高的短语，补充单个词
  let searchTerms = [];
  let searchQuery = '';
  let ghPhraseQueries = [];

  if (phrases.length > 0) {
    // 使用排名最高的短语作为主搜索词
    const topPhrase = phrases[0];
    searchTerms.push(topPhrase);
    // 补充不属于短语的单词
    const phraseWords = topPhrase.split(' ');
    const extraWords = words.filter(w => !phraseWords.includes(w)).slice(0, 2);
    searchTerms.push(...extraWords.slice(0, 2));
  } else {
    searchTerms = words.slice(0, 3);
  }

  // 如果翻译词不足，补充概念映射词
  if (searchTerms.length < 2 && conceptTerms.length > 0) {
    searchTerms = [...searchTerms, ...conceptTerms].slice(0, 3);
  }

  // 普通搜索查询（Bing等用空格拼接）
  searchQuery = searchTerms.join(' ');

  // GitHub专用查询：多策略短语搜索（精准→宽泛）
  if (phrases.length > 0) {
    const phrase1 = phrases[0];
    const phrase2 = phrases[1]; // 第二个短语（可能不存在）
    const phrase1Words = phrase1.split(' ');
    const remainingWords = words.filter(w => !phrase1Words.includes(w)).slice(0, 2);

    // Q1: 最优短语 + 补充词（最精准）
    if (remainingWords.length > 0) {
      ghPhraseQueries.push(`"${phrase1}" ${remainingWords.join(' ')}`);
    }
    // Q2: 仅最优短语
    ghPhraseQueries.push(`"${phrase1}"`);
    // Q3: 第二短语（如果有且不同于第一短语）
    if (phrase2 && phrase2 !== phrase1) {
      ghPhraseQueries.push(`"${phrase2}"`);
    }
    // Q4: 拆词宽搜（去掉引号，用短语中的词 + 补充词）
    ghPhraseQueries.push([...phrase1Words, ...remainingWords].slice(0, 3).join(' '));
  } else {
    // 无短语时，用原有逻辑
    if (searchTerms.length >= 3) ghPhraseQueries.push(searchTerms.slice(0, 3).join(' '));
    if (searchTerms.length >= 2) ghPhraseQueries.push(searchTerms.slice(0, 2).join(' '));
    ghPhraseQueries.push(searchTerms[0] || conceptTerms[0] || '');
  }

  return { groups, searchTerms, searchQuery, allTerms, translatedText, phrases, ghPhraseQueries };
}

// 将中文描述按概念分组提取关键词（P1优化：使用共享最长匹配函数）
function extractKeywordGroups(text) {
  const conceptMap = TOPIC_DATA.conceptMap || {};

  // P1优化：使用共享的最长匹配分词函数（支持多次出现+重叠检测）
  const matchedConcepts = longestMatchConcepts(text, conceptMap);
  const groups = matchedConcepts.map(m => ({ cn: m.cn, en: m.en, type: m.type }));

  // 构建搜索查询：优先使用 feature + domain 类关键词（找同类项目）
  // 避免使用 tech 类关键词（会返回通用代码库而非同类项目）
  // 优先级：feature > domain > tech
  const featureTerms = groups.filter(g => g.type === 'feature').map(g => g.en[0]);
  const domainTerms = groups.filter(g => g.type === 'domain').map(g => g.en[0]);
  const techTerms = groups.filter(g => g.type === 'tech').map(g => g.en[0]);

  // 去重并按优先级组合：先 feature，再 domain
  const productTerms = [...new Set([...featureTerms, ...domainTerms])];

  // 搜索查询：用产品相关词（feature + domain），最多3个
  let searchTerms = productTerms.slice(0, 3);
  // 如果产品词不足2个，补充技术词
  if (searchTerms.length < 2 && techTerms.length > 0) {
    searchTerms = [...searchTerms, ...techTerms].slice(0, 3);
  }
  const searchQuery = searchTerms.join(' ');
  const allTerms = [...new Set(groups.flatMap(g => g.en))];

  // P1优化：从概念映射的英文词中检测多词短语 + 构建短语查询
  // 1. 收集conceptMap中已知的多词英文短语（如 "speech recognition", "data visualization"）
  const conceptPhrases = [];
  groups.forEach(g => {
    g.en.forEach(en => {
      if (en.includes(' ') && en.split(' ').every(w => w.length > 1)) {
        conceptPhrases.push(en.toLowerCase());
      }
    });
  });

  let ghPhraseQueries = [];
  let phrases = [];

  // 2. 优先使用conceptMap多词短语作为GitHub引号搜索
  if (conceptPhrases.length > 0) {
    phrases = conceptPhrases;
    // Q1: 最优短语 + 补充词
    const topPhrase = conceptPhrases[0];
    const extraTerms = productTerms.filter(t => !topPhrase.includes(t)).slice(0, 1);
    if (extraTerms.length > 0) {
      ghPhraseQueries.push(`"${topPhrase}" ${extraTerms[0]}`);
    }
    // Q2: 仅最优短语
    ghPhraseQueries.push(`"${topPhrase}"`);
    // Q3: 第二短语（如果有）
    if (conceptPhrases[1] && conceptPhrases[1] !== topPhrase) {
      ghPhraseQueries.push(`"${conceptPhrases[1]}"`);
    }
  }

  // 3. 如果没有多词短语，用产品词组合
  if (ghPhraseQueries.length === 0 && productTerms.length >= 2) {
    ghPhraseQueries.push(`${productTerms[0]} ${productTerms[1]}`);
    phrases.push(`${productTerms[0]} ${productTerms[1]}`);
  }

  // 4. 兜底：宽泛搜索
  if (searchTerms.length >= 3) ghPhraseQueries.push(searchTerms.slice(0, 3).join(' '));
  if (searchTerms.length >= 2) ghPhraseQueries.push(searchTerms.slice(0, 2).join(' '));
  ghPhraseQueries.push(searchTerms[0] || productTerms[0] || '');

  return { groups, searchTerms, searchQuery, allTerms, productTerms, techTerms, ghPhraseQueries, phrases };
}

// 计算搜索结果命中百分比
// 检查结果是否包含未用于搜索的更具体关键词（衡量真正的相关性）
function calculateHitRatio(searchStats, allTerms, usedQuery) {
  if (!searchStats.repos || searchStats.repos.length === 0) {
    searchStats.hitRatio = 0;
    searchStats.matchedCount = 0;
    return searchStats;
  }

  // 提取未用于搜索查询的关键词（这些是更具体的、能区分相关性的词）
  const usedQueryTerms = (usedQuery || '').toLowerCase().split(/\s+/);
  const specificTerms = allTerms.filter(t => !usedQueryTerms.includes(t.toLowerCase()));

  // 如果没有更具体的词（比如只用了1个搜索词），则用所有词检查
  const checkTerms = specificTerms.length > 0 ? specificTerms : allTerms;

  let matched = 0;
  searchStats.repos.forEach(repo => {
    const text = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase();
    // 需要匹配至少2个不同概念组的词，才算真正命中
    const matchCount = checkTerms.filter(term => text.includes(term.toLowerCase())).length;
    if (matchCount >= 1) {
      matched++;
    }
  });

  searchStats.matchedCount = matched;
  searchStats.hitRatio = matched / searchStats.repos.length;
  return searchStats;
}

function extractKeywords(text) {
  // 1. 从中文描述中提取核心概念，映射到英文搜索词
  const conceptMap = TOPIC_DATA.conceptMap || {};
  const englishTerms = new Set();

  // 遍历概念映射表，检查描述中是否包含中文关键词
  Object.keys(conceptMap).forEach(cn => {
    if (text.toLowerCase().includes(cn.toLowerCase())) {
      conceptMap[cn].forEach(en => englishTerms.add(en));
    }
  });

  // 2. 提取描述中已有的英文词
  const englishWords = text.match(/[a-zA-Z][a-zA-Z\s]{2,}/g) || [];
  englishWords.forEach(w => {
    const cleaned = w.trim().toLowerCase();
    if (cleaned.length > 2) englishTerms.add(cleaned);
  });

  // 3. 转为数组，取最重要的5个
  let keywords = Array.from(englishTerms).slice(0, 5);

  // 4. 如果没有提取到关键词，用通用词兜底
  if (keywords.length === 0) {
    const stopWords = ['的','了','是','在','我','有','和','就','不','人','都','一','一个','上','也','很','到','说','要','去','你','会','着','没有','看','好','自己','这','那','它','他','她','们','这个','那个','什么','怎么','为什么','可以','能够','应该','需要','一个','应用','系统','平台','工具','网站','项目','产品','功能','用户','通过','使用','基于','实现'];
    const words = text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.includes(w));
    keywords = [...new Set(words)].slice(0, 5);
  }

  return keywords;
}

async function searchGitHubRepos(searchQuery) {
  // 用精准搜索查询，返回完整结果（含 total_count）
  const url = `${TOPIC_DATA.githubSearch.apiUrl}?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=8`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('GitHub API error');
  const data = await resp.json();
  return { items: data.items || [], total_count: data.total_count || 0 };
}

function renderGithubResults(repos, searchStats) {
  if (!repos || repos.length === 0) {
    $('#githubResults').style.display = 'none';
    return;
  }
  $('#githubResults').style.display = 'block';

  // 搜索统计信息
  const totalCount = searchStats.totalCount;
  const matchedCount = searchStats.matchedCount || 0;
  const hitRatio = Math.round((searchStats.hitRatio || 0) * 100);
  const totalCountLabel = totalCount > 1000 ? `${(totalCount/1000).toFixed(1)}k` : totalCount;

  let statsHTML = `<div class="search-stats">`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${totalCountLabel}</span><span class="stat-label">${t('search.githubTotal')}</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${matchedCount}/${repos.length}</span><span class="stat-label">${t('search.matched')}</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${hitRatio}%</span><span class="stat-label">${t('search.hitRate')}</span></div>`;
  statsHTML += `</div>`;

  $('#repoList').innerHTML = statsHTML + repos.map(repo => {
    // 检查这个repo是否命中
    const repoText = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase();
    const allTerms = (searchStats.allTerms || []);
    const isHit = allTerms.some(t => repoText.includes(t.toLowerCase()));
    const desc = repo.description || t('search.noDesc');
    return `
    <div class="repo-card ${isHit ? 'hit' : 'miss'}">
      <div class="repo-header">
        <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.full_name}</a>
        <span class="repo-stars">⭐ ${repo.stargazers_count}</span>
      </div>
      <p class="repo-desc">${desc}</p>
      <div class="repo-meta">
        ${repo.language ? `<span class="repo-lang">${repo.language}</span>` : ''}
        <span class="repo-updated">${t('search.updatedAt')} ${new Date(repo.updated_at).toLocaleDateString(getLang() === 'zh' ? 'zh-CN' : 'en-US')}</span>
        ${isHit ? `<span class="repo-hit">${t('search.hit')}</span>` : `<span class="repo-miss">${t('search.miss')}</span>`}
      </div>
    </div>
  `;
  }).join('');
  checkDescTruncation($('#repoList'));
}

function analyzeTopic(description, keywordGroups, searchStats, socialDemand) {
  const descLower = description.toLowerCase();
  const allTerms = keywordGroups.allTerms || [];
  const socialDemandMod = socialDemand ? socialDemand.modifier : 0;
  searchStats = searchStats || {};

  // 1. 检测匹配的常见模式
  const matchedPatterns = [];
  TOPIC_DATA.commonPatterns.forEach(pattern => {
    const matchCount = pattern.keywords.filter(kw => descLower.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      matchedPatterns.push({ ...pattern, matchCount, matchRatio: matchCount / pattern.keywords.length });
    }
  });
  matchedPatterns.sort((a, b) => b.matchRatio - a.matchRatio);

  // 2. 基于搜索结果计算稀缺度
  // totalCount: GitHub上匹配的项目总数（越少越稀缺）
  // hitRatio: 命中百分比（越低说明大部分结果不相关，项目越独特）
  const totalCount = searchStats.totalCount || 0;
  const hitRatio = searchStats.hitRatio || 0;

  // 稀缺度评分逻辑：
  // - total_count < 10: 极度稀缺 (90-100)
  // - total_count 10-50: 稀缺 (75-89)
  // - total_count 50-200: 适中 (55-74)
  // - total_count 200-1000: 常见 (35-54)
  // - total_count > 1000: 非常常见 (10-34)
  // 命中百分比越低，加分越多（说明项目方向更独特）
  let searchScarcity;
  if (totalCount === 0) {
    searchScarcity = 95; // 没有搜索到任何结果，极度稀缺
  } else if (totalCount < 10) {
    searchScarcity = 90 - hitRatio * 5;
  } else if (totalCount < 50) {
    searchScarcity = 78 - hitRatio * 8;
  } else if (totalCount < 200) {
    searchScarcity = 65 - hitRatio * 10;
  } else if (totalCount < 1000) {
    searchScarcity = 45 - hitRatio * 10;
  } else if (totalCount < 5000) {
    searchScarcity = 30 - hitRatio * 8;
  } else {
    searchScarcity = 15 - hitRatio * 5;
  }
  searchScarcity = clamp(Math.round(searchScarcity), 5, 98);

  // 3. 检测加分因素
  const matchedBoosters = [];
  let meaningBase = 50;
  let originalityBase = 70;

  TOPIC_DATA.originalityBoosters.forEach(booster => {
    if (descLower.includes(booster.keyword.toLowerCase())) {
      matchedBoosters.push(booster);
      meaningBase += booster.meaningBoost * 5;
      originalityBase += booster.boost * 2;
    }
  });

  // 4. 常见模式扣分
  let patternPenalty = 0;
  matchedPatterns.forEach(p => {
    patternPenalty += p.originalityPenalty * p.matchRatio;
    meaningBase = Math.min(meaningBase, 100 - (5 - p.meaning) * 8);
  });

  // 5. 计算三维分数
  // 稀缺度：主要基于搜索结果数量和命中百分比
  const scarcityScore = searchScarcity;
  // 原创性：基于模式匹配扣分 + 加分因素 + 搜索稀缺度加权
  const originalityScore = clamp(Math.round(originalityBase - patternPenalty + matchedBoosters.length * 3 + searchScarcity * 0.15), 10, 98);
  // 意义感：基于加分因素和模式的意义评级，加上社媒需求调节
  const meaningScore = clamp(Math.round(meaningBase) + socialDemandMod, 10, 98);
  // 综合分：稀缺度权重最高（40%），原创性（35%），意义感（25%）
  const compositeScore = Math.round(scarcityScore * 0.4 + originalityScore * 0.35 + meaningScore * 0.25);

  // 6. 综合判定
  let oceanType;
  if (compositeScore >= 70) oceanType = 'blue';
  else if (compositeScore >= 45) oceanType = 'yellow';
  else oceanType = 'red';

  return {
    matchedPatterns, matchedBoosters,
    multiScores: { originality: originalityScore, scarcity: scarcityScore, meaning: meaningScore },
    compositeScore, oceanType,
    searchStats: { totalCount, hitRatio, matchedCount: searchStats.matchedCount || 0, resultCount: (searchStats.repos || []).length },
    socialDemand: socialDemand || { level: 'weak', modifier: 0, signals: [] },
    differentiation: matchedPatterns.length > 0 ? matchedPatterns[0].differentiation : [],
    patternName: matchedPatterns.length > 0 ? matchedPatterns[0].pattern : null
  };
}

function renderTopicResults(analysis, keywordGroups, searchStats) {
  $('#topicResults').style.display = 'block';

  // 分数
  const score = analysis.compositeScore;
  $('#topicScarcityScore').textContent = score;
  $('#topicScore').textContent = score;
  $('#navScoreTopic').textContent = score;

  const gauge = $('#topicGauge');
  gauge.style.background = `conic-gradient(var(--accent-primary) 0deg, var(--accent-primary) ${score * 3.6}deg, rgba(255,255,255,0.05) ${score * 3.6}deg)`;

  // 判定
  const verdicts = {
    blue: { icon: '🌊', text: t('verdict.blue'), color: 'var(--accent-primary)' },
    yellow: { icon: '⚡', text: t('verdict.yellow'), color: 'var(--accent-warning)' },
    red: { icon: '🔥', text: t('verdict.red'), color: 'var(--accent-danger)' }
  };
  const v = verdicts[analysis.oceanType] || verdicts.yellow;
  $('#topicVerdict').innerHTML = `<div class="verdict-card" style="border-color:${v.color}"><span class="verdict-icon">${v.icon}</span><span class="verdict-text">${v.text}</span></div>`;

  // 搜索统计摘要
  const ss = analysis.searchStats || {};
  const totalCountLabel = ss.totalCount > 1000 ? `${(ss.totalCount/1000).toFixed(1)}k` : (ss.totalCount || 0);
  const hitPct = Math.round((ss.hitRatio || 0) * 100);
  let searchSummaryHTML = '<div class="search-summary-card"><h4>' + t('analysis.searchScarcity') + '</h4><div class="search-summary-stats">';
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${totalCountLabel}</span><span class="ss-label">${t('analysis.githubTotal')}</span></div>`;
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${ss.matchedCount || 0}/${ss.resultCount || 0}</span><span class="ss-label">${t('analysis.relatedHits')}</span></div>`;
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${hitPct}%</span><span class="ss-label">${t('analysis.hitPercentage')}</span></div>`;
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${analysis.multiScores.scarcity}</span><span class="ss-label">${t('analysis.scarcityScore')}</span></div>`;
  searchSummaryHTML += '</div>';
  // 评分依据
  let basis = '';
  if (ss.totalCount === 0) basis = t('scarcity.none');
  else if (ss.totalCount < 10) basis = t('scarcity.veryLow') + ' ' + ss.totalCount + ' ' + t('scarcity.repos');
  else if (ss.totalCount < 50) basis = t('scarcity.found') + ' ' + ss.totalCount + ' ' + t('scarcity.low');
  else if (ss.totalCount < 200) basis = t('scarcity.found') + ' ' + ss.totalCount + ' ' + t('scarcity.medium');
  else if (ss.totalCount < 1000) basis = t('scarcity.found') + ' ' + ss.totalCount + ' ' + t('scarcity.high');
  else basis = t('scarcity.over') + ' ' + totalCountLabel + ' ' + t('scarcity.veryHigh');
  if (ss.resultCount > 0 && hitPct < 50) basis += t('scarcity.diffSpace') + ' ' + hitPct + t('scarcity.diffSpaceDesc');
  searchSummaryHTML += `<p class="ss-basis">${basis}</p></div>`;

  // 多维分数（在分数区域前插入搜索摘要）
  const scores = analysis.multiScores;
  $('#topicMultiScores').innerHTML = `
    ${searchSummaryHTML}
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${scores.originality}%;background:linear-gradient(90deg,#00ffa3,#00d488)"></div></div>
      <div class="multi-score-info"><span>${t('analysis.originality')}</span><span class="multi-score-value">${scores.originality}</span></div>
    </div>
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${scores.scarcity}%;background:linear-gradient(90deg,#4d8dff,#7c5cff)"></div></div>
      <div class="multi-score-info"><span>${t('analysis.scarcityBased')}</span><span class="multi-score-value">${scores.scarcity}</span></div>
    </div>
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${scores.meaning}%;background:linear-gradient(90deg,#ffb800,#ff8c00)"></div></div>
      <div class="multi-score-info"><span>${t('analysis.meaningfulness')}</span><span class="multi-score-value">${scores.meaning}</span></div>
    </div>
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${score}%;background:linear-gradient(90deg,#a78bfa,#7c5cff)"></div></div>
      <div class="multi-score-info"><span>${t('analysis.overallScarcity')}</span><span class="multi-score-value">${score}</span></div>
    </div>
  `;

  // 社媒需求发现结果
  if (analysis.socialDemand) {
    const sd = analysis.socialDemand;
    const levelMap = {
      strong: { icon: '🔥', label: t('socialDemand.strong'), color: 'var(--accent-success)', desc: t('socialDemand.strongDesc') },
      medium: { icon: '✅', label: t('socialDemand.medium'), color: 'var(--accent-primary)', desc: t('socialDemand.mediumDesc') },
      weak: { icon: '❓', label: t('socialDemand.weak'), color: 'var(--text-muted)', desc: t('socialDemand.weakDesc') },
      false_demand: { icon: '⚠️', label: t('socialDemand.false'), color: 'var(--accent-warning)', desc: t('socialDemand.falseDesc') },
    };
    const lv = levelMap[sd.level] || levelMap.weak;
    const modText = sd.modifier > 0 ? `(+${sd.modifier})` : (sd.modifier < 0 ? `(${sd.modifier})` : '');
    let sdHTML = `<div class="social-demand-card" style="border-color:${lv.color}">
      <div class="social-demand-header">
        <span class="social-demand-icon">${lv.icon}</span>
        <span class="social-demand-label">${t('socialDemand.title')}</span>
        <span class="social-demand-level" style="color:${lv.color}">${lv.label} ${modText}</span>
      </div>
      <p class="social-demand-desc">${lv.desc}</p>`;

    if (sd.signals && sd.signals.length > 0) {
      sdHTML += '<div class="social-demand-signals">';
      sd.signals.forEach(s => {
        sdHTML += `<div class="demand-signal-item">
          <span class="demand-signal-source">${s.source}</span>
          <span class="demand-signal-text">${s.title.substring(0, 80)}</span>
        </div>`;
      });
      sdHTML += '</div>';
    }
    sdHTML += '</div>';

    // 插入到专用容器
    const sdEl = $('#socialDemandResult');
    if (sdEl) sdEl.innerHTML = sdHTML;
  }

  // 查重结果
  if (analysis.matchedPatterns.length > 0) {
    $('#similarPatterns').innerHTML = analysis.matchedPatterns.slice(0, 5).map(p => {
      const oceanBadge = { red: '<span class="ocean-badge red">' + t('ocean.red') + '</span>', yellow: '<span class="ocean-badge yellow">' + t('ocean.yellow') + '</span>', blue: '<span class="ocean-badge blue">' + t('ocean.blue') + '</span>' };
      return `
        <div class="pattern-item">
          <div class="pattern-header">
            <span class="pattern-name">${p.pattern}</span>
            ${oceanBadge[p.oceanType] || ''}
          </div>
          <div class="pattern-meta">
            <span>${t('meta.scarcity')} ${'★'.repeat(p.scarcity)}${'☆'.repeat(5-p.scarcity)}</span>
            <span>${t('meta.meaningfulness')} ${'★'.repeat(p.meaning)}${'☆'.repeat(5-p.meaning)}</span>
            <span>${t('meta.matchRate')} ${Math.round(p.matchRatio * 100)}%</span>
          </div>
          <p class="pattern-advice">${p.advice}</p>
        </div>
      `;
    }).join('');
  } else {
    $('#similarPatterns').innerHTML = '<div class="empty-hint">' + t('empty.patterns') + '</div>';
  }

  // 加分因素
  if (analysis.matchedBoosters.length > 0) {
    $('#boostersFound').innerHTML = analysis.matchedBoosters.map(b => {
      const typeLabels = { social: t('booster.social'), tech: t('booster.tech'), domain: t('booster.domain') };
      return `<div class="booster-item"><span class="booster-badge ${b.type}">${typeLabels[b.type]||b.type}</span><span class="booster-label">${b.label}</span><span class="booster-boost">+${b.boost}</span></div>`;
    }).join('');
  } else {
    $('#boostersFound').innerHTML = '<div class="empty-hint">' + t('empty.boosters') + '</div>';
  }

  // 差异化策略
  if (analysis.differentiation && analysis.differentiation.length > 0) {
    $('#differentiationStrategies').innerHTML = analysis.differentiation.map((d, i) => `
      <div class="diff-strategy"><span class="diff-num">${i+1}</span><span class="diff-text">${d}</span></div>
    `).join('');
  } else {
    $('#differentiationStrategies').innerHTML = '<div class="empty-hint">' + t('empty.differentiation') + '</div>';
  }
}

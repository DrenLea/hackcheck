/**
 * HackCheck - 黑客松全流程辅助器 核心逻辑
 * 5大阶段：选题评审 → 技术选型 → 代码扫描 → Demo辅助 → Pitch评审
 */

// ============================================
// 全局状态
// ============================================
const AppState = {
  currentModule: 'topic',
  currentSubmodule: null,
  topic: {
    description: '',
    score: 0,
    analyzed: false,
    githubResults: [],
    multiScores: {}
  },
  tech: {
    selected: [],
    duration: 48,
    teamSize: 3,
    experience: 1,
    score: 0,
    activePlan: null
  },
  dev: {
    files: [],
    scanned: false,
    score: 0,
    findings: { secrets: [], gitignore: null, quality: [], sensitive: [] }
  },
  demo: {
    projectType: null,
    detected: false
  },
  pitch: {
    generated: false,
    pitchContent: '',
    review: { ratings: {}, feedbacks: {}, score: 0, autoReviewed: false }
  }
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function showToast(msg, type = 'info', duration = 3000) {
  const c = $('#toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
  t.innerHTML = `<span>${icons[type]||icons.info}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, duration);
}

function saveState() {
  try { localStorage.setItem('hackcheck_v2', JSON.stringify(AppState)); } catch(e) {}
}
function loadState() {
  try {
    const s = localStorage.getItem('hackcheck_v2');
    if (s) Object.assign(AppState, JSON.parse(s));
  } catch(e) {}
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ============================================
// 导航
// ============================================
function initNavigation() {
  // 模块项点击：切换模块或折叠/展开子项
  $$('.nav-item[data-module]').forEach(item => {
    item.addEventListener('click', () => {
      const moduleId = item.dataset.module;
      if (AppState.currentModule === moduleId) {
        // 已是当前模块，仅折叠/展开子项
        toggleSubmenu(moduleId);
      } else {
        // 切换到新模块（switchModule 内部已处理手风琴展开）
        switchModule(moduleId);
        // 默认选中第一个子项
        const firstSub = MODULE_SUBMODULES[moduleId]?.[0];
        if (firstSub) {
          switchSubmodule(moduleId, firstSub.id);
        }
      }
    });
  });

  // 折叠按钮
  $('#sidebarToggle')?.addEventListener('click', toggleSidebar);

  // 渲染子项
  renderSubmodules();
}
function switchModule(name) {
  AppState.currentModule = name;
  AppState.currentSubmodule = null;
  $$('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.module === name));
  $$('.module-section').forEach(s => s.classList.toggle('active', s.id === `module-${name}`));
  // 手风琴：展开当前模块子项，折叠其他
  $$('.nav-group').forEach(g => {
    g.classList.toggle('expanded', g.dataset.module === name);
  });
  $('.main-content').scrollTop = 0;
}

// 折叠/展开侧边栏
function toggleSidebar() {
  $('#sidebar').classList.toggle('collapsed');
}

// 展开/折叠模块的子项列表（手风琴效果）
function toggleSubmenu(moduleId) {
  $$('.nav-group').forEach(group => {
    if (group.dataset.module === moduleId) {
      group.classList.toggle('expanded');
    } else {
      group.classList.remove('expanded');
    }
  });
}

// 从 MODULE_SUBMODULES 渲染子项列表和 flyout 面板
function renderSubmodules() {
  Object.entries(MODULE_SUBMODULES).forEach(([moduleId, subs]) => {
    const container = $(`#navChildren-${moduleId}`);
    if (!container) return;

    // 渲染展开模式的子项列表
    container.innerHTML = subs.map(sub => `
      <button class="nav-sub-item" data-module="${moduleId}" data-submodule="${sub.id}">
        <span>${sub.icon}</span>
        <span>${sub.label}</span>
      </button>
    `).join('');

    // 渲染窄栏 flyout 面板
    const group = container.closest('.nav-group');
    if (!group) return;
    let flyout = group.querySelector('.nav-flyout');
    if (!flyout) {
      flyout = document.createElement('div');
      flyout.className = 'nav-flyout';
      group.appendChild(flyout);
    }
    const moduleTitle = group.querySelector('.nav-title')?.textContent || moduleId;
    flyout.innerHTML = `
      <div class="nav-flyout-title">${moduleTitle}</div>
      ${subs.map(sub => `
        <button class="nav-sub-item" data-module="${moduleId}" data-submodule="${sub.id}">
          <span>${sub.icon}</span>
          <span>${sub.label}</span>
        </button>
      `).join('')}
    `;
  });

  // 绑定子项点击事件（展开模式 + flyout 共用）
  $$('.nav-sub-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      switchSubmodule(item.dataset.module, item.dataset.submodule);
    });
  });
}

// 切换子项：只显示对应区块，隐藏其他
function switchSubmodule(moduleId, subId) {
  if (AppState.currentModule !== moduleId) {
    switchModule(moduleId);
  }
  AppState.currentSubmodule = subId;

  // 隐藏该模块下所有 data-submodule 区块，只显示选中的
  const moduleEl = $(`#module-${moduleId}`);
  if (moduleEl) {
    moduleEl.querySelectorAll('[data-submodule]').forEach(el => {
      el.style.display = el.dataset.submodule === subId ? '' : 'none';
    });
  }

  // 更新子项高亮
  $$('.nav-sub-item').forEach(el => {
    const match = el.dataset.module === moduleId && el.dataset.submodule === subId;
    el.classList.toggle('active', match);
  });

  $('.main-content').scrollTop = 0;
}

// ============================================
// 阶段1: 选题评审
// ============================================
function initTopicModule() {
  const ta = $('#projectDescription');
  ta.addEventListener('input', () => {
    $('#charCount').textContent = `${ta.value.length} 字`;
    AppState.topic.description = ta.value;
  });

  if (AppState.topic.description) ta.value = AppState.topic.description;
  $('#charCount').textContent = `${ta.value.length} 字`;

  $('#searchBtn').addEventListener('click', handleTopicSearch);

  // 渲染搜索平台
  $('#searchPlatforms').innerHTML = TOPIC_DATA.searchPlatforms.map(p => `
    <a href="${p.url}${encodeURIComponent(AppState.topic.description || 'hackathon')}" target="_blank" class="platform-link">
      <span class="platform-icon">${p.icon}</span>
      <span class="platform-name">${p.name}</span>
      <span class="platform-desc">${p.desc}</span>
    </a>
  `).join('');
}

async function handleTopicSearch() {
  const desc = $('#projectDescription').value.trim();
  if (!desc || desc.length < 10) {
    showToast('请输入至少10个字的项目描述', 'warning');
    return;
  }

  AppState.topic.description = desc;
  $('#searchStatus').style.display = 'block';
  $('#multiChannelResults').style.display = 'none';
  $('#topicResults').style.display = 'none';

  // 更新加载状态：正在翻译
  $('#searchStatus').innerHTML = '<div class="search-loading"><div class="loading-spinner"></div><span>正在翻译项目描述为英文...</span></div>';

  // 1. 调用翻译API将描述翻译为英文（支持多语种输入）
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

  // 更新加载状态：正在多渠道搜索
  $('#searchStatus').innerHTML = '<div class="search-loading"><div class="loading-spinner"></div><span>正在搜索 GitHub / Devpost / Bing / 百度 / Wikipedia / DuckDuckGo ...</span></div>';

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
  const channelResults = await multiChannelSearch(searchQuery, keywordGroups.allTerms, desc);

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

  // 8. 分析稀缺度
  const analysis = analyzeTopic(desc, keywordGroups, combinedStats);
  AppState.topic.score = analysis.compositeScore;
  AppState.topic.multiScores = analysis.multiScores;
  AppState.topic.analyzed = true;

  renderTopicResults(analysis, keywordGroups, combinedStats);
  updateOverallScore();
  saveState();

  $('#searchStatus').style.display = 'none';
  const toastMsg = translationSource === 'api'
    ? `翻译+多渠道搜索完成！英文关键词: "${searchQuery}"`
    : '搜索完成（翻译API不可用，使用概念映射）';
  showToast(toastMsg, 'success');
}

// 从中文描述中提取关键词（用于百度搜索）
function extractChineseKeywords(desc) {
  if (!desc) return '';
  // 取第一句话或前40个字符
  const firstSentence = desc.split(/[，。；！？\n,;!?]/)[0].trim();
  const query = firstSentence.length > 40 ? firstSentence.substring(0, 40) : firstSentence;
  return query || desc.substring(0, 30);
}

// 多渠道并行搜索
async function multiChannelSearch(searchQuery, allTerms, originalDesc) {
  // GitHub: 尝试多个查询（从精准到宽泛），取第一个有结果的
  const searchTerms = searchQuery.split(' ');
  const ghQueries = [];
  if (searchTerms.length >= 3) ghQueries.push(searchTerms.slice(0, 3).join(' '));
  if (searchTerms.length >= 2) ghQueries.push(searchTerms.slice(0, 2).join(' '));
  ghQueries.push(searchTerms[0]);

  // 百度使用中文原词搜索
  const baiduQuery = extractChineseKeywords(originalDesc);

  const channels = [
    { id: 'github', name: 'GitHub', icon: '🐙', searchFn: async () => {
      for (const q of ghQueries) {
        const r = await searchGitHubRepos(q);
        if (r.total_count > 0 && r.items.length > 0) return r;
      }
      return { items: [], total_count: 0 };
    }},
    { id: 'devpost', name: 'Devpost', icon: '🏆', searchFn: () => searchDevpost(searchQuery) },
    { id: 'bing', name: 'Bing', icon: '🔍', searchFn: () => searchBing(searchQuery) },
    { id: 'baidu', name: '百度', icon: '🔎', searchFn: () => searchBaidu(baiduQuery) },
    { id: 'wikipedia', name: 'Wikipedia', icon: '📚', searchFn: () => searchWikipedia(searchQuery) },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆', searchFn: () => searchDuckDuckGo(searchQuery) },
  ];

  // 并行搜索所有渠道
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

// 搜索 Devpost 黑客松项目（通过 r.jina.ai 渲染JS后解析Markdown）
async function searchDevpost(searchQuery) {
  const targetUrl = `https://devpost.com/software/search?query=${encodeURIComponent(searchQuery)}`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  let text = '';
  try {
    const resp = await fetch(jinaUrl, { signal: AbortSignal.timeout(20000) });
    if (resp.ok) {
      text = await resp.text();
    }
  } catch(e) {
    console.warn(`Devpost r.jina.ai failed:`, e.message);
    throw new Error('Devpost search failed (timeout)');
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
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Wikipedia API error');
  const data = await resp.json();

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
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('DuckDuckGo API error');
  const data = await resp.json();

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

// 搜索 Bing 搜索引擎（通过 r.jina.ai 渲染JS后解析Markdown）
async function searchBing(searchQuery) {
  const targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&count=10`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  let text = '';
  try {
    const resp = await fetch(jinaUrl, { signal: AbortSignal.timeout(20000) });
    if (resp.ok) {
      text = await resp.text();
    }
  } catch(e) {
    console.warn(`Bing r.jina.ai failed:`, e.message);
    throw new Error('Bing search failed (timeout)');
  }

  if (!text || text.length < 500) throw new Error('Bing: empty response');

  // 解析Markdown提取搜索结果
  // 格式: ## [Title](bing_redirect_url) 后跟描述文本
  const results = [];
  const lines = text.split('\n');
  const seen = new Set();

  for (let i = 0; i < lines.length && results.length < 8; i++) {
    const line = lines[i];
    // 匹配 ## [Title](URL) 或 ### [Title](URL)
    const headingMatch = line.match(/^#{2,3}\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (headingMatch) {
      const title = headingMatch[1].replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim();
      const url = headingMatch[2];

      // 跳过Bing自身的链接
      if (url.includes('bing.com/search') || url.includes('bing.com/ck/a')) {
        // 仍然记录，但使用Bing搜索URL作为回退
      }
      if (seen.has(url)) continue;
      seen.add(url);

      // 提取描述（下一行或下两行的非空文本）
      let desc = '';
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('![') && nextLine.length > 15) {
          desc = nextLine.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
          break;
        }
      }

      if (title && title.length > 2 && !desc.startsWith('Sponsored')) {
        results.push({ name: title, description: desc, url: url, stars: '🔍' });
      }
    }
  }

  if (results.length === 0) throw new Error('Bing: no results parsed');
  return { items: results, total_count: results.length };
}

// 搜索百度搜索引擎（使用中文关键词，通过 r.jina.ai 渲染JS后解析Markdown）
async function searchBaidu(chineseQuery) {
  if (!chineseQuery || chineseQuery.length < 2) throw new Error('Baidu: no Chinese query');

  const targetUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(chineseQuery)}&rn=10`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  let text = '';
  try {
    const resp = await fetch(jinaUrl, { signal: AbortSignal.timeout(20000) });
    if (resp.ok) {
      text = await resp.text();
    }
  } catch(e) {
    console.warn(`Baidu r.jina.ai failed:`, e.message);
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
        <div class="channel-stat-label">${hasResult ? `${stats.matchedCount}/${stats.repos.length} 命中 · ${hitPct}%` : (ch.error ? '搜索失败' : '无结果')}</div>
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
    $('#channelContent').innerHTML = '<div class="channel-empty">该渠道未搜索到相关结果</div>';
    return;
  }

  const totalCount = channel.stats.totalCount;
  const matchedCount = channel.stats.matchedCount || 0;
  const hitRatio = Math.round((channel.stats.hitRatio || 0) * 100);
  const totalCountLabel = totalCount > 1000 ? `${(totalCount/1000).toFixed(1)}k` : totalCount;

  let statsHTML = `<div class="search-stats">`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${totalCountLabel}</span><span class="stat-label">${channel.name}总结果</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${matchedCount}/${repos.length}</span><span class="stat-label">命中相关</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${hitRatio}%</span><span class="stat-label">命中百分比</span></div>`;
  statsHTML += `</div>`;

  const reposHTML = repos.map(repo => {
    const repoText = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase();
    const isHit = allTerms.some(t => repoText.includes(t.toLowerCase()));
    return `
    <div class="repo-card ${isHit ? 'hit' : 'miss'}">
      <div class="repo-header">
        <a href="${repo.url || repo.html_url || '#'}" target="_blank" class="repo-name">${repo.name || repo.full_name}</a>
        <span class="repo-stars">${repo.stars || (repo.stargazers_count ? '⭐ ' + repo.stargazers_count : '')}</span>
      </div>
      <p class="repo-desc">${repo.description || '暂无描述'}</p>
      <div class="repo-meta">
        ${repo.language ? `<span class="repo-lang">${repo.language}</span>` : ''}
        ${repo.updated_at ? `<span class="repo-updated">更新于 ${new Date(repo.updated_at).toLocaleDateString('zh-CN')}</span>` : ''}
        ${isHit ? '<span class="repo-hit">✅ 命中</span>' : '<span class="repo-miss">⚪ 不相关</span>'}
      </div>
    </div>
  `;
  }).join('');

  $('#channelContent').innerHTML = statsHTML + reposHTML;
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

// 从翻译后的英文文本提取搜索关键词
function extractKeywordsFromEnglish(translatedText, originalDesc) {
  // 1. 从翻译文本中提取有意义的英文词组
  // 去除常见停用词
  const stopWords = new Set(['a','an','the','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','to','of','in','on','at','by','for','with','about','as','into','like','through','after','over','between','out','against','during','without','before','under','around','among','and','but','or','nor','not','so','yet','both','either','neither','each','every','all','any','few','more','most','other','some','such','no','only','own','same','than','too','very','just','also','now','then','here','there','when','where','why','how','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','whose','my','your','his','her','its','our','their','me','him','us','them','myself','yourself','himself','herself','itself','ourself','themselves','what','whatever','whoever','whomever']);

  // 提取词组（2-3个连续有意义词）和单个长词
  const words = translatedText.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1 && !stopWords.has(w));

  // 也用概念映射补充（从原始中文描述）
  const conceptMap = TOPIC_DATA.conceptMap || {};
  const conceptTerms = [];
  const sortedKeys = Object.keys(conceptMap).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(cn => {
    if (originalDesc.toLowerCase().includes(cn.toLowerCase())) {
      conceptMap[cn].forEach(en => {
        if (!conceptTerms.includes(en.toLowerCase())) conceptTerms.push(en.toLowerCase());
      });
    }
  });

  // 合并：优先用翻译API的词，补充概念映射的词
  const allTerms = [...new Set([...words.map(w => w.toLowerCase()), ...conceptTerms])];

  // 构建搜索词：取翻译结果的前3个有意义词
  let searchTerms = words.slice(0, 3);
  // 如果不足，补充概念映射词
  if (searchTerms.length < 2 && conceptTerms.length > 0) {
    searchTerms = [...searchTerms, ...conceptTerms].slice(0, 3);
  }

  const searchQuery = searchTerms.join(' ');

  // 构建groups用于显示
  const groups = sortedKeys
    .filter(cn => originalDesc.toLowerCase().includes(cn.toLowerCase()))
    .map(cn => ({ cn, en: conceptMap[cn] }));

  return { groups, searchTerms, searchQuery, allTerms, translatedText };
}

// 将中文描述按概念分组提取关键词，每组取第一个词构建精准搜索
function extractKeywordGroups(text) {
  const conceptMap = TOPIC_DATA.conceptMap || {};
  const groups = []; // [{cn: '老年人', en: ['elderly','senior',...], type: 'domain'}]

  // 概念分类：技术类关键词（不用于搜索，避免返回通用库）
  const techConcepts = ['语音识别','自然语言','AI','人工智能','区块链','IoT','物联网','AR','VR','数据可视化','机器学习','深度学习'];
  // 领域/用户类关键词
  const domainConcepts = ['老年人','老人','适老','儿童','学生','乡村','盲人','聋','残障','无障碍','隐私','安全','环保','心理','情绪','压力','应急','灾害'];

  // 按中文词长度降序排列，优先匹配更长的词（如"语音识别"优先于"语音"）
  const sortedKeys = Object.keys(conceptMap).sort((a, b) => b.length - a.length);
  const matchedSet = new Set(); // 已匹配的字符位置，避免重复匹配

  sortedKeys.forEach(cn => {
    const lower = text.toLowerCase();
    const cnLower = cn.toLowerCase();
    const idx = lower.indexOf(cnLower);
    if (idx >= 0) {
      // 检查是否与已匹配的概念重叠
      let overlap = false;
      for (let i = idx; i < idx + cnLower.length; i++) {
        if (matchedSet.has(i)) { overlap = true; break; }
      }
      if (!overlap) {
        for (let i = idx; i < idx + cnLower.length; i++) matchedSet.add(i);
        let type = 'feature'; // 默认为功能类
        if (techConcepts.includes(cn)) type = 'tech';
        else if (domainConcepts.includes(cn)) type = 'domain';
        groups.push({ cn, en: conceptMap[cn], type });
      }
    }
  });

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

  return { groups, searchTerms, searchQuery, allTerms, productTerms, techTerms };
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
  statsHTML += `<div class="stat-item"><span class="stat-num">${totalCountLabel}</span><span class="stat-label">GitHub总结果</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${matchedCount}/${repos.length}</span><span class="stat-label">命中相关</span></div>`;
  statsHTML += `<div class="stat-item"><span class="stat-num">${hitRatio}%</span><span class="stat-label">命中百分比</span></div>`;
  statsHTML += `</div>`;

  $('#repoList').innerHTML = statsHTML + repos.map(repo => {
    // 检查这个repo是否命中
    const repoText = ((repo.name || '') + ' ' + (repo.description || '')).toLowerCase();
    const allTerms = (searchStats.allTerms || []);
    const isHit = allTerms.some(t => repoText.includes(t.toLowerCase()));
    return `
    <div class="repo-card ${isHit ? 'hit' : 'miss'}">
      <div class="repo-header">
        <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.full_name}</a>
        <span class="repo-stars">⭐ ${repo.stargazers_count}</span>
      </div>
      <p class="repo-desc">${repo.description || '暂无描述'}</p>
      <div class="repo-meta">
        ${repo.language ? `<span class="repo-lang">${repo.language}</span>` : ''}
        <span class="repo-updated">更新于 ${new Date(repo.updated_at).toLocaleDateString('zh-CN')}</span>
        ${isHit ? '<span class="repo-hit">✅ 命中</span>' : '<span class="repo-miss">⚪ 不相关</span>'}
      </div>
    </div>
  `;
  }).join('');
}

function analyzeTopic(description, keywordGroups, searchStats) {
  const descLower = description.toLowerCase();
  const allTerms = keywordGroups.allTerms || [];

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
  // 意义感：基于加分因素和模式的意义评级
  const meaningScore = clamp(Math.round(meaningBase), 10, 98);
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
    blue: { icon: '🌊', text: '蓝海项目！这个方向稀缺度高，社会价值显著，有很大机会脱颖而出。', color: 'var(--accent-primary)' },
    yellow: { icon: '⚡', text: '黄海项目。方向有一定竞争，但通过差异化策略可以脱颖而出。', color: 'var(--accent-warning)' },
    red: { icon: '🔥', text: '红海项目。这个方向已有大量同类项目，需要找到独特切入点。', color: 'var(--accent-danger)' }
  };
  const v = verdicts[analysis.oceanType] || verdicts.yellow;
  $('#topicVerdict').innerHTML = `<div class="verdict-card" style="border-color:${v.color}"><span class="verdict-icon">${v.icon}</span><span class="verdict-text">${v.text}</span></div>`;

  // 搜索统计摘要
  const ss = analysis.searchStats || {};
  const totalCountLabel = ss.totalCount > 1000 ? `${(ss.totalCount/1000).toFixed(1)}k` : (ss.totalCount || 0);
  const hitPct = Math.round((ss.hitRatio || 0) * 100);
  let searchSummaryHTML = '<div class="search-summary-card"><h4>📈 搜索稀缺度分析</h4><div class="search-summary-stats">';
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${totalCountLabel}</span><span class="ss-label">GitHub 仓库总数</span></div>`;
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${ss.matchedCount || 0}/${ss.resultCount || 0}</span><span class="ss-label">相关命中</span></div>`;
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${hitPct}%</span><span class="ss-label">命中百分比</span></div>`;
  searchSummaryHTML += `<div class="ss-stat"><span class="ss-num">${analysis.multiScores.scarcity}</span><span class="ss-label">稀缺度评分</span></div>`;
  searchSummaryHTML += '</div>';
  // 评分依据
  let basis = '';
  if (ss.totalCount === 0) basis = '未搜索到任何同类项目，极度稀缺';
  else if (ss.totalCount < 10) basis = `仅找到 ${ss.totalCount} 个相关仓库，属于极度稀缺方向`;
  else if (ss.totalCount < 50) basis = `找到 ${ss.totalCount} 个相关仓库，稀缺度较高`;
  else if (ss.totalCount < 200) basis = `找到 ${ss.totalCount} 个相关仓库，竞争适中`;
  else if (ss.totalCount < 1000) basis = `找到 ${ss.totalCount} 个相关仓库，方向较常见`;
  else basis = `找到超过 ${totalCountLabel} 个相关仓库，方向非常常见`;
  if (ss.resultCount > 0 && hitPct < 50) basis += `；命中百分比仅 ${hitPct}%，说明大部分搜索结果与你的项目不直接相关，有差异化空间`;
  searchSummaryHTML += `<p class="ss-basis">${basis}</p></div>`;

  // 多维分数（在分数区域前插入搜索摘要）
  const scores = analysis.multiScores;
  $('#topicMultiScores').innerHTML = `
    ${searchSummaryHTML}
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${scores.originality}%;background:linear-gradient(90deg,#00ffa3,#00d488)"></div></div>
      <div class="multi-score-info"><span>原创性</span><span class="multi-score-value">${scores.originality}</span></div>
    </div>
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${scores.scarcity}%;background:linear-gradient(90deg,#4d8dff,#7c5cff)"></div></div>
      <div class="multi-score-info"><span>稀缺度（基于搜索结果）</span><span class="multi-score-value">${scores.scarcity}</span></div>
    </div>
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${scores.meaning}%;background:linear-gradient(90deg,#ffb800,#ff8c00)"></div></div>
      <div class="multi-score-info"><span>意义感</span><span class="multi-score-value">${scores.meaning}</span></div>
    </div>
    <div class="multi-score-item">
      <div class="multi-score-bar"><div class="multi-score-fill" style="width:${score}%;background:linear-gradient(90deg,#a78bfa,#7c5cff)"></div></div>
      <div class="multi-score-info"><span>综合稀缺指数</span><span class="multi-score-value">${score}</span></div>
    </div>
  `;

  // 查重结果
  if (analysis.matchedPatterns.length > 0) {
    $('#similarPatterns').innerHTML = analysis.matchedPatterns.slice(0, 5).map(p => {
      const oceanBadge = { red: '<span class="ocean-badge red">红海</span>', yellow: '<span class="ocean-badge yellow">黄海</span>', blue: '<span class="ocean-badge blue">蓝海</span>' };
      return `
        <div class="pattern-item">
          <div class="pattern-header">
            <span class="pattern-name">${p.pattern}</span>
            ${oceanBadge[p.oceanType] || ''}
          </div>
          <div class="pattern-meta">
            <span>稀缺度: ${'★'.repeat(p.scarcity)}${'☆'.repeat(5-p.scarcity)}</span>
            <span>意义感: ${'★'.repeat(p.meaning)}${'☆'.repeat(5-p.meaning)}</span>
            <span>匹配度: ${Math.round(p.matchRatio * 100)}%</span>
          </div>
          <p class="pattern-advice">${p.advice}</p>
        </div>
      `;
    }).join('');
  } else {
    $('#similarPatterns').innerHTML = '<div class="empty-hint">未检测到与常见模式的匹配，你的项目方向可能比较独特！</div>';
  }

  // 加分因素
  if (analysis.matchedBoosters.length > 0) {
    $('#boostersFound').innerHTML = analysis.matchedBoosters.map(b => {
      const typeLabels = { social: '社会价值', tech: '技术亮点', domain: '领域专精' };
      return `<div class="booster-item"><span class="booster-badge ${b.type}">${typeLabels[b.type]||b.type}</span><span class="booster-label">${b.label}</span><span class="booster-boost">+${b.boost}</span></div>`;
    }).join('');
  } else {
    $('#boostersFound').innerHTML = '<div class="empty-hint">未检测到加分因素。考虑加入无障碍、可持续发展、适老化等元素来提升项目价值。</div>';
  }

  // 差异化策略
  if (analysis.differentiation && analysis.differentiation.length > 0) {
    $('#differentiationStrategies').innerHTML = analysis.differentiation.map((d, i) => `
      <div class="diff-strategy"><span class="diff-num">${i+1}</span><span class="diff-text">${d}</span></div>
    `).join('');
  } else {
    $('#differentiationStrategies').innerHTML = '<div class="empty-hint">你的项目方向较为独特，暂无特定差异化策略推荐。继续保持创新！</div>';
  }

  // 更新搜索平台链接（使用英文关键词）
  const searchQuery = encodeURIComponent(keywordGroups.searchQuery || keywordGroups.searchTerms.slice(0, 3).join(' '));
  $('#searchPlatforms').innerHTML = TOPIC_DATA.searchPlatforms.map(p => `
    <a href="${p.url}${searchQuery}" target="_blank" class="platform-link">
      <span class="platform-icon">${p.icon}</span>
      <div><span class="platform-name">${p.name}</span><span class="platform-desc">${p.desc}</span></div>
    </a>
  `).join('');

  // 建议
  let adviceHTML = '<div class="advice-card"><h4>💡 优化建议</h4><ul>';
  if (analysis.oceanType === 'red') {
    adviceHTML += '<li>当前方向竞争激烈，强烈建议参考上方的<strong>差异化策略</strong>找到独特切入点</li>';
    adviceHTML += '<li>尝试结合<strong>无障碍、适老化、可持续发展</strong>等方向重新定位项目</li>';
  } else if (analysis.oceanType === 'yellow') {
    adviceHTML += '<li>方向有一定潜力，通过差异化策略可以脱颖而出</li>';
    adviceHTML += '<li>强化项目的<strong>社会价值</strong>叙述，让评委看到意义</li>';
  } else {
    adviceHTML += '<li>方向很好！稀缺度高，有差异化优势</li>';
    adviceHTML += '<li>专注于<strong>快速实现MVP</strong>，用Demo证明可行性</li>';
  }
  if (analysis.matchedBoosters.length < 2) {
    adviceHTML += '<li>考虑加入<strong>适老化、无障碍、可持续发展</strong>等元素提升项目意义</li>';
  }
  adviceHTML += '</ul></div>';
  $('#topicAdvice').innerHTML = adviceHTML;
}

// ============================================
// 阶段2: 技术选型
// ============================================
function initTechModule() {
  const container = $('#techCategories');
  container.innerHTML = TECH_DATA.categories.map(cat => {
    const chips = cat.technologies.map(tech => {
      const sel = AppState.tech.selected.includes(tech.name) ? 'selected' : '';
      return `<div class="tech-chip ${sel}" data-tech="${tech.name}"><span>${tech.name}</span><span class="tech-chip-complexity">C${tech.complexity}</span></div>`;
    }).join('');
    return `<div class="tech-category"><div class="tech-category-header"><span class="tech-category-icon">${cat.icon}</span><span class="tech-category-name">${cat.name}</span></div><div class="tech-options">${chips}</div></div>`;
  }).join('');

  // 渲染预设方案选择器
  renderPresetPlans();

  $$('.tech-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.tech;
      const idx = AppState.tech.selected.indexOf(name);
      if (idx > -1) { AppState.tech.selected.splice(idx, 1); chip.classList.remove('selected'); }
      else { AppState.tech.selected.push(name); chip.classList.add('selected'); }
      // 手动选择后取消方案高亮
      AppState.tech.activePlan = null;
      $$('.plan-card').forEach(c => c.classList.remove('active'));
      evaluateTechStack();
      saveState();
    });
  });

  $('#hackathonDuration').addEventListener('change', e => { AppState.tech.duration = parseInt(e.target.value); evaluateTechStack(); saveState(); });
  $('#teamSize').addEventListener('change', e => { AppState.tech.teamSize = parseInt(e.target.value); evaluateTechStack(); saveState(); });
  $('#teamExperience').addEventListener('change', e => { AppState.tech.experience = parseInt(e.target.value); evaluateTechStack(); saveState(); });

  $('#hackathonDuration').value = AppState.tech.duration;
  $('#teamSize').value = AppState.tech.teamSize;
  $('#teamExperience').value = AppState.tech.experience;

  if (AppState.tech.selected.length > 0) {
    // 恢复方案高亮
    if (AppState.tech.activePlan) {
      const card = document.querySelector(`.plan-card[data-plan="${AppState.tech.activePlan}"]`);
      if (card) card.classList.add('active');
    }
    evaluateTechStack();
  }
}

function renderPresetPlans() {
  const container = $('#presetPlans');
  if (!container) return;

  container.innerHTML = TECH_DATA.presetPlans.map(plan => `
    <div class="plan-card ${AppState.tech.activePlan === plan.id ? 'active' : ''}" data-plan="${plan.id}">
      <div class="plan-header">
        <span class="plan-icon">${plan.icon}</span>
        <div>
          <div class="plan-name">${plan.name}</div>
          <div class="plan-cost">${plan.costLabel}</div>
        </div>
      </div>
      <p class="plan-desc">${plan.desc}</p>
      <div class="plan-bestfor">📌 ${plan.bestFor}</div>
    </div>
  `).join('');

  $$('.plan-card').forEach(card => {
    card.addEventListener('click', () => {
      const planId = card.dataset.plan;
      const plan = TECH_DATA.presetPlans.find(p => p.id === planId);
      if (!plan) return;

      // 应用方案
      AppState.tech.selected = [...plan.techs];
      AppState.tech.activePlan = planId;

      // 更新chip选中状态
      $$('.tech-chip').forEach(chip => {
        chip.classList.toggle('selected', plan.techs.includes(chip.dataset.tech));
      });

      // 高亮当前方案
      $$('.plan-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      evaluateTechStack();
      saveState();
      showToast(`已应用「${plan.name}」，共 ${plan.techs.length} 项技术`, 'success');
    });
  });
}

function evaluateTechStack() {
  const selected = AppState.tech.selected;
  if (selected.length === 0) {
    $('#techResults').style.display = 'none';
    $('#divisionSection').style.display = 'none';
    $('#timelineSection').style.display = 'none';
    $('#navScoreTech').textContent = '--';
    return;
  }

  $('#techResults').style.display = 'block';
  $('#divisionSection').style.display = 'block';
  $('#timelineSection').style.display = 'block';

  const selectedTechs = [];
  TECH_DATA.categories.forEach(cat => {
    cat.technologies.forEach(t => { if (selected.includes(t.name)) selectedTechs.push({ ...t, category: cat.name }); });
  });

  const totalComplexity = selectedTechs.reduce((s, t) => s + t.complexity, 0);
  const avgComplexity = totalComplexity / selectedTechs.length;
  const avgFit = selectedTechs.reduce((s, t) => s + t.hackathonFit, 0) / selectedTechs.length;
  const totalSetup = selectedTechs.reduce((s, t) => s + t.timeToSetup, 0);

  const duration = AppState.tech.duration;
  const experience = AppState.tech.experience;
  const teamSize = AppState.tech.teamSize;

  const expFactor = experience === 1 ? 1.5 : experience === 2 ? 1.0 : 0.7;
  const teamFactor = teamSize === 1 ? 1.3 : teamSize <= 3 ? 1.0 : 0.85;
  const adjustedComplexity = totalComplexity * expFactor * teamFactor;
  const timeRec = TECH_DATA.timeRecommendations[duration] || TECH_DATA.timeRecommendations[48];
  const isFeasible = adjustedComplexity <= timeRec.maxComplexity;

  // 复杂度
  const cLevel = avgComplexity <= 2 ? 'low' : avgComplexity <= 3 ? 'medium' : 'high';
  const cText = avgComplexity <= 2 ? '低' : avgComplexity <= 3 ? '中' : '高';
  $('#complexityResult').innerHTML = `
    <div class="result-score ${cLevel}">${cText}</div>
    <div class="result-bar"><div class="result-bar-fill ${cLevel}" style="width:${(avgComplexity/5)*100}%"></div></div>
    <p class="result-meta">总复杂度: ${totalComplexity} | 平均: ${avgComplexity.toFixed(1)}/5</p>
    <p class="result-meta">配置时间: ~${totalSetup}h</p>
  `;

  // 时间可行性
  const feasibilityScore = clamp(Math.round((timeRec.maxComplexity / adjustedComplexity) * 100), 0, 100);
  const fLevel = feasibilityScore >= 70 ? 'low' : feasibilityScore >= 40 ? 'medium' : 'high';
  const fText = feasibilityScore >= 70 ? '可行' : feasibilityScore >= 40 ? '有风险' : '不可行';
  $('#timeResult').innerHTML = `
    <div class="result-score ${fLevel}">${fText}</div>
    <div class="result-bar"><div class="result-bar-fill ${fLevel}" style="width:${feasibilityScore}%"></div></div>
    <p class="result-meta">调整后复杂度: ${Math.round(adjustedComplexity)}/${timeRec.maxComplexity}</p>
    <p class="result-meta">${timeRec.recommendation}</p>
  `;

  // 适配度
  const fitLevel = avgFit >= 4 ? 'low' : avgFit >= 3 ? 'medium' : 'high';
  const fitText = avgFit >= 4 ? '极佳' : avgFit >= 3 ? '一般' : '不佳';
  $('#fitResult').innerHTML = `
    <div class="result-score ${fitLevel}">${fitText}</div>
    <div class="result-bar"><div class="result-bar-fill ${fitLevel}" style="width:${(avgFit/5)*100}%"></div></div>
    <p class="result-meta">平均适配: ${avgFit.toFixed(1)}/5</p>
    <p class="result-meta">${selectedTechs.length} 项技术已选</p>
  `;

  // 风险报告
  const risks = [];
  TECH_DATA.riskRules.forEach(rule => {
    const triggered = rule.triggers.some(t => selected.includes(t));
    if (triggered) risks.push(rule);
  });
  if (risks.length > 0) {
    $('#riskReport').style.display = 'block';
    $('#riskList').innerHTML = risks.map(r => `
      <div class="risk-item ${r.severity}">
        <span class="risk-icon">${r.severity === 'high' ? '🔴' : '🟡'}</span>
        <div class="risk-content"><strong>${r.title}</strong><p>${r.description}</p><div class="risk-suggestions">${r.suggestions.map(s => `<span class="risk-suggestion">→ ${s}</span>`).join('')}</div></div>
      </div>
    `).join('');
  } else {
    $('#riskReport').style.display = 'none';
  }

  // 推荐
  let recHTML = '<div class="tech-rec-card"><h4>📋 技术选型建议</h4><ul>';
  if (isFeasible) {
    recHTML += `<li>✅ 当前技术栈在 ${duration} 小时内<strong>可行</strong>，复杂度在可控范围内</li>`;
  } else {
    recHTML += `<li>⚠️ 当前技术栈复杂度偏高，建议<strong>精简技术选型</strong>或增加人手</li>`;
  }
  if (avgFit >= 4) recHTML += '<li>🎯 所选技术<strong>黑客松适配度高</strong>，能快速搭建</li>';
  if (totalSetup > 8) recHTML += `<li>⏱️ 配置时间预计 ${totalSetup} 小时，建议<strong>提前搭建环境</strong></li>`;
  recHTML += '</ul></div>';
  $('#techRecommendation').innerHTML = recHTML;

  // 成本分析
  renderCostAnalysis(selected);

  // 分工推荐
  renderTaskDivision();
  renderTimeline();

  // 更新分数
  const techScore = clamp(Math.round((feasibilityScore + avgFit * 20) / 2), 0, 100);
  AppState.tech.score = techScore;
  $('#techScore').textContent = techScore;
  $('#navScoreTech').textContent = techScore;
  updateOverallScore();
}

function renderCostAnalysis(selectedTechs) {
  const costContainer = $('#costAnalysis');
  if (!costContainer) return;

  // 查找匹配的预设方案
  const matchedPlan = TECH_DATA.presetPlans.find(plan =>
    plan.techs.every(t => selectedTechs.includes(t)) && selectedTechs.length === plan.techs.length
  );

  let html = '<div class="cost-card"><h4>💰 成本分析</h4>';

  if (matchedPlan) {
    // 完全匹配某个预设方案
    html += `<div class="cost-plan-match">当前选型完全匹配「${matchedPlan.icon} ${matchedPlan.name}」</div>`;
    html += '<div class="cost-breakdown">';
    matchedPlan.costBreakdown.forEach(item => {
      html += `<div class="cost-item"><span class="cost-item-label">${item.item}</span><span class="cost-item-tool">${item.tool}</span><span class="cost-item-price">${item.cost}</span></div>`;
    });
    html += '</div>';
    html += `<div class="cost-total">预估总成本: <strong>${matchedPlan.costLabel}</strong></div>`;
    html += '<div class="cost-pros-cons">';
    html += `<div class="cost-pros"><strong>✅ 优势</strong><ul>${matchedPlan.pros.map(p => `<li>${p}</li>`).join('')}</ul></div>`;
    html += `<div class="cost-cons"><strong>⚠️ 注意</strong><ul>${matchedPlan.cons.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
    html += '</div>';
  } else {
    // 自定义选型 - 分析各项成本
    const costItems = [];
    let hasPaidAPI = false;

    selectedTechs.forEach(name => {
      if (['OpenAI API', 'Claude API', 'Together AI'].includes(name)) {
        hasPaidAPI = true;
        if (name === 'Together AI') costItems.push({ item: 'AI能力', tool: name, cost: '免费$5额度' });
        else if (name === 'OpenAI API') costItems.push({ item: 'AI能力', tool: name, cost: '约$5-50（按量计费）' });
        else costItems.push({ item: 'AI能力', tool: name, cost: '约$5-50（按量计费）' });
      }
      if (['Vercel', 'Netlify', 'Render'].includes(name)) costItems.push({ item: '前端部署', tool: name, cost: '免费额度可用' });
      if (['Railway'].includes(name)) costItems.push({ item: '后端部署', tool: name, cost: '$5/月' });
      if (['Supabase', 'Firebase'].includes(name)) costItems.push({ item: 'BaaS', tool: name, cost: '免费额度可用' });
      if (['Stripe'].includes(name)) costItems.push({ item: '支付', tool: name, cost: '免费（测试模式）' });
      if (['Twilio'].includes(name)) costItems.push({ item: '短信/通话', tool: name, cost: '有免费试用额度' });
    });

    if (costItems.length === 0) {
      html += '<div class="cost-free-all">🎉 当前选型完全免费！所有技术都有免费额度可用。</div>';
    } else {
      html += '<div class="cost-breakdown">';
      costItems.forEach(item => {
        html += `<div class="cost-item"><span class="cost-item-label">${item.item}</span><span class="cost-item-tool">${item.tool}</span><span class="cost-item-price">${item.cost}</span></div>`;
      });
      html += '</div>';
      if (hasPaidAPI) {
        html += '<div class="cost-tip">💡 AI API费用提示：使用GPT-4o-mini等经济模型，设置用量上限，黑客松期间费用通常在$5-20以内</div>';
      }
    }
    html += `<div class="cost-compare">💡 想看看预设方案？点击上方方案卡片可以一键切换到推荐选型</div>`;
  }

  html += '</div>';
  costContainer.innerHTML = html;
  costContainer.style.display = 'block';
}

function renderTaskDivision() {
  const teamSize = AppState.tech.teamSize;
  const template = TECH_DATA.taskDivisionTemplates[teamSize] || TECH_DATA.taskDivisionTemplates[3];

  $('#divisionStrategy').innerHTML = `<div class="division-strategy-card"><strong>${template.title}</strong><p>${template.strategy}</p></div>`;

  $('#divisionRoles').innerHTML = template.roles.map(r => `
    <div class="division-role-card">
      <div class="role-header"><span class="role-icon">${r.icon}</span><span class="role-name">${r.role}</span></div>
      <ul class="role-tasks">${r.tasks.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="role-time">⏱️ ${r.timeAllocation}</div>
    </div>
  `).join('');

  $('#divisionTips').innerHTML = `<div class="division-tips-card"><strong>💡 分工建议</strong><ul>${template.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
}

function renderTimeline() {
  const duration = AppState.tech.duration;
  const timeline = TECH_DATA.timelineTemplates[duration] || TECH_DATA.timelineTemplates[48];

  $('#timelineTrack').innerHTML = timeline.map((phase, i) => `
    <div class="timeline-phase ${i === 0 ? 'first' : ''} ${i === timeline.length - 1 ? 'last' : ''}">
      <div class="timeline-marker">${i + 1}</div>
      <div class="timeline-content">
        <div class="timeline-time">${phase.time}</div>
        <div class="timeline-name">${phase.phase}</div>
        <ul class="timeline-tasks">${phase.tasks.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    </div>
  `).join('');
}

// ============================================
// 阶段3: 代码扫描
// ============================================
function initDevModule() {
  const zone = $('#uploadZone');
  const input = $('#fileInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', (e) => handleFiles(e.target.files));

  $('#clearFilesBtn').addEventListener('click', () => {
    AppState.dev.files = [];
    AppState.dev.scanned = false;
    $('#scannedFiles').style.display = 'none';
    $('#scanResults').style.display = 'none';
    $('#devScore').textContent = '0';
    $('#navScoreDev').textContent = '--';
    updateOverallScore();
    saveState();
  });

  if (AppState.dev.files.length > 0 && AppState.dev.scanned) {
    renderFileList();
    renderScanResults();
  }
}

async function handleFiles(fileList) {
  // 过滤可扫描文件，保留目录路径信息
  const files = Array.from(fileList).filter(f => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    return CODE_SCAN_DATA.scanableExtensions.includes(ext) || f.name === '.gitignore' || f.name === '.env';
  });

  // 过滤掉 node_modules、.git 等不需要扫描的目录
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', '.cache', 'vendor'];
  const filteredFiles = files.filter(f => {
    const relPath = f.webkitRelativePath || f.name;
    return !ignoreDirs.some(d => relPath.includes('/' + d + '/') || relPath.startsWith(d + '/'));
  });

  if (filteredFiles.length === 0) {
    showToast('未找到可扫描的文件，请上传包含 .js .ts .py .env .gitignore 等文件的项目文件夹', 'warning');
    return;
  }

  showToast(`正在扫描 ${filteredFiles.length} 个文件...`, 'info');

  const readPromises = filteredFiles.map(f => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({
      name: f.name,
      path: f.webkitRelativePath || f.name, // 保留完整相对路径
      content: e.target.result,
      ext: '.' + f.name.split('.').pop().toLowerCase(),
      size: f.size
    });
    reader.readAsText(f);
  }));

  const readFiles = await Promise.all(readPromises);
  AppState.dev.files = [...AppState.dev.files, ...readFiles];

  // 去重（按路径去重而非文件名）
  const seen = new Set();
  AppState.dev.files = AppState.dev.files.filter(f => {
    const key = f.path || f.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  renderFileList();
  scanFiles();
}

function renderFileList() {
  const files = AppState.dev.files;
  if (files.length === 0) {
    $('#scannedFiles').style.display = 'none';
    return;
  }

  $('#scannedFiles').style.display = 'block';
  $('#fileCount').textContent = files.length;

  // 按目录分组显示
  const dirGroups = {};
  files.forEach(f => {
    const path = f.path || f.name;
    const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '(根目录)';
    if (!dirGroups[dir]) dirGroups[dir] = [];
    dirGroups[dir].push(f);
  });

  let html = '';
  Object.keys(dirGroups).sort().forEach(dir => {
    html += `<div class="file-dir-group">`;
    html += `<div class="file-dir-name">📁 ${dir} <span class="file-dir-count">(${dirGroups[dir].length})</span></div>`;
    html += `<div class="file-dir-items">`;
    dirGroups[dir].forEach(f => {
      html += `
        <div class="file-item">
          <span class="file-icon">${getFileIcon(f.ext)}</span>
          <span class="file-name">${f.name}</span>
          <span class="file-size">${(f.size / 1024).toFixed(1)}KB</span>
        </div>
      `;
    });
    html += `</div></div>`;
  });
  $('#fileList').innerHTML = html;
}

function getFileIcon(ext) {
  const icons = { '.js':'📄','.ts':'📄','.jsx':'⚛️','.tsx':'⚛️','.py':'🐍','.java':'☕','.go':'🐹','.env':'🔑','.gitignore':'📋','.json':'📊','.html':'🌐','.css':'🎨','.vue':'💚','.svelte':'🔥' };
  return icons[ext] || '📄';
}

function scanFiles() {
  const files = AppState.dev.files;
  const findings = { secrets: [], gitignore: null, quality: [], sensitive: [] };

  // 1. 扫描硬编码密钥
  files.forEach(file => {
    CODE_SCAN_DATA.secretPatterns.forEach(pattern => {
      const matches = file.content.match(pattern.regex);
      if (matches) {
        const lines = file.content.split('\n');
        const lineNums = [];
        lines.forEach((line, i) => {
          if (pattern.regex.test(line)) lineNums.push(i + 1);
        });
        findings.secrets.push({
          ...pattern,
          fileName: file.path || file.name,
          count: matches.length,
          lineNumbers: lineNums.slice(0, 3)
        });
      }
    });
  });

  // 2. 分析 .gitignore
  const gitignoreFile = files.find(f => f.name === '.gitignore' || f.name.endsWith('.gitignore'));
  if (gitignoreFile) {
    const content = gitignoreFile.content;
    const rules = CODE_SCAN_DATA.gitignoreRules;
    const missingCritical = rules.critical.filter(r => !content.includes(r.pattern));
    const missingImportant = rules.important.filter(r => !content.includes(r.pattern));
    const missingRecommended = rules.recommended.filter(r => !content.includes(r.pattern));
    findings.gitignore = {
      exists: true,
      content,
      missingCritical,
      missingImportant,
      missingRecommended,
      hasEnv: content.includes('.env'),
      hasNodeModules: content.includes('node_modules')
    };
  } else {
    findings.gitignore = {
      exists: false,
      missingCritical: CODE_SCAN_DATA.gitignoreRules.critical,
      missingImportant: CODE_SCAN_DATA.gitignoreRules.important,
      missingRecommended: CODE_SCAN_DATA.gitignoreRules.recommended
    };
  }

  // 3. 代码质量检查
  files.forEach(file => {
    CODE_SCAN_DATA.qualityChecks.forEach(check => {
      if (!check.fileTypes.includes(file.ext)) return;
      const matches = file.content.match(check.regex);
      if (matches) {
        const lines = file.content.split('\n');
        const lineNums = [];
        lines.forEach((line, i) => { if (check.regex.test(line)) lineNums.push(i + 1); });
        findings.quality.push({
          ...check,
          fileName: file.path || file.name,
          count: matches.length,
          lineNumbers: lineNums.slice(0, 3)
        });
      }
    });
  });

  // 4. 敏感文件检测
  files.forEach(file => {
    CODE_SCAN_DATA.sensitiveFiles.forEach(sf => {
      if (sf.pattern.test(file.name)) {
        findings.sensitive.push({ ...sf, fileName: file.path || file.name });
      }
    });
  });

  AppState.dev.findings = findings;
  AppState.dev.scanned = true;

  // 计算安全评分
  let score = 100;
  findings.secrets.forEach(s => { score -= s.severity === 'critical' ? 20 : 10; });
  if (!findings.gitignore.exists) score -= 30;
  else {
    findings.gitignore.missingCritical.forEach(() => score -= 10);
    findings.gitignore.missingImportant.forEach(() => score -= 3);
  }
  findings.sensitive.forEach(s => { score -= s.severity === 'critical' ? 15 : 8; });
  findings.quality.forEach(q => { score -= q.severity === 'medium' ? 5 : 2; });
  score = clamp(score, 0, 100);

  AppState.dev.score = score;
  $('#devScore').textContent = score;
  $('#navScoreDev').textContent = score;
  const scoreEl = $('#devScore');
  scoreEl.style.color = score >= 80 ? 'var(--accent-success)' : score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  renderScanResults();
  updateOverallScore();
  saveState();

  const totalIssues = findings.secrets.length + findings.sensitive.length + (findings.gitignore.exists ? findings.gitignore.missingCritical.length + findings.gitignore.missingImportant.length : 1) + findings.quality.length;
  showToast(`扫描完成！发现 ${totalIssues} 个问题`, totalIssues > 0 ? 'warning' : 'success');
}

function renderScanResults() {
  const f = AppState.dev.findings;
  $('#scanResults').style.display = 'block';

  // 摘要
  const totalCritical = f.secrets.filter(s => s.severity === 'critical').length + f.sensitive.filter(s => s.severity === 'critical').length;
  const totalHigh = f.secrets.filter(s => s.severity === 'high').length;
  const totalMedium = f.quality.filter(q => q.severity === 'medium').length;
  const totalLow = f.quality.filter(q => q.severity === 'low').length;
  const gitignoreMissing = f.gitignore.exists ? f.gitignore.missingCritical.length + f.gitignore.missingImportant.length : '缺失';

  $('#scanSummary').innerHTML = `
    <div class="scan-summary-grid">
      <div class="summary-stat critical ${totalCritical > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalCritical}</div><div class="stat-label">严重问题</div></div>
      <div class="summary-stat high ${totalHigh > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalHigh}</div><div class="stat-label">高危问题</div></div>
      <div class="summary-stat medium ${totalMedium > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalMedium}</div><div class="stat-label">中危问题</div></div>
      <div class="summary-stat low ${totalLow > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalLow}</div><div class="stat-label">低危问题</div></div>
      <div class="summary-stat ${gitignoreMissing !== 0 ? 'has-issues' : ''}"><div class="stat-num">${gitignoreMissing}</div><div class="stat-label">Gitignore缺失项</div></div>
    </div>
  `;

  // 密钥检测
  if (f.secrets.length > 0) {
    $('#secretSection').style.display = 'block';
    $('#secretFindings').innerHTML = f.secrets.map(s => `
      <div class="finding-item ${s.severity}">
        <div class="finding-header"><span class="finding-severity">${s.severity === 'critical' ? '🔴 严重' : '🟠 高危'}</span><strong>${s.name}</strong></div>
        <div class="finding-detail"><span class="finding-file">📁 ${s.fileName}</span><span class="finding-lines">行 ${s.lineNumbers.join(', ')}</span><span class="finding-count">出现 ${s.count} 次</span></div>
        <p class="finding-desc">${s.desc}</p>
      </div>
    `).join('');
  } else {
    $('#secretSection').style.display = 'block';
    $('#secretFindings').innerHTML = '<div class="no-issues">✅ 未检测到硬编码密钥</div>';
  }

  // Gitignore
  $('#gitignoreSection').style.display = 'block';
  if (!f.gitignore.exists) {
    $('#gitignoreFindings').innerHTML = `
      <div class="finding-item critical">
        <div class="finding-header"><span class="finding-severity">🔴 严重</span><strong>.gitignore 文件缺失</strong></div>
        <p class="finding-desc">项目根目录未找到 .gitignore 文件！强烈建议创建，防止敏感文件和构建产物被提交到仓库。</p>
      </div>
      <div class="gitignore-suggest">
        <strong>建议添加以下内容到 .gitignore：</strong>
        <pre>${[...CODE_SCAN_DATA.gitignoreRules.critical, ...CODE_SCAN_DATA.gitignoreRules.important].map(r => r.pattern).join('\n')}</pre>
      </div>
    `;
  } else {
    let giHTML = '<div class="finding-item low"><div class="finding-header"><span class="finding-severity">✅ 已检测</span><strong>.gitignore 文件存在</strong></div></div>';
    if (f.gitignore.missingCritical.length > 0) {
      giHTML += f.gitignore.missingCritical.map(r => `
        <div class="finding-item critical"><div class="finding-header"><span class="finding-severity">🔴 严重</span><strong>缺少: ${r.pattern}</strong></div><p class="finding-desc">${r.desc} - ${r.reason}</p></div>
      `).join('');
    }
    if (f.gitignore.missingImportant.length > 0) {
      giHTML += f.gitignore.missingImportant.map(r => `
        <div class="finding-item medium"><div class="finding-header"><span class="finding-severity">🟡 中危</span><strong>建议添加: ${r.pattern}</strong></div><p class="finding-desc">${r.desc} - ${r.reason}</p></div>
      `).join('');
    }
    if (f.gitignore.missingRecommended.length > 0) {
      giHTML += '<div class="gitignore-suggest"><strong>可选优化项：</strong><ul>';
      giHTML += f.gitignore.missingRecommended.map(r => `<li><code>${r.pattern}</code> - ${r.desc}</li>`).join('');
      giHTML += '</ul></div>';
    }
    $('#gitignoreFindings').innerHTML = giHTML;
  }

  // 代码质量
  if (f.quality.length > 0) {
    $('#qualitySection').style.display = 'block';
    $('#qualityFindings').innerHTML = f.quality.map(q => `
      <div class="finding-item ${q.severity}">
        <div class="finding-header"><span class="finding-severity">${q.severity === 'medium' ? '🟡 中危' : '🔵 低危'}</span><strong>${q.name}</strong></div>
        <div class="finding-detail"><span class="finding-file">📁 ${q.fileName}</span><span class="finding-count">出现 ${q.count} 次</span></div>
        <p class="finding-desc">${q.desc}</p>
      </div>
    `).join('');
  } else {
    $('#qualitySection').style.display = 'block';
    $('#qualityFindings').innerHTML = '<div class="no-issues">✅ 代码质量良好，未发现问题</div>';
  }

  // 敏感文件
  if (f.sensitive.length > 0) {
    $('#sensitiveFileSection').style.display = 'block';
    $('#sensitiveFileFindings').innerHTML = f.sensitive.map(s => `
      <div class="finding-item ${s.severity}">
        <div class="finding-header"><span class="finding-severity">${s.severity === 'critical' ? '🔴 严重' : '🟠 高危'}</span><strong>${s.fileName}</strong></div>
        <p class="finding-desc">${s.desc}</p>
      </div>
    `).join('');
  } else {
    $('#sensitiveFileSection').style.display = 'block';
    $('#sensitiveFileFindings').innerHTML = '<div class="no-issues">✅ 未检测到敏感文件</div>';
  }

  // 修复建议
  let fixesHTML = '<div class="fixes-card"><h4>🔧 修复建议</h4><ol>';
  if (f.secrets.filter(s => s.severity === 'critical').length > 0) {
    fixesHTML += '<li><strong>立即更换所有泄露的API密钥！</strong>泄露的密钥可能已被公开，必须到对应平台重新生成。</li>';
  }
  if (!f.gitignore.exists || f.gitignore.missingCritical.length > 0) {
    fixesHTML += '<li><strong>创建/完善 .gitignore 文件</strong>，确保 .env、*.pem、*.key 等敏感文件不被提交。</li>';
  }
  if (f.sensitive.length > 0) {
    fixesHTML += '<li><strong>从仓库中移除敏感文件</strong>（.env、credentials.json等），使用 .env.example 模板代替。</li>';
  }
  if (f.secrets.filter(s => s.severity === 'high').length > 0) {
    fixesHTML += '<li>将所有硬编码的密钥和密码迁移到<strong>环境变量</strong>中，使用 dotenv 或 os.environ 读取。</li>';
  }
  if (f.quality.filter(q => q.severity === 'medium').length > 0) {
    fixesHTML += '<li>移除所有 <code>debugger</code> 语句和 <code>alert()</code> 调用。</li>';
  }
  if (f.quality.filter(q => q.severity === 'low').length > 0) {
    fixesHTML += '<li>清理 <code>console.log</code>、<code>print()</code> 等调试输出和 TODO 注释。</li>';
  }
  if (f.gitignore.exists && f.gitignore.missingRecommended.length > 0) {
    fixesHTML += '<li>在 .gitignore 中添加推荐的忽略规则（.vscode、*.log等）。</li>';
  }
  fixesHTML += '</ol></div>';
  $('#scanFixes').innerHTML = fixesHTML;
}

// ============================================
// 阶段4: Demo辅助
// ============================================
function initDemoModule() {
  // 渲染Git教程
  renderGitTutorial();

  // 填充手动选择下拉框
  const select = $('#manualProjectType');
  DEPLOY_DATA.projectTypes.forEach(pt => {
    const opt = document.createElement('option');
    opt.value = pt.id;
    opt.textContent = `${pt.icon} ${pt.name}`;
    select.appendChild(opt);
  });

  // 文件上传
  const zone = $('#packageUploadZone');
  const input = $('#packageFileInput');
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) detectFromPackageFile(file);
  });

  // 手动选择
  select.addEventListener('change', (e) => {
    const typeId = e.target.value;
    if (typeId) {
      const pt = DEPLOY_DATA.projectTypes.find(p => p.id === typeId);
      if (pt) showDeployRecommendations(pt);
    }
  });

  // 恢复状态
  if (AppState.demo.projectType) {
    const pt = DEPLOY_DATA.projectTypes.find(p => p.id === AppState.demo.projectType);
    if (pt) showDeployRecommendations(pt);
  }
}

function renderGitTutorial() {
  const steps = [
    {
      title: '安装 Git',
      icon: '📥',
      desc: '如果还没有安装Git，从官网下载安装',
      commands: [
        { cmd: 'git --version', comment: '检查Git是否已安装' },
      ],
      link: { url: 'https://git-scm.com/downloads', text: '下载 Git' }
    },
    {
      title: '初始化本地仓库',
      icon: '🔧',
      desc: '在项目根目录下初始化Git仓库',
      commands: [
        { cmd: 'cd your-project-folder', comment: '进入项目目录' },
        { cmd: 'git init', comment: '初始化Git仓库' },
        { cmd: 'git add .', comment: '添加所有文件到暂存区' },
        { cmd: 'git commit -m "Initial commit"', comment: '提交初始代码' },
      ]
    },
    {
      title: '创建 .gitignore（重要！）',
      icon: '🚫',
      desc: '避免将敏感文件、依赖包等上传到GitHub',
      commands: [
        { cmd: '# 创建 .gitignore 文件，添加以下内容：', comment: '' },
        { cmd: 'node_modules/\n.env\n*.key\n*.pem\n.DS_Store\ndist/\nbuild/', comment: '常见需要忽略的文件' },
      ],
      tips: [
        '千万不要上传 .env 文件（包含API密钥）',
        'node_modules/ 体积巨大，必须忽略',
        '在代码扫描模块检查你的 .gitignore 是否完善'
      ]
    },
    {
      title: '在 GitHub 创建仓库',
      icon: '🌐',
      desc: '登录GitHub，创建一个新的仓库',
      commands: [],
      link: { url: 'https://github.com/new', text: '前往 GitHub 创建仓库' },
      tips: [
        '仓库名建议用项目英文名，如 hackathon-medication-reminder',
        '不要勾选 "Add a README" （本地已有代码时）',
        '选择 Public 让评委可以查看'
      ]
    },
    {
      title: '关联远程仓库并推送',
      icon: '🚀',
      desc: '将本地代码推送到GitHub',
      commands: [
        { cmd: 'git remote add origin https://github.com/你的用户名/你的仓库名.git', comment: '关联远程仓库' },
        { cmd: 'git branch -M main', comment: '将分支重命名为main' },
        { cmd: 'git push -u origin main', comment: '推送代码到GitHub' },
      ],
      tips: [
        '首次推送需要GitHub认证（使用Token或SSH Key）',
        '如果报错 "failed to push"，先运行 git pull origin main --allow-unrelated-histories'
      ]
    },
    {
      title: '后续开发中的版本管理',
      icon: '🔄',
      desc: '每次完成一个功能就提交一次，保持提交历史清晰',
      commands: [
        { cmd: 'git add .', comment: '添加修改的文件' },
        { cmd: 'git commit -m "feat: 添加了XX功能"', comment: '提交（用feat/fix/docs前缀）' },
        { cmd: 'git push', comment: '推送到GitHub' },
      ],
      tips: [
        '提交信息规范：feat:新功能 / fix:修复 / docs:文档 / refactor:重构',
        '黑客松中至少每2小时提交一次，防止代码丢失',
        '可以用 git log --oneline 查看提交历史'
      ]
    },
  ];

  $('#gitSteps').innerHTML = steps.map((step, i) => `
    <div class="git-step-card">
      <div class="git-step-header">
        <span class="git-step-num">${i + 1}</span>
        <span class="git-step-icon">${step.icon}</span>
        <span class="git-step-title">${step.title}</span>
      </div>
      <p class="git-step-desc">${step.desc}</p>
      ${step.commands.length > 0 ? `
        <div class="git-commands">
          ${step.commands.map(c => `
            <div class="git-command">
              <code class="git-cmd-text">${escapeHtml(c.cmd)}</code>
              ${c.comment ? `<span class="git-cmd-comment">${c.comment}</span>` : ''}
              <button class="btn btn-ghost btn-sm copy-cmd" data-cmd="${btoa(unescape(encodeURIComponent(c.cmd)))}">📋</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${step.tips ? `<div class="git-step-tips"><ul>${step.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      ${step.link ? `<a href="${step.link.url}" target="_blank" class="git-step-link">🔗 ${step.link.text} →</a>` : ''}
    </div>
  `).join('');

  // 绑定复制按钮
  $$('.copy-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = decodeURIComponent(escape(atob(btn.dataset.cmd)));
      navigator.clipboard.writeText(cmd).then(() => showToast('命令已复制', 'success'));
    });
  });
}

function detectFromPackageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    let detectedType = null;

    if (file.name === 'package.json' || file.name.endsWith('.json')) {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const pt of DEPLOY_DATA.projectTypes) {
          if (pt.detect.packageDeps && pt.detect.packageDeps.every(d => deps[d])) {
            detectedType = pt;
            break;
          }
        }
      } catch(e) {}
    } else if (file.name === 'requirements.txt' || file.name.endsWith('.txt')) {
      for (const pt of DEPLOY_DATA.projectTypes) {
        if (pt.detect.pyDeps && pt.detect.pyDeps.some(d => content.toLowerCase().includes(d))) {
          detectedType = pt;
          break;
        }
      }
    }

    if (detectedType) {
      showToast(`检测到项目类型: ${detectedType.name}`, 'success');
      showDeployRecommendations(detectedType);
    } else {
      showToast('无法自动检测项目类型，请手动选择', 'warning');
    }
  };
  reader.readAsText(file);
}

function showDeployRecommendations(projectType) {
  AppState.demo.projectType = projectType.id;
  AppState.demo.detected = true;
  saveState();

  // 显示检测结果
  $('#detectedType').style.display = 'block';
  $('#detectedType').innerHTML = `
    <div class="detected-type-card">
      <span class="detected-icon">${projectType.icon}</span>
      <div><div class="detected-name">${projectType.name}</div><div class="detected-desc">${projectType.desc}</div></div>
    </div>
  `;

  // 推荐平台
  const platforms = projectType.platforms.map(id => DEPLOY_DATA.platforms.find(p => p.id === id)).filter(Boolean);
  $('#deployRecommendations').style.display = 'block';
  $('#platformGrid').innerHTML = platforms.map((p, i) => `
    <div class="platform-card ${i === 0 ? 'recommended' : ''}" data-platform="${p.id}">
      ${i === 0 ? '<div class="recommended-badge">⭐ 推荐</div>' : ''}
      <div class="platform-card-header"><span class="platform-card-icon">${p.icon}</span><span class="platform-card-name">${p.name}</span></div>
      <p class="platform-card-desc">${p.desc}</p>
      <div class="platform-card-meta">
        <span>🔗 ${p.url}</span>
        ${p.deployCmd ? `<span>💻 ${p.deployCmd}</span>` : ''}
      </div>
      <button class="btn btn-primary btn-sm view-steps" data-platform-id="${p.id}">查看部署步骤</button>
    </div>
  `).join('');

  // 绑定查看步骤
  $$('.view-steps').forEach(btn => {
    btn.addEventListener('click', () => {
      const platformId = btn.dataset.platformId;
      showDeploySteps(platformId);
    });
  });

  // 默认显示第一个平台的步骤
  if (platforms.length > 0) showDeploySteps(platforms[0].id);

  $('#navScoreDemo').textContent = '✓';
  updateOverallScore();
  showToast('部署方案已生成！', 'success');
}

function showDeploySteps(platformId) {
  const platform = DEPLOY_DATA.platforms.find(p => p.id === platformId);
  if (!platform) return;

  $('#deployStepsSection').style.display = 'block';
  $('#deploySteps').innerHTML = `
    <div class="steps-header">
      <span class="steps-platform-icon">${platform.icon}</span>
      <span class="steps-platform-name">${platform.name} 部署步骤</span>
    </div>
    <div class="steps-prereq">📋 前置条件: ${platform.prereq}</div>
    <ol class="steps-list">
      ${platform.steps.map(s => `<li>${s}</li>`).join('')}
    </ol>
    ${platform.tips ? `<div class="steps-tips"><strong>💡 小贴士</strong><ul>${platform.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
  `;

  // 配置文件
  $('#configGenSection').style.display = 'block';
  if (platform.configFile) {
    $('#configGen').innerHTML = `
      <div class="config-file-card">
        <div class="config-file-header">
          <span class="config-file-name">📄 ${platform.configFile.name}</span>
          <button class="btn btn-ghost btn-sm copy-config" data-config="${btoa(platform.configFile.content)}">📋 复制</button>
        </div>
        <pre class="config-file-content">${escapeHtml(platform.configFile.content)}</pre>
      </div>
    `;
    $('.copy-config').addEventListener('click', (e) => {
      const content = atob(e.target.dataset.config);
      navigator.clipboard.writeText(content).then(() => showToast('配置已复制到剪贴板', 'success'));
    });
  } else {
    $('#configGen').innerHTML = '<div class="no-config">该平台无需额外配置文件，按照上方步骤操作即可。</div>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// 阶段5: Pitch & 评审
// ============================================
function initPitchModule() {
  $('#generatePitchBtn').addEventListener('click', generatePitch);
  $('#exportPitchBtn').addEventListener('click', exportPitch);
  $('#autoReviewBtn').addEventListener('click', autoReview);

  // 恢复已有评审状态
  if (AppState.pitch.review.autoReviewed && AppState.pitch.review.feedbacks) {
    renderReviewAgentsWithFeedback(AppState.pitch.review.feedbacks);
    if (AppState.pitch.review.score) {
      $('#reviewResults').style.display = 'block';
    }
  } else if (AppState.pitch.review.ratings && Object.keys(AppState.pitch.review.ratings).length > 0) {
    renderReviewAgents();
  } else {
    renderReviewAgents();
  }
}

function generatePitch() {
  const name = $('#pitchProjectName').value.trim();
  const oneLiner = $('#pitchOneLiner').value.trim();
  const desc = $('#pitchDescription').value.trim();

  if (!name || !oneLiner) {
    showToast('请填写项目名称和一句话描述', 'warning');
    return;
  }

  // 收集所有可用信息
  const context = {
    name,
    oneLiner,
    desc,
    topicDesc: AppState.topic.description || '',
    techStack: AppState.tech.selected || [],
    teamSize: AppState.tech.teamSize || 3,
    duration: AppState.tech.duration || 48,
    topicScore: AppState.topic.score || 0,
    devScore: AppState.dev.score || 0,
  };

  // 从描述中提取关键信息
  const parsedInfo = parseProjectInfo(desc + ' ' + context.topicDesc);

  // 生成个性化的 pitch 内容
  const sections = generatePitchSections(context, parsedInfo);

  let pitchHTML = '';
  let pitchText = `# ${name} - Pitch 演讲稿\n\n`;

  sections.forEach((section, i) => {
    pitchHTML += `
      <div class="pitch-section-card">
        <div class="pitch-section-header">
          <span class="pitch-section-num">${i + 1}</span>
          <span class="pitch-section-icon">${section.icon}</span>
          <div><div class="pitch-section-title">${section.title}</div><div class="pitch-section-time">⏱️ ${section.duration}</div></div>
        </div>
        <div class="pitch-section-content">${section.content}</div>
        ${section.tips ? `<div class="pitch-section-tips"><strong>💡 演讲提示：</strong><ul>${section.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      </div>
    `;

    pitchText += `## ${i + 1}. ${section.title} (${section.duration})\n${section.plainText}\n\n`;
  });

  $('#pitchResult').style.display = 'block';
  $('#pitchStructure').innerHTML = pitchHTML;
  AppState.pitch.generated = true;
  AppState.pitch.pitchContent = pitchText;
  saveState();

  showToast('Pitch 演讲稿已生成！', 'success');
}

// 从用户描述中解析项目信息
function parseProjectInfo(text) {
  const info = {
    targetUsers: '',
    problem: '',
    solution: '',
    tech: [],
    features: [],
    impact: '',
  };

  // 提取目标用户
  const userPatterns = [
    /(?:目标用户[是为]?|面向|针对|帮助|服务)(.{2,20}?)(?:[的。，；;]|$)/,
    /用户是(.{2,20}?)(?:[的。，；;]|$)/,
    /为(.{2,15}?)(?:设计|开发|打造|提供|解决)/,
  ];
  for (const p of userPatterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].length > 1 && m[1].length < 20) {
      info.targetUsers = m[1].trim();
      break;
    }
  }

  // 提取问题
  const problemPatterns = [
    /(?:问题|痛点|困难|挑战|难点|不足|缺乏|无法|不能|难以)(.{5,50}?)(?:。|，|；|;|$)/,
    /(?:面临|遇到|存在)(.{5,40}?)(?:的|问题|困难|挑战)/,
  ];
  for (const p of problemPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      info.problem = m[1].trim();
      break;
    }
  }

  // 提取技术栈
  const techKeywords = ['React', 'Vue', 'Next.js', 'Angular', 'FastAPI', 'Express', 'Flask', 'Django',
    'OpenAI', 'Claude', 'GPT', 'AI', '语音识别', 'NLP', '机器学习', '深度学习',
    'Firebase', 'Supabase', 'PostgreSQL', 'MongoDB', 'SQLite',
    'Vercel', 'Netlify', 'Docker', 'LangChain', 'AR', 'VR', 'IoT', '区块链'];
  techKeywords.forEach(t => {
    if (text.includes(t)) info.tech.push(t);
  });
  // 也从AppState补充（仅当用户描述中没有提到技术时）
  if (info.tech.length === 0 && AppState.tech.selected.length > 0) {
    AppState.tech.selected.forEach(t => {
      if (!info.tech.includes(t)) info.tech.push(t);
    });
  }

  // 提取功能
  const featurePatterns = [
    /(?:功能|实现|支持|提供|包括|包含)(.{5,40}?)(?:。|，|；|;|$)/g,
    /(?:可以|能够|能)(.{3,30}?)(?:。|，|；|;|$)/g,
  ];
  for (const p of featurePatterns) {
    let m;
    while ((m = p.exec(text)) !== null && info.features.length < 5) {
      if (m[1] && m[1].length > 3) info.features.push(m[1].trim());
    }
  }

  return info;
}

// 根据用户输入生成个性化 pitch 各段落
function generatePitchSections(ctx, info) {
  const name = ctx.name;
  const oneLiner = ctx.oneLiner;
  const desc = ctx.desc;
  const techStr = info.tech.length > 0 ? info.tech.slice(0, 5).join(' + ') : '现代Web技术';
  const users = info.targetUsers || '目标用户';
  const problem = info.problem || '一个亟待解决的实际问题';
  const features = info.features.length > 0 ? info.features : [];

  // 1. 开场Hook
  let hookContent;
  if (ctx.topicScore > 0 && ctx.topicScore >= 70) {
    hookContent = `<p>「${oneLiner}」——这是我们在黑客松中选择的方向。</p><p>经过搜索，GitHub上仅有极少同类项目，这是一个<strong>稀缺且有价值的方向</strong>。今天，${name} 要改变这个现状。</p>`;
  } else if (ctx.topicScore > 0 && ctx.topicScore < 45) {
    hookContent = `<p>市场上已经有很多类似产品，但<strong>${users}的核心需求仍然没有被真正满足</strong>。</p><p>现有的方案要么太复杂，要么不够精准。这就是我们开发 ${name} 的原因。</p>`;
  } else {
    hookContent = `<p>${oneLiner}。</p><p>这不是一个简单的需求——它关乎${users}的日常体验。我们用 ${techStr} 重新思考了这个问题的解法。</p>`;
  }

  // 2. 问题陈述
  let problemContent = `<p><strong>目标用户：</strong>${users}</p>`;
  if (info.problem) {
    problemContent += `<p><strong>核心痛点：</strong>${info.problem}</p>`;
  } else {
    problemContent += `<p><strong>核心痛点：</strong>${desc.split(/[。；;]/)[0]}</p>`;
  }
  if (features.length > 0) {
    problemContent += `<p><strong>现状不足：</strong>目前${users}面临的困难包括：${features.slice(0, 3).join('、')}等问题，缺乏有效的解决方案。</p>`;
  }
  problemContent += `<p>这些问题直接影响了${users}的体验和效率，亟待解决。</p>`;

  // 3. 解决方案
  let solutionContent = `<p>我们开发了 <strong>${name}</strong>——${oneLiner}。</p>`;
  if (features.length > 0) {
    solutionContent += `<p><strong>核心功能包括：</strong></p><ul>`;
    features.slice(0, 4).forEach(f => {
      solutionContent += `<li>${f}</li>`;
    });
    solutionContent += `</ul>`;
  } else {
    solutionContent += `<p>${desc}</p>`;
  }
  solutionContent += `<p>与现有方案不同，${name} 的核心创新在于<strong>深度结合用户实际场景</strong>，而非简单堆砌功能。</p>`;

  // 4. 核心Demo
  let demoContent = `<p><strong>演示流程：</strong></p><ol>`;
  if (features.length > 0) {
    demoContent += `<li>打开 ${name}，展示${features[0] || '主界面'}</li>`;
    if (features.length > 1) demoContent += `<li>演示${features[1]}</li>`;
    if (features.length > 2) demoContent += `<li>展示${features[2]}的完整流程</li>`;
  } else {
    demoContent += `<li>展示 ${name} 的主界面和核心交互</li>`;
    demoContent += `<li>演示核心功能的完整使用流程</li>`;
    demoContent += `<li>展示关键技术的实际效果</li>`;
  }
  demoContent += `</ol>`;
  demoContent += `<p>如你所见，整个流程<strong>简洁流畅</strong>，用户无需学习即可上手。</p>`;

  // 5. 技术亮点
  let techContent = `<p><strong>技术栈：</strong>${techStr}</p>`;
  if (info.tech.length > 0) {
    techContent += `<p><strong>技术架构：</strong></p><ul>`;
    // 分层展示
    const frontend = info.tech.filter(t => ['React','Vue','Next.js','Angular','HTML/CSS/JS'].includes(t));
    const backend = info.tech.filter(t => ['FastAPI (Python)','Express (Node.js)','Flask','Django'].includes(t));
    const ai = info.tech.filter(t => ['OpenAI API','Claude API','Together AI','LangChain','Hugging Face'].includes(t));
    const db = info.tech.filter(t => ['PostgreSQL','MongoDB','SQLite','Supabase','Firebase','Firebase Firestore'].includes(t));
    const deploy = info.tech.filter(t => ['Vercel','Netlify','Render','Railway'].includes(t));
    if (frontend.length) techContent += `<li>前端：${frontend.join(' + ')}</li>`;
    if (backend.length) techContent += `<li>后端：${backend.join(' + ')}</li>`;
    if (ai.length) techContent += `<li>AI能力：${ai.join(' + ')}</li>`;
    if (db.length) techContent += `<li>数据层：${db.join(' + ')}</li>`;
    if (deploy.length) techContent += `<li>部署：${deploy.join(' + ')}</li>`;
    techContent += `</ul>`;
  }
  // 技术创新点
  const aiTech = info.tech.find(t => ['OpenAI API','Claude API','Together AI','LangChain'].includes(t));
  if (aiTech) {
    techContent += `<p><strong>创新点：</strong>将 ${aiTech} 深度融入业务场景，不是简单的API套壳，而是针对${users}的需求做了定制化优化。</p>`;
  } else {
    techContent += `<p><strong>创新点：</strong>在 ${ctx.duration} 小时内完成了从设计到部署的完整流程，技术选型兼顾了开发效率和产品质量。</p>`;
  }

  // 6. 影响力
  let impactContent = `<p>${name} 可以直接帮助<strong>${users}</strong>解决${info.problem || '实际问题'}。</p>`;
  if (ctx.topicScore > 0) {
    if (ctx.topicScore >= 70) {
      impactContent += `<p>这个方向在GitHub上同类项目极少（稀缺度评分 ${ctx.topicScore}/100），有很大的<strong>先发优势和社会价值</strong>。</p>`;
    } else if (ctx.topicScore < 45) {
      impactContent += `<p>虽然市场上已有同类产品，但 ${name} 通过差异化功能切入，有望服务到<strong>被现有方案忽略的用户群体</strong>。</p>`;
    }
  }
  impactContent += `<p>如果推广开来，预计能显著改善${users}的体验和效率。</p>`;

  // 7. 未来展望
  let futureContent = `<p>接下来，我们计划：</p><ul>`;
  futureContent += `<li>优化核心功能，根据用户反馈快速迭代</li>`;
  if (features.length > 2) {
    futureContent += `<li>扩展更多场景，如${features.slice(2).join('、')}等</li>`;
  }
  futureContent += `<li>探索商业化路径，让 ${name} 服务更广泛的${users}</li>`;
  futureContent += `</ul>`;

  const sections = [
    {
      title: '开场Hook', icon: '🎣', duration: '15秒',
      content: hookContent,
      plainText: hookContent.replace(/<[^>]+>/g, ''),
      tips: ['用自信的语气开场，眼神接触评委', '停顿1秒让数据/观点sink in']
    },
    {
      title: '问题陈述', icon: '🎯', duration: '30秒',
      content: problemContent,
      plainText: problemContent.replace(/<[^>]+>/g, ''),
      tips: ['让评委感受到痛点的真实性和严重性', '用具体场景代替抽象描述']
    },
    {
      title: '解决方案', icon: '💡', duration: '45秒',
      content: solutionContent,
      plainText: solutionContent.replace(/<[^>]+>/g, ''),
      tips: ['突出与竞品的差异化', '强调核心创新点，不要泛泛而谈']
    },
    {
      title: '核心Demo', icon: '🎬', duration: '60秒',
      content: demoContent,
      plainText: demoContent.replace(/<[^>]+>/g, ''),
      tips: ['提前准备好演示账号和数据', '只展示最核心的1-2个功能', '如果现场有风险，使用录屏备用']
    },
    {
      title: '技术亮点', icon: '🔧', duration: '20秒',
      content: techContent,
      plainText: techContent.replace(/<[^>]+>/g, ''),
      tips: ['不要过于深入技术细节', '重点讲创新点而非技术清单']
    },
    {
      title: '影响力', icon: '🌟', duration: '20秒',
      content: impactContent,
      plainText: impactContent.replace(/<[^>]+>/g, ''),
      tips: ['用量化数据增强说服力', '强调社会价值而非仅商业价值']
    },
    {
      title: '未来展望', icon: '🚀', duration: '10秒',
      content: futureContent,
      plainText: futureContent.replace(/<[^>]+>/g, ''),
      tips: ['展示项目的可持续性', '简短有力，不要拖沓']
    },
  ];

  return sections;
}

function exportPitch() {
  if (!AppState.pitch.pitchContent) {
    showToast('请先生成 Pitch', 'warning');
    return;
  }
  navigator.clipboard.writeText(AppState.pitch.pitchContent).then(() => {
    showToast('Pitch 已复制到剪贴板！', 'success');
  });
}

function renderReviewAgents() {
  const container = $('#reviewAgents');
  container.innerHTML = PITCH_DATA.agents.map(agent => `
    <div class="review-agent" data-agent="${agent.id}">
      <div class="agent-header">
        <span class="agent-icon" style="color:${agent.color}">${agent.icon}</span>
        <div><div class="agent-name">${agent.name}</div><div class="agent-focus">${agent.focus}</div></div>
      </div>
      <div class="agent-criteria" id="criteria-${agent.id}">
        ${agent.criteria.map(c => `
          <div class="criterion" data-agent="${agent.id}" data-criterion="${c.id}">
            <div class="criterion-info">
              <span class="criterion-text">${c.text}</span>
              <span class="criterion-weight">${c.weight}分</span>
            </div>
            <div class="criterion-rating">
              ${[0,1,2,3,4,5].map(n => `<button class="rating-btn ${AppState.pitch.review.ratings[agent.id] && AppState.pitch.review.ratings[agent.id][c.id] === n ? 'active' : ''}" data-rating="${n}">${n}</button>`).join('')}
            </div>
            <div class="criterion-feedback" id="feedback-${agent.id}-${c.id}"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // 绑定评分按钮
  $$('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const criterion = btn.closest('.criterion');
      const agentId = criterion.dataset.agent;
      const criterionId = criterion.dataset.criterion;
      const rating = parseInt(btn.dataset.rating);

      if (!AppState.pitch.review.ratings[agentId]) AppState.pitch.review.ratings[agentId] = {};
      AppState.pitch.review.ratings[agentId][criterionId] = rating;

      criterion.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveState();
    });
  });
}

// 根据选手输入的信息自动生成模拟Agent评审
function autoReview() {
  const name = $('#pitchProjectName').value.trim();
  const oneLiner = $('#pitchOneLiner').value.trim();
  const desc = $('#pitchDescription').value.trim();

  if (!name || !oneLiner) {
    showToast('请先填写项目名称和一句话描述', 'warning');
    return;
  }

  // 收集所有项目信息
  const projectInfo = {
    name, oneLiner, desc,
    topicDesc: AppState.topic.description || '',
    techStack: AppState.tech.selected || [],
    teamSize: AppState.tech.teamSize || 3,
    duration: AppState.tech.duration || 48,
    topicScore: AppState.topic.score || 0,
    devScore: AppState.dev.score || 0,
    devFindings: AppState.dev.findings || null,
    hasGitignore: AppState.dev.files?.some(f => f.name === '.gitignore' || f.name.endsWith('.gitignore')) || false,
    hasEnvFile: AppState.dev.files?.some(f => f.name === '.env' || f.name.endsWith('.env')) || false,
    demoDetected: AppState.demo.detected || false,
    demoType: AppState.demo.projectType || '',
  };

  // 从描述中补充技术栈（如果用户没有在技术选型模块选择）
  const parsed = parseProjectInfo(desc + ' ' + projectInfo.topicDesc);
  projectInfo.techStack = [...new Set([...projectInfo.techStack, ...parsed.tech])];

  // 为每个 agent 的每个 criterion 自动评分并生成反馈
  const ratings = {};
  const feedbacks = {};

  PITCH_DATA.agents.forEach(agent => {
    ratings[agent.id] = {};
    feedbacks[agent.id] = {};

    agent.criteria.forEach(criterion => {
      const result = evaluateCriterion(agent.id, criterion, projectInfo, parsed);
      ratings[agent.id][criterion.id] = result.score;
      feedbacks[agent.id][criterion.id] = result.feedback;
    });
  });

  AppState.pitch.review.ratings = ratings;
  AppState.pitch.review.feedbacks = feedbacks;
  AppState.pitch.review.autoReviewed = true;

  // 重新渲染评审界面，显示自动评分和反馈
  renderReviewAgentsWithFeedback(feedbacks);

  // 自动计算分数
  calculateReviewScore();

  saveState();
  showToast('5位AI评审员已完成模拟评审！查看下方详细反馈', 'success');
}

// 根据项目信息评估单个评审标准
function evaluateCriterion(agentId, criterion, info, parsed) {
  let score = 3; // 默认中等
  let feedback = '';
  const allText = (info.desc + ' ' + info.topicDesc).toLowerCase();
  const hasTech = (techName) => info.techStack.some(t => t.toLowerCase().includes(techName.toLowerCase()));

  switch(criterion.id) {
    // === 代码质量评审员 ===
    case 'structure':
      if (info.techStack.length >= 4) { score = 4; feedback = `技术栈包含${info.techStack.length}项技术，表明有前后端分离的架构意识。建议确保目录结构清晰（src/、config/、tests/）。`; }
      else if (info.techStack.length >= 2) { score = 3; feedback = `技术栈较少（${info.techStack.length}项），需关注代码模块化。建议将业务逻辑与UI分离。`; }
      else { score = 2; feedback = '技术栈单一，代码可能集中在少数文件中。建议拆分模块，提高可维护性。'; }
      break;
    case 'readability':
      score = 3; feedback = '建议使用有意义的变量名和函数名，避免缩写。关键业务逻辑应添加注释。';
      break;
    case 'error_handling':
      if (hasTech('FastAPI') || hasTech('Express') || hasTech('Flask') || hasTech('Django')) { score = 3; feedback = '使用了后端框架，建议为API接口添加try-catch和统一的错误响应格式。'; }
      else { score = 2; feedback = '未检测到后端框架，错误处理可能不足。建议至少在前端添加全局错误捕获。'; }
      break;
    case 'comments':
      score = 3; feedback = '黑客松项目中注释容易被忽略，建议至少为核心算法和API接口添加注释。';
      break;
    case 'no_hardcode':
      if (info.devFindings && info.devFindings.secrets && info.devFindings.secrets.length > 0) {
        score = 1; feedback = `⚠️ 代码扫描发现${info.devFindings.secrets.length}处硬编码密钥/密码！这是严重安全问题，必须使用环境变量替代。`;
      } else if (info.hasEnvFile) {
        score = 4; feedback = '检测到.env文件，说明有使用环境变量的意识。确保.env已加入.gitignore。';
      } else {
        score = 3; feedback = '未进行代码扫描，无法确认是否存在硬编码。建议使用代码扫描模块检查。';
      }
      break;
    case 'dependency':
      if (hasTech('React') || hasTech('Next.js') || hasTech('Vue')) { score = 4; feedback = '使用了主流框架，依赖管理较规范。建议锁定版本号（package-lock.json）。'; }
      else { score = 3; feedback = '建议使用包管理器（npm/pip）管理依赖，并提交lock文件。'; }
      break;
    case 'testing':
      score = 2; feedback = '黑客松项目通常缺少测试。建议至少为核心功能编写1-2个基本测试用例，展示工程素养。';
      break;
    case 'version_control':
      if (info.hasGitignore) { score = 4; feedback = '检测到.gitignore文件，版本控制意识良好。建议保持频繁提交，提交信息清晰。'; }
      else { score = 2; feedback = '未检测到.gitignore文件！请参考Demo辅助模块的Git教程，创建.gitignore并上传到GitHub。'; }
      break;

    // === 用户体验评审员 ===
    case 'first_impression':
      if (parsed.targetUsers) { score = 4; feedback = `项目面向"${parsed.targetUsers}"，建议首屏设计针对该用户群体的审美和使用习惯优化。`; }
      else { score = 3; feedback = '建议首屏突出核心功能，用一句话让评委理解项目价值。'; }
      break;
    case 'navigation':
      score = 3; feedback = '建议导航结构不超过3层，核心功能入口放在首屏可见位置。';
      break;
    case 'feedback':
      score = 3; feedback = '建议为所有用户操作添加反馈：按钮点击loading、成功toast、失败提示。';
      break;
    case 'responsive':
      if (hasTech('React') || hasTech('Next.js')) { score = 4; feedback = '使用React/Next.js，可配合Tailwind CSS快速实现响应式。建议至少适配手机和桌面端。'; }
      else { score = 3; feedback = '建议使用CSS媒体查询或Flexbox/Grid确保在不同屏幕尺寸下正常显示。'; }
      break;
    case 'consistency':
      score = 3; feedback = '建议统一配色方案（不超过3种主色）、字体（不超过2种）和组件风格。';
      break;
    case 'accessibility':
      if (allText.includes('无障碍') || allText.includes('适老') || allText.includes('accessibility') || allText.includes('a11y')) { score = 5; feedback = '✅ 项目描述中提到了无障碍/适老化，这是极大的加分项！确保实现大字体、高对比度、语音辅助等功能。'; }
      else { score = 2; feedback = '未检测到无障碍设计考量。建议至少添加alt文本、ARIA标签和键盘导航支持。'; }
      break;
    case 'empty_state':
      score = 3; feedback = '建议为列表空状态、加载中、错误状态都设计友好的提示页面。';
      break;
    case 'performance':
      score = 3; feedback = '建议优化首屏加载（<3秒），使用懒加载和代码分割。图片压缩后使用。';
      break;

    // === 创新性评审员 ===
    case 'novelty':
      if (info.topicScore >= 70) { score = 5; feedback = `✅ 稀缺度评分${info.topicScore}分，项目方向非常新颖！GitHub上同类项目极少，有巨大差异化优势。`; }
      else if (info.topicScore >= 45) { score = 3; feedback = `稀缺度评分${info.topicScore}分，方向有一定竞争。需要在功能或体验上找到独特切入点。`; }
      else if (info.topicScore > 0) { score = 2; feedback = `⚠️ 稀缺度评分仅${info.topicScore}分，方向较常见。强烈建议参考选题评审中的差异化策略。`; }
      else { score = 3; feedback = '建议先完成选题评审模块，获取稀缺度评分和差异化建议。'; }
      break;
    case 'differentiation':
      if (parsed.features.length >= 3) { score = 4; feedback = `检测到${parsed.features.length}个核心功能，建议在Pitch中突出最独特的1-2个功能作为差异化亮点。`; }
      else { score = 3; feedback = '建议明确项目的核心差异化功能，在演示中重点展示。'; }
      break;
    case 'ai_integration':
      const aiTechs = info.techStack.filter(t => ['OpenAI API','Claude API','Together AI','LangChain','Hugging Face','OpenAI'].some(n => t.includes(n)));
      if (aiTechs.length >= 2) { score = 5; feedback = `使用了${aiTechs.length}种AI能力（${aiTechs.join('、')}），建议展示AI能力的深度整合而非简单调用。`; }
      else if (aiTechs.length === 1) { score = 3; feedback = `使用了${aiTechs[0]}，建议不要仅做API套壳，要结合业务场景做定制化Prompt和后处理。`; }
      else if (allText.includes('ai') || allText.includes('人工智能')) { score = 2; feedback = '项目提到AI但技术栈中未包含AI API。建议明确AI能力如何融入产品。'; }
      else { score = 3; feedback = '项目未使用AI能力。如果不需要AI也可以，但如果加入AI可以提升竞争力。'; }
      break;
    case 'problem_fitting':
      if (info.desc && info.desc.length > 50) { score = 4; feedback = '项目描述详细，问题与解决方案匹配度较高。建议在Pitch中清晰展示"问题→方案"的逻辑链。'; }
      else { score = 3; feedback = '建议更详细地描述问题场景，确保解决方案与问题高度匹配。'; }
      break;
    case 'scalability':
      score = 3; feedback = '建议思考项目的可扩展方向：能否支持更多用户？能否扩展到其他场景？';
      break;
    case 'tech_combination':
      if (info.techStack.length >= 5) { score = 4; feedback = `技术栈丰富（${info.techStack.length}项），组合有创意。注意确保${info.duration}小时内能完成。`; }
      else if (info.techStack.length >= 3) { score = 3; feedback = '技术栈适中。考虑是否需要加入数据库、缓存等提升完成度。'; }
      else { score = 3; feedback = '技术栈较少，可能是优点（聚焦）也可能是缺点（功能不足），需结合项目目标判断。'; }
      break;
    case 'user_insight':
      if (parsed.targetUsers && info.desc.length > 50) { score = 4; feedback = `对目标用户"${parsed.targetUsers}"有较好的理解。建议在Pitch中用具体用户故事展示痛点。`; }
      else { score = 3; feedback = '建议深入研究目标用户的真实痛点，用用户访谈或数据支撑。'; }
      break;
    case 'market_potential':
      if (allText.includes('老年人') || allText.includes('无障碍') || allText.includes('环保') || allText.includes('乡村') || allText.includes('残障') || allText.includes('心理')) { score = 5; feedback = '✅ 项目具有显著的社会价值，面向弱势群体或社会问题，评委会非常认可。'; }
      else { score = 3; feedback = '建议思考项目的社会价值，黑客松评委通常偏好有社会意义的项目。'; }
      break;

    // === 技术深度评审员 ===
    case 'complexity':
      if (info.techStack.length >= 6) { score = 5; feedback = `技术栈复杂度高（${info.techStack.length}项），注意确保${info.duration}小时内能完成核心功能。`; }
      else if (info.techStack.length >= 4) { score = 4; feedback = '技术复杂度适中，有足够的深度展示技术能力。'; }
      else { score = 3; feedback = '技术实现相对简单，建议增加一些有难度的技术点提升竞争力。'; }
      break;
    case 'completeness':
      if (info.demoDetected) { score = 4; feedback = '已检测项目类型并准备部署，完成度较高。建议确保核心功能端到端可用。'; }
      else { score = 3; feedback = '建议确保核心功能完整实现，避免展示半成品功能。优先完成主流程。'; }
      break;
    case 'architecture':
      const hasBackend = hasTech('FastAPI') || hasTech('Express') || hasTech('Flask') || hasTech('Django');
      const hasDB = hasTech('PostgreSQL') || hasTech('MongoDB') || hasTech('SQLite') || hasTech('Supabase') || hasTech('Firebase');
      if (hasBackend && hasDB) { score = 5; feedback = '前后端+数据库架构完整，系统设计合理。建议确保API设计RESTful规范。'; }
      else if (hasBackend || hasDB) { score = 3; feedback = '有后端或数据库，但架构不够完整。建议补充缺失部分。'; }
      else { score = 3; feedback = '前端-only项目也可以，但建议考虑数据持久化方案。'; }
      break;
    case 'api_design':
      if (hasTech('FastAPI') || hasTech('Express') || hasTech('Flask') || hasTech('Django')) { score = 4; feedback = '使用后端框架，建议API遵循RESTful规范，统一响应格式（{code, data, message}）。'; }
      else { score = 3; feedback = '如果使用第三方API，建议封装统一的API调用层，处理超时和错误。'; }
      break;
    case 'data_handling':
      if (hasTech('PostgreSQL') || hasTech('MongoDB')) { score = 4; feedback = '使用关系型/文档数据库，建议设计合理的数据模型，注意索引优化。'; }
      else if (hasTech('Firebase') || hasTech('Supabase')) { score = 4; feedback = '使用BaaS，数据处理便捷。注意设计合理的数据结构。'; }
      else { score = 3; feedback = '建议考虑数据存储方案，至少使用localStorage保存关键状态。'; }
      break;
    case 'security':
      if (info.devScore > 0 && info.devScore < 50) { score = 1; feedback = `⚠️ 代码安全评分仅${info.devScore}分！存在安全隐患。请立即修复代码扫描中发现的问题。`; }
      else if (info.devScore >= 80) { score = 5; feedback = `✅ 代码安全评分${info.devScore}分，安全措施到位。`; }
      else { score = 3; feedback = '建议进行代码安全扫描，检查硬编码密钥、输入验证等基本安全措施。'; }
      break;
    case 'performance_t':
      score = 3; feedback = '建议关注首屏加载时间和API响应时间。使用浏览器DevTools检测性能瓶颈。';
      break;
    case 'deployment_t':
      if (info.demoDetected) { score = 4; feedback = `已检测项目类型（${info.demoType}），建议使用推荐的部署方案上线。`; }
      else { score = 2; feedback = '建议在Demo辅助模块检测项目类型并选择部署方案。能在线访问的Demo大大加分。'; }
      break;

    // === 演示与表达评审员 ===
    case 'value_prop':
      if (info.oneLiner && info.oneLiner.length > 10) { score = 4; feedback = `一句话描述"${info.oneLiner}"简洁有力。建议在Pitch开场直接使用这句话。`; }
      else { score = 2; feedback = '一句话描述不够清晰或太短。建议用"[产品名]是一个为[用户]解决[问题]的[方案]"格式。'; }
      break;
    case 'demo_flow':
      if (parsed.features.length >= 3) { score = 4; feedback = `有${parsed.features.length}个可演示功能。建议设计3步演示流程：打开→核心操作→展示结果。`; }
      else { score = 3; feedback = '建议设计清晰的演示流程，提前准备好演示数据，只展示最核心的功能。'; }
      break;
    case 'problem_statement':
      if (info.desc && info.desc.includes('问题') && info.desc.length > 50) { score = 4; feedback = '项目描述中清晰阐述了问题。建议在Pitch中用数据或用户故事强化问题严重性。'; }
      else { score = 3; feedback = '建议在Pitch中用具体数据（如"60%的老人忘记服药"）说明问题的严重性。'; }
      break;
    case 'solution_clarity':
      if (info.oneLiner && info.desc && info.desc.length > 50) { score = 4; feedback = '项目描述清晰，解决方案明确。建议在Pitch中用"问题→方案→效果"的逻辑展开。'; }
      else { score = 3; feedback = '建议更清晰地说明解决方案的核心创新点，让评委一听就懂。'; }
      break;
    case 'visual_aid':
      score = 3; feedback = '建议准备高质量的演示素材：1-3分钟演示视频、关键流程截图。如果可以，准备一页PPT总结。';
      break;
    case 'tech_explanation':
      if (info.techStack.length > 0) { score = 4; feedback = `技术栈（${info.techStack.slice(0,3).join(' + ')}）清晰。建议用通俗语言解释技术亮点，避免过多术语。`; }
      else { score = 3; feedback = '建议在Pitch中简述技术方案，重点是创新点而非技术清单。'; }
      break;
    case 'future_plan':
      score = 3; feedback = '建议准备1-2句未来展望：扩展场景、商业化路径、开源计划等。';
      break;
    case 'qa_ready':
      score = 3; feedback = '建议预想评委可能的3个问题：技术难点？竞争对手？商业模式？提前准备好答案。';
      break;

    default:
      score = 3; feedback = '建议关注此项评审标准，提升项目整体质量。';
  }

  return { score, feedback };
}

// 渲染带反馈的评审界面
function renderReviewAgentsWithFeedback(feedbacks) {
  const container = $('#reviewAgents');
  container.innerHTML = PITCH_DATA.agents.map(agent => `
    <div class="review-agent" data-agent="${agent.id}">
      <div class="agent-header">
        <span class="agent-icon" style="color:${agent.color}">${agent.icon}</span>
        <div><div class="agent-name">${agent.name}</div><div class="agent-focus">${agent.focus}</div></div>
      </div>
      <div class="agent-criteria" id="criteria-${agent.id}">
        ${agent.criteria.map(c => {
          const rating = AppState.pitch.review.ratings[agent.id]?.[c.id] || 0;
          const fb = feedbacks[agent.id]?.[c.id] || '';
          const scoreColor = rating >= 4 ? 'var(--accent-success)' : rating >= 3 ? 'var(--accent-warning)' : 'var(--accent-danger)';
          return `
          <div class="criterion" data-agent="${agent.id}" data-criterion="${c.id}">
            <div class="criterion-info">
              <span class="criterion-text">${c.text}</span>
              <span class="criterion-weight">${c.weight}分</span>
            </div>
            <div class="criterion-rating">
              ${[0,1,2,3,4,5].map(n => `<button class="rating-btn ${rating === n ? 'active' : ''}" data-rating="${n}">${n}</button>`).join('')}
            </div>
            ${fb ? `<div class="criterion-feedback" style="border-left: 2px solid ${scoreColor};"><span class="feedback-score" style="color:${scoreColor};">AI评分: ${rating}/5</span><span class="feedback-text">${fb}</span></div>` : ''}
          </div>
        `}).join('')}
      </div>
    </div>
  `).join('');

  // 绑定评分按钮（允许用户调整AI评分）
  $$('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const criterion = btn.closest('.criterion');
      const agentId = criterion.dataset.agent;
      const criterionId = criterion.dataset.criterion;
      const rating = parseInt(btn.dataset.rating);

      if (!AppState.pitch.review.ratings[agentId]) AppState.pitch.review.ratings[agentId] = {};
      AppState.pitch.review.ratings[agentId][criterionId] = rating;

      criterion.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 更新反馈中的分数显示
      const fbScore = criterion.querySelector('.feedback-score');
      if (fbScore) {
        const scoreColor = rating >= 4 ? 'var(--accent-success)' : rating >= 3 ? 'var(--accent-warning)' : 'var(--accent-danger)';
        fbScore.textContent = `AI评分: ${rating}/5`;
        fbScore.style.color = scoreColor;
        criterion.querySelector('.criterion-feedback').style.borderLeftColor = scoreColor;
      }

      saveState();
      showToast('评分已调整', 'info');
    });
  });
}

function calculateReviewScore() {
  const ratings = AppState.pitch.review.ratings;
  const hasRatings = Object.keys(ratings).length > 0;

  if (!hasRatings) {
    showToast('请先完成评审打分', 'warning');
    return;
  }

  const agentScores = [];
  PITCH_DATA.agents.forEach(agent => {
    if (!ratings[agent.id]) return;
    let earned = 0, total = 0;
    agent.criteria.forEach(c => {
      const rating = ratings[agent.id][c.id] || 0;
      earned += (rating / 5) * c.weight;
      total += c.weight;
    });
    agentScores.push({
      agent,
      score: total > 0 ? Math.round((earned / total) * 100) : 0,
      earned, total
    });
  });

  if (agentScores.length === 0) {
    showToast('请先完成评审打分', 'warning');
    return;
  }

  const avgScore = Math.round(agentScores.reduce((s, a) => s + a.score, 0) / agentScores.length);
  AppState.pitch.review.score = avgScore;

  $('#pitchScore').textContent = avgScore;
  $('#navScorePitch').textContent = avgScore;
  $('#reviewResults').style.display = 'block';

  // 雷达图
  renderReviewRadar(agentScores);

  // 各维度评分
  $('#reviewScores').innerHTML = agentScores.map(a => `
    <div class="agent-score-card">
      <div class="agent-score-header">
        <span class="agent-score-icon" style="color:${a.agent.color}">${a.agent.icon}</span>
        <span class="agent-score-name">${a.agent.name}</span>
        <span class="agent-score-value" style="color:${a.score >= 80 ? 'var(--accent-success)' : a.score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'}">${a.score}</span>
      </div>
      <div class="agent-score-bar"><div class="agent-score-fill" style="width:${a.score}%;background:${a.agent.color}"></div></div>
    </div>
  `).join('');

  // 改进清单
  generateImprovementList(ratings);

  // Meta Judge
  generateMetaJudgeSummary(avgScore, agentScores);

  updateOverallScore();
  saveState();
  showToast(`评审完成！综合得分: ${avgScore}`, 'success');

  $('#reviewResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderReviewRadar(agentScores) {
  const size = 260, cx = size/2, cy = size/2, maxR = 100;
  const n = agentScores.length;
  const angleStep = (Math.PI * 2) / n;

  let points = '';
  let gridPolygons = '';
  let axisLines = '';
  let labels = '';

  // 网格
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(scale => {
    let polyPoints = '';
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxR * scale;
      const y = cy + Math.sin(angle) * maxR * scale;
      polyPoints += `${x},${y} `;
    }
    gridPolygons += `<polygon points="${polyPoints}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  });

  // 轴线和标签
  agentScores.forEach((a, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxR;
    const y = cy + Math.sin(angle) * maxR;
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;

    const labelX = cx + Math.cos(angle) * (maxR + 25);
    const labelY = cy + Math.sin(angle) * (maxR + 25);
    labels += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="${a.agent.color}" font-size="11" font-weight="600">${a.agent.icon}</text>`;
    labels += `<text x="${labelX}" y="${labelY + 14}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.6)" font-size="9">${a.score}</text>`;
  });

  // 数据多边形
  let dataPoints = '';
  agentScores.forEach((a, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (a.score / 100) * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    dataPoints += `${x},${y} `;
  });

  $('#reviewRadar').innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="margin:0 auto;display:block">
      ${gridPolygons}
      ${axisLines}
      <polygon points="${dataPoints}" fill="rgba(0,255,163,0.12)" stroke="#00ffa3" stroke-width="2"/>
      ${agentScores.map((a, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = (a.score / 100) * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return `<circle cx="${x}" cy="${y}" r="4" fill="${a.agent.color}"/>`;
      }).join('')}
      ${labels}
    </svg>
  `;
}

function generateImprovementList(ratings) {
  const improvements = [];

  PITCH_DATA.agents.forEach(agent => {
    if (!ratings[agent.id]) return;
    agent.criteria.forEach(c => {
      const rating = ratings[agent.id][c.id] || 0;
      if (rating <= 2) {
        const rule = PITCH_DATA.improvementRules.find(r => r.condition === c.id);
        if (rule) improvements.push({ ...rule, agent: agent.name, icon: agent.icon, criterion: c.text });
      }
    });
  });

  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (improvements.length === 0) {
    $('#improvementList').innerHTML = '<div class="no-issues">🎉 所有评分项都达标了！项目状态良好。</div>';
    return;
  }

  const priorityColors = { P0: 'var(--accent-danger)', P1: 'var(--accent-warning)', P2: 'var(--accent-info)', P3: 'var(--muted)' };
  $('#improvementList').innerHTML = improvements.map(imp => `
    <div class="improvement-item" style="border-left-color:${priorityColors[imp.priority]}">
      <div class="improvement-header">
        <span class="improvement-priority" style="background:${priorityColors[imp.priority]}">${imp.priority}</span>
        <span class="improvement-agent">${imp.icon} ${imp.agent}</span>
      </div>
      <div class="improvement-action">${imp.action}</div>
      <div class="improvement-criterion">问题: ${imp.criterion}</div>
    </div>
  `).join('');
}

function generateMetaJudgeSummary(avgScore, agentScores) {
  let summary = '';
  const weakest = [...agentScores].sort((a, b) => a.score - b.score)[0];
  const strongest = [...agentScores].sort((a, b) => b.score - a.score)[0];

  if (avgScore >= 80) {
    summary = `🏆 项目整体表现<strong style="color:var(--accent-success)">优秀</strong>！`;
  } else if (avgScore >= 60) {
    summary = `👍 项目整体表现<strong style="color:var(--accent-warning)">良好</strong>，还有提升空间。`;
  } else {
    summary = `⚠️ 项目整体表现<strong style="color:var(--accent-danger)">需改进</strong>，请关注下方建议。`;
  }

  summary += ` 最强维度是 <strong style="color:${strongest.agent.color}">${strongest.agent.name}</strong>（${strongest.score}分），`;
  summary += `最需关注的是 <strong style="color:${weakest.agent.color}">${weakest.agent.name}</strong>（${weakest.score}分）。`;

  $('#metaJudge').innerHTML = `<div class="meta-judge-card"><span class="meta-judge-icon">🧑‍⚖️</span><div class="meta-judge-text">${summary}</div></div>`;
}

// ============================================
// 总分计算
// ============================================
function updateOverallScore() {
  const scores = [
    AppState.topic.score || 0,
    AppState.tech.score || 0,
    AppState.dev.score || 0,
    AppState.demo.detected ? 100 : 0,
    AppState.pitch.review.score || 0
  ];
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  $('#overallScore').textContent = avg;
  const progress = $('#overallProgress');
  const circumference = 2 * Math.PI * 34;
  progress.style.strokeDashoffset = circumference * (1 - avg / 100);
}

// ============================================
// 导出报告
// ============================================
function exportReport() {
  let report = '# HackCheck 黑客松全流程报告\n\n';
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  // 阶段1
  report += '## 1. 选题评审\n\n';
  if (AppState.topic.analyzed) {
    report += `项目描述: ${AppState.topic.description}\n`;
    report += `稀缺指数: ${AppState.topic.score}\n`;
    if (AppState.topic.multiScores) {
      report += `原创性: ${AppState.topic.multiScores.originality} | 稀缺度: ${AppState.topic.multiScores.scarcity} | 意义感: ${AppState.topic.multiScores.meaning}\n`;
    }
    if (AppState.topic.githubResults.length > 0) {
      report += `\nGitHub相似项目:\n`;
      AppState.topic.githubResults.slice(0, 5).forEach(r => {
        report += `- ${r.full_name} (⭐${r.stargazers_count}): ${r.description || 'N/A'}\n`;
      });
    }
  } else {
    report += '未完成\n';
  }

  // 阶段2
  report += '\n## 2. 技术选型\n\n';
  if (AppState.tech.selected.length > 0) {
    report += `技术栈: ${AppState.tech.selected.join(', ')}\n`;
    report += `团队: ${AppState.tech.teamSize}人 | 时长: ${AppState.tech.duration}h | 经验: ${['初学者','有经验','丰富'][AppState.tech.experience - 1]}\n`;
    report += `适配分数: ${AppState.tech.score}\n`;
  } else {
    report += '未完成\n';
  }

  // 阶段3
  report += '\n## 3. 代码扫描\n\n';
  if (AppState.dev.scanned) {
    report += `扫描文件数: ${AppState.dev.files.length}\n`;
    report += `安全评分: ${AppState.dev.score}\n`;
    const f = AppState.dev.findings;
    if (f.secrets.length > 0) report += `密钥泄露: ${f.secrets.length} 处\n`;
    if (f.sensitive.length > 0) report += `敏感文件: ${f.sensitive.length} 个\n`;
    if (f.quality.length > 0) report += `代码质量问题: ${f.quality.length} 处\n`;
    if (!f.gitignore.exists) report += `.gitignore: 缺失\n`;
  } else {
    report += '未完成\n';
  }

  // 阶段4
  report += '\n## 4. Demo辅助\n\n';
  if (AppState.demo.detected) {
    const pt = DEPLOY_DATA.projectTypes.find(p => p.id === AppState.demo.projectType);
    if (pt) report += `项目类型: ${pt.name}\n部署平台: ${pt.platforms.join(', ')}\n`;
  } else {
    report += '未完成\n';
  }

  // 阶段5
  report += '\n## 5. Pitch & 评审\n\n';
  if (AppState.pitch.review.score > 0) {
    report += `综合评分: ${AppState.pitch.review.score}\n`;
    if (AppState.pitch.generated) report += `Pitch已生成\n`;
  } else {
    report += '未完成\n';
  }

  // 下载
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hackcheck-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('报告已导出！', 'success');
}

// ============================================
// 重置
// ============================================
function resetAll() {
  if (!confirm('确定要重置所有数据吗？此操作不可撤销。')) return;

  localStorage.removeItem('hackcheck_v2');
  AppState.topic = { description: '', score: 0, analyzed: false, githubResults: [], multiScores: {} };
  AppState.tech = { selected: [], duration: 48, teamSize: 3, experience: 1, score: 0 };
  AppState.dev = { files: [], scanned: false, score: 0, findings: { secrets: [], gitignore: null, quality: [], sensitive: [] } };
  AppState.demo = { projectType: null, detected: false };
  AppState.pitch = { generated: false, pitchContent: '', review: { ratings: {}, feedbacks: {}, score: 0, autoReviewed: false } };

  location.reload();
}

// ============================================
// 初始化
// ============================================
function init() {
  loadState();
  initNavigation();
  // 激活 loadState 恢复的模块（HTML 默认 active 是 topic，需要同步到实际 currentModule）
  if (AppState.currentModule && AppState.currentModule !== 'topic') {
    switchModule(AppState.currentModule);
  }
  initTopicModule();
  initTechModule();
  initDevModule();
  initDemoModule();
  initPitchModule();

  // 初始化时选中第一个模块的第一个子项（在 UI 恢复之前，避免后续错误阻止导航）
  const firstSub = MODULE_SUBMODULES[AppState.currentModule]?.[0];
  if (firstSub) {
    switchSubmodule(AppState.currentModule, firstSub.id);
  }

  $('#exportBtn').addEventListener('click', exportReport);
  $('#resetBtn').addEventListener('click', resetAll);

  // 恢复UI状态（try-catch 防止单个模块恢复失败影响整体）
  try {
    if (AppState.topic.analyzed) {
      $('#projectDescription').value = AppState.topic.description;
      $('#charCount').textContent = `${AppState.topic.description.length} 字`;
      if (AppState.topic.githubResults.length > 0) renderGithubResults(AppState.topic.githubResults);
      const analysis = analyzeTopic(AppState.topic.description, extractKeywords(AppState.topic.description));
      renderTopicResults(analysis, extractKeywords(AppState.topic.description));
    }
  } catch(e) { console.warn('恢复选题模块UI失败:', e.message); }

  try {
    if (AppState.dev.scanned) {
      renderFileList();
      renderScanResults();
    }
  } catch(e) { console.warn('恢复代码扫描模块UI失败:', e.message); }

  try {
    if (AppState.pitch.review.score > 0) {
      $('#pitchScore').textContent = AppState.pitch.review.score;
      $('#navScorePitch').textContent = AppState.pitch.review.score;
      calculateReviewScore();
    }

    if (AppState.pitch.generated) {
      $('#pitchProjectName').value = localStorage.getItem('hackcheck_pitch_name') || '';
      $('#pitchOneLiner').value = localStorage.getItem('hackcheck_pitch_liner') || '';
      $('#pitchDescription').value = localStorage.getItem('hackcheck_pitch_desc') || '';
    }
  } catch(e) { console.warn('恢复Pitch模块UI失败:', e.message); }

  updateOverallScore();

  // 恢复导航分数
  if (AppState.topic.score > 0) $('#navScoreTopic').textContent = AppState.topic.score;
  if (AppState.tech.score > 0) $('#navScoreTech').textContent = AppState.tech.score;
  if (AppState.dev.score > 0) $('#navScoreDev').textContent = AppState.dev.score;
  if (AppState.demo.detected) $('#navScoreDemo').textContent = '✓';
  if (AppState.pitch.review.score > 0) $('#navScorePitch').textContent = AppState.pitch.review.score;
}

document.addEventListener('DOMContentLoaded', init);

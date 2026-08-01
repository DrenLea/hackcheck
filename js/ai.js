/**
 * HackCheck AI 客户端层。
 * 职责：给定任务名和 payload，构建 prompt → 请求 /api/ai → 校验 schema → 返回结构化数据。
 * 不碰 DOM，不知道选题逻辑。aiTask() 永不 throw：返回 {ok:true,data} 或 {ok:false,error}。
 */
(function () {
  const ENDPOINT = '/api/ai';
  const TIMEOUT_MS = 20000;
  const LS_USER_KEY = 'hackcheck_user_ai'; // 用户自备 key: { key, baseUrl, model }
  const DEFAULT_BASE_URL = 'https://api.openai-next.com/v1';
  const DEFAULT_MODEL = 'deepseek-v4-flash';

  // ---------- 工具 ----------
  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  const isStr = v => typeof v === 'string' && v.length > 0;
  const isNum = v => typeof v === 'number' && isFinite(v);
  const isArr = Array.isArray;

  // 雷达图几何（纯函数，放这里以便测试页零 DOM 加载）
  function computeRadarPoints(values, size, maxR) {
    const cx = size / 2, cy = size / 2, n = values.length;
    return values.map((v, i) => {
      const angle = i * (Math.PI * 2 / n) - Math.PI / 2;
      const r = Math.max(0, Math.min(100, v)) / 100 * maxR;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    });
  }

  // ---------- 任务定义：prompt 构建 + schema 校验 ----------
  const SYS = '你是黑客松选题分析助手。严格输出一个 JSON 对象，不要输出任何其他文字。';

  const TASKS = {
    understand: {
      build(p) {
        return [
          { role: 'system', content: SYS },
          { role: 'user', content:
            '分析这个黑客松项目描述，输出 JSON：\n' +
            '{"summary":"一句话摘要","target_user":"目标用户","core_scenario":"核心使用场景",' +
            '"search_query_en":"2-3个核心概念组成的英文搜索词","search_query_zh":"中文搜索词",' +
            '"github_queries":["GitHub搜索查询，多词短语加英文引号，最多3条，由精准到宽泛"],' +
            '"key_terms":["用于判断搜索结果是否同类的术语，中英混合，5-10个"]}\n\n' +
            '项目描述：' + p.description },
        ];
      },
      valid(d) {
        return !!d && isStr(d.summary) && isStr(d.target_user) && isStr(d.core_scenario)
          && isStr(d.search_query_en) && isStr(d.search_query_zh)
          && isArr(d.github_queries) && d.github_queries.every(isStr)
          && isArr(d.key_terms) && d.key_terms.length > 0 && d.key_terms.every(isStr);
      },
    },

    assess: {
      build(p) {
        const list = p.results.map((r, i) => i + '. [' + r.channel + '] ' + r.title + ' — ' + r.desc).join('\n');
        return [
          { role: 'system', content: SYS },
          { role: 'user', content:
            '项目：' + p.summary + '\n目标用户：' + (p.targetUser || '未知') + '\n\n' +
            '搜索结果（逐条判断与本项目是否同类/相关）：\n' + (list || '（无结果）') + '\n\n' +
            '候选查重模式（matched_patterns.id 只能从下列 id 中选，不得自造，不相关就不选）：\n' +
            p.patterns.map(x => x.id + ': ' + x.pattern).join('\n') + '\n\n' +
            '候选加分因素（matched_boosters 只能从中选）：' + p.boosters.join(', ') + '\n\n' +
            '社媒需求信号：\n' + (p.socialSignals.join('\n') || '（无）') + '\n\n' +
            '输出 JSON：{"results":[{"index":0,"relevant":true,"reason":"一句话"}],' +
            '"hit_ratio":0到1之间的小数,' +
            '"matched_patterns":[{"id":"...","match_ratio":0到1,"reason":"..."}],' +
            '"matched_boosters":["keyword"],' +
            '"social_demand":{"level":"strong|medium|weak|false_demand","reason":"..."},' +
            '"feasibility":0到100整数,"demand_strength":0到100整数,"differentiation_space":0到100整数}' },
        ];
      },
      valid(d) {
        const levels = ['strong', 'medium', 'weak', 'false_demand'];
        return !!d && isArr(d.results)
          && isNum(d.hit_ratio) && d.hit_ratio >= 0 && d.hit_ratio <= 1
          && isArr(d.matched_patterns)
          && d.matched_patterns.every(m => m && isStr(m.id) && isNum(m.match_ratio))
          && isArr(d.matched_boosters) && d.matched_boosters.every(isStr)
          && !!d.social_demand && levels.indexOf(d.social_demand.level) >= 0
          && isNum(d.feasibility) && isNum(d.demand_strength) && isNum(d.differentiation_space);
      },
    },

    advise: {
      build(p) {
        return [
          { role: 'system', content: SYS },
          { role: 'user', content:
            '项目：' + p.summary + '\n' +
            '三维评分：原创性 ' + p.scores.originality + '，稀缺度 ' + p.scores.scarcity +
            '，意义感 ' + p.scores.meaning + '，综合 ' + p.composite + '（' + p.oceanType + ' 海域）\n' +
            '命中查重模式：' + (p.patternNames.join('、') || '无') + '\n\n' +
            '候选蓝海方向（blue_ocean.direction 只能从下列名称中选，选 2-3 个最适合本项目的）：\n' +
            p.blueOceanDirections.join('\n') + '\n\n' +
            '输出 JSON：{"score_advice":[' +
            '{"dimension":"originality","why":"为什么是这个分","how":"具体怎么提升"},' +
            '{"dimension":"scarcity","why":"...","how":"..."},' +
            '{"dimension":"meaning","why":"...","how":"..."}],' +
            '"differentiation":["针对本项目的具体差异化策略，3-4条，要具体可执行"],' +
            '"blue_ocean":[{"direction":"候选名称原文","why":"为什么适合本项目"}]}' },
        ];
      },
      valid(d) {
        return !!d && isArr(d.score_advice) && d.score_advice.length >= 3
          && d.score_advice.every(a => a && isStr(a.dimension) && isStr(a.why) && isStr(a.how))
          && isArr(d.differentiation) && d.differentiation.length > 0 && d.differentiation.every(isStr)
          && isArr(d.blue_ocean) && d.blue_ocean.every(b => b && isStr(b.direction) && isStr(b.why));
      },
    },

    // 功能级对比矩阵：从描述中提取本项目功能，再与最相关的相似项目逐项对比，
    // 输出【已有成熟实现 / 差异点（项目独有+竞品独有）/ 优先级优化建议】。
    // 用于把选题从「稀缺度数字」升级为「做哪些功能才有差异化」的可执行结论。
    compare: {
      build(p) {
        const list = p.projects.map((r, i) => i + '. [' + r.channel + '] ' + r.title + ' — ' + r.desc).join('\n');
        return [
          { role: 'system', content: SYS },
          { role: 'user', content:
            '本项目：' + p.summary + '\n目标用户：' + (p.targetUser || '未知') + '\n\n' +
            '最相关的相似项目（按相关度排序）：\n' + (list || '（无相似项目）') + '\n\n' +
            '请做功能级对比分析，输出 JSON：\n' +
            '{"features":["本项目计划的核心功能，3-6个，简短动词短语"],' +
            '"matrix":[{"feature":"与上面features一致的功能名","overlap":"high|medium|low|none",' +
            '"maturity":"mature|partial|absent","leaders":["实现该功能最好的1-2个竞品名"],"note":"一句话说明重复度或差异空间"}],' +
            '"mature":["哪些功能市面上已有很成熟的实现，建议直接复用/不重复造轮子，并点名1-2个成熟代表"],' +
            '"gaps":["本项目独特且竞品基本没做的差异点，这是获奖关键，要突出"],' +
            '"competitor_unique":["竞品有但本项目没考虑、值得借鉴补充的功能"],' +
            '"recommendations":["按优先级排序的具体优化建议，3-5条，要可执行"]}\n' +
            '要求：matrix 的 feature 必须来自 features；overlap=与竞品功能重合程度，maturity=该功能在市场上的实现成熟度。' },
        ];
      },
      valid(d) {
        const OV = ['high', 'medium', 'low', 'none'];
        const MA = ['mature', 'partial', 'absent'];
        return !!d && isArr(d.features) && d.features.length > 0 && d.features.every(isStr)
          && isArr(d.matrix) && d.matrix.every(m => m && isStr(m.feature)
            && OV.indexOf(m.overlap) >= 0 && MA.indexOf(m.maturity) >= 0)
          && isArr(d.mature) && isArr(d.gaps) && isArr(d.competitor_unique)
          && isArr(d.recommendations) && d.recommendations.every(isStr);
      },
    },
  };

  // ---------- 用户自备 key ----------
  function getUserConfig() {
    try {
      const c = JSON.parse(localStorage.getItem(LS_USER_KEY) || 'null');
      return c && c.key ? c : null;
    } catch (e) { return null; }
  }
  function setUserAiConfig(key, baseUrl, model) {
    if (!key) { localStorage.removeItem(LS_USER_KEY); }
    else {
      localStorage.setItem(LS_USER_KEY,
        JSON.stringify({ key: key, baseUrl: baseUrl || '', model: model || '' }));
    }
    _availableCache = null;
  }

  // ---------- 传输 ----------
  async function postOnce(task, messages) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const user = getUserConfig();
      if (user) {
        // 用户自备 key：浏览器直连（key 属于用户自己，不涉及泄露他人密钥）
        const base = (user.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
        const resp = await fetch(base + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.key },
          body: JSON.stringify({ model: user.model || DEFAULT_MODEL, messages: messages,
            response_format: { type: 'json_object' }, temperature: 0.3 }),
          signal: ctrl.signal,
        });
        if (resp.status === 401 || resp.status === 403) return { ok: false, error: 'auth' };
        if (resp.status >= 500) return { ok: false, error: 'upstream_5xx' };
        if (!resp.ok) return { ok: false, error: 'upstream' };
        const j = await resp.json();
        try { return { ok: true, data: JSON.parse(j.choices[0].message.content) }; }
        catch (e) { return { ok: false, error: 'invalid_json' }; }
      }
      const resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task, messages: messages }),
        signal: ctrl.signal,
      });
      if (resp.status === 404) return { ok: false, error: 'no_key' }; // 无服务端（如 http.server）
      if (resp.status >= 500) return { ok: false, error: 'upstream_5xx' };
      return await resp.json();
    } catch (e) {
      return { ok: false, error: e.name === 'AbortError' ? 'timeout' : 'network' };
    } finally {
      clearTimeout(timer);
    }
  }

  const RETRYABLE = { timeout: 1, upstream_5xx: 1, invalid_json: 1, network: 1 };

  async function aiTask(name, payload) {
    const def = TASKS[name];
    if (!def) return { ok: false, error: 'bad_task' };
    const cacheKey = 'hackai_' + name + '_' + hashStr(JSON.stringify(payload));
    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) return { ok: true, data: JSON.parse(hit), cached: true };
    } catch (e) {}
    const messages = def.build(payload);
    let res = await postOnce(name, messages);
    if (!res.ok && RETRYABLE[res.error]) res = await postOnce(name, messages);
    if (!res.ok) return res;
    if (!def.valid(res.data)) return { ok: false, error: 'schema' };
    try { sessionStorage.setItem(cacheKey, JSON.stringify(res.data)); } catch (e) {}
    return res;
  }

  let _availableCache = null;
  async function aiAvailable() {
    if (_availableCache !== null) return _availableCache;
    if (getUserConfig()) { _availableCache = true; return true; }
    try {
      const r = await fetch(ENDPOINT, { method: 'GET' });
      const j = await r.json();
      _availableCache = !!(j.ok && j.hasKey);
    } catch (e) {
      _availableCache = false;
    }
    return _availableCache;
  }

  window.HackAI = {
    aiTask: aiTask,
    aiAvailable: aiAvailable,
    setUserAiConfig: setUserAiConfig,
    computeRadarPoints: computeRadarPoints,
    _internal: { TASKS: TASKS, hashStr: hashStr },
  };
})();

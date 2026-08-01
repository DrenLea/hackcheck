/**
 * HackCheck - 核心：全局状态、导航、通用工具、总分、导出报告、初始化
 * 5大阶段逻辑分别在 topic.js / tech.js / dev.js / demo.js / pitch.js
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
        <span>${sub.labelKey ? t(sub.labelKey) : sub.label}</span>
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
          <span>${sub.labelKey ? t(sub.labelKey) : sub.label}</span>
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

// 语言切换后更新动态渲染的导航标签
function updateNavLabels() {
  Object.entries(MODULE_SUBMODULES).forEach(([moduleId, subs]) => {
    // 更新展开模式的子项标签
    const container = $(`#navChildren-${moduleId}`);
    if (container) {
      const items = container.querySelectorAll('.nav-sub-item');
      items.forEach((item, idx) => {
        const labelEl = item.querySelectorAll('span')[1];
        if (labelEl && subs[idx] && subs[idx].labelKey) {
          labelEl.textContent = t(subs[idx].labelKey);
        }
      });
    }
    // 更新 flyout 面板标签
    const group = container?.closest('.nav-group');
    const flyout = group?.querySelector('.nav-flyout');
    if (flyout) {
      const flyoutTitle = flyout.querySelector('.nav-flyout-title');
      const navTitleEl = group?.querySelector('.nav-title');
      if (flyoutTitle && navTitleEl) flyoutTitle.textContent = navTitleEl.textContent;
      const flyoutItems = flyout.querySelectorAll('.nav-sub-item');
      flyoutItems.forEach((item, idx) => {
        const labelEl = item.querySelectorAll('span')[1];
        if (labelEl && subs[idx] && subs[idx].labelKey) {
          labelEl.textContent = t(subs[idx].labelKey);
        }
      });
    }
  });
  // 更新字数统计
  const ta = $('#projectDescription');
  if (ta) {
    $('#charCount').innerHTML = `${ta.value.length} <span>${t('topic.charCount')}</span>`;
  }
  // 重新渲染动态内容（如果已有数据）
  try {
    if (AppState.topic.analyzed) {
      const analysis = analyzeTopic(AppState.topic.description, extractKeywords(AppState.topic.description));
      renderTopicResults(analysis, extractKeywords(AppState.topic.description));
    }
  } catch(e) { console.warn('i18n re-render topic failed:', e.message); }
  try {
    if (AppState.tech.selected.length > 0) evaluateTechStack();
  } catch(e) { console.warn('i18n re-render tech failed:', e.message); }
  try {
    if (AppState.dev.scanned) renderScanResults();
  } catch(e) { console.warn('i18n re-render scan failed:', e.message); }
  try {
    if (AppState.pitch.review.autoReviewed) calculateReviewScore();
  } catch(e) { console.warn('i18n re-render review failed:', e.message); }
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
// 通用工具
// ============================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

  // 更新竖向进度条
  const fill = $('#sideProgressFill');
  if (fill) fill.style.height = avg + '%';
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
  showToast(t('report.exported'), 'success');
}

// ============================================
// 重置
// ============================================
function resetAll() {
  if (!confirm(t('app.resetConfirm'))) return;

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
  initI18n();
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

  $('#resetBtn').addEventListener('click', resetAll);

  // 恢复UI状态（try-catch 防止单个模块恢复失败影响整体）
  try {
    if (AppState.topic.analyzed) {
      $('#projectDescription').value = AppState.topic.description;
      $('#charCount').textContent = `${AppState.topic.description.length} ${t('topic.charCount')}`;
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

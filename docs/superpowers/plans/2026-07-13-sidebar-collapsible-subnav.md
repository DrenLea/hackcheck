# 侧边栏可折叠与子项导航 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将左侧导航栏从固定扁平列表改为可折叠伸缩的二级导航系统，支持整体收起为图标窄栏、分组内子项手风琴展开/折叠、窄栏 hover flyout、以及子项切换页面区块显示。

**Architecture:** CSS 控制侧边栏收起/展开和分组折叠的视觉表现，JS 控制子项导航和区块显示/隐藏逻辑，子项配置集中在 `data.js` 的 `MODULE_SUBMODULES` 中统一管理。保留现有 `switchModule` 函数并扩展。

**Tech Stack:** HTML5 + CSS3 + 原生 JavaScript（无框架依赖），LocalStorage 持久化，无测试框架（手动浏览器测试）

**Spec:** `docs/superpowers/specs/2026-07-13-sidebar-collapsible-subnav-design.md`

---

## 文件结构

| 文件 | 职责 | 改动类型 |
|------|------|---------|
| `js/data.js` | 新增 `MODULE_SUBMODULES` 配置 | 追加到文件末尾 |
| `index.html` | Header 折叠按钮、侧边栏 `.nav-group` 结构、模块内 `data-submodule` 标记 | 修改 |
| `css/styles.css` | 折叠、子项、flyout、箭头样式 | 追加新样式 |
| `js/app.js` | AppState 扩展、导航函数、子项渲染与切换 | 修改+新增 |

---

### Task 1: 新增 MODULE_SUBMODULES 配置

**Files:**
- Modify: `js/data.js`（文件末尾，第 892 行 `};` 之后追加）

- [ ] **Step 1: 在 `js/data.js` 末尾追加 MODULE_SUBMODULES 配置**

在文件最后一行 `};`（第 892 行，PITCH_DATA 结束）之后追加：

```js

// ============================================
// 模块子项导航配置
// ============================================
const MODULE_SUBMODULES = {
  topic: [
    { id: 'description',  label: '项目描述',   icon: '📝' },
    { id: 'search',       label: '搜索结果',   icon: '🔍' },
    { id: 'analysis',     label: '稀缺度分析', icon: '📊' },
    { id: 'strategies',   label: '差异化策略', icon: '🎯' },
  ],
  tech: [
    { id: 'config',       label: '团队配置',   icon: '⚙️' },
    { id: 'presets',      label: '预设方案',   icon: '💡' },
    { id: 'manual',       label: '手动选型',   icon: '🔧' },
    { id: 'results',      label: '评估结果',   icon: '📈' },
    { id: 'division',     label: '团队分工',   icon: '👥' },
    { id: 'timeline',     label: '开发时间线', icon: '📅' },
  ],
  dev: [
    { id: 'upload',       label: '文件上传',   icon: '📂' },
    { id: 'results',      label: '扫描结果',   icon: '🔒' },
  ],
  demo: [
    { id: 'git',          label: 'Git教程',    icon: '📦' },
    { id: 'detect',       label: '项目检测',   icon: '🔎' },
    { id: 'deploy',       label: '部署方案',   icon: '🚀' },
  ],
  pitch: [
    { id: 'info',         label: '项目信息',   icon: '📝' },
    { id: 'pitch',        label: 'Pitch演讲稿',icon: '🎤' },
    { id: 'review',       label: '模拟评审',   icon: '🎯' },
  ],
};
```

- [ ] **Step 2: 浏览器验证配置加载**

启动本地服务器（如果未运行）：`python -m http.server 8080`
打开浏览器控制台，执行：`console.log(MODULE_SUBMODULES)`
预期：输出包含 5 个模块的对象，每个模块有子项数组。

- [ ] **Step 3: Commit**

```bash
git add js/data.js
git commit -m "feat: 新增 MODULE_SUBMODULES 子项导航配置"
```

---

### Task 2: 修改 HTML - Header 折叠按钮与侧边栏结构

**Files:**
- Modify: `index.html`（第 18-125 行 header 和 sidebar 区域）

- [ ] **Step 1: 在 header 的 logo 前增加折叠按钮**

将 `index.html` 第 19-20 行：
```html
    <div class="header-left">
      <div class="logo">
```
改为：
```html
    <div class="header-left">
      <button class="btn btn-ghost sidebar-toggle" id="sidebarToggle" title="折叠/展开侧边栏">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="logo">
```

- [ ] **Step 2: 将侧边栏的模块项改为 .nav-group 结构**

将 `index.html` 第 52-95 行（从 `<nav class="sidebar">` 到第一个 `</div>` 闭合 `sidebar-section`）替换为：

```html
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-label">开发流程</div>

        <div class="nav-group expanded" data-module="topic">
          <button class="nav-item active" data-module="topic">
            <span class="nav-icon">🔍</span>
            <div class="nav-content">
              <span class="nav-title">选题评审</span>
              <span class="nav-desc">查重与稀缺度分析</span>
            </div>
            <span class="nav-score" id="navScoreTopic">--</span>
            <span class="nav-arrow">▼</span>
          </button>
          <div class="nav-children" id="navChildren-topic"></div>
        </div>

        <div class="nav-group" data-module="tech">
          <button class="nav-item" data-module="tech">
            <span class="nav-icon">⚙️</span>
            <div class="nav-content">
              <span class="nav-title">技术选型</span>
              <span class="nav-desc">技术栈与分工推荐</span>
            </div>
            <span class="nav-score" id="navScoreTech">--</span>
            <span class="nav-arrow">▼</span>
          </button>
          <div class="nav-children" id="navChildren-tech"></div>
        </div>

        <div class="nav-group" data-module="dev">
          <button class="nav-item" data-module="dev">
            <span class="nav-icon">🔒</span>
            <div class="nav-content">
              <span class="nav-title">代码扫描</span>
              <span class="nav-desc">安全检测与质量检查</span>
            </div>
            <span class="nav-score" id="navScoreDev">--</span>
            <span class="nav-arrow">▼</span>
          </button>
          <div class="nav-children" id="navChildren-dev"></div>
        </div>

        <div class="nav-group" data-module="demo">
          <button class="nav-item" data-module="demo">
            <span class="nav-icon">🚀</span>
            <div class="nav-content">
              <span class="nav-title">Demo辅助</span>
              <span class="nav-desc">部署推荐与配置</span>
            </div>
            <span class="nav-score" id="navScoreDemo">--</span>
            <span class="nav-arrow">▼</span>
          </button>
          <div class="nav-children" id="navChildren-demo"></div>
        </div>

        <div class="nav-group" data-module="pitch">
          <button class="nav-item" data-module="pitch">
            <span class="nav-icon">🎤</span>
            <div class="nav-content">
              <span class="nav-title">Pitch & 评审</span>
              <span class="nav-desc">演讲生成与模拟评审</span>
            </div>
            <span class="nav-score" id="navScorePitch">--</span>
            <span class="nav-arrow">▼</span>
          </button>
          <div class="nav-children" id="navChildren-pitch"></div>
        </div>
      </div>
```

保留后面的"总体进度"和"sidebar-footer"部分不变。

- [ ] **Step 3: 浏览器验证页面结构**

刷新 `http://localhost:8080`，页面应正常加载，侧边栏显示 5 个模块，每个模块右侧有 ▼ 箭头。此时子项列表为空（尚未渲染）。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 侧边栏改为 nav-group 结构并增加折叠按钮"
```

---

### Task 3: 修改 HTML - 模块内区块加 data-submodule 标记

**Files:**
- Modify: `index.html`（5 个 module-section 内部）

- [ ] **Step 1: 选题评审模块（module-topic）加 data-submodule 标记**

在 `module-topic` section 内，将功能区块用 `<div data-submodule="xxx">` 包裹。

将第 143 行 `<div class="topic-input">` 改为 `<div class="topic-input" data-submodule="description">`

将第 158-178 行的"搜索状态"和"多渠道搜索结果"两个 div 包裹：
```html
        <div data-submodule="search">
          <!-- 搜索状态 -->
          <div class="search-status" id="searchStatus" style="display:none;">
            ...
          </div>

          <!-- 多渠道搜索结果 -->
          <div class="multi-channel-results" id="multiChannelResults" style="display:none;">
            ...
          </div>
        </div>
```

将第 180-220 行的"分析结果"div 包裹：
```html
        <div data-submodule="analysis">
          <!-- 分析结果 -->
          <div class="topic-results" id="topicResults" style="display:none;">
            ...
          </div>
        </div>
```

将第 213-219 行的"手动查重平台"和"优化建议"从 topic-results 中移出，单独包裹：
```html
        <div data-submodule="strategies">
          <div class="search-suggestions">
            <h4 class="detail-title">🔎 手动查重平台</h4>
            <p class="search-hint">在以下平台搜索你的项目关键词，检查是否有高度相似的项目：</p>
            <div class="search-platforms" id="searchPlatforms"></div>
          </div>
          <div class="topic-advice" id="topicAdvice"></div>
        </div>
```

注意：`searchPlatforms` 和 `topicAdvice` 需要从 `topicResults` div 内部移出到 `strategies` div 中。`renderTopicResults` 函数中引用这些元素的代码不需要修改，因为它们仍然存在于 DOM 中，只是被移动了父容器。

- [ ] **Step 2: 技术选型模块（module-tech）加 data-submodule 标记**

将第 236 行 `<div class="tech-config">` 改为 `<div class="tech-config" data-submodule="config">`

将第 266-270 行的预设方案区域：
```html
        <div class="preset-plans-section" data-submodule="presets">
```

将第 272-275 行的手动选型区域：
```html
        <div class="tech-selector" data-submodule="manual">
```

将第 277-302 行的评估结果区域：
```html
        <div class="tech-results" id="techResults" data-submodule="results" style="display:none;">
```

将第 304-310 行的分工推荐区域：
```html
        <div class="division-section" id="divisionSection" data-submodule="division" style="display:none;">
```

将第 312-316 行的时间线区域：
```html
        <div class="timeline-section" id="timelineSection" data-submodule="timeline" style="display:none;">
```

- [ ] **Step 3: 代码扫描模块（module-dev）加 data-submodule 标记**

将第 332-337 行的扫描介绍和第 339-349 行的上传区域合并包裹：
```html
        <div data-submodule="upload">
          <div class="scan-intro">...</div>
          <div class="upload-zone" id="uploadZone">...</div>
          <div class="scanned-files" id="scannedFiles" style="display:none;">...</div>
        </div>
```

将第 360-391 行的扫描结果区域：
```html
        <div data-submodule="results">
          <div class="scan-results" id="scanResults" style="display:none;">...</div>
        </div>
```

- [ ] **Step 4: Demo辅助模块（module-demo）加 data-submodule 标记**

将第 403-408 行 Git 教程区域：
```html
        <div class="git-tutorial-section" data-submodule="git">
```

将第 410-427 行项目检测区域：
```html
        <div class="project-detect-section" data-submodule="detect">
```

将第 429-445 行部署相关区域合并：
```html
        <div data-submodule="deploy">
          <div class="deploy-recommendations" id="deployRecommendations" style="display:none;">...</div>
          <div class="deploy-steps-section" id="deployStepsSection" style="display:none;">...</div>
          <div class="config-gen-section" id="configGenSection" style="display:none;">...</div>
        </div>
```

- [ ] **Step 5: Pitch模块（module-pitch）加 data-submodule 标记**

将第 462-487 行项目信息区域：
```html
        <div class="pitch-input-section" data-submodule="info">
```

将第 489-496 行 Pitch 结果区域：
```html
        <div class="pitch-result" id="pitchResult" data-submodule="pitch" style="display:none;">
```

将第 498-515 行模拟评审区域：
```html
        <div class="review-section" data-submodule="review">
```

- [ ] **Step 6: 浏览器验证页面正常加载**

刷新页面，所有模块页面应正常显示，功能不受影响（此时 data-submodule 标记仅添加，不影响显示逻辑）。

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: 5个模块内区块添加 data-submodule 标记"
```

---

### Task 4: 新增 CSS 样式

**Files:**
- Modify: `css/styles.css`（在现有侧边栏样式之后追加）

- [ ] **Step 1: 在 styles.css 的 Sidebar 区域之后追加新样式**

在 `.sidebar-tip span:last-child` 规则之后（约第 166 行），追加以下样式：

```css
/* ============================================
   Sidebar Toggle & Sub-navigation
   ============================================ */
.sidebar-toggle {
  padding: 6px;
  flex-shrink: 0;
}
.sidebar-toggle:hover {
  background: var(--bg-hover);
}

.sidebar {
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.collapsed {
  width: 56px;
}
.sidebar.collapsed .nav-content,
.sidebar.collapsed .nav-score,
.sidebar.collapsed .nav-arrow,
.sidebar.collapsed .nav-children,
.sidebar.collapsed .sidebar-label,
.sidebar.collapsed .overall-score-card,
.sidebar.collapsed .sidebar-footer {
  display: none;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}
.sidebar.collapsed .nav-group {
  position: relative;
}

/* 子项列表（展开模式） */
.nav-group {
  position: relative;
}
.nav-children {
  display: none;
  flex-direction: column;
  gap: 2px;
  padding-left: 32px;
  padding-top: 4px;
}
.nav-group.expanded .nav-children {
  display: flex;
}
.nav-sub-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition);
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  width: 100%;
}
.nav-sub-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-sub-item.active {
  color: var(--accent-primary);
  background: rgba(0,255,163,0.06);
}

/* 展开箭头 */
.nav-arrow {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.nav-group.expanded .nav-arrow {
  transform: rotate(0deg);
}
.nav-group:not(.expanded) .nav-arrow {
  transform: rotate(-90deg);
}

/* Hover Flyout（窄栏模式） */
.nav-flyout {
  display: none;
  position: absolute;
  left: 56px;
  top: 0;
  min-width: 200px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 8px;
  z-index: 200;
}
.sidebar.collapsed .nav-group:hover .nav-flyout {
  display: block;
}
.nav-flyout-title {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.nav-flyout .nav-sub-item {
  padding: 8px 10px;
  font-size: 13px;
}
```

- [ ] **Step 2: 浏览器验证样式**

刷新页面，确认：
- 侧边栏模块项右侧出现 ▼ 箭头
- 第一个模块（选题评审）的箭头朝下（expanded），其他朝右（未展开）

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: 新增侧边栏折叠、子项列表、flyout 样式"
```

---

### Task 5: JS - AppState 扩展与导航函数

**Files:**
- Modify: `js/app.js`（第 9-10 行 AppState、第 67-80 行导航区域）

- [ ] **Step 1: 扩展 AppState**

将 `js/app.js` 第 9-10 行：
```js
const AppState = {
  currentModule: 'topic',
```
改为：
```js
const AppState = {
  currentModule: 'topic',
  currentSubmodule: null,
```

- [ ] **Step 2: 修改 switchModule 函数**

将 `js/app.js` 第 75-80 行：
```js
function switchModule(name) {
  AppState.currentModule = name;
  $$('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.module === name));
  $$('.module-section').forEach(s => s.classList.toggle('active', s.id === `module-${name}`));
  $('.main-content').scrollTop = 0;
}
```
改为：
```js
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
```

- [ ] **Step 3: 修改 initNavigation 函数**

将 `js/app.js` 第 70-74 行：
```js
function initNavigation() {
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchModule(item.dataset.module));
  });
}
```
改为：
```js
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
```

- [ ] **Step 4: 在 initNavigation 之后新增导航函数**

在 `switchModule` 函数之后（原第 80 行 `}` 之后）追加：

```js
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
```

- [ ] **Step 5: 浏览器验证基础功能**

刷新 `http://localhost:8080`，验证：
1. 页面加载后，选题评审模块展开，显示 4 个子项
2. 点击子项，页面只显示对应区块，其他隐藏
3. 点击其他模块（如"技术选型"），自动展开其子项，折叠选题评审的子项
4. 点击折叠按钮，侧边栏收窄为 56px，仅显示图标
5. 窄栏模式下鼠标悬停图标，弹出 flyout 面板显示子项
6. 点击 flyout 中的子项，跳转到对应区块

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "feat: 实现侧边栏折叠、子项导航与区块切换逻辑"
```

---

### Task 6: 初始化时选中第一个子项

**Files:**
- Modify: `js/app.js`（`init` 函数，约第 2980 行）

- [ ] **Step 1: 在 init 函数末尾调用默认子项选中**

在 `js/app.js` 的 `init` 函数中，找到最后一行恢复 UI 状态的代码之后（约第 3004 行 `initPitchModule();` 调用之后，或者在 init 函数末尾），在 `}` 之前追加：

```js
  // 初始化时选中第一个模块的第一个子项
  const firstSub = MODULE_SUBMODULES[AppState.currentModule]?.[0];
  if (firstSub) {
    switchSubmodule(AppState.currentModule, firstSub.id);
  }
```

具体位置：在 `init()` 函数中所有 `init*Module()` 调用和 UI 恢复逻辑之后、函数闭合 `}` 之前。

- [ ] **Step 2: 浏览器验证初始化**

刷新 `http://localhost:8080`，验证：
1. 页面加载后默认显示"选题评审 > 项目描述"区块
2. 其他区块（搜索结果、稀缺度分析、差异化策略）初始隐藏
3. 侧边栏第一个子项"项目描述"高亮

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: 初始化时自动选中第一个子项"
```

---

### Task 7: 完整功能测试与修复

**Files:**
- 可能修改: `js/app.js`、`index.html`、`css/styles.css`

- [ ] **Step 1: 测试折叠按钮**

1. 点击 header 左侧的折叠按钮
2. 验证侧边栏收窄为 56px，仅显示图标
3. 验证主内容区自动扩展填充剩余空间
4. 再次点击，恢复 260px 宽度

- [ ] **Step 2: 测试分组折叠（手风琴）**

1. 在展开模式下，当前模块"选题评审"已展开
2. 再次点击"选题评审"模块项，验证子项列表折叠
3. 再次点击，验证子项列表展开
4. 点击"技术选型"模块，验证选题评审子项自动折叠，技术选型子项展开

- [ ] **Step 3: 测试子项切换**

1. 在"选题评审"模块下点击"搜索结果"子项
2. 验证页面只显示搜索相关区块，"项目描述"等区块隐藏
3. 点击"稀缺度分析"子项，验证切换到分析区块
4. 验证侧边栏子项高亮正确跟随

- [ ] **Step 4: 测试 Hover Flyout**

1. 点击折叠按钮收窄侧边栏
2. 鼠标悬停在"技术选型"图标上
3. 验证右侧弹出 flyout 面板，显示"技术选型"标题和子项列表
4. 点击 flyout 中的"团队分工"子项
5. 验证跳转到技术选型模块的团队分工区块，flyout 消失

- [ ] **Step 5: 测试动态内容**

1. 在"选题评审 > 项目描述"中输入项目描述
2. 点击搜索按钮
3. 搜索完成后，手动切换到"搜索结果"子项
4. 验证搜索结果正常显示在"搜索结果"区块内
5. 切换到"稀缺度分析"子项，验证分析结果正常显示

- [ ] **Step 6: 测试模块标题始终可见**

1. 在任意模块中切换不同子项
2. 验证 `.module-header`（标题、副标题、分数）始终显示在页面顶部

- [ ] **Step 7: 测试页面刷新**

1. 刷新页面
2. 验证侧边栏恢复展开状态（260px）
3. 验证选中第一个模块（选题评审）的第一个子项（项目描述）

- [ ] **Step 8: 修复发现的问题（如有）**

根据测试结果修复任何问题。常见问题：
- 动态显示的元素（如 `style.display = 'none'` 的搜索结果）在子项切换后可能不显示：确保 `switchSubmodule` 设置 `display = ''`（恢复默认）而非 `display = 'block'`
- flyout 面板位置偏移：确保 `.nav-group` 有 `position: relative`

- [ ] **Step 9: Commit 所有修复**

```bash
git add -A
git commit -m "fix: 修复测试中发现的问题"
```

---

### Task 8: 推送到 GitHub

- [ ] **Step 1: 推送所有提交**

```bash
git push origin main
```

- [ ] **Step 2: 验证推送成功**

检查 GitHub 仓库 `https://github.com/DrenLea/hackcheck` 确认提交已上传。

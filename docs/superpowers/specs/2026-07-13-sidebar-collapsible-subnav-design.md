# 侧边栏可折叠与子项导航设计

> 日期：2026-07-13
> 状态：已确认，待实现

## 1. 概述

将 HackCheck 的左侧导航栏从固定宽度的扁平列表改为可折叠伸缩的二级导航系统。支持整体收起为图标窄栏、分组内子项展开/折叠（手风琴效果）、以及窄栏模式下的 hover flyout 弹出面板。每个模块页面内的功能区块通过子项导航分开存放，点击子项仅显示对应区块。

## 2. 需求总结

| 需求 | 决策 |
|------|------|
| 子项导航交互方式 | C - 子页面导航：侧边栏每个模块展开子项，点击直接跳到对应功能区块 |
| 折叠行为 | C - 两者结合：整体收起为图标窄栏 + 分组内子项展开/折叠 |
| 窄栏子项呈现 | A - Hover flyout：鼠标悬停图标时右侧弹出子项列表 |
| 子项点击后页面展示 | B - 仅显示该子项：其他区块隐藏 |
| 状态记忆 | B - 始终默认展开：刷新后恢复默认状态 |
| 设计原则 | YAGNI + DRY |

## 3. 子项配置

在 `js/data.js` 中新增 `MODULE_SUBMODULES` 配置，集中管理每个模块的子项。侧边栏子项列表从此配置动态渲染，不手写 HTML。

```js
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

## 4. HTML 结构改动

### 4.1 Header 折叠按钮

在 header 的 logo 与右侧按钮之间新增折叠按钮：

```html
<header class="header">
  <div class="header-left">
    <button class="btn btn-ghost sidebar-toggle" id="sidebarToggle" title="折叠/展开侧边栏">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/>
      </svg>
    </button>
    <div class="logo">...</div>
  </div>
  ...
</header>
```

### 4.2 侧边栏结构

每个模块项下方增加子项容器，初始由 JS 动态渲染：

```html
<nav class="sidebar" id="sidebar">
  <div class="sidebar-section">
    <div class="sidebar-label">开发流程</div>

    <!-- 模块项（点击展开子项） -->
    <div class="nav-group" data-module="topic">
      <button class="nav-item active" data-module="topic">
        <span class="nav-icon">🔍</span>
        <div class="nav-content">
          <span class="nav-title">选题评审</span>
          <span class="nav-desc">查重与稀缺度分析</span>
        </div>
        <span class="nav-score" id="navScoreTopic">--</span>
        <span class="nav-arrow">▼</span>
      </button>
      <!-- 子项列表（JS 动态渲染） -->
      <div class="nav-children" id="navChildren-topic"></div>
    </div>

    <!-- 其他模块同理 -->
  </div>

  <div class="sidebar-section">
    <div class="sidebar-label">总体进度</div>
    <div class="overall-score-card">...</div>
  </div>

  <div class="sidebar-footer">...</div>
</nav>
```

### 4.3 页面区块标记

每个模块内的功能区块用 `data-submodule` 包裹。以选题评审为例：

```html
<section class="module-section active" id="module-topic">
  <div class="module-header">
    <h1 class="module-title">选题评审与查重</h1>
    <p class="module-subtitle">搜索相似项目，分析稀缺度，找到最有价值的方向</p>
    <div class="module-score-display">...</div>
  </div>

  <div data-submodule="description">
    <!-- 项目描述输入区 -->
  </div>

  <div data-submodule="search">
    <!-- 搜索状态 + 多渠道搜索结果 -->
  </div>

  <div data-submodule="analysis">
    <!-- 稀缺度分析 + 多维度评分 + 查重结果 + 加分因素 -->
  </div>

  <div data-submodule="strategies">
    <!-- 差异化策略 + 手动查重平台 + 优化建议 -->
  </div>
</section>
```

`.module-header` 始终显示，不受子项切换影响。

## 5. CSS 设计

### 5.1 侧边栏折叠

```css
.sidebar {
  width: 260px;
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
```

### 5.2 子项列表（展开模式）

```css
.nav-group {
  position: relative;  /* 为 flyout 定位提供基准 */
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
}

.nav-sub-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-sub-item.active {
  color: var(--accent-primary);
  background: rgba(0,255,163,0.06);
}

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
```

### 5.3 Hover Flyout（窄栏模式）

```css
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

### 5.4 折叠按钮

```css
.sidebar-toggle {
  padding: 6px;
}

.sidebar-toggle:hover {
  background: var(--bg-hover);
}
```

## 6. JS 逻辑

### 6.1 AppState 扩展

```js
let AppState = {
  currentModule: 'topic',
  currentSubmodule: null,  // 新增
  // ... 其余不变
};
```

### 6.2 新增函数

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

// 从 MODULE_SUBMODULES 渲染子项列表
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
    let flyout = group.querySelector('.nav-flyout');
    if (!flyout) {
      flyout = document.createElement('div');
      flyout.className = 'nav-flyout';
      group.appendChild(flyout);
    }
    const moduleTitle = group.querySelector('.nav-title').textContent;
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

  // 绑定子项点击事件
  $$('.nav-sub-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      switchSubmodule(item.dataset.module, item.dataset.submodule);
    });
  });
}

// 切换子项
function switchSubmodule(moduleId, subId) {
  if (AppState.currentModule !== moduleId) {
    switchModule(moduleId);
  }
  AppState.currentSubmodule = subId;

  // 隐藏该模块下所有 data-submodule 区块，只显示选中的
  const moduleEl = $(`#module-${moduleId}`);
  moduleEl.querySelectorAll('[data-submodule]').forEach(el => {
    el.style.display = el.dataset.submodule === subId ? '' : 'none';
  });

  // 更新子项高亮
  $$('.nav-sub-item').forEach(el => {
    const match = el.dataset.module === moduleId && el.dataset.submodule === subId;
    el.classList.toggle('active', match);
  });

  $('.main-content').scrollTop = 0;
}
```

### 6.3 修改 initNavigation

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
  $('#sidebarToggle').addEventListener('click', toggleSidebar);

  // 渲染子项
  renderSubmodules();
}
```

### 6.4 修改 switchModule

```js
function switchModule(name) {
  AppState.currentModule = name;
  AppState.currentSubmodule = null;

  $$('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.module === name));
  $$('.module-section').forEach(s => s.classList.toggle('active', s.id === `module-${name}`));

  // 手风琴：展开当前模块子项
  $$('.nav-group').forEach(g => {
    g.classList.toggle('expanded', g.dataset.module === name);
  });

  $('.main-content').scrollTop = 0;
}
```

## 7. 边界处理

| 场景 | 处理方式 |
|------|---------|
| 动态显示的区块（搜索结果等） | `switchSubmodule` 只控制 `data-submodule` 容器显隐，容器内部动态元素保持原有逻辑 |
| 窄栏点击图标 | 直接切换到该模块第一个子项，hover 时才显示 flyout 供选择 |
| 模块切换 | 自动折叠上一个模块子项，展开新模块子项，默认选中第一个子项 |
| 只有一个子项的模块 | 不显示展开/折叠箭头（防御性处理，当前无此情况） |
| 页面刷新 | 恢复默认展开状态，选中第一个模块第一个子项 |

## 8. 不做的事（YAGNI）

- 不记忆折叠/子项状态到 LocalStorage
- 不支持侧边栏拖拽调宽
- 不做子项拖拽排序
- 不做键盘快捷键导航
- 不做子项的搜索/过滤
- 不做子项的进一步嵌套（只有两级）

## 9. 涉及文件

| 文件 | 改动类型 | 改动内容 |
|------|---------|---------|
| `js/data.js` | 新增 | `MODULE_SUBMODULES` 配置 |
| `index.html` | 修改 | header 增加折叠按钮；侧边栏改为 `.nav-group` 结构；模块内区块加 `data-submodule` 标记 |
| `css/styles.css` | 新增 | `.sidebar.collapsed`、`.nav-children`、`.nav-sub-item`、`.nav-arrow`、`.nav-flyout`、`.sidebar-toggle` 样式 |
| `js/app.js` | 修改+新增 | 扩展 `AppState`；新增 `toggleSidebar`、`toggleSubmenu`、`renderSubmodules`、`switchSubmodule`；修改 `initNavigation`、`switchModule` |

## 10. 测试方案

| 测试项 | 验证内容 |
|--------|---------|
| 折叠按钮 | 点击切换窄栏/宽栏，主内容区自适应 |
| 分组折叠 | 点击模块展开子项，切换模块自动折叠上一个 |
| 子项切换 | 点击子项只显示对应区块，其他隐藏 |
| Hover flyout | 窄栏下悬停图标弹出子项面板，移出消失 |
| 默认子项 | 进入模块自动选中第一个子项 |
| 动态内容 | 搜索/扫描后结果在子项容器内正常显示 |
| 模块标题 | 切换子项时标题区始终可见 |
| 页面刷新 | 刷新后恢复默认展开状态，选中第一个模块第一个子项 |

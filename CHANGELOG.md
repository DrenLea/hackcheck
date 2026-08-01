# Changelog

本项目的所有重要变更记录于此。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

All notable changes to this project are documented here.

## [2026-08-02] — AI 功能级对比矩阵

### Added
- **功能级对比矩阵（`compare` AI 任务）**：把 AI 判定为最相关的相似项目当作竞品，提取本项目 3-6 个核心功能，逐项对比「重合度（高/部分/低/无）× 市场成熟度（成熟/部分/空白）」，输出四块可执行结论：
  - 🧩 已有成熟实现（勿重复造轮子，点名成熟代表）
  - ⭐ 你的差异点（竞品没做的，获奖关键）
  - 👀 竞品独点（可借鉴补充）
  - 🚀 按优先级排序的优化建议
- 对比矩阵的表格与洞察区块渲染、中英双语文案、CSS 样式（重合度/成熟度彩色标签）
- pytest 新增 compare 任务白名单测试；浏览器测试页新增 6 条 compare schema 断言

### Changed
- 默认 AI 模型切换为 `deepseek-v4-flash`（DeepSeek 最新代低费率）。经实测中转站无 `ds-v4-pro` 渠道（返回 "no available channels"），从 653 个可用模型中选定并端到端验证
- `.env.example` / README / 三处代理默认值同步更新

### Fixed
- **本地代理 "auth" 误报**：中转站前置 Cloudflare 会对 Python-urllib 默认 User-Agent 返回 403（error 1010），被误判为密钥认证失败。`tools/ai_proxy.py` 改用浏览器 UA 后修复——此前的 auth 报错并非密钥无效

## [2026-08-01] — AI 增强选题评审

### Added
- **AI 客户端层（`js/ai.js`）**：prompt 构建 → 请求 `/api/ai` → schema 校验 → sessionStorage 缓存；永不 throw，失败自动降级
- **三个 AI 任务**：
  - `understand`——输入理解：翻译并提取搜索关键词（替代硬编码词表）
  - `assess`——语义匹配：逐条判定搜索结果相关度、查重模式命中、社媒需求信号（替代字符串匹配）
  - `advise`——建议生成：三维评分解释、定制差异化策略、蓝海方向推荐
- **本地开发服务器（`tools/ai_proxy.py`）**：纯标准库，静态文件 + AI 代理二合一，密钥只存服务端 `.env`，点文件路径一律 403
- **Vercel Serverless 代理（`api/ai.js`）**：线上部署读取平台环境变量
- 纯静态托管场景：页面 ⚙ 按钮可填自备 Key（仅存本机浏览器）
- 六轴雷达图替代评分仪表盘；AI 增强时显示 AI 徽标
- 代理层 pytest 测试（`tools/test_ai_proxy.py`）+ 前端浏览器测试页（`tests/ai.test.html`）

### Changed
- `js/app.js` 拆分为按模块的 `core.js` / `topic.js` / `tech.js` / `dev.js` / `demo.js` / `pitch.js`
- 多渠道搜索改进：代理回退链、GitHub 短语查询、概念映射表扩充

## [2026-07-14 ~ 2026-07-15] — 国际化与搜索渠道完善

### Added
- 中英双语切换（i18n），覆盖搜索结果、分析、AI 评审全部文案
- 搜索渠道调整为 6 渠道并行：GitHub / Devpost / Bing / DuckDuckGo / Wikipedia / ProductHunt
- 社媒需求发现（Hacker News API）
- 搜索结果描述超 3 行自动折叠、结果超 3 条自动折叠
- 侧边栏纵向进度条

### Fixed
- 多渠道搜索代理回退（cors.sh / cors.eu.org）
- 进度条填充方向、3 行折叠用真实 DOM 测量

## [2026-07-13] — 侧边栏子导航与选题方法论

### Added
- 侧边栏折叠、模块子项导航与区块切换
- `hackathon-topic-advisor` skill 包：选题评分脚本（25 个查重模式、24 个加分因素、8 个蓝海方向、100+ 中英概念映射）及测试

## [2026-07-12] — 初始版本

### Added
- HackCheck 五大模块初始实现：选题评审 / 技术选型 / 代码扫描 / Demo 辅助 / Pitch 生成与 AI 模拟评审
- 中英双语 README

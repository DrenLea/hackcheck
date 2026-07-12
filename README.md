<div align="center">

# HackCheck

### 黑客松全流程辅助器 | Hackathon Full-Process Assistant

帮助 0 基础开发者从创意到参赛的全流程辅助工具

A full-process assistant tool that helps zero-experience developers go from idea to competition.

[功能特性](#核心功能--features) · [快速开始](#快速开始--quick-start) · [使用流程](#使用流程--workflow) · [设计理念](#设计理念--design-principles)

</div>

---

## 中文说明

帮助 0 基础开发者从创意到参赛的全流程辅助工具。覆盖选题、选型、开发、部署、演示五大阶段，让每一个有创意的人都能创造出自己的项目并成功参赛。

### 核心功能

#### 1. 选题评审与查重

- 集成 MyMemory 多语种翻译 API，自动将中文描述翻译为英文
- 精准搜索 GitHub 上的同类项目
- 基于搜索结果数量和命中百分比计算稀缺度评分
- 从原创性、稀缺度、意义感三个维度量化项目价值
- 25+ 常见项目模式查重库，自动检测"换皮"项目
- 匹配时推荐差异化策略，帮助红海项目找到蓝海切入点

#### 2. 技术选型与分工

- 4 套预设方案：完全免费(¥0) / 经济(¥30-80) / 专业(¥150-400) / 高配(¥400-1000)
- 一键自动推荐技术栈，展示逐项成本分析
- 支持团队规模和开发时长配置
- 自动生成分工建议

#### 3. 代码安全扫描

- 支持整个项目文件夹递归上传
- 自动过滤 `node_modules`、`.git` 等无关目录
- 按目录结构分组展示文件列表
- 扫描硬编码密钥（API Key、Token、密码等）
- 检测敏感文件（.env、私钥文件等）
- 检测代码质量问题（debugger、console.log 等）
- 检测 `.gitignore` 配置完整性
- 实时输出安全评分

#### 4. Demo 部署辅助

- 6 步 Git 版本控制教程（从安装到推送 GitHub，每步含可复制命令）
- 自动检测项目类型（React / Vue / Next.js / Python / 静态站点等）
- 推荐最佳部署方案（Vercel / Netlify / Render / Railway）
- 附部署检查清单

#### 5. Pitch 生成与 AI 模拟评审

- 根据选手输入的项目名称、描述和技术栈，自动解析目标用户和核心功能
- 生成 7 段个性化 Pitch 演讲稿（开场Hook → 问题 → 方案 → Demo → 技术 → 影响力 → 展望）
- 5 个 AI 评审员从 5 个维度自动评分：
  - 代码质量评审员（结构、可读性、错误处理、注释、硬编码、依赖、测试、版本控制）
  - 用户体验评审员（首屏、导航、反馈、响应式、一致性、无障碍、空状态、性能）
  - 创新性评审员（新颖性、差异化、AI整合、问题匹配、可扩展、技术组合、用户洞察、市场潜力）
  - 技术深度评审员（复杂度、完整性、架构、API设计、数据处理、安全、性能、部署）
  - 演示与表达评审员（价值主张、演示流程、问题陈述、方案清晰度、视觉辅助、技术解释、未来规划、QA准备）
- 40 项标准自动评分并给出针对性反馈
- 雷达图可视化展示
- 生成 P0-P3 优先级改进清单
- 支持用户手动调整 AI 评分

### 技术栈

- **前端**：HTML5 + CSS3 + 原生 JavaScript（无框架依赖）
- **外部 API**：
  - [MyMemory Translation API](https://mymemory.translated.net/) - 多语种翻译
  - [GitHub Search API](https://docs.github.com/en/rest/search) - 仓库搜索
- **数据存储**：LocalStorage（本地持久化，无需后端）
- **部署**：纯静态文件，可部署到任何静态托管平台

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/DrenLea/hackcheck.git

# 进入项目目录
cd hackcheck

# 直接用浏览器打开 index.html，或启动本地服务器
python -m http.server 8080

# 然后访问 http://localhost:8080
```

无需安装任何依赖，无需配置环境变量，打开即用。

### 项目结构

```
hackcheck/
├── index.html              # 主页面
├── css/
│   └── styles.css          # 全局样式
├── js/
│   ├── app.js              # 核心业务逻辑
│   └── data.js             # 配置数据（技术栈、评审标准、查重库等）
└── README.md
```

### 使用流程

1. **选题阶段**：在首页输入项目描述，点击"搜索相似项目"，系统自动翻译并搜索 GitHub，返回稀缺度评分和同类项目列表
2. **选型阶段**：进入"技术选型"模块，选择预设方案，获取技术栈推荐和成本分析
3. **开发阶段**：进入"代码扫描"模块，上传整个项目文件夹，获取安全评分和改进建议
4. **部署阶段**：进入"Demo辅助"模块，按 Git 教程完成版本控制，检测项目类型并选择部署方案
5. **演示阶段**：进入"Pitch生成"模块，输入项目信息生成演讲稿，点击"AI模拟评审"获取5个维度的自动评分和反馈
6. **导出报告**：点击"导出报告"按钮，下载完整的参赛自查报告

### 设计理念

- **全流程陪伴**：不是只在最后检查，而是从选题阶段就介入
- **0 基础友好**：每个模块都有详细指引，Git 教程包含可复制命令
- **避坑导向**：安全扫描检测硬编码密钥、.gitignore 配置等常见陷阱
- **数据驱动**：稀缺度评分基于 GitHub 搜索结果，AI 评审基于项目实际信息
- **开箱即用**：纯前端实现，无需注册登录，无需后端，打开即用

---

## English Documentation

A full-process assistant tool that helps zero-experience developers go from idea to competition. Covers five stages: topic selection, tech stack selection, development, deployment, and demo — empowering anyone with an idea to build their own project and compete successfully.

### Features

#### 1. Topic Review & Duplicate Detection

- Integrated MyMemory multilingual translation API — auto-translates Chinese descriptions to English
- Precise search for similar projects on GitHub
- Scarcity score calculated from search result count and hit percentage
- Quantifies project value across three dimensions: originality, scarcity, and social impact
- 25+ common project pattern library — auto-detects "reskin" projects
- Recommends differentiation strategies to help red-ocean projects find blue-ocean angles

#### 2. Tech Stack Selection & Task Assignment

- 4 preset plans: Free (¥0) / Budget (¥30-80) / Pro (¥150-400) / Premium (¥400-1000)
- One-click tech stack recommendation with itemized cost breakdown
- Configurable team size and development duration
- Auto-generated task assignment suggestions

#### 3. Code Security Scanner

- Recursive folder upload support
- Auto-filters `node_modules`, `.git`, and other irrelevant directories
- File list grouped by directory structure
- Scans for hardcoded secrets (API keys, tokens, passwords, etc.)
- Detects sensitive files (.env, private key files, etc.)
- Detects code quality issues (debugger, console.log, etc.)
- Checks `.gitignore` configuration completeness
- Real-time security score output

#### 4. Demo Deployment Assistant

- 6-step Git version control tutorial (from installation to pushing to GitHub, with copyable commands)
- Auto-detects project type (React / Vue / Next.js / Python / static site, etc.)
- Recommends best deployment platform (Vercel / Netlify / Render / Railway)
- Includes deployment checklist

#### 5. Pitch Generation & AI Simulation Review

- Auto-parses target users and core features from project name, description, and tech stack
- Generates 7-section personalized pitch script (Hook → Problem → Solution → Demo → Tech → Impact → Future)
- 5 AI reviewers auto-score across 5 dimensions:
  - Code Quality Reviewer (structure, readability, error handling, comments, hardcoding, dependencies, testing, version control)
  - UX Reviewer (first impression, navigation, feedback, responsiveness, consistency, accessibility, empty states, performance)
  - Innovation Reviewer (novelty, differentiation, AI integration, problem fitting, scalability, tech combination, user insight, market potential)
  - Tech Depth Reviewer (complexity, completeness, architecture, API design, data handling, security, performance, deployment)
  - Presentation Reviewer (value proposition, demo flow, problem statement, solution clarity, visual aids, tech explanation, future plans, Q&A readiness)
- 40 criteria auto-scored with targeted feedback
- Radar chart visualization
- P0-P3 priority improvement list
- Users can manually adjust AI scores

### Tech Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript (no framework dependencies)
- **External APIs**:
  - [MyMemory Translation API](https://mymemory.translated.net/) — Multilingual translation
  - [GitHub Search API](https://docs.github.com/en/rest/search) — Repository search
- **Data Storage**: LocalStorage (client-side persistence, no backend needed)
- **Deployment**: Pure static files, deployable to any static hosting platform

### Quick Start

```bash
# Clone the repository
git clone https://github.com/DrenLea/hackcheck.git

# Navigate to project directory
cd hackcheck

# Open index.html directly in browser, or start a local server
python -m http.server 8080

# Visit http://localhost:8080
```

No dependencies to install, no environment variables to configure — just open and use.

### Project Structure

```
hackcheck/
├── index.html              # Main page
├── css/
│   └── styles.css          # Global styles
├── js/
│   ├── app.js              # Core business logic
│   └── data.js             # Configuration data (tech stack, review criteria, pattern library, etc.)
└── README.md
```

### Workflow

1. **Topic Selection**: Enter your project description on the home page, click "Search Similar Projects" — the system auto-translates and searches GitHub, returning a scarcity score and similar project list
2. **Tech Selection**: Go to the "Tech Selection" module, choose a preset plan, and get tech stack recommendations with cost analysis
3. **Development**: Go to the "Code Scan" module, upload your entire project folder, and get a security score with improvement suggestions
4. **Deployment**: Go to the "Demo Assistant" module, follow the Git tutorial for version control, detect project type, and choose a deployment plan
5. **Presentation**: Go to the "Pitch Generation" module, enter project info to generate a speech script, click "AI Review" to get auto-scoring and feedback across 5 dimensions
6. **Export Report**: Click "Export Report" to download a complete competition self-check report

### Design Principles

- **Full-Process Companion**: Not just a final check — intervenes from the topic selection stage
- **Beginner-Friendly**: Every module has detailed guidance; Git tutorial includes copyable commands
- **Pitfall-Oriented**: Security scanner detects hardcoded secrets, .gitignore config, and other common traps
- **Data-Driven**: Scarcity score based on GitHub search results; AI review based on actual project info
- **Out-of-the-Box**: Pure frontend implementation — no registration, no backend, just open and use

---

## License

MIT

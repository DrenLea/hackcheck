/**
 * HackCheck i18n - 中英文语言包
 * Usage: t('key') returns translated string for current language
 */

const I18N = {
  // ==================== 通用 UI ====================
  'app.title': { zh: '黑客松全流程辅助器', en: 'Hackathon Full-Process Assistant' },
  'app.export': { zh: '导出报告', en: 'Export Report' },
  'app.reset': { zh: '重置', en: 'Reset' },
  'app.toggleSidebar': { zh: '折叠/展开侧边栏', en: 'Toggle Sidebar' },
  'app.resetConfirm': { zh: '确定要重置所有数据吗？此操作不可撤销。', en: 'Are you sure you want to reset all data? This cannot be undone.' },

  // ==================== 侧边栏导航 ====================
  'nav.workflow': { zh: '开发流程', en: 'Workflow' },
  'nav.topic.title': { zh: '选题评审', en: 'Topic Review' },
  'nav.topic.desc': { zh: '查重与稀缺度分析', en: 'Plagiarism & Scarcity Analysis' },
  'nav.tech.title': { zh: '技术选型', en: 'Tech Selection' },
  'nav.tech.desc': { zh: '技术栈与分工推荐', en: 'Tech Stack & Team Roles' },
  'nav.code.title': { zh: '代码扫描', en: 'Code Scanner' },
  'nav.code.desc': { zh: '安全检测与质量检查', en: 'Security & Quality Check' },
  'nav.demo.title': { zh: 'Demo辅助', en: 'Demo Helper' },
  'nav.demo.desc': { zh: '部署推荐与配置', en: 'Deployment & Config' },
  'nav.pitch.title': { zh: 'Pitch & 评审', en: 'Pitch & Review' },
  'nav.pitch.desc': { zh: '演讲生成与模拟评审', en: 'Pitch Generator & AI Review' },
  'nav.progress': { zh: '总体进度', en: 'Overall Progress' },
  'nav.completeness': { zh: '综合完成度', en: 'Completeness' },
  'nav.tip': { zh: '按流程从上到下依次完成各阶段，每阶段为下一阶段提供基础', en: 'Complete each stage top-to-bottom; each stage builds the foundation for the next' },

  // ==================== 子模块导航 ====================
  'sub.topic.desc': { zh: '项目描述', en: 'Description' },
  'sub.topic.search': { zh: '搜索结果', en: 'Search Results' },
  'sub.topic.analysis': { zh: '稀缺度分析', en: 'Scarcity Analysis' },
  'sub.tech.config': { zh: '团队配置', en: 'Team Config' },
  'sub.tech.presets': { zh: '预设方案', en: 'Preset Plans' },
  'sub.tech.manual': { zh: '手动选型', en: 'Manual Selection' },
  'sub.tech.result': { zh: '评估结果', en: 'Evaluation' },
  'sub.tech.roles': { zh: '团队分工', en: 'Team Roles' },
  'sub.tech.timeline': { zh: '开发时间线', en: 'Timeline' },
  'sub.dev.upload': { zh: '文件上传', en: 'File Upload' },
  'sub.dev.scan': { zh: '扫描结果', en: 'Scan Results' },
  'sub.demo.git': { zh: 'Git教程', en: 'Git Tutorial' },
  'sub.demo.detect': { zh: '项目检测', en: 'Detection' },
  'sub.demo.deploy': { zh: '部署方案', en: 'Deployment' },
  'sub.pitch.info': { zh: '项目信息', en: 'Project Info' },
  'sub.pitch.pitch': { zh: 'Pitch演讲稿', en: 'Pitch Script' },
  'sub.pitch.review': { zh: '模拟评审', en: 'AI Review' },

  // ==================== 阶段1: 选题评审 ====================
  'topic.moduleTitle': { zh: '选题评审与查重', en: 'Topic Review & Plagiarism Check' },
  'topic.moduleSubtitle': { zh: '搜索相似项目，分析稀缺度，找到最有价值的方向', en: 'Search similar projects, analyze scarcity, find the most valuable direction' },
  'topic.scarcityIndex': { zh: '稀缺指数', en: 'Scarcity Index' },
  'topic.inputLabel': { zh: '📝 描述你的项目想法', en: '📝 Describe Your Project Idea' },
  'topic.charCount': { zh: '字', en: 'chars' },
  'topic.searchBtn': { zh: '搜索相似项目', en: 'Search Similar Projects' },
  'topic.placeholder': {
    zh: '详细描述你的项目想法，越具体搜索越精准：\n\n1. 要解决什么问题？（痛点场景）\n2. 核心功能是什么？（主要能力）\n3. 目标用户是谁？（使用人群）\n4. 用了什么技术？（技术方案）\n\n例如：一个基于AI的老年人用药提醒应用，通过语音识别理解老人的自然语言指令，自动生成用药计划，并包含适老化的简洁界面和无障碍设计。',
    en: 'Describe your project idea in detail. The more specific, the more accurate the search:\n\n1. What problem are you solving? (Pain point)\n2. What is the core feature? (Main capability)\n3. Who are the target users? (User group)\n4. What technology are you using? (Tech stack)\n\nExample: An AI-powered medication reminder app for elderly users that uses speech recognition to understand natural language commands, auto-generates medication schedules, and includes an accessible interface with large fonts.'
  },
  'topic.warn.minLength': { zh: '请输入至少10个字的项目描述', en: 'Please enter at least 10 characters of project description' },
  'topic.loading': { zh: '正在多渠道搜索相似项目...', en: 'Searching across multiple channels...' },
  'topic.success': { zh: '搜索完成！点击「稀缺度分析」查看详细评分', en: 'Search complete! Click "Scarcity Analysis" for detailed scoring' },

  // 搜索结果
  'search.title': { zh: '🔍 多渠道相似项目搜索结果', en: '🔍 Multi-Channel Search Results' },
  'search.noResult': { zh: '该渠道未搜索到相关结果', en: 'No results found on this channel' },
  'search.totalResults': { zh: '总结果', en: 'Total' },
  'search.matched': { zh: '命中相关', en: 'Matched' },
  'search.hitRate': { zh: '命中百分比', en: 'Hit Rate' },
  'search.noDesc': { zh: '暂无描述', en: 'No description' },
  'search.expand': { zh: '展开 ▼', en: 'Expand ▼' },
  'search.collapse': { zh: '折叠 ▲', en: 'Collapse ▲' },
  'search.updatedAt': { zh: '更新于', en: 'Updated' },
  'search.hit': { zh: '✅ 命中', en: '✅ Hit' },
  'search.miss': { zh: '⚪ 不相关', en: '⚪ Miss' },
  'search.expandRemaining': { zh: '展开剩余', en: 'Show' },
  'search.collapseAll': { zh: '折叠结果', en: 'Collapse' },
  'search.results': { zh: '条结果', en: 'results' },
  'search.networkLimited': { zh: '网络受限', en: 'Limited' },
  'search.noResults': { zh: '无结果', en: 'No results' },

  // 分析结果
  'analysis.searchScarcity': { zh: '📈 搜索稀缺度分析', en: '📈 Search Scarcity Analysis' },
  'analysis.githubTotal': { zh: 'GitHub 仓库总数', en: 'GitHub Repos Total' },
  'analysis.relatedHits': { zh: '相关命中', en: 'Related Hits' },
  'analysis.hitPercentage': { zh: '命中百分比', en: 'Hit Percentage' },
  'analysis.scarcityScore': { zh: '稀缺度评分', en: 'Scarcity Score' },
  'analysis.originality': { zh: '原创性', en: 'Originality' },
  'analysis.scarcityBased': { zh: '稀缺度（基于搜索结果）', en: 'Scarcity (Search-based)' },
  'analysis.meaningfulness': { zh: '意义感', en: 'Meaningfulness' },
  'analysis.overallScarcity': { zh: '综合稀缺指数', en: 'Overall Scarcity Index' },
  'analysis.multiScore': { zh: '📊 多维度评分', en: '📊 Multi-Dimensional Score' },
  'analysis.plagiarism': { zh: '🔍 查重结果 - 相似项目检测', en: '🔍 Plagiarism - Similar Project Detection' },
  'analysis.boosters': { zh: '✨ 加分因素检测', en: '✨ Bonus Factors' },
  'analysis.differentiation': { zh: '🎯 差异化策略推荐', en: '🎯 Differentiation Strategy' },

  // 判定文案
  'verdict.blue': { zh: '蓝海项目！这个方向稀缺度高，社会价值显著，有很大机会脱颖而出。', en: 'Blue Ocean! High scarcity with significant social value. Great opportunity to stand out.' },
  'verdict.yellow': { zh: '黄海项目。方向有一定竞争，但通过差异化策略可以脱颖而出。', en: 'Yellow Ocean. Moderate competition, but differentiation strategies can help you stand out.' },
  'verdict.red': { zh: '红海项目。这个方向已有大量同类项目，需要找到独特切入点。', en: 'Red Ocean. Many similar projects exist. You need a unique angle.' },

  // 稀缺度依据
  'scarcity.none': { zh: '未搜索到任何同类项目，极度稀缺', en: 'No similar projects found, extremely scarce' },
  'scarcity.veryLow': { zh: '仅找到', en: 'Only' },
  'scarcity.repos': { zh: '个相关仓库，属于极度稀缺方向', en: 'related repos found, extremely scarce direction' },
  'scarcity.low': { zh: '个相关仓库，稀缺度较高', en: 'related repos found, high scarcity' },
  'scarcity.medium': { zh: '个相关仓库，竞争适中', en: 'related repos found, moderate competition' },
  'scarcity.high': { zh: '个相关仓库，方向较常见', en: 'related repos found, common direction' },
  'scarcity.veryHigh': { zh: '个相关仓库，方向非常常见', en: 'related repos found, very common direction' },
  'scarcity.over': { zh: '找到超过', en: 'Found over' },

  // 社媒需求
  'socialDemand.title': { zh: '社媒需求发现', en: 'Social Demand Discovery' },
  'socialDemand.strong': { zh: '强需求', en: 'Strong Demand' },
  'socialDemand.medium': { zh: '中等需求', en: 'Medium Demand' },
  'socialDemand.weak': { zh: '需求待验证', en: 'Unverified Demand' },
  'socialDemand.false': { zh: '伪需求', en: 'False Demand' },
  'socialDemand.strongDesc': { zh: '发现多个真实用户需求表达，社会价值显著', en: 'Multiple real user demand signals found, significant social value' },
  'socialDemand.mediumDesc': { zh: '发现部分用户需求讨论', en: 'Some user demand discussions found' },
  'socialDemand.weakDesc': { zh: '未找到明确的需求表达，建议进一步调研', en: 'No clear demand signals found, further research recommended' },
  'socialDemand.falseDesc': { zh: '用户认为现有方案已够用，需重新考量', en: 'Users find existing solutions sufficient, reconsider needed' },

  // 海洋标签
  'ocean.red': { zh: '红海', en: 'Red Ocean' },
  'ocean.yellow': { zh: '黄海', en: 'Yellow Ocean' },
  'ocean.blue': { zh: '蓝海', en: 'Blue Ocean' },

  // 元数据标签
  'meta.scarcity': { zh: '稀缺度:', en: 'Scarcity:' },
  'meta.meaningfulness': { zh: '意义感:', en: 'Meaningfulness:' },
  'meta.matchRate': { zh: '匹配度:', en: 'Match Rate:' },

  // 加分类型
  'booster.social': { zh: '社会价值', en: 'Social Value' },
  'booster.tech': { zh: '技术亮点', en: 'Tech Highlight' },
  'booster.domain': { zh: '领域专精', en: 'Domain Expertise' },

  // 空提示
  'empty.patterns': { zh: '未检测到与常见模式的匹配，你的项目方向可能比较独特！', en: 'No common pattern matches detected. Your project direction may be unique!' },
  'empty.boosters': { zh: '未检测到加分因素。考虑加入无障碍、可持续发展、适老化等元素来提升项目价值。', en: 'No bonus factors detected. Consider adding accessibility, sustainability, or elderly-friendly features.' },
  'empty.differentiation': { zh: '你的项目方向较为独特，暂无特定差异化策略推荐。继续保持创新！', en: 'Your project direction is relatively unique. No specific differentiation strategy needed. Keep innovating!' },

  // ==================== 阶段2: 技术选型 ====================
  'tech.moduleTitle': { zh: '技术选型与分工推荐', en: 'Tech Selection & Team Roles' },
  'tech.moduleSubtitle': { zh: '根据团队规模和时间，推荐技术栈与任务分工', en: 'Recommend tech stack and task division based on team size and time' },
  'tech.fitScore': { zh: '适配分数', en: 'Fit Score' },
  'tech.duration': { zh: '⏱️ 参赛时长', en: '⏱️ Duration' },
  'tech.24h': { zh: '24 小时', en: '24 hours' },
  'tech.48h': { zh: '48 小时', en: '48 hours' },
  'tech.72h': { zh: '72 小时（3天）', en: '72 hours (3 days)' },
  'tech.7d': { zh: '7 天', en: '7 days' },
  'tech.teamSize': { zh: '👥 团队规模', en: '👥 Team Size' },
  'tech.1person': { zh: '1 人（个人参赛）', en: '1 person (solo)' },
  'tech.2people': { zh: '2 人', en: '2 people' },
  'tech.3people': { zh: '3 人', en: '3 people' },
  'tech.4people': { zh: '4 人', en: '4 people' },
  'tech.5plus': { zh: '5 人及以上', en: '5+ people' },
  'tech.experience': { zh: '📊 团队经验水平', en: '📊 Experience Level' },
  'tech.beginner': { zh: '0基础 / 初学者', en: 'Beginner' },
  'tech.intermediate': { zh: '有一定开发经验', en: 'Intermediate' },
  'tech.expert': { zh: '经验丰富', en: 'Experienced' },
  'tech.presets': { zh: '💡 快速选型方案（点击一键应用）', en: '💡 Quick Preset Plans (Click to apply)' },
  'tech.manualSelect': { zh: '或手动选择技术', en: 'Or manually select technologies' },
  'tech.complexity': { zh: '复杂度评估', en: 'Complexity' },
  'tech.timeFeasibility': { zh: '时间可行性', en: 'Time Feasibility' },
  'tech.hackFit': { zh: '黑客松适配度', en: 'Hackathon Fit' },
  'tech.riskReport': { zh: '⚠️ 风险报告', en: '⚠️ Risk Report' },
  'tech.teamDivision': { zh: '👥 团队分工推荐', en: '👥 Team Division' },
  'tech.timeline': { zh: '📅 开发时间线', en: '📅 Development Timeline' },

  // 评估结果
  'eval.low': { zh: '低', en: 'Low' },
  'eval.medium': { zh: '中', en: 'Medium' },
  'eval.high': { zh: '高', en: 'High' },
  'eval.totalComplexity': { zh: '总复杂度:', en: 'Total complexity:' },
  'eval.average': { zh: '平均:', en: 'Average:' },
  'eval.setupTime': { zh: '配置时间:', en: 'Setup time:' },
  'eval.feasible': { zh: '可行', en: 'Feasible' },
  'eval.risky': { zh: '有风险', en: 'Risky' },
  'eval.infeasible': { zh: '不可行', en: 'Infeasible' },
  'eval.adjustedComplexity': { zh: '调整后复杂度:', en: 'Adjusted complexity:' },
  'eval.excellent': { zh: '极佳', en: 'Excellent' },
  'eval.average2': { zh: '一般', en: 'Average' },
  'eval.poor': { zh: '不佳', en: 'Poor' },
  'eval.avgFit': { zh: '平均适配:', en: 'Avg fit:' },
  'eval.techsSelected': { zh: '项技术已选', en: 'technologies selected' },

  // 成本分析
  'cost.title': { zh: '💰 成本分析', en: '💰 Cost Analysis' },
  'cost.matched': { zh: '当前选型完全匹配', en: 'Current selection matches' },
  'cost.totalCost': { zh: '预估总成本:', en: 'Estimated total cost:' },
  'cost.pros': { zh: '✅ 优势', en: '✅ Pros' },
  'cost.cons': { zh: '⚠️ 注意', en: '⚠️ Cons' },
  'cost.freeAll': { zh: '🎉 当前选型完全免费！所有技术都有免费额度可用。', en: '🎉 Current selection is completely free! All technologies have free tiers.' },
  'cost.aiTip': { zh: '💡 AI API费用提示：使用GPT-4o-mini等经济模型，设置用量上限，黑客松期间费用通常在$5-20以内', en: '💡 AI API tip: Use GPT-4o-mini and set usage limits. During hackathons, costs are typically under $5-20' },
  'cost.compare': { zh: '💡 想看看预设方案？点击上方方案卡片可以一键切换到推荐选型', en: '💡 Want preset plans? Click the cards above to switch to recommended selections' },

  // ==================== 阶段3: 代码扫描 ====================
  'code.moduleTitle': { zh: '代码仓库扫描', en: 'Code Repository Scanner' },
  'code.moduleSubtitle': { zh: '扫描本地代码，检测硬编码密钥、.gitignore配置和代码质量问题', en: 'Scan local code for hardcoded secrets, .gitignore config, and code quality issues' },
  'code.securityScore': { zh: '安全评分', en: 'Security Score' },
  'code.intro': { zh: '上传你的项目文件或整个代码仓库，系统将自动扫描：', en: 'Upload your project files or entire repository. The system will automatically scan:' },
  'code.introDetail': { zh: '· 🔑 硬编码的API密钥、密码和Token\n· 📋 .gitignore 配置是否完善\n· ✨ 代码质量问题（console.log、debugger等）\n· 📄 敏感文件检测（.env、密钥文件等）', en: '· 🔑 Hardcoded API keys, passwords and tokens\n· 📋 .gitignore configuration completeness\n· ✨ Code quality issues (console.log, debugger, etc.)\n· 📄 Sensitive file detection (.env, key files, etc.)' },
  'code.dropZone': { zh: '拖拽文件夹到此处，或点击选择项目文件夹', en: 'Drag a folder here, or click to select a project folder' },
  'code.dropHint': { zh: '选择整个项目文件夹，自动递归扫描所有 .js .ts .py .env .gitignore .json 等文件', en: 'Select the entire project folder. Auto-recursively scans .js .ts .py .env .gitignore .json files' },
  'code.scannedFiles': { zh: '📂 已扫描文件', en: '📂 Scanned Files' },
  'code.clear': { zh: '清空', en: 'Clear' },
  'code.secrets': { zh: '🔑 硬编码密钥检测', en: '🔑 Hardcoded Secrets Detection' },
  'code.gitignore': { zh: '📋 .gitignore 配置分析', en: '📋 .gitignore Analysis' },
  'code.quality': { zh: '✨ 代码质量检查', en: '✨ Code Quality Check' },
  'code.sensitive': { zh: '📄 敏感文件检测', en: '📄 Sensitive File Detection' },

  // 扫描摘要
  'scan.critical': { zh: '严重问题', en: 'Critical' },
  'scan.highRisk': { zh: '高危问题', en: 'High Risk' },
  'scan.mediumRisk': { zh: '中危问题', en: 'Medium Risk' },
  'scan.lowRisk': { zh: '低危问题', en: 'Low Risk' },
  'scan.gitignoreMissing': { zh: 'Gitignore缺失项', en: 'Missing .gitignore Items' },
  'scan.missing': { zh: '缺失', en: 'Missing' },
  'scan.rootDir': { zh: '(根目录)', en: '(root)' },
  'scan.noSecrets': { zh: '✅ 未检测到硬编码密钥', en: '✅ No hardcoded secrets detected' },
  'scan.noSensitiveFiles': { zh: '✅ 未检测到敏感文件', en: '✅ No sensitive files detected' },
  'scan.goodQuality': { zh: '✅ 代码质量良好，未发现问题', en: '✅ Code quality is good, no issues found' },
  'scan.gitignoreMissingFile': { zh: '.gitignore 文件缺失', en: '.gitignore file missing' },
  'scan.gitignoreMissingDesc': { zh: '项目根目录未找到 .gitignore 文件！强烈建议创建，防止敏感文件和构建产物被提交到仓库。', en: 'No .gitignore file found in project root! Strongly recommended to create one to prevent sensitive files and build artifacts from being committed.' },
  'scan.gitignoreSuggest': { zh: '建议添加以下内容到 .gitignore：', en: 'Suggested .gitignore additions:' },
  'scan.gitignoreExists': { zh: '✅ 已检测', en: '✅ Detected' },
  'scan.gitignorePresent': { zh: '.gitignore 文件存在', en: '.gitignore file exists' },
  'scan.missingKey': { zh: '缺少:', en: 'Missing:' },
  'scan.suggestAdd': { zh: '建议添加:', en: 'Suggested:' },
  'scan.optionalOptimize': { zh: '可选优化项：', en: 'Optional optimizations:' },

  // 修复建议
  'fix.title': { zh: '🔧 修复建议', en: '🔧 Fix Suggestions' },
  'fix.secrets': { zh: '立即更换所有泄露的API密钥！泄露的密钥可能已被公开，必须到对应平台重新生成。', en: 'Replace all leaked API keys immediately! Leaked keys may be public. Regenerate them on the respective platforms.' },
  'fix.gitignore': { zh: '创建/完善 .gitignore 文件，确保 .env、*.pem、*.key 等敏感文件不被提交。', en: 'Create/improve .gitignore to ensure .env, *.pem, *.key files are not committed.' },
  'fix.sensitiveFiles': { zh: '从仓库中移除敏感文件（.env、credentials.json等），使用 .env.example 模板代替。', en: 'Remove sensitive files (.env, credentials.json) from repo. Use .env.example template instead.' },
  'fix.envVars': { zh: '将所有硬编码的密钥和密码迁移到**环境变量**中，使用 dotenv 或 os.environ 读取。', en: 'Migrate all hardcoded secrets to **environment variables**. Use dotenv or os.environ.' },
  'fix.debugger': { zh: '移除所有 debugger 语句和 alert() 调用。', en: 'Remove all debugger statements and alert() calls.' },
  'fix.cleanup': { zh: '清理 console.log、print() 等调试输出和 TODO 注释。', en: 'Clean up console.log, print() debug output and TODO comments.' },
  'fix.gitignoreRules': { zh: '在 .gitignore 中添加推荐的忽略规则（.vscode、*.log等）。', en: 'Add recommended ignore rules to .gitignore (.vscode, *.log, etc.).' },

  // Toast
  'toast.noFiles': { zh: '未找到可扫描的文件，请上传包含 .js .ts .py .env .gitignore 等文件的项目文件夹', en: 'No scannable files found. Please upload a project folder with .js .ts .py .env .gitignore files' },
  'toast.scanning': { zh: '正在扫描', en: 'Scanning' },
  'toast.files': { zh: '个文件...', en: 'files...' },
  'toast.scanDone': { zh: '扫描完成！发现', en: 'Scan complete! Found' },
  'toast.issues': { zh: '个问题', en: 'issues' },

  // ==================== 阶段4: Demo辅助 ====================
  'demo.moduleTitle': { zh: 'Demo部署辅助', en: 'Demo Deployment Helper' },
  'demo.moduleSubtitle': { zh: 'Git版本控制、自动检测项目类型、推荐最佳部署方案', en: 'Git version control, auto project type detection, deployment recommendations' },
  'demo.gitTitle': { zh: '📦 Git版本控制 & GitHub上传', en: '📦 Git Version Control & GitHub Upload' },
  'demo.gitDesc': { zh: '黑客松必备：用Git管理代码版本，上传到GitHub方便评委查看和部署', en: 'Essential for hackathons: Use Git for version control, upload to GitHub for judges to view' },
  'demo.detectTitle': { zh: '🔎 项目类型检测', en: '🔎 Project Type Detection' },
  'demo.uploadPackage': { zh: '上传 package.json 或选择项目类型', en: 'Upload package.json or select project type' },
  'demo.uploadZone': { zh: '📄 上传 package.json / requirements.txt', en: '📄 Upload package.json / requirements.txt' },
  'demo.or': { zh: '或', en: 'or' },
  'demo.selectType': { zh: '手动选择项目类型...', en: 'Select project type...' },
  'demo.deployTitle': { zh: '🚀 推荐部署平台', en: '🚀 Recommended Deploy Platforms' },
  'demo.stepsTitle': { zh: '📝 部署步骤', en: '📝 Deploy Steps' },
  'demo.configTitle': { zh: '⚙️ 部署配置文件', en: '⚙️ Deploy Config' },

  // Git教程
  'git.step1.title': { zh: '安装 Git', en: 'Install Git' },
  'git.step1.desc': { zh: '如果还没有安装Git，从官网下载安装', en: 'If you haven\'t installed Git, download it from the official site' },
  'git.step2.title': { zh: '初始化本地仓库', en: 'Initialize Local Repository' },
  'git.step2.desc': { zh: '在项目根目录下初始化Git仓库', en: 'Initialize a Git repository in your project root' },
  'git.step3.title': { zh: '创建 .gitignore（重要！）', en: 'Create .gitignore (Important!)' },
  'git.step3.desc': { zh: '避免将敏感文件、依赖包等上传到GitHub', en: 'Prevent sensitive files and dependencies from being uploaded to GitHub' },
  'git.step4.title': { zh: '在 GitHub 创建仓库', en: 'Create Repository on GitHub' },
  'git.step4.desc': { zh: '登录GitHub，创建一个新的仓库', en: 'Log in to GitHub and create a new repository' },
  'git.step5.title': { zh: '关联远程仓库并推送', en: 'Link Remote and Push' },
  'git.step5.desc': { zh: '将本地代码推送到GitHub', en: 'Push local code to GitHub' },
  'git.step6.title': { zh: '后续开发中的版本管理', en: 'Ongoing Version Management' },
  'git.step6.desc': { zh: '每次完成一个功能就提交一次，保持提交历史清晰', en: 'Commit each completed feature to keep history clean' },

  // 部署
  'deploy.recommended': { zh: '⭐ 推荐', en: '⭐ Recommended' },
  'deploy.viewSteps': { zh: '查看部署步骤', en: 'View Steps' },
  'deploy.generated': { zh: '部署方案已生成！', en: 'Deployment plan generated!' },
  'deploy.prereq': { zh: '📋 前置条件:', en: '📋 Prerequisites:' },
  'deploy.tips': { zh: '💡 小贴士', en: '💡 Tips' },
  'deploy.copy': { zh: '📋 复制', en: '📋 Copy' },
  'deploy.copied': { zh: '配置已复制到剪贴板', en: 'Config copied to clipboard' },
  'deploy.noConfig': { zh: '该平台无需额外配置文件，按照上方步骤操作即可。', en: 'No extra config needed. Follow the steps above.' },
  'deploy.copiedCmd': { zh: '命令已复制', en: 'Command copied' },

  // 项目检测
  'detect.detected': { zh: '检测到项目类型:', en: 'Detected project type:' },
  'detect.failed': { zh: '无法自动检测项目类型，请手动选择', en: 'Cannot auto-detect project type. Please select manually.' },

  // ==================== 阶段5: Pitch & 评审 ====================
  'pitch.moduleTitle': { zh: 'Pitch生成与模拟评审', en: 'Pitch Generator & AI Review' },
  'pitch.moduleSubtitle': { zh: '生成演讲稿结构，多Agent模拟评审反馈', en: 'Generate pitch structure, multi-agent AI review feedback' },
  'pitch.overallScore': { zh: '综合评分', en: 'Overall Score' },
  'pitch.infoTitle': { zh: '📝 项目信息', en: '📝 Project Info' },
  'pitch.projectName': { zh: '项目名称', en: 'Project Name' },
  'pitch.oneLiner': { zh: '一句话描述', en: 'One-liner' },
  'pitch.description': { zh: '项目描述（问题+解决方案+技术）', en: 'Description (Problem + Solution + Tech)' },
  'pitch.generateBtn': { zh: '生成 Pitch 演讲稿', en: 'Generate Pitch' },
  'pitch.resultTitle': { zh: '🎤 Pitch 演讲稿结构', en: '🎤 Pitch Script Structure' },
  'pitch.exportBtn': { zh: '📋 复制 Pitch 到剪贴板', en: '📋 Copy Pitch to Clipboard' },
  'pitch.reviewTitle': { zh: '🎯 模拟Agent评审', en: '🎯 Simulated AI Review' },
  'pitch.reviewIntro': { zh: '5个AI评审员将根据你输入的项目信息，自动从5个维度评估你的项目并给出具体反馈。', en: '5 AI reviewers will evaluate your project from 5 dimensions based on your input.' },
  'pitch.reviewBtn': { zh: '🤖 开始AI模拟评审', en: '🤖 Start AI Review' },
  'pitch.summaryTitle': { zh: '📊 评审结果总览', en: '📊 Review Summary' },
  'pitch.dimensionsTitle': { zh: '🏆 各维度评分', en: '🏆 Dimension Scores' },
  'pitch.improvementTitle': { zh: '📋 优先级改进清单', en: '📋 Priority Improvements' },

  // Pitch 段落
  'pitch.hook': { zh: '开场Hook', en: 'Opening Hook' },
  'pitch.problem': { zh: '问题陈述', en: 'Problem Statement' },
  'pitch.solution': { zh: '解决方案', en: 'Solution' },
  'pitch.demo': { zh: '核心Demo', en: 'Core Demo' },
  'pitch.techHighlight': { zh: '技术亮点', en: 'Tech Highlights' },
  'pitch.impact': { zh: '影响力', en: 'Impact' },
  'pitch.future': { zh: '未来展望', en: 'Future Outlook' },

  // Toast - Pitch
  'pitch.warn.empty': { zh: '请填写项目名称和一句话描述', en: 'Please fill in project name and one-liner' },
  'pitch.success.generated': { zh: 'Pitch 演讲稿已生成！', en: 'Pitch script generated!' },
  'pitch.warn.noPitch': { zh: '请先生成 Pitch', en: 'Please generate a pitch first' },
  'pitch.success.copied': { zh: 'Pitch 已复制到剪贴板！', en: 'Pitch copied to clipboard!' },
  'pitch.success.reviewed': { zh: '5位AI评审员已完成模拟评审！查看下方详细反馈', en: '5 AI reviewers completed! See detailed feedback below' },
  'pitch.warn.noReview': { zh: '请先完成评审打分', en: 'Please complete the review scoring first' },
  'pitch.success.scored': { zh: '评审完成！综合得分:', en: 'Review complete! Overall score:' },
  'pitch.scoreAdjusted': { zh: '评分已调整', en: 'Score adjusted' },
  'pitch.aiScore': { zh: 'AI评分:', en: 'AI Score:' },

  // ==================== 导出报告 ====================
  'report.title': { zh: '# HackCheck 黑客松全流程报告', en: '# Hackathon Full-Process Report' },
  'report.generated': { zh: '生成时间:', en: 'Generated:' },
  'report.topic': { zh: '## 1. 选题评审', en: '## 1. Topic Review' },
  'report.tech': { zh: '## 2. 技术选型', en: '## 2. Tech Selection' },
  'report.code': { zh: '## 3. 代码扫描', en: '## 3. Code Scan' },
  'report.demo': { zh: '## 4. Demo辅助', en: '## 4. Demo Helper' },
  'report.pitch': { zh: '## 5. Pitch & 评审', en: '## 5. Pitch & Review' },
  'report.notCompleted': { zh: '未完成', en: 'Not completed' },
  'report.exported': { zh: '报告已导出！', en: 'Report exported!' },

  // ==================== 语言切换 ====================
  'lang.switch': { zh: 'EN', en: '中' },
  'lang.switchTitle': { zh: '切换到英文', en: 'Switch to Chinese' },
};

// ==================== 核心函数 ====================

let _currentLang = 'zh';

function getLang() {
  return _currentLang;
}

function setLang(lang) {
  _currentLang = lang;
  try { localStorage.setItem('hackcheck_lang', lang); } catch(e) {}
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  applyI18n();
}

function t(key) {
  const entry = I18N[key];
  if (!entry) {
    console.warn(`[i18n] Missing key: ${key}`);
    return key;
  }
  return entry[_currentLang] || entry.zh || key;
}

// 带 params 的翻译：t('key', { count: 5 })
function tf(key, params) {
  let str = t(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return str;
}

// 初始化语言
function initI18n() {
  try {
    _currentLang = localStorage.getItem('hackcheck_lang') || 'zh';
  } catch(e) {
    _currentLang = 'zh';
  }
  document.documentElement.lang = _currentLang === 'zh' ? 'zh-CN' : 'en';
  applyI18n();
}

// 应用所有 data-i18n 标签到 DOM
function applyI18n() {
  // 文本内容
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });

  // html 内容（含换行等）
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  // 更新语言切换按钮
  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.textContent = t('lang.switch');
    langBtn.title = t('lang.switchTitle');
  }

  // 更新页面标题
  document.title = t('app.title') + ' - HackCheck';

  // 更新侧边栏模块导航（动态渲染的）
  if (typeof updateNavLabels === 'function') {
    updateNavLabels();
  }
}

// 切换语言
function toggleLang() {
  setLang(_currentLang === 'zh' ? 'en' : 'zh');
}

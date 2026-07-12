# Common Project Patterns Library

> Source: Migrated from `js/data.js` TOPIC_DATA.commonPatterns
> Usage: AI matches user's description against these patterns to detect "reskin" projects and recommend differentiation strategies.
> Scoring: Each pattern has originality_penalty (1-10), scarcity (1-5), meaning (1-5), ocean_type (red/yellow/blue).

## Pattern Matching Guide

For each pattern, check how many of its `keywords` appear in the user's description. If match ratio > 0, the pattern is matched. Sort by match ratio descending.

## Patterns

### 1. 待办事项/任务管理应用 (todo_app)
- **Keywords**: todo, task, checklist, 待办, 任务管理, to-do, reminder, 日程
- **Frequency**: 极高 | **Originality Penalty**: 8 | **Scarcity**: 1/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 待办应用是最常见的黑客松项目之一。如果要做，需要找到独特的切入点。
- **Differentiation strategies**:
  1. 结合AI预测用户最可能忘记的任务并主动提醒
  2. 从日历/邮件/聊天记录中自动提取待办，零手动输入
  3. 游戏化设计：完成任务获得经验值，与好友组队挑战
  4. 情绪感知：根据用户压力水平自动调整任务量

### 2. 天气查询应用 (weather_app)
- **Keywords**: weather, 天气, forecast, 气象, temperature
- **Frequency**: 极高 | **Originality Penalty**: 8 | **Scarcity**: 1/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 天气应用过于常见。建议结合其他场景。
- **Differentiation strategies**:
  1. 为户外运动爱好者提供精确到小时的微气候预测
  2. 结合空气质量+花粉+UV指数的健康出行决策引擎
  3. 为农民提供基于天气的种植/灌溉决策支持系统
  4. 气候变化数据可视化：展示本地30年气温变化趋势

### 3. AI套壳聊天机器人 (chatbot_wrapper)
- **Keywords**: chatbot, 聊天机器人, chat with ai, gpt wrapper, ai assistant, 对话
- **Frequency**: 极高 | **Originality Penalty**: 9 | **Scarcity**: 1/5 | **Meaning**: 1/5 | **Ocean**: Red
- **Advice**: 直接包装GPT API的聊天机器人是最严重的"换皮"项目。
- **Differentiation strategies**:
  1. 不要做通用聊天，选择极度垂直的领域
  2. 加入RAG知识库，让AI基于用户上传的专业文档回答
  3. 多Agent协作：不同角色Agent讨论后给出综合建议
  4. 结合实时数据源做情境感知对话

### 4. 计算器/转换工具 (calculator)
- **Keywords**: calculator, 计算器, converter, 转换, unit
- **Frequency**: 高 | **Originality Penalty**: 7 | **Scarcity**: 1/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 基础计算工具缺乏创新。
- **Differentiation strategies**:
  1. 自然语言输入计算
  2. 可视化推导过程
  3. 碳足迹计算器
  4. 多场景比较：买房vs租房长期财务模拟

### 5. 博客/CMS系统 (blog_cms)
- **Keywords**: blog, cms, 博客, 内容管理, article, post
- **Frequency**: 高 | **Originality Penalty**: 6 | **Scarcity**: 1/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 博客系统在黑客松中缺乏竞争力。
- **Differentiation strategies**:
  1. AI辅助写作
  2. 知识图谱博客
  3. 语音博客
  4. 协作式故事创作

### 6. 简单电商/购物应用 (ecommerce)
- **Keywords**: shop, store, ecommerce, 电商, 购物, 商品, cart, shopping
- **Frequency**: 高 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 电商类项目需要独特功能才能脱颖而出。
- **Differentiation strategies**:
  1. AR试穿/试用
  2. 碳标签电商
  3. AI议价助手
  4. 临期食品救星

### 7. 个人作品集/简历网站 (portfolio)
- **Keywords**: portfolio, resume, 作品集, 简历, cv, personal website
- **Frequency**: 中 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 作品集网站缺乏竞赛价值。
- **Differentiation strategies**:
  1. AI面试官
  2. 技能树可视化
  3. 可交互简历
  4. AI简历优化

### 8. 社交媒体克隆 (social_clone)
- **Keywords**: social, 社交媒体, feed, twitter clone, instagram clone, 朋友圈, 社交
- **Frequency**: 中 | **Originality Penalty**: 6 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 社交平台克隆缺乏创新。
- **Differentiation strategies**:
  1. 匿名技术问答
  2. 学习伙伴匹配
  3. 技能交换社交
  4. 深度讨论社区

### 9. 笔记应用 (note_app)
- **Keywords**: note, 笔记, notebook, memo, 记事本
- **Frequency**: 高 | **Originality Penalty**: 5 | **Scarcity**: 1/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 笔记应用竞争激烈。
- **Differentiation strategies**:
  1. AI笔记助手
  2. 语音笔记
  3. 知识连接
  4. 场景笔记

### 10. 番茄钟/专注计时器 (pomodoro)
- **Keywords**: pomodoro, 番茄钟, focus timer, 专注, 计时器, timer
- **Frequency**: 高 | **Originality Penalty**: 6 | **Scarcity**: 1/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 番茄钟应用泛滥。
- **Differentiation strategies**:
  1. AI自适应专注周期
  2. 环境音生成
  3. 团队专注室
  4. 专注数据分析

### 11. 记账/预算管理应用 (expense_tracker)
- **Keywords**: expense, budget, 记账, 预算, spending, 财务
- **Frequency**: 高 | **Originality Penalty**: 5 | **Scarcity**: 1/5 | **Meaning**: 3/5 | **Ocean**: Red
- **Advice**: 记账应用非常常见。
- **Differentiation strategies**:
  1. AI自动记账
  2. 消费情绪分析
  3. 社交记账
  4. AI财务顾问

### 12. 习惯追踪应用 (habit_tracker)
- **Keywords**: habit, 习惯, streak, habit tracker, 打卡
- **Frequency**: 高 | **Originality Penalty**: 5 | **Scarcity**: 1/5 | **Meaning**: 3/5 | **Ocean**: Red
- **Advice**: 习惯追踪应用很常见。
- **Differentiation strategies**:
  1. AI习惯预测
  2. 社交契约
  3. 习惯连锁反应可视化
  4. 微习惯引擎

### 13. ChatGPT界面克隆 (chat_gpt_clone)
- **Keywords**: chatgpt, chat gpt, ai chat interface, 对话界面
- **Frequency**: 极高 | **Originality Penalty**: 10 | **Scarcity**: 1/5 | **Meaning**: 1/5 | **Ocean**: Red
- **Advice**: 克隆ChatGPT界面是最没有创意的项目。
- **Differentiation strategies**:
  1. 语音优先交互
  2. 多模态对话
  3. 情境感知
  4. 专家模式切换

### 14. 简单图片分类器 (image_classifier)
- **Keywords**: image classification, 图片分类, image recognizer, 猫狗识别
- **Frequency**: 中 | **Originality Penalty**: 6 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 简单的图片分类器是ML教程项目。
- **Differentiation strategies**:
  1. 皮肤病变初筛
  2. 食材识别+菜谱推荐
  3. 垃圾分类助手
  4. 文物识别

### 15. 音乐播放器/推荐 (music_player)
- **Keywords**: music player, 音乐播放, music recommend, 歌单, playlist
- **Frequency**: 中 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 音乐播放器缺乏创新。
- **Differentiation strategies**:
  1. AI场景歌单
  2. 哼唱搜索
  3. 音乐疗愈
  4. 协作歌单

### 16. 翻译应用 (translate_app)
- **Keywords**: translate, 翻译, translator, translation
- **Frequency**: 中 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 3/5 | **Ocean**: Red
- **Advice**: 直接套壳翻译API缺乏创新。
- **Differentiation strategies**:
  1. 实时对话翻译
  2. 方言保护
  3. 文化语境翻译
  4. 医学翻译

### 17. 文本摘要工具 (text_summarizer)
- **Keywords**: summarize, 摘要, summarizer, 总结, tldr
- **Frequency**: 高 | **Originality Penalty**: 6 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: AI摘要工具已经泛滥。
- **Differentiation strategies**:
  1. 会议摘要+行动项
  2. 论文摘要+知识图谱
  3. 多文档对比摘要
  4. 渐进式摘要

### 18. 地图/位置标记应用 (map_location)
- **Keywords**: map, 地图, location, 位置, marker, pin
- **Frequency**: 中 | **Originality Penalty**: 4 | **Scarcity**: 3/5 | **Meaning**: 3/5 | **Ocean**: Yellow
- **Advice**: 地图应用有一定空间。
- **Differentiation strategies**:
  1. 无障碍地图
  2. 社区故事地图
  3. 安全路线推荐
  4. 本地美食探索

### 19. 通用数据看板 (dashboard)
- **Keywords**: dashboard, 仪表盘, 看板, data visualization, 数据可视化
- **Frequency**: 中 | **Originality Penalty**: 4 | **Scarcity**: 3/5 | **Meaning**: 3/5 | **Ocean**: Yellow
- **Advice**: 通用仪表盘需要独特数据源。
- **Differentiation strategies**:
  1. 个人数字足迹看板
  2. 实时城市脉搏
  3. AI数据故事
  4. 情绪天气图

### 20. 落地页/官网生成器 (landing_page)
- **Keywords**: landing page, 落地页, website builder, 官网生成
- **Frequency**: 中 | **Originality Penalty**: 4 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 落地页生成器很常见。
- **Differentiation strategies**:
  1. AI一句话建站
  2. 实时A/B测试
  3. 语音建站
  4. 可交互3D落地页

### 21. 问答/闪卡学习工具 (quiz_flashcard)
- **Keywords**: quiz, flashcard, 闪卡, 答题, 选择题, quizlet
- **Frequency**: 高 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 3/5 | **Ocean**: Red
- **Advice**: 闪卡工具已经很常见。
- **Differentiation strategies**:
  1. AI一键生成闪卡
  2. 自适应难度
  3. 对战学习
  4. 视觉化记忆

### 22. 情感分析工具 (sentiment_analyzer)
- **Keywords**: sentiment, 情感分析, sentiment analysis, 情绪分析
- **Frequency**: 中 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 3/5 | **Ocean**: Red
- **Advice**: 基础情感分析工具很常见。
- **Differentiation strategies**:
  1. 客服对话实时情感监控
  2. 团队情绪温度计
  3. 产品评论深度分析
  4. 心理健康日记

### 23. 二维码扫描器/生成器 (qr_scanner)
- **Keywords**: qr code, 二维码, qr scanner, 扫码
- **Frequency**: 中 | **Originality Penalty**: 6 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 二维码工具过于基础。
- **Differentiation strategies**:
  1. 二维码溯源系统
  2. 动态二维码
  3. 二维码艺术化
  4. 无障碍扫码

### 24. 文件管理器/云盘 (file_manager)
- **Keywords**: file manager, cloud storage, 文件管理, 云盘, drive
- **Frequency**: 中 | **Originality Penalty**: 4 | **Scarcity**: 2/5 | **Meaning**: 2/5 | **Ocean**: Red
- **Advice**: 文件管理类项目需增加AI能力。
- **Differentiation strategies**:
  1. AI语义搜索
  2. 自动知识库
  3. 版本时光机
  4. 智能归档

### 25. 密码管理器 (password_manager)
- **Keywords**: password manager, 密码管理, password vault
- **Frequency**: 中 | **Originality Penalty**: 5 | **Scarcity**: 2/5 | **Meaning**: 3/5 | **Ocean**: Red
- **Advice**: 密码管理器已有成熟竞品。
- **Differentiation strategies**:
  1. 生物识别解锁
  2. AI异常检测
  3. 家庭共享密码库
  4. 无密码认证方案

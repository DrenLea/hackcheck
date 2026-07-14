/**
 * HackCheck - 黑客松全流程辅助器 数据规则库
 * 5大阶段：选题评审 → 技术选型 → 代码扫描 → Demo辅助 → Pitch评审
 */

// ============================================
// 阶段1：选题评审 - 项目查重与稀缺度分析
// ============================================
const TOPIC_DATA = {
  // GitHub 搜索配置（CORS-enabled, 免费API）
  githubSearch: {
    apiUrl: 'https://api.github.com/search/repositories',
    defaultParams: { sort: 'stars', order: 'desc', per_page: 8 }
  },
  devpostSearchUrl: 'https://devpost.com/software/search?query=',
  producthuntSearchUrl: 'https://www.producthunt.com/search?q=',

  // 中文概念 → 英文搜索关键词映射（用于GitHub精准搜索）
  conceptMap: {
    '老年人': ['elderly','senior','aging','older adults'],
    '老人': ['elderly','senior','aging'],
    '适老': ['elderly','accessibility','senior'],
    '用药': ['medication','medicine','pill','prescription'],
    '提醒': ['reminder','alert','notification'],
    '就医': ['medical','healthcare','hospital','doctor'],
    '医疗': ['medical','healthcare','health'],
    '健康': ['health','wellness','medical'],
    '语音': ['voice','speech','audio'],
    '语音识别': ['speech recognition','voice','ASR'],
    '自然语言': ['NLP','natural language','text'],
    'AI': ['AI','artificial intelligence','machine learning'],
    '人工智能': ['AI','artificial intelligence','deep learning'],
    '聊天': ['chat','chatbot','conversation'],
    '机器人': ['bot','robot','assistant'],
    '教育': ['education','learning','teaching','edtech'],
    '学习': ['learning','education','study'],
    '儿童': ['children','kids','child'],
    '学生': ['student','education','school'],
    '购物': ['shopping','ecommerce','commerce','store'],
    '电商': ['ecommerce','commerce','shop','store'],
    '支付': ['payment','stripe','checkout','fintech'],
    '金融': ['finance','fintech','banking','investment'],
    '记账': ['expense','budget','finance','money'],
    '预算': ['budget','finance','money'],
    '天气': ['weather','forecast','meteorology'],
    '地图': ['map','location','geolocation','navigation'],
    '导航': ['navigation','map','direction','route'],
    '社交': ['social','community','network','friend'],
    '笔记': ['note','notebook','memo','knowledge'],
    '日记': ['journal','diary','daily'],
    '任务': ['task','todo','productivity'],
    '待办': ['todo','task','checklist','productivity'],
    '习惯': ['habit','tracker','productivity'],
    '番茄': ['pomodoro','timer','focus','productivity'],
    '专注': ['focus','productivity','timer','concentration'],
    '音乐': ['music','audio','player','playlist'],
    '视频': ['video','stream','media','youtube'],
    '图片': ['image','photo','picture','vision'],
    '翻译': ['translate','translation','language','i18n'],
    '摘要': ['summarize','summary','tldr','NLP'],
    '问答': ['quiz','flashcard','Q&A','study'],
    '闪卡': ['flashcard','quiz','study','memorize'],
    '密码': ['password','vault','security','auth'],
    '安全': ['security','privacy','safe','encryption'],
    '隐私': ['privacy','security','encryption','GDPR'],
    '无障碍': ['accessibility','a11y','disability','inclusive'],
    '残障': ['disability','accessibility','a11y','assistive'],
    '盲人': ['blind','visually impaired','accessibility','screen reader'],
    '聋': ['deaf','hearing','sign language','accessibility'],
    '乡村': ['rural','village','countryside','agriculture'],
    '农业': ['agriculture','farming','crop','agritech'],
    '环境': ['environment','sustainability','green','eco'],
    '环保': ['sustainability','green','eco','recycling','carbon'],
    '碳': ['carbon','climate','sustainability','emission'],
    '回收': ['recycling','waste','sustainability'],
    '灾害': ['disaster','emergency','rescue','alert'],
    '应急': ['emergency','disaster','rescue','response'],
    '心理': ['mental health','psychology','wellness','mindfulness'],
    '情绪': ['emotion','sentiment','mood','mental health'],
    '压力': ['stress','mental health','wellness'],
    '游戏': ['game','gaming','play','entertainment'],
    'AR': ['AR','augmented reality','XR'],
    'VR': ['VR','virtual reality','XR'],
    '物联网': ['IoT','internet of things','sensor','embedded'],
    'IoT': ['IoT','internet of things','sensor'],
    '区块链': ['blockchain','web3','crypto','smart contract'],
    '数据可视化': ['data visualization','dashboard','chart','analytics'],
    '看板': ['dashboard','analytics','visualization','monitor'],
    '日程': ['calendar','schedule','planner'],
    '文件': ['file','storage','cloud','drive'],
    '邮件': ['email','mail','smtp'],
    '短信': ['SMS','message','twilio','notification'],
    '实时': ['real-time','live','websocket','stream'],
    '推荐': ['recommendation','recommend','suggestion','personalize'],
    '分析': ['analytics','analysis','insight','data'],
    '监控': ['monitor','surveillance','track','observe'],
    '预约': ['booking','appointment','reservation','schedule'],
    '排队': ['queue','waiting','line'],
    '物流': ['logistics','delivery','shipping','supply chain'],
    '餐饮': ['restaurant','food','delivery','menu'],
    '美食': ['food','recipe','cooking','restaurant'],
    '菜谱': ['recipe','cooking','food'],
    '旅游': ['travel','trip','tourism','guide'],
    '酒店': ['hotel','booking','reservation'],
    '房产': ['real estate','property','housing','rent'],
    '租房': ['rent','rental','housing','property'],
    '宠物': ['pet','animal','veterinary'],
    '运动': ['fitness','exercise','workout','sport'],
    '健身': ['fitness','workout','exercise','health'],
    '睡眠': ['sleep','rest','health','tracking'],
    '饮食': ['diet','nutrition','food','health'],
    '日历': ['calendar','schedule','event','planner'],
    '简历': ['resume','CV','portfolio','job'],
    '作品集': ['portfolio','resume','showcase'],
    '招聘': ['job','recruitment','hiring','career'],
    '会议': ['meeting','conference','video call'],
    '协作': ['collaboration','team','workspace','productivity'],
    '文档': ['document','doc','wiki','knowledge base'],
    '知识': ['knowledge','wiki','documentation','learning'],
    '搜索': ['search','search engine','query'],
    '客服': ['customer service','support','chatbot','helpdesk'],
    '营销': ['marketing','campaign','growth','SEO'],
    '广告': ['advertising','ads','marketing'],
    '二维码': ['QR code','barcode','scan'],
    '直播': ['livestream','broadcast','live video'],
    '短视频': ['short video','tiktok','clip'],
    '播客': ['podcast','audio','RSS'],
    '新闻': ['news','media','feed','journalism'],
    ' weather': ['weather'],
  },

  // 常见项目模式（25+种，含稀缺度/意义感/差异化策略）
  commonPatterns: [
    { id: 'todo_app', pattern: '待办事项/任务管理应用', keywords: ['todo','task','checklist','待办','任务管理','to-do','reminder','日程'], frequency: '极高', originalityPenalty: 8, scarcity: 1, meaning: 2, oceanType: 'red', advice: '待办应用是最常见的黑客松项目之一。如果要做，需要找到独特的切入点。', differentiation: ['结合AI预测用户最可能忘记的任务并主动提醒','从日历/邮件/聊天记录中自动提取待办，零手动输入','游戏化设计：完成任务获得经验值，与好友组队挑战','情绪感知：根据用户压力水平自动调整任务量'] },
    { id: 'weather_app', pattern: '天气查询应用', keywords: ['weather','天气','forecast','气象','temperature'], frequency: '极高', originalityPenalty: 8, scarcity: 1, meaning: 2, oceanType: 'red', advice: '天气应用过于常见。建议结合其他场景。', differentiation: ['为户外运动爱好者提供精确到小时的微气候预测','结合空气质量+花粉+UV指数的健康出行决策引擎','为农民提供基于天气的种植/灌溉决策支持系统','气候变化数据可视化：展示本地30年气温变化趋势'] },
    { id: 'chatbot_wrapper', pattern: 'AI套壳聊天机器人', keywords: ['chatbot','聊天机器人','chat with ai','gpt wrapper','ai assistant','对话'], frequency: '极高', originalityPenalty: 9, scarcity: 1, meaning: 1, oceanType: 'red', advice: '直接包装GPT API的聊天机器人是最严重的"换皮"项目。', differentiation: ['不要做通用聊天，选择极度垂直的领域','加入RAG知识库，让AI基于用户上传的专业文档回答','多Agent协作：不同角色Agent讨论后给出综合建议','结合实时数据源做情境感知对话'] },
    { id: 'calculator', pattern: '计算器/转换工具', keywords: ['calculator','计算器','converter','转换','unit'], frequency: '高', originalityPenalty: 7, scarcity: 1, meaning: 2, oceanType: 'red', advice: '基础计算工具缺乏创新。', differentiation: ['自然语言输入计算','可视化推导过程','碳足迹计算器','多场景比较：买房vs租房长期财务模拟'] },
    { id: 'blog_cms', pattern: '博客/CMS系统', keywords: ['blog','cms','博客','内容管理','article','post'], frequency: '高', originalityPenalty: 6, scarcity: 1, meaning: 2, oceanType: 'red', advice: '博客系统在黑客松中缺乏竞争力。', differentiation: ['AI辅助写作','知识图谱博客','语音博客','协作式故事创作'] },
    { id: 'ecommerce', pattern: '简单电商/购物应用', keywords: ['shop','store','ecommerce','电商','购物','商品','cart','shopping'], frequency: '高', originalityPenalty: 5, scarcity: 2, meaning: 2, oceanType: 'red', advice: '电商类项目需要独特功能才能脱颖而出。', differentiation: ['AR试穿/试用','碳标签电商','AI议价助手','临期食品救星'] },
    { id: 'portfolio', pattern: '个人作品集/简历网站', keywords: ['portfolio','resume','作品集','简历','cv','personal website'], frequency: '中', originalityPenalty: 5, scarcity: 2, meaning: 2, oceanType: 'red', advice: '作品集网站缺乏竞赛价值。', differentiation: ['AI面试官','技能树可视化','可交互简历','AI简历优化'] },
    { id: 'social_clone', pattern: '社交媒体克隆', keywords: ['social','社交媒体','feed','twitter clone','instagram clone','朋友圈','社交'], frequency: '中', originalityPenalty: 6, scarcity: 2, meaning: 2, oceanType: 'red', advice: '社交平台克隆缺乏创新。', differentiation: ['匿名技术问答','学习伙伴匹配','技能交换社交','深度讨论社区'] },
    { id: 'note_app', pattern: '笔记应用', keywords: ['note','笔记','notebook','memo','记事本'], frequency: '高', originalityPenalty: 5, scarcity: 1, meaning: 2, oceanType: 'red', advice: '笔记应用竞争激烈。', differentiation: ['AI笔记助手','语音笔记','知识连接','场景笔记'] },
    { id: 'pomodoro', pattern: '番茄钟/专注计时器', keywords: ['pomodoro','番茄钟','focus timer','专注','计时器','timer'], frequency: '高', originalityPenalty: 6, scarcity: 1, meaning: 2, oceanType: 'red', advice: '番茄钟应用泛滥。', differentiation: ['AI自适应专注周期','环境音生成','团队专注室','专注数据分析'] },
    { id: 'expense_tracker', pattern: '记账/预算管理应用', keywords: ['expense','budget','记账','预算','spending','财务'], frequency: '高', originalityPenalty: 5, scarcity: 1, meaning: 3, oceanType: 'red', advice: '记账应用非常常见。', differentiation: ['AI自动记账','消费情绪分析','社交记账','AI财务顾问'] },
    { id: 'habit_tracker', pattern: '习惯追踪应用', keywords: ['habit','习惯','streak','habit tracker','打卡'], frequency: '高', originalityPenalty: 5, scarcity: 1, meaning: 3, oceanType: 'red', advice: '习惯追踪应用很常见。', differentiation: ['AI习惯预测','社交契约','习惯连锁反应可视化','微习惯引擎'] },
    { id: 'chat_gpt_clone', pattern: 'ChatGPT界面克隆', keywords: ['chatgpt','chat gpt','ai chat interface','对话界面'], frequency: '极高', originalityPenalty: 10, scarcity: 1, meaning: 1, oceanType: 'red', advice: '克隆ChatGPT界面是最没有创意的项目。', differentiation: ['语音优先交互','多模态对话','情境感知','专家模式切换'] },
    { id: 'image_classifier', pattern: '简单图片分类器', keywords: ['image classification','图片分类','image recognizer','猫狗识别'], frequency: '中', originalityPenalty: 6, scarcity: 2, meaning: 2, oceanType: 'red', advice: '简单的图片分类器是ML教程项目。', differentiation: ['皮肤病变初筛','食材识别+菜谱推荐','垃圾分类助手','文物识别'] },
    { id: 'music_player', pattern: '音乐播放器/推荐', keywords: ['music player','音乐播放','music recommend','歌单','playlist'], frequency: '中', originalityPenalty: 5, scarcity: 2, meaning: 2, oceanType: 'red', advice: '音乐播放器缺乏创新。', differentiation: ['AI场景歌单','哼唱搜索','音乐疗愈','协作歌单'] },
    { id: 'translate_app', pattern: '翻译应用', keywords: ['translate','翻译','translator','translation'], frequency: '中', originalityPenalty: 5, scarcity: 2, meaning: 3, oceanType: 'red', advice: '直接套壳翻译API缺乏创新。', differentiation: ['实时对话翻译','方言保护','文化语境翻译','医学翻译'] },
    { id: 'text_summarizer', pattern: '文本摘要工具', keywords: ['summarize','摘要','summarizer','总结','tldr'], frequency: '高', originalityPenalty: 6, scarcity: 2, meaning: 2, oceanType: 'red', advice: 'AI摘要工具已经泛滥。', differentiation: ['会议摘要+行动项','论文摘要+知识图谱','多文档对比摘要','渐进式摘要'] },
    { id: 'map_location', pattern: '地图/位置标记应用', keywords: ['map','地图','location','位置','marker','pin'], frequency: '中', originalityPenalty: 4, scarcity: 3, meaning: 3, oceanType: 'yellow', advice: '地图应用有一定空间。', differentiation: ['无障碍地图','社区故事地图','安全路线推荐','本地美食探索'] },
    { id: 'dashboard', pattern: '通用数据看板', keywords: ['dashboard','仪表盘','看板','data visualization','数据可视化'], frequency: '中', originalityPenalty: 4, scarcity: 3, meaning: 3, oceanType: 'yellow', advice: '通用仪表盘需要独特数据源。', differentiation: ['个人数字足迹看板','实时城市脉搏','AI数据故事','情绪天气图'] },
    { id: 'landing_page', pattern: '落地页/官网生成器', keywords: ['landing page','落地页','website builder','官网生成'], frequency: '中', originalityPenalty: 4, scarcity: 2, meaning: 2, oceanType: 'red', advice: '落地页生成器很常见。', differentiation: ['AI一句话建站','实时A/B测试','语音建站','可交互3D落地页'] },
    { id: 'quiz_flashcard', pattern: '问答/闪卡学习工具', keywords: ['quiz','flashcard','闪卡','答题','选择题','quizlet'], frequency: '高', originalityPenalty: 5, scarcity: 2, meaning: 3, oceanType: 'red', advice: '闪卡工具已经很常见。', differentiation: ['AI一键生成闪卡','自适应难度','对战学习','视觉化记忆'] },
    { id: 'sentiment_analyzer', pattern: '情感分析工具', keywords: ['sentiment','情感分析','sentiment analysis','情绪分析'], frequency: '中', originalityPenalty: 5, scarcity: 2, meaning: 3, oceanType: 'red', advice: '基础情感分析工具很常见。', differentiation: ['客服对话实时情感监控','团队情绪温度计','产品评论深度分析','心理健康日记'] },
    { id: 'qr_scanner', pattern: '二维码扫描器/生成器', keywords: ['qr code','二维码','qr scanner','扫码'], frequency: '中', originalityPenalty: 6, scarcity: 2, meaning: 2, oceanType: 'red', advice: '二维码工具过于基础。', differentiation: ['二维码溯源系统','动态二维码','二维码艺术化','无障碍扫码'] },
    { id: 'file_manager', pattern: '文件管理器/云盘', keywords: ['file manager','cloud storage','文件管理','云盘','drive'], frequency: '中', originalityPenalty: 4, scarcity: 2, meaning: 2, oceanType: 'red', advice: '文件管理类项目需增加AI能力。', differentiation: ['AI语义搜索','自动知识库','版本时光机','智能归档'] },
    { id: 'password_manager', pattern: '密码管理器', keywords: ['password manager','密码管理','password vault'], frequency: '中', originalityPenalty: 5, scarcity: 2, meaning: 3, oceanType: 'red', advice: '密码管理器已有成熟竞品。', differentiation: ['生物识别解锁','AI异常检测','家庭共享密码库','无密码认证方案'] },
  ],

  // 加分因素
  originalityBoosters: [
    { keyword: 'accessibility', label: '无障碍/可访问性', boost: 3, scarcityBoost: 2, meaningBoost: 3, type: 'social' },
    { keyword: 'sustainability', label: '可持续发展/环保', boost: 3, scarcityBoost: 2, meaningBoost: 3, type: 'social' },
    { keyword: 'mental health', label: '心理健康', boost: 2, scarcityBoost: 2, meaningBoost: 3, type: 'social' },
    { keyword: 'education', label: '教育公平', boost: 2, scarcityBoost: 1, meaningBoost: 3, type: 'social' },
    { keyword: 'ar', label: 'AR/VR/XR', boost: 3, scarcityBoost: 3, meaningBoost: 2, type: 'tech' },
    { keyword: 'iot', label: 'IoT/物联网', boost: 2, scarcityBoost: 2, meaningBoost: 2, type: 'tech' },
    { keyword: 'privacy', label: '隐私保护', boost: 2, scarcityBoost: 2, meaningBoost: 3, type: 'social' },
    { keyword: 'elderly', label: '适老化', boost: 3, scarcityBoost: 3, meaningBoost: 4, type: 'social' },
    { keyword: 'rural', label: '乡村振兴', boost: 3, scarcityBoost: 4, meaningBoost: 4, type: 'social' },
    { keyword: 'disaster', label: '灾害预警/救援', boost: 4, scarcityBoost: 4, meaningBoost: 5, type: 'social' },
    { keyword: 'healthcare', label: '医疗健康', boost: 2, scarcityBoost: 2, meaningBoost: 4, type: 'domain' },
    { keyword: 'agent', label: 'AI Agent自主智能体', boost: 3, scarcityBoost: 3, meaningBoost: 2, type: 'tech' },
    { keyword: 'multimodal', label: '多模态AI', boost: 3, scarcityBoost: 3, meaningBoost: 2, type: 'tech' },
    { keyword: 'voice', label: '语音交互', boost: 2, scarcityBoost: 2, meaningBoost: 3, type: 'tech' },
    { keyword: 'low code', label: '低代码/无代码', boost: 2, scarcityBoost: 2, meaningBoost: 3, type: 'tech' },
    { keyword: 'children', label: '儿童安全', boost: 2, scarcityBoost: 2, meaningBoost: 4, type: 'social' },
    { keyword: 'digital inclusion', label: '数字包容', boost: 2, scarcityBoost: 3, meaningBoost: 3, type: 'social' },
    { keyword: 'local first', label: '本地优先/离线可用', boost: 2, scarcityBoost: 3, meaningBoost: 2, type: 'tech' },
    { keyword: 'deaf', label: '聋人辅助', boost: 3, scarcityBoost: 4, meaningBoost: 5, type: 'social' },
    { keyword: 'blind', label: '盲人辅助', boost: 3, scarcityBoost: 4, meaningBoost: 5, type: 'social' },
    { keyword: 'disability', label: '残障人士辅助', boost: 3, scarcityBoost: 4, meaningBoost: 5, type: 'social' },
    { keyword: 'agriculture', label: '农业科技', boost: 3, scarcityBoost: 3, meaningBoost: 4, type: 'social' },
    { keyword: 'carbon', label: '碳中和/减碳', boost: 3, scarcityBoost: 4, meaningBoost: 5, type: 'social' },
    { keyword: 'emergency', label: '应急响应', boost: 4, scarcityBoost: 4, meaningBoost: 5, type: 'social' },
  ],

  // 蓝海方向推荐
  blueOceanDirections: [
    { direction: '银发经济科技', scarcity: 5, meaning: 5, desc: '中国60岁以上人口超2.8亿，但针对老年人的科技产品极度匮乏', examples: ['老年用药管理系统','防走失定位+社交手环','适老化智能音箱','老年防诈骗教育平台'] },
    { direction: '残障人士辅助技术', scarcity: 5, meaning: 5, desc: '全球超10亿残障人士，辅助技术市场严重 underserved', examples: ['AI手语翻译','视障导航App','认知障碍者日常助手','听障实时字幕'] },
    { direction: '乡村数字化', scarcity: 5, meaning: 5, desc: '农村数字化服务缺口巨大', examples: ['AI病虫害识别','农产品溯源','乡村远程医疗','留守儿童教育陪伴'] },
    { direction: '应急与公共安全', scarcity: 4, meaning: 5, desc: '自然灾害频发，应急技术的数字化升级迫在眉睫', examples: ['AI洪水预警','地震快速响应','应急物资调度','灾后心理援助'] },
    { direction: '心理健康普惠', scarcity: 4, meaning: 5, desc: '全球心理健康问题日益严重，但专业资源极度匮乏', examples: ['AI情绪日记分析','团体心理支持','青少年压力管理','职场倦怠预警'] },
    { direction: '可持续发展与碳中和', scarcity: 4, meaning: 5, desc: '碳中和目标下，碳管理需求快速增长', examples: ['个人碳足迹追踪','企业ESG看板','绿色供应链追踪','社区共享经济'] },
    { direction: '文化遗产数字化', scarcity: 4, meaning: 4, desc: '传统文化遗产的数字化保护和传播有很大空间', examples: ['非遗技艺AI记录','虚拟博物馆导览','方言保护与传承','古籍AI解读'] },
    { direction: '小众群体需求', scarcity: 5, meaning: 4, desc: '很多小众群体的需求被主流市场忽视', examples: ['罕见病患者社区','左撇子工具','多动症专注辅助','夜班工作者健康助手'] },
  ],

  searchPlatforms: [
    { name: 'Devpost', icon: '🏆', url: 'https://devpost.com/software/search?query=', desc: '最大的黑客松项目展示平台' },
    { name: 'GitHub', icon: '🐙', url: 'https://github.com/search?q=', desc: '搜索开源代码仓库' },
    { name: 'Watcha', icon: '🇨🇳', url: 'https://watcha.cn/search?query=', desc: '中文AI产品发现平台，发现国内同类产品' },
    { name: 'ProductHunt', icon: '🚀', url: 'https://www.producthunt.com/search?q=', desc: '发现最新产品创意' },
    { name: 'Bing', icon: '🔍', url: 'https://www.bing.com/search?q=', desc: '微软搜索引擎，覆盖面广' },
    { name: '百度', icon: '🔎', url: 'https://www.baidu.com/s?wd=', desc: '中文搜索引擎，适合中文项目' },
    { name: 'Kaggle', icon: '📊', url: 'https://www.kaggle.com/search?q=', desc: '数据科学竞赛与项目平台' },
    { name: 'Hackathon.io', icon: '🌐', url: 'https://www.hackathon.io/search?q=', desc: '黑客松项目搜索' },
    { name: 'Google', icon: '🔍', url: 'https://www.google.com/search?q=', desc: '全球搜索引擎' },
  ],
};

// ============================================
// 阶段2：技术选型 - 技术栈 + 分工推荐
// ============================================
const TECH_DATA = {
  categories: [
    { id: 'frontend', name: '前端框架', icon: '🎨', technologies: [
      { name: 'React', complexity: 3, learningCurve: 3, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 2, notes: '生态丰富，组件库多' },
      { name: 'Vue.js', complexity: 2, learningCurve: 2, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '上手快，适合0基础' },
      { name: 'Next.js', complexity: 3, learningCurve: 3, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 2, notes: 'SSR/SSG支持' },
      { name: 'Svelte', complexity: 2, learningCurve: 2, ecosystemMaturity: 3, hackathonFit: 4, timeToSetup: 1, notes: '编译时优化，代码量少' },
      { name: 'HTML/CSS/JS', complexity: 1, learningCurve: 1, ecosystemMaturity: 5, hackathonFit: 4, timeToSetup: 1, notes: '零依赖，极简工具' },
      { name: 'Flutter', complexity: 4, learningCurve: 4, ecosystemMaturity: 4, hackathonFit: 3, timeToSetup: 3, notes: '跨平台移动端' },
    ]},
    { id: 'backend', name: '后端框架', icon: '⚙️', technologies: [
      { name: 'Flask (Python)', complexity: 2, learningCurve: 2, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '轻量级，快速搭建API' },
      { name: 'FastAPI (Python)', complexity: 2, learningCurve: 2, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '自动生成API文档，异步支持' },
      { name: 'Express (Node.js)', complexity: 2, learningCurve: 2, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '前后端统一JS' },
      { name: 'Django (Python)', complexity: 3, learningCurve: 3, ecosystemMaturity: 5, hackathonFit: 4, timeToSetup: 2, notes: '功能全面，自带ORM和Admin' },
      { name: 'Spring Boot (Java)', complexity: 4, learningCurve: 4, ecosystemMaturity: 5, hackathonFit: 2, timeToSetup: 3, notes: '企业级，不适合短时间黑客松' },
      { name: 'Go (Gin)', complexity: 3, learningCurve: 3, ecosystemMaturity: 4, hackathonFit: 4, timeToSetup: 2, notes: '高性能，编译型' },
    ]},
    { id: 'database', name: '数据库', icon: '🗄️', technologies: [
      { name: 'SQLite', complexity: 1, learningCurve: 1, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '零配置，文件型数据库' },
      { name: 'PostgreSQL', complexity: 3, learningCurve: 3, ecosystemMaturity: 5, hackathonFit: 4, timeToSetup: 2, notes: '推荐用Supabase托管' },
      { name: 'MongoDB', complexity: 2, learningCurve: 2, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '文档型，推荐Atlas' },
      { name: 'Firebase Firestore', complexity: 2, learningCurve: 2, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: 'BaaS，自带实时同步' },
    ]},
    { id: 'ai_ml', name: 'AI/ML 服务', icon: '🤖', technologies: [
      { name: 'OpenAI API', complexity: 2, learningCurve: 2, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: 'GPT系列，API调用简单' },
      { name: 'Claude API', complexity: 2, learningCurve: 2, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '长上下文，复杂推理' },
      { name: 'LangChain', complexity: 3, learningCurve: 3, ecosystemMaturity: 4, hackathonFit: 4, timeToSetup: 2, notes: 'LLM应用框架，RAG和Agent' },
      { name: 'Hugging Face', complexity: 3, learningCurve: 3, ecosystemMaturity: 5, hackathonFit: 4, timeToSetup: 2, notes: '开源模型库' },
      { name: 'Together AI', complexity: 2, learningCurve: 2, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '开源模型API，有免费额度' },
    ]},
    { id: 'deploy', name: '部署与托管', icon: '☁️', technologies: [
      { name: 'Vercel', complexity: 1, learningCurve: 1, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '前端/全栈部署首选' },
      { name: 'Netlify', complexity: 1, learningCurve: 1, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '静态站点和Serverless' },
      { name: 'Render', complexity: 2, learningCurve: 1, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '支持后端服务部署' },
      { name: 'Railway', complexity: 2, learningCurve: 1, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '一键部署全栈应用' },
    ]},
    { id: 'tools', name: '开发工具与服务', icon: '🛠️', technologies: [
      { name: 'Supabase', complexity: 2, learningCurve: 2, ecosystemMaturity: 4, hackathonFit: 5, timeToSetup: 1, notes: '开源Firebase替代' },
      { name: 'Firebase', complexity: 2, learningCurve: 2, ecosystemMaturity: 5, hackathonFit: 5, timeToSetup: 1, notes: '全套BaaS' },
      { name: 'Stripe', complexity: 3, learningCurve: 3, ecosystemMaturity: 5, hackathonFit: 4, timeToSetup: 2, notes: '支付集成，有测试模式' },
      { name: 'Twilio', complexity: 2, learningCurve: 2, ecosystemMaturity: 5, hackathonFit: 4, timeToSetup: 1, notes: '短信/通话API' },
    ]},
  ],

  riskRules: [
    { id: 'api_cost', triggers: ['OpenAI API','Claude API','Together AI','Stripe','Twilio'], severity: 'high', title: 'API 调用费用风险', description: '使用的第三方API可能产生费用', suggestions: ['设置API调用频率限制','使用环境变量管理API密钥','实现错误重试机制','监控API使用量'] },
    { id: 'deployment_complexity', triggers: ['Spring Boot (Java)'], severity: 'high', title: '部署复杂度过高', description: '在有限时间内完成复杂部署可能导致演示失败', suggestions: ['考虑使用Vercel/Render','提前准备部署文档','准备本地运行的备用方案'] },
    { id: 'learning_curve', triggers: ['Flutter','Spring Boot (Java)'], severity: 'medium', title: '技术学习曲线陡峭', description: '团队需要时间学习新技术', suggestions: ['确保团队中至少有一人熟悉','预留20%的时间用于学习','准备备选方案'] },
    { id: 'model_resource', triggers: ['Hugging Face'], severity: 'high', title: '模型资源需求高', description: '本地运行AI模型需要大量计算资源', suggestions: ['确认有足够的GPU/内存','考虑使用云端API','准备模型加载失败的降级方案'] },
  ],

  timeRecommendations: {
    24: { maxComplexity: 8, recommendation: '24小时黑客松建议使用最熟悉的技术栈。推荐 HTML/CSS/JS + Firebase + Vercel。' },
    48: { maxComplexity: 12, recommendation: '48小时可尝试1-2个新技术，核心功能用熟悉技术。推荐 React/Vue + FastAPI + Vercel/Render。' },
    72: { maxComplexity: 16, recommendation: '72小时有更多探索空间，可引入AI能力。推荐 React + FastAPI + OpenAI API + Vercel。' },
    168: { maxComplexity: 20, recommendation: '一周黑客松可尝试较复杂技术栈，预留最后2天用于测试和部署。' }
  },

  // 预设技术方案（按成本分级）
  presetPlans: [
    {
      id: 'free',
      name: '完全免费方案',
      icon: '🆓',
      cost: 0,
      costLabel: '¥0',
      desc: '全部使用免费服务和开源工具，适合学生和个人参赛者',
      techs: ['HTML/CSS/JS', 'Firebase Firestore', 'Together AI', 'Vercel', 'Firebase'],
      costBreakdown: [
        { item: '前端框架', tool: 'HTML/CSS/JS', cost: '免费' },
        { item: '数据库', tool: 'Firebase Firestore', cost: '免费额度（1GB存储/10万次/天）' },
        { item: 'AI能力', tool: 'Together AI', cost: '免费$5额度' },
        { item: '部署', tool: 'Vercel', cost: '免费Hobby计划' },
        { item: '后端服务', tool: 'Firebase Functions', cost: '免费额度（200万次/月）' },
      ],
      pros: ['零成本','无需信用卡','部署简单快速'],
      cons: ['免费额度有限','AI能力受限','无自定义后端'],
      bestFor: '24-48小时黑客松、0基础参赛者、MVP快速验证'
    },
    {
      id: 'budget',
      name: '经济方案',
      icon: '💰',
      cost: 50,
      costLabel: '¥30-80',
      desc: '使用少量付费API + 免费部署，性价比最高',
      techs: ['React', 'FastAPI (Python)', 'OpenAI API', 'SQLite', 'Vercel', 'Render'],
      costBreakdown: [
        { item: '前端框架', tool: 'React', cost: '免费' },
        { item: '后端框架', tool: 'FastAPI (Python)', cost: '免费' },
        { item: '数据库', tool: 'SQLite', cost: '免费' },
        { item: 'AI能力', tool: 'OpenAI API', cost: '约$5-10（GPT-4o-mini）' },
        { item: '前端部署', tool: 'Vercel', cost: '免费' },
        { item: '后端部署', tool: 'Render', cost: '免费750小时/月' },
      ],
      pros: ['成本低','技术灵活','AI能力强','适合大多数项目'],
      cons: ['需要搭建后端','OpenAI API需绑卡','Render免费层会休眠'],
      bestFor: '48-72小时黑客松、有开发经验的团队、需要AI能力的项目'
    },
    {
      id: 'pro',
      name: '专业方案',
      icon: '🚀',
      cost: 200,
      costLabel: '¥150-400',
      desc: '全栈专业方案，包含高级AI能力和高性能部署',
      techs: ['Next.js', 'FastAPI (Python)', 'OpenAI API', 'Claude API', 'LangChain', 'PostgreSQL', 'Railway', 'Supabase'],
      costBreakdown: [
        { item: '前端框架', tool: 'Next.js', cost: '免费' },
        { item: '后端框架', tool: 'FastAPI (Python)', cost: '免费' },
        { item: '数据库', tool: 'PostgreSQL (Supabase)', cost: '免费500MB' },
        { item: 'AI能力', tool: 'OpenAI API + Claude API', cost: '约$20-50' },
        { item: 'AI框架', tool: 'LangChain', cost: '免费开源' },
        { item: '前端部署', tool: 'Vercel Pro', cost: '$20/月' },
        { item: '后端部署', tool: 'Railway', cost: '$5/月（含数据库）' },
        { item: 'BaaS', tool: 'Supabase', cost: '免费Pro额度' },
      ],
      pros: ['技术栈完整','AI能力最强','高性能部署','支持复杂应用'],
      cons: ['成本较高','技术栈复杂','需要多人协作'],
      bestFor: '72小时-7天黑客松、有经验的团队、复杂全栈项目'
    },
    {
      id: 'enterprise',
      name: '高配方案',
      icon: '🏆',
      cost: 500,
      costLabel: '¥400-1000',
      desc: '顶级配置，适合冲击大奖的项目，包含GPU推理和专业服务',
      techs: ['Next.js', 'Express (Node.js)', 'OpenAI API', 'Claude API', 'Hugging Face', 'MongoDB', 'Railway', 'Stripe'],
      costBreakdown: [
        { item: '前端框架', tool: 'Next.js', cost: '免费' },
        { item: '后端框架', tool: 'Express (Node.js)', cost: '免费' },
        { item: '数据库', tool: 'MongoDB Atlas', cost: '免费512MB' },
        { item: 'AI能力', tool: 'OpenAI API + Claude API', cost: '约$50-100' },
        { item: '模型推理', tool: 'Hugging Face Pro', cost: '$9/月（GPU推理）' },
        { item: '部署', tool: 'Railway Pro', cost: '$20/月' },
        { item: '支付', tool: 'Stripe', cost: '免费（仅测试模式）' },
        { item: '域名', tool: '自定义域名', cost: '约$10-15/年' },
      ],
      pros: ['最强AI能力','GPU推理支持','完整商业功能','专业级部署'],
      cons: ['成本最高','需要专业知识','部署配置复杂'],
      bestFor: '7天黑客松、冲奖团队、需要商业化功能的项目'
    },
  ],

  // NEW: 角色定义
  roles: [
    { id: 'frontend', name: '前端开发', icon: '🎨', skills: ['React','Vue.js','Next.js','Svelte','HTML/CSS/JS','Flutter'], desc: '负责UI界面、用户交互、页面路由' },
    { id: 'backend', name: '后端开发', icon: '⚙️', skills: ['Flask (Python)','FastAPI (Python)','Express (Node.js)','Django (Python)','Go (Gin)'], desc: '负责API设计、数据逻辑、服务器部署' },
    { id: 'ai_ml', name: 'AI/算法', icon: '🤖', skills: ['OpenAI API','Claude API','LangChain','Hugging Face','Together AI'], desc: '负责AI模型集成、Prompt工程、数据处理' },
    { id: 'design', name: '产品设计', icon: '📐', skills: [], desc: '负责UI/UX设计、原型图、演示素材' },
    { id: 'devops', name: '部署运维', icon: '☁️', skills: ['Vercel','Netlify','Render','Railway','Supabase','Firebase'], desc: '负责CI/CD、环境配置、域名部署' },
  ],

  // NEW: 分工推荐模板
  taskDivisionTemplates: {
    1: {
      title: '单人参赛',
      strategy: '聚焦核心功能，砍掉所有非必要特性。推荐使用BaaS（Firebase/Supabase）省去后端开发。',
      roles: [
        { role: '全栈开发', icon: '🎯', tasks: ['前端UI + 后端API + 数据库','使用Vercel一键部署','AI能力通过API调用实现'], timeAllocation: '80%开发 + 10%测试 + 10%部署' }
      ],
      tips: ['使用create-react-app或vite快速搭建','后端用Firebase/Supabase省去服务器管理','预留2小时做演示视频和README']
    },
    2: {
      title: '双人团队',
      strategy: '前后端分离，一人专注前端，一人专注后端+AI。',
      roles: [
        { role: '前端+设计', icon: '🎨', tasks: ['UI界面开发','用户交互逻辑','页面路由和状态管理','设计演示素材'], timeAllocation: '开发60% + 设计20% + 测试20%' },
        { role: '后端+AI+部署', icon: '⚙️', tasks: ['API设计和开发','AI模型集成','数据库设计','部署到Vercel/Render'], timeAllocation: '开发60% + AI集成20% + 部署20%' }
      ],
      tips: ['约定好API接口格式后再并行开发','使用Swagger或简单的Markdown文档API','前端使用Mock数据先行开发']
    },
    3: {
      title: '三人团队',
      strategy: '前端、后端、AI/设计三线并行，效率最高。',
      roles: [
        { role: '前端开发', icon: '🎨', tasks: ['UI界面开发','用户交互','响应式适配'], timeAllocation: '开发70% + 联调20% + 优化10%' },
        { role: '后端开发', icon: '⚙️', tasks: ['API开发','数据库设计','部署配置'], timeAllocation: '开发60% + 联调20% + 部署20%' },
        { role: 'AI/产品/设计', icon: '🤖', tasks: ['AI模型集成','Prompt工程','产品原型','演示素材'], timeAllocation: 'AI50% + 设计30% + 测试20%' }
      ],
      tips: ['三人每日同步进度2次','使用Git分支管理，避免代码冲突','AI成员提前准备好API调用封装']
    },
    4: {
      title: '四人团队',
      strategy: '前后端各一人，AI一人，产品/设计一人。',
      roles: [
        { role: '前端开发', icon: '🎨', tasks: ['UI开发','交互逻辑','组件库'], timeAllocation: '开发70% + 联调30%' },
        { role: '后端开发', icon: '⚙️', tasks: ['API开发','数据库','部署'], timeAllocation: '开发60% + 部署40%' },
        { role: 'AI工程师', icon: '🤖', tasks: ['模型集成','数据处理','算法优化'], timeAllocation: '开发70% + 调试30%' },
        { role: '产品/设计', icon: '📐', tasks: ['需求分析','UI设计','演示视频','Pitch准备'], timeAllocation: '设计40% + 产品30% + 演示30%' }
      ],
      tips: ['产品经理负责整体协调和时间管理','前端和设计师一起确定UI规范','AI工程师与后端约定好接口格式']
    },
    5: {
      title: '五人及以上',
      strategy: '可增加专门的测试/DevOps角色，或拆分前后端为多人。',
      roles: [
        { role: '前端开发(1-2人)', icon: '🎨', tasks: ['UI开发','交互','组件','响应式'], timeAllocation: '开发70% + 联调30%' },
        { role: '后端开发(1-2人)', icon: '⚙️', tasks: ['API','数据库','认证','部署'], timeAllocation: '开发60% + 部署40%' },
        { role: 'AI工程师', icon: '🤖', tasks: ['模型集成','数据处理','算法'], timeAllocation: '开发70% + 调试30%' },
        { role: '产品/设计', icon: '📐', tasks: ['需求','UI设计','Pitch','演示'], timeAllocation: '设计40% + 产品30% + 演示30%' },
        { role: '测试/DevOps(可选)', icon: '🧪', tasks: ['自动化测试','CI/CD','环境管理','代码审查'], timeAllocation: '测试50% + DevOps50%' }
      ],
      tips: ['5人以上需要指定一个Project Manager协调','使用GitHub Projects或Trello管理任务','每日站会同步进度，及时调整分工']
    }
  },

  // NEW: 时间线模板
  timelineTemplates: {
    24: [
      { phase: '选题+设计', time: '0-3h', tasks: ['确定项目方向','画线框图','确定技术栈','初始化项目'] },
      { phase: '核心开发', time: '3-18h', tasks: ['实现核心功能MVP','前端UI搭建','后端API开发','AI集成'] },
      { phase: '测试+修复', time: '18-21h', tasks: ['功能测试','Bug修复','性能优化'] },
      { phase: '部署+演示', time: '21-24h', tasks: ['部署上线','录制演示视频','写README','准备Pitch'] },
    ],
    48: [
      { phase: '选题+设计', time: '0-6h', tasks: ['需求分析','确定方向','UI原型设计','技术选型','项目初始化'] },
      { phase: '核心开发', time: '6-30h', tasks: ['前端UI开发','后端API开发','数据库搭建','AI模型集成'] },
      { phase: '功能完善', time: '30-40h', tasks: ['功能联调','边缘case处理','UI打磨','错误处理'] },
      { phase: '测试+部署', time: '40-45h', tasks: ['功能测试','Bug修复','部署上线','环境验证'] },
      { phase: '演示准备', time: '45-48h', tasks: ['录制演示视频','写README','准备Pitch','演练演示流程'] },
    ],
    72: [
      { phase: '选题+设计', time: '0-8h', tasks: ['需求调研','确定方向','UI/UX设计','技术选型','架构设计','项目初始化'] },
      { phase: '核心开发', time: '8-40h', tasks: ['前端开发','后端开发','AI集成','数据库','核心功能MVP'] },
      { phase: '功能增强', time: '40-56h', tasks: ['高级功能','性能优化','UI打磨','边缘case','错误处理'] },
      { phase: '测试+部署', time: '56-64h', tasks: ['全面测试','Bug修复','部署上线','环境验证','文档编写'] },
      { phase: '演示+Pitch', time: '64-72h', tasks: ['演示视频','README','Pitch演练','最终检查','备用方案'] },
    ],
    168: [
      { phase: '选题+设计', time: 'Day 1', tasks: ['需求调研','方向确定','UI/UX设计','技术选型','架构设计'] },
      { phase: '核心开发', time: 'Day 2-4', tasks: ['前端开发','后端开发','AI集成','数据库','核心功能'] },
      { phase: '功能增强', time: 'Day 5', tasks: ['高级功能','性能优化','UI打磨','边缘case'] },
      { phase: '测试+部署', time: 'Day 6', tasks: ['全面测试','Bug修复','部署上线','文档'] },
      { phase: '演示+Pitch', time: 'Day 7', tasks: ['演示视频','Pitch演练','最终检查','备用方案'] },
    ],
  }
};

// ============================================
// 阶段3：代码扫描 - 安全检测与质量检查
// ============================================
const CODE_SCAN_DATA = {
  // 硬编码密钥检测规则
  secretPatterns: [
    { id: 'openai_key', name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{20,}/g, severity: 'critical', desc: '检测到OpenAI API密钥硬编码，请立即更换并使用环境变量' },
    { id: 'aws_access_key', name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g, severity: 'critical', desc: '检测到AWS访问密钥硬编码' },
    { id: 'aws_secret', name: 'AWS Secret Key', regex: /aws_secret_access_key\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/gi, severity: 'critical', desc: '检测到AWS密钥硬编码' },
    { id: 'github_token', name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9]{36}/g, severity: 'critical', desc: '检测到GitHub Token硬编码' },
    { id: 'google_api', name: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/g, severity: 'critical', desc: '检测到Google API密钥硬编码' },
    { id: 'stripe_key', name: 'Stripe Key', regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/g, severity: 'critical', desc: '检测到Stripe密钥硬编码' },
    { id: 'slack_token', name: 'Slack Token', regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g, severity: 'critical', desc: '检测到Slack Token硬编码' },
    { id: 'jwt_secret', name: 'JWT Secret', regex: /(jwt[_-]?secret|jwt[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'high', desc: '检测到JWT密钥硬编码' },
    { id: 'generic_api_key', name: '通用API密钥', regex: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi, severity: 'high', desc: '检测到通用API密钥赋值' },
    { id: 'password_assign', name: '硬编码密码', regex: /password\s*[:=]\s*['"][^'"]{4,}['"]/gi, severity: 'high', desc: '检测到密码硬编码' },
    { id: 'secret_assign', name: '硬编码密钥', regex: /secret\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'high', desc: '检测到密钥硬编码' },
    { id: 'token_assign', name: '硬编码Token', regex: /token\s*[:=]\s*['"][^'"]{10,}['"]/gi, severity: 'high', desc: '检测到Token硬编码' },
    { id: 'private_key', name: '私钥', regex: /-----BEGIN\s+(RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g, severity: 'critical', desc: '检测到私钥文件内容' },
    { id: 'connection_string', name: '数据库连接字符串', regex: /(mongodb|postgresql|mysql|redis):\/\/[^\s'"]+:[^\s'"]+@/gi, severity: 'high', desc: '检测到含密码的数据库连接字符串' },
  ],

  // .gitignore 规则检查
  gitignoreRules: {
    critical: [
      { pattern: '.env', desc: '.env 环境变量文件（含密钥）', reason: '防止API密钥和密码被提交到仓库' },
      { pattern: '*.pem', desc: 'SSL证书/私钥文件', reason: '防止私钥泄露' },
      { pattern: '*.key', desc: '密钥文件', reason: '防止密钥泄露' },
    ],
    important: [
      { pattern: 'node_modules', desc: 'Node.js依赖目录', reason: '体积巨大，应通过npm install恢复' },
      { pattern: '__pycache__', desc: 'Python缓存目录', reason: '编译缓存，不需要提交' },
      { pattern: '.DS_Store', desc: 'macOS系统文件', reason: '系统生成的文件，无意义' },
      { pattern: 'dist', desc: '构建输出目录', reason: '构建产物，应通过build命令生成' },
      { pattern: 'build', desc: '构建输出目录', reason: '同上' },
    ],
    recommended: [
      { pattern: '.vscode', desc: 'VSCode编辑器配置', reason: '个人编辑器配置，不应强制共享' },
      { pattern: '.idea', desc: 'JetBrains IDE配置', reason: '同上' },
      { pattern: '*.log', desc: '日志文件', reason: '运行时生成，不应提交' },
      { pattern: 'coverage', desc: '测试覆盖率报告', reason: '自动生成，不需要提交' },
      { pattern: '.next', desc: 'Next.js构建目录', reason: '构建产物' },
      { pattern: '.env.local', desc: '本地环境变量', reason: '本地专用配置' },
      { pattern: '.env.production', desc: '生产环境变量', reason: '生产密钥，绝对不能提交' },
    ]
  },

  // 代码质量检查
  qualityChecks: [
    { id: 'console_log', name: 'Console.log调试输出', regex: /console\.(log|debug|info)\s*\(/g, severity: 'low', desc: '发现调试用的console.log，建议在生产代码中移除', fileTypes: ['.js','.ts','.jsx','.tsx'] },
    { id: 'debugger', name: 'Debugger语句', regex: /debugger\s*;?/g, severity: 'medium', desc: '发现debugger语句，必须移除', fileTypes: ['.js','.ts','.jsx','.tsx'] },
    { id: 'todo_comment', name: 'TODO/FIXME注释', regex: /(TODO|FIXME|HACK|XXX|BUG)/g, severity: 'low', desc: '发现未解决的TODO/FIXME注释', fileTypes: ['.js','.ts','.jsx','.tsx','.py','.java','.go'] },
    { id: 'print_debug', name: 'Print调试输出', regex: /print\s*\(/g, severity: 'low', desc: '发现Python print调试输出', fileTypes: ['.py'] },
    { id: 'alert', name: 'Alert弹窗', regex: /alert\s*\(/g, severity: 'medium', desc: '发现alert()弹窗，应使用更友好的提示方式', fileTypes: ['.js','.ts','.jsx','.tsx'] },
    { id: 'var_usage', name: 'var变量声明', regex: /\bvar\s+/g, severity: 'low', desc: '建议使用let/const代替var', fileTypes: ['.js','.ts','.jsx','.tsx'] },
  ],

  // 可扫描的文件类型
  scanableExtensions: ['.js','.ts','.jsx','.tsx','.py','.java','.go','.rb','.php','.env','.gitignore','.json','.yaml','.yml','.txt','.md','.html','.css','.vue','.svelte'],

  // 忽略的目录
  ignoredDirs: ['node_modules','.git','dist','build','__pycache__','.next','vendor','.venv','venv','env','.cache'],

  // 敏感文件名检测
  sensitiveFiles: [
    { pattern: /\.env$/, severity: 'critical', desc: '.env文件包含敏感信息，确保已在.gitignore中' },
    { pattern: /\.env\.local$/, severity: 'critical', desc: '.env.local文件包含本地敏感配置' },
    { pattern: /\.env\.production$/, severity: 'critical', desc: '.env.production文件包含生产环境密钥' },
    { pattern: /credentials\.json$/i, severity: 'critical', desc: '凭证文件，绝对不应提交到仓库' },
    { pattern: /secrets\.json$/i, severity: 'critical', desc: '密钥文件' },
    { pattern: /serviceaccount.*\.json$/i, severity: 'critical', desc: '服务账号密钥文件（如Firebase/GCP）' },
    { pattern: /\.pem$/, severity: 'critical', desc: 'PEM证书/私钥文件' },
    { pattern: /\.key$/, severity: 'critical', desc: '密钥文件' },
    { pattern: /id_rsa/, severity: 'critical', desc: 'SSH私钥文件' },
    { pattern: /\.htpasswd$/i, severity: 'high', desc: 'Apache密码文件' },
  ],
};

// ============================================
// 阶段4：Demo辅助 - 项目类型检测与部署推荐
// ============================================
const DEPLOY_DATA = {
  // 项目类型检测规则（按检测优先级排序）
  projectTypes: [
    {
      id: 'nextjs', name: 'Next.js 应用', icon: '▲',
      detect: { files: ['next.config.js', 'next.config.mjs'], packageDeps: ['next'] },
      buildCmd: 'npm run build', outputDir: '.next',
      platforms: ['vercel'],
      desc: 'Next.js应用，Vercel是其原生部署平台'
    },
    {
      id: 'react', name: 'React 应用', icon: '⚛️',
      detect: { files: [], packageDeps: ['react', 'react-dom'] },
      buildCmd: 'npm run build', outputDir: 'dist',
      platforms: ['vercel', 'netlify'],
      desc: 'React单页应用，推荐Vercel或Netlify部署'
    },
    {
      id: 'vue', name: 'Vue 应用', icon: '💚',
      detect: { files: ['vue.config.js'], packageDeps: ['vue'] },
      buildCmd: 'npm run build', outputDir: 'dist',
      platforms: ['vercel', 'netlify'],
      desc: 'Vue应用，推荐Vercel或Netlify部署'
    },
    {
      id: 'vite', name: 'Vite 应用', icon: '⚡',
      detect: { files: ['vite.config.js', 'vite.config.ts'], packageDeps: ['vite'] },
      buildCmd: 'npm run build', outputDir: 'dist',
      platforms: ['vercel', 'netlify'],
      desc: 'Vite构建的应用，部署简单'
    },
    {
      id: 'static', name: '静态网站', icon: '📄',
      detect: { files: ['index.html'], packageDeps: [] },
      buildCmd: null, outputDir: '.',
      platforms: ['netlify', 'vercel', 'github-pages'],
      desc: '纯静态HTML网站，可部署到任何静态托管平台'
    },
    {
      id: 'flask', name: 'Flask 应用', icon: '🐍',
      detect: { files: [], packageDeps: [], pyDeps: ['flask'] },
      buildCmd: null, outputDir: '.',
      platforms: ['render', 'railway'],
      desc: 'Flask后端应用，需要支持WSGI的部署平台'
    },
    {
      id: 'fastapi', name: 'FastAPI 应用', icon: '⚡',
      detect: { files: [], packageDeps: [], pyDeps: ['fastapi'] },
      buildCmd: null, outputDir: '.',
      platforms: ['render', 'railway'],
      desc: 'FastAPI后端应用，需要支持ASGI的部署平台'
    },
    {
      id: 'express', name: 'Express 应用', icon: '🟢',
      detect: { files: [], packageDeps: ['express'] },
      buildCmd: null, outputDir: '.',
      platforms: ['render', 'railway'],
      desc: 'Express后端应用，需要Node.js运行环境'
    },
    {
      id: 'django', name: 'Django 应用', icon: '🎸',
      detect: { files: ['manage.py'], packageDeps: [], pyDeps: ['django'] },
      buildCmd: null, outputDir: '.',
      platforms: ['render', 'railway'],
      desc: 'Django后端应用，需要支持WSGI的部署平台'
    },
  ],

  // 部署平台配置
  platforms: [
    {
      id: 'vercel', name: 'Vercel', icon: '▲',
      url: 'https://vercel.com',
      bestFor: ['nextjs', 'react', 'vue', 'vite', 'static'],
      desc: '前端和全栈应用部署首选，连接GitHub自动部署',
      deployCmd: 'npx vercel --prod',
      prereq: '需要GitHub账号和Vercel账号',
      steps: [
        '将代码推送到GitHub仓库',
        '登录 vercel.com，点击 "New Project"',
        '导入GitHub仓库，Vercel会自动检测框架',
        '配置环境变量（在Settings → Environment Variables中）',
        '点击Deploy，等待构建完成',
        '获取部署URL，分享给评委'
      ],
      configFile: {
        name: 'vercel.json',
        content: `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}`
      },
      tips: ['免费额度足够黑客松使用','自动HTTPS','每次push自动重新部署','支持自定义域名（免费）']
    },
    {
      id: 'netlify', name: 'Netlify', icon: '🌐',
      url: 'https://netlify.com',
      bestFor: ['static', 'react', 'vue', 'vite'],
      desc: '静态站点和Serverless函数部署，简单易用',
      deployCmd: 'npx netlify deploy --prod',
      prereq: '需要GitHub账号和Netlify账号',
      steps: [
        '将代码推送到GitHub仓库',
        '登录 app.netlify.com，点击 "Add new site"',
        '选择 "Import an existing project"',
        '连接GitHub并选择仓库',
        '配置构建命令和发布目录',
        '配置环境变量',
        '点击Deploy site'
      ],
      configFile: {
        name: 'netlify.toml',
        content: `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`
      },
      tips: ['免费100GB流量/月','自动HTTPS','支持Serverless函数','拖拽部署（无需GitHub）']
    },
    {
      id: 'render', name: 'Render', icon: '🔵',
      url: 'https://render.com',
      bestFor: ['flask', 'fastapi', 'express', 'django'],
      desc: '支持后端服务部署，有免费层级',
      deployCmd: null,
      prereq: '需要GitHub账号和Render账号',
      steps: [
        '将代码推送到GitHub仓库',
        '登录 render.com，点击 "New +"',
        '选择 "Web Service"（后端）或 "Static Site"（前端）',
        '连接GitHub仓库',
        '配置启动命令（如 python app.py 或 npm start）',
        '配置环境变量',
        '选择免费套餐',
        '点击Create Web Service'
      ],
      configFile: {
        name: 'render.yaml',
        content: `services:
  - type: web
    name: my-app
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: OPENAI_API_KEY
        sync: false`
      },
      tips: ['免费套餐有750小时/月','支持Docker部署','自动HTTPS','注意免费服务会休眠']
    },
    {
      id: 'railway', name: 'Railway', icon: '🚂',
      url: 'https://railway.app',
      bestFor: ['flask', 'fastapi', 'express', 'django', 'react', 'vue'],
      desc: '一键部署全栈应用，支持数据库',
      deployCmd: null,
      prereq: '需要GitHub账号和Railway账号',
      steps: [
        '将代码推送到GitHub仓库',
        '登录 railway.app，点击 "New Project"',
        '选择 "Deploy from GitHub repo"',
        '选择仓库，Railway会自动检测框架',
        '配置环境变量（在Variables标签中）',
        '等待部署完成，获取域名'
      ],
      configFile: null,
      tips: ['自动检测框架','内置数据库支持','每月$5免费额度','不会休眠（在额度内）']
    },
    {
      id: 'github-pages', name: 'GitHub Pages', icon: '🐙',
      url: 'https://pages.github.com',
      bestFor: ['static'],
      desc: 'GitHub自带的静态网站托管，完全免费',
      deployCmd: 'npm run deploy',
      prereq: '只需要GitHub账号',
      steps: [
        '确保仓库已设为Public',
        '进入仓库Settings → Pages',
        '选择Source分支（通常为gh-pages或main）',
        '选择目录（通常为/root或/docs）',
        '等待几分钟后访问 username.github.io/repo-name',
        '可在自定义域名设置中绑定自己的域名'
      ],
      configFile: null,
      tips: ['完全免费无限制','适合纯静态网站','可配合GitHub Actions自动部署','URL格式：username.github.io/repo-name']
    },
  ],
};

// ============================================
// 阶段5：Pitch生成 + Agent评审
// ============================================
const PITCH_DATA = {
  // Pitch 结构模板
  pitchStructure: [
    {
      section: '开场Hook', duration: '15秒', icon: '🎣',
      desc: '用一个惊人的数据、故事或问题抓住评委注意力',
      template: '你知道吗？[惊人数据]。这就是我们今天要解决的问题。',
      examples: [
        '你知道吗？全球有2.8亿老年人面临数字鸿沟，他们甚至不会用手机挂号。',
        '每60秒，就有100吨可回收塑料被错误地扔进填埋场。',
        '在中国农村，平均每3个村才有1名全科医生。'
      ]
    },
    {
      section: '问题陈述', duration: '30秒', icon: '🎯',
      desc: '清晰描述你要解决的核心问题，让评委感受到痛点',
      template: '[目标用户] 在 [场景] 下 面临 [问题]，导致 [负面影响]。',
      examples: [
        '老年人在医院就医时，面对复杂的手机挂号系统完全不知所措，导致他们不得不凌晨4点去现场排队。',
        '回收站工作人员每天需要手动分类数吨垃圾，效率低下且容易出错。'
      ]
    },
    {
      section: '解决方案', duration: '45秒', icon: '💡',
      desc: '展示你的解决方案，突出核心创新点',
      template: '我们开发了 [项目名]，一个 [一句话描述]。它通过 [核心技术] 实现 [核心功能]。',
      examples: [
        '我们开发了"银发就医助手"，一个专为老年人设计的语音就医导航应用。它通过AI语音识别理解老人的自然语言指令，自动完成挂号、导航、提醒。',
        '我们的"绿分"智能垃圾桶通过AI视觉识别自动分类垃圾，并给予用户碳积分奖励。'
      ]
    },
    {
      section: '核心Demo', duration: '60秒', icon: '🎬',
      desc: '现场演示核心功能，展示最惊艳的部分',
      template: '让我来演示一下。[操作演示]。如你所见，[功能亮点]。',
      tips: [
        '提前准备好演示账号和数据',
        '只展示最核心的1-2个功能',
        '如果现场演示有风险，使用录屏备用',
        '演示流程要自然流畅，不要卡顿'
      ]
    },
    {
      section: '技术亮点', duration: '20秒', icon: '🔧',
      desc: '简述技术架构和创新点，不要过于深入细节',
      template: '技术上，我们使用了 [技术栈]，创新点在于 [技术亮点]。',
      examples: [
        '技术上，我们使用了React + FastAPI + OpenAI API。创新点在于多Agent协作架构，不同AI角色各司其职。',
        '我们使用了Flutter跨平台开发，后端用Firebase实时数据库，实现了毫秒级同步。'
      ]
    },
    {
      section: '影响力', duration: '20秒', icon: '🌟',
      desc: '说明项目的社会价值和影响力',
      template: '这个项目可以帮助 [受益人群]，预计 [影响数据]。',
      examples: [
        '这个项目可以帮助全国2.8亿老年人跨越数字鸿沟，预计每月减少就医排队时间5000万小时。',
        '如果推广到全国，每年可减少300万吨错误分类的垃圾。'
      ]
    },
    {
      section: '未来展望', duration: '10秒', icon: '🚀',
      desc: '简述后续发展计划，展示项目的可持续性',
      template: '未来，我们计划 [下一步计划]。',
      examples: [
        '未来，我们计划扩展到全国100家三甲医院，并开发智能音箱版本。',
        '下一步我们将开源核心算法，并在3个城市进行试点。'
      ]
    },
  ],

  // 评审Agent（复用并增强）
  agents: [
    {
      id: 'code_quality', name: '代码质量评审员', icon: '💻', color: '#00ffa3',
      focus: '从工程实践角度评估代码质量',
      criteria: [
        { id: 'structure', text: '代码组织结构清晰，模块划分合理', weight: 10 },
        { id: 'readability', text: '命名规范，代码可读性强', weight: 8 },
        { id: 'error_handling', text: '关键路径有完善的错误处理', weight: 8 },
        { id: 'comments', text: '复杂逻辑有适当注释', weight: 5 },
        { id: 'no_hardcode', text: '无硬编码的配置和密钥', weight: 7 },
        { id: 'dependency', text: '依赖管理规范，版本锁定', weight: 5 },
        { id: 'testing', text: '有基本的测试覆盖', weight: 5 },
        { id: 'version_control', text: 'Git提交信息规范，历史清晰', weight: 5 },
      ]
    },
    {
      id: 'ux_design', name: '用户体验评审员', icon: '🎨', color: '#4d8dff',
      focus: '从用户视角评估产品设计',
      criteria: [
        { id: 'first_impression', text: '首屏视觉冲击力强，能吸引评委注意', weight: 10 },
        { id: 'navigation', text: '导航清晰，用户能快速找到核心功能', weight: 8 },
        { id: 'feedback', text: '操作有明确反馈（loading、成功/失败提示）', weight: 7 },
        { id: 'responsive', text: '在不同屏幕尺寸下表现正常', weight: 6 },
        { id: 'consistency', text: 'UI风格统一，色彩和字体协调', weight: 6 },
        { id: 'accessibility', text: '考虑了基本的可访问性', weight: 4 },
        { id: 'empty_state', text: '空状态、错误状态有友好提示', weight: 5 },
        { id: 'performance', text: '页面加载和交互响应流畅', weight: 5 },
      ]
    },
    {
      id: 'innovation', name: '创新性评审员', icon: '💡', color: '#ffb800',
      focus: '评估项目的创意和差异化',
      criteria: [
        { id: 'novelty', text: '核心想法新颖，非常见项目类型', weight: 12 },
        { id: 'differentiation', text: '与同类项目有明显差异化功能', weight: 10 },
        { id: 'ai_integration', text: 'AI能力与业务场景深度结合（非简单套壳）', weight: 8 },
        { id: 'problem_fitting', text: '解决方案与目标问题高度匹配', weight: 8 },
        { id: 'scalability', text: '项目有可扩展的空间和后续发展潜力', weight: 6 },
        { id: 'tech_combination', text: '技术组合有创意，非标准技术栈堆砌', weight: 5 },
        { id: 'user_insight', text: '体现了对用户痛点的深入洞察', weight: 7 },
        { id: 'market_potential', text: '有一定的市场或社会价值', weight: 6 },
      ]
    },
    {
      id: 'technical', name: '技术深度评审员', icon: '🔧', color: '#ff6b9d',
      focus: '评估技术实现的难度和完成度',
      criteria: [
        { id: 'complexity', text: '技术实现有合理的复杂度（非过于简单）', weight: 8 },
        { id: 'completeness', text: '核心功能完整实现，非半成品', weight: 10 },
        { id: 'architecture', text: '系统架构设计合理，有扩展性', weight: 7 },
        { id: 'api_design', text: 'API设计规范，接口合理', weight: 5 },
        { id: 'data_handling', text: '数据处理逻辑正确，无数据丢失风险', weight: 6 },
        { id: 'security', text: '基本安全措施到位（认证、输入验证）', weight: 6 },
        { id: 'performance_t', text: '性能可接受，无明显卡顿', weight: 5 },
        { id: 'deployment_t', text: '部署方案合理，可独立运行', weight: 5 },
      ]
    },
    {
      id: 'presentation', name: '演示与表达评审员', icon: '🎤', color: '#a78bfa',
      focus: '评估项目的展示和表达能力',
      criteria: [
        { id: 'value_prop', text: '能用一句话清晰说明项目价值', weight: 10 },
        { id: 'demo_flow', text: '演示流程设计合理，突出核心功能', weight: 8 },
        { id: 'problem_statement', text: '清晰阐述了要解决的问题', weight: 7 },
        { id: 'solution_clarity', text: '解决方案说明简洁明了', weight: 7 },
        { id: 'visual_aid', text: '演示素材（视频/截图/PPT）质量高', weight: 6 },
        { id: 'tech_explanation', text: '技术方案解释通俗易懂', weight: 5 },
        { id: 'future_plan', text: '有清晰的后续发展计划', weight: 4 },
        { id: 'qa_ready', text: '对可能的评委提问有准备', weight: 5 },
      ]
    }
  ],

  improvementRules: [
    { condition: 'no_hardcode', priority: 'P0', action: '立即移除所有硬编码的API密钥和敏感信息，使用环境变量管理' },
    { condition: 'demo_video', priority: 'P0', action: '录制1-3分钟的项目演示视频，展示核心功能' },
    { condition: 'live_demo', priority: 'P1', action: '部署项目到线上，提供可访问的演示链接' },
    { condition: 'error_handling', priority: 'P1', action: '为关键功能添加错误处理和用户友好的错误提示' },
    { condition: 'first_impression', priority: 'P1', action: '优化首屏视觉设计，提升第一印象' },
    { condition: 'feedback', priority: 'P1', action: '添加加载状态和操作反馈，改善用户体验' },
    { condition: 'novelty', priority: 'P2', action: '寻找项目的差异化亮点，强化独特卖点' },
    { condition: 'completeness', priority: 'P2', action: '确保核心功能完整可用，避免展示半成品' },
    { condition: 'value_prop', priority: 'P2', action: '提炼一句话项目价值描述，用于演示开场' },
    { condition: 'testing', priority: 'P3', action: '为关键功能添加基本测试，提升代码可靠性' },
    { condition: 'responsive', priority: 'P3', action: '适配移动端或不同屏幕尺寸' },
    { condition: 'accessibility', priority: 'P3', action: '改善可访问性，添加alt文本和ARIA标签' },
  ],
};

// ============================================
// 模块子项导航配置
// ============================================
const MODULE_SUBMODULES = {
  topic: [
    { id: 'description',  label: '项目描述',   labelKey: 'sub.topic.desc',     icon: '📝' },
    { id: 'search',       label: '搜索结果',   labelKey: 'sub.topic.search',   icon: '🔍' },
    { id: 'analysis',     label: '稀缺度分析', labelKey: 'sub.topic.analysis', icon: '📊' },
  ],
  tech: [
    { id: 'config',       label: '团队配置',   labelKey: 'sub.tech.config',   icon: '⚙️' },
    { id: 'presets',      label: '预设方案',   labelKey: 'sub.tech.presets',  icon: '💡' },
    { id: 'manual',       label: '手动选型',   labelKey: 'sub.tech.manual',   icon: '🔧' },
    { id: 'results',      label: '评估结果',   labelKey: 'sub.tech.result',   icon: '📈' },
    { id: 'division',     label: '团队分工',   labelKey: 'sub.tech.roles',    icon: '👥' },
    { id: 'timeline',     label: '开发时间线', labelKey: 'sub.tech.timeline', icon: '📅' },
  ],
  dev: [
    { id: 'upload',       label: '文件上传',   labelKey: 'sub.dev.upload', icon: '📂' },
    { id: 'results',      label: '扫描结果',   labelKey: 'sub.dev.scan',   icon: '🔒' },
  ],
  demo: [
    { id: 'git',          label: 'Git教程',    labelKey: 'sub.demo.git',    icon: '📦' },
    { id: 'detect',       label: '项目检测',   labelKey: 'sub.demo.detect', icon: '🔎' },
    { id: 'deploy',       label: '部署方案',   labelKey: 'sub.demo.deploy', icon: '🚀' },
  ],
  pitch: [
    { id: 'info',         label: '项目信息',    labelKey: 'sub.pitch.info',  icon: '📝' },
    { id: 'pitch',        label: 'Pitch演讲稿', labelKey: 'sub.pitch.pitch', icon: '🎤' },
    { id: 'review',       label: '模拟评审',    labelKey: 'sub.pitch.review',icon: '🎯' },
  ],
};

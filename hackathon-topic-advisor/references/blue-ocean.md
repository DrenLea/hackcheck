# Blue Ocean Directions & Originality Boosters

> Source: Migrated from `js/data.js` TOPIC_DATA.blueOceanDirections and originalityBoosters
> Usage: AI recommends blue ocean directions when user's project is in a red/yellow ocean. Boosters are used to add bonus points during scoring.

## Blue Ocean Directions

### 1. 银发经济科技
- **Scarcity**: 5/5 | **Meaning**: 5/5
- **Description**: 中国60岁以上人口超2.8亿，但针对老年人的科技产品极度匮乏
- **Example projects**:
  1. 老年用药管理系统
  2. 防走失定位+社交手环
  3. 适老化智能音箱
  4. 老年防诈骗教育平台

### 2. 残障人士辅助技术
- **Scarcity**: 5/5 | **Meaning**: 5/5
- **Description**: 全球超10亿残障人士，辅助技术市场严重 underserved
- **Example projects**:
  1. AI手语翻译
  2. 视障导航App
  3. 认知障碍者日常助手
  4. 听障实时字幕

### 3. 乡村数字化
- **Scarcity**: 5/5 | **Meaning**: 5/5
- **Description**: 农村数字化服务缺口巨大
- **Example projects**:
  1. AI病虫害识别
  2. 农产品溯源
  3. 乡村远程医疗
  4. 留守儿童教育陪伴

### 4. 应急与公共安全
- **Scarcity**: 4/5 | **Meaning**: 5/5
- **Description**: 自然灾害频发，应急技术的数字化升级迫在眉睫
- **Example projects**:
  1. AI洪水预警
  2. 地震快速响应
  3. 应急物资调度
  4. 灾后心理援助

### 5. 心理健康普惠
- **Scarcity**: 4/5 | **Meaning**: 5/5
- **Description**: 全球心理健康问题日益严重，但专业资源极度匮乏
- **Example projects**:
  1. AI情绪日记分析
  2. 团体心理支持
  3. 青少年压力管理
  4. 职场倦怠预警

### 6. 可持续发展与碳中和
- **Scarcity**: 4/5 | **Meaning**: 5/5
- **Description**: 碳中和目标下，碳管理需求快速增长
- **Example projects**:
  1. 个人碳足迹追踪
  2. 企业ESG看板
  3. 绿色供应链追踪
  4. 社区共享经济

### 7. 文化遗产数字化
- **Scarcity**: 4/5 | **Meaning**: 4/5
- **Description**: 传统文化遗产的数字化保护和传播有很大空间
- **Example projects**:
  1. 非遗技艺AI记录
  2. 虚拟博物馆导览
  3. 方言保护与传承
  4. 古籍AI解读

### 8. 小众群体需求
- **Scarcity**: 5/5 | **Meaning**: 4/5
- **Description**: 很多小众群体的需求被主流市场忽视
- **Example projects**:
  1. 罕见病患者社区
  2. 左撇子工具
  3. 多动症专注辅助
  4. 夜班工作者健康助手

## Originality Boosters

These keywords, when found in the user's project description, add bonus points to originality and meaning scores.

| Keyword | Label | Boost | Scarcity Boost | Meaning Boost | Type |
|---------|-------|-------|---------------|---------------|------|
| accessibility | 无障碍/可访问性 | 3 | 2 | 3 | social |
| sustainability | 可持续发展/环保 | 3 | 2 | 3 | social |
| mental health | 心理健康 | 2 | 2 | 3 | social |
| education | 教育公平 | 2 | 1 | 3 | social |
| ar | AR/VR/XR | 3 | 3 | 2 | tech |
| iot | IoT/物联网 | 2 | 2 | 2 | tech |
| privacy | 隐私保护 | 2 | 2 | 3 | social |
| elderly | 适老化 | 3 | 3 | 4 | social |
| rural | 乡村振兴 | 3 | 4 | 4 | social |
| disaster | 灾害预警/救援 | 4 | 4 | 5 | social |
| healthcare | 医疗健康 | 2 | 2 | 4 | domain |
| agent | AI Agent自主智能体 | 3 | 3 | 2 | tech |
| multimodal | 多模态AI | 3 | 3 | 2 | tech |
| voice | 语音交互 | 2 | 2 | 3 | tech |
| low code | 低代码/无代码 | 2 | 2 | 3 | tech |
| children | 儿童安全 | 2 | 2 | 4 | social |
| digital inclusion | 数字包容 | 2 | 3 | 3 | social |
| local first | 本地优先/离线可用 | 2 | 3 | 2 | tech |

## Usage Guide for AI

1. **For scoring**: When the user's description contains any booster keyword, add the corresponding boost values to the scoring input
2. **For recommendations**: When a project scores yellow or red, recommend 2-3 blue ocean directions that are most related to the user's topic
3. **For differentiation**: Use the blue ocean example projects as inspiration for how to pivot a red ocean project

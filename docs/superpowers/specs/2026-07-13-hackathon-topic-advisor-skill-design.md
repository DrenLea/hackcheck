# Hackathon Topic Advisor Skill 设计文档

> 日期：2026-07-13
> 状态：待审核
> 来源：从 HackCheck 项目选题评审模块（`js/data.js` + `js/app.js` 阶段1）提炼封装

## 1. 目标与范围

### 1.1 目标

将 HackCheck Web App 中选题评审模块的完整逻辑，封装为一个跨平台的 AI Skill（技能包），适用于 TRAE、Claude Code、Cursor、Windsurf 等 vibe-coding 工具。

### 1.2 范围

**包含**：
- 多轮对话式选题引导（AI 反问澄清）
- 多渠道实时搜索同类项目（GitHub / Devpost / 搜索引擎）
- 社媒用户需求发现（搜索社交媒体上的真实痛点表达）
- 三维评分（原创性 + 稀缺度 + 意义感）+ 蓝黄红海判定
- 25+ 常见项目模式查重 + 差异化策略推荐
- 8 个蓝海方向推荐
- 轻量级 Python 评分脚本（确定性计算）

**不包含**：
- 技术选型模块（阶段2）
- 代码扫描模块（阶段3）
- Demo 部署辅助模块（阶段4）
- Pitch 生成与 AI 评审模块（阶段5）

### 1.3 与原 App 的差异

| 维度 | HackCheck App | Skill 版本 |
|------|---------------|-----------|
| 搜索方式 | GitHub API + Devpost + Bing 等 6 个 API 直接调用 | AI 用 WebSearch 工具实时搜索，灵活适配 |
| 社媒需求 | 无 | **新增**：搜索社交媒体上的真实用户痛点 |
| 交互方式 | 单次输入 → 输出结果 | **新增**：多轮对话，AI 反问引导 |
| 评分 | JS 硬编码算法 | Python 脚本 + AI 推理结合 |
| 平台 | 仅 Web 浏览器 | TRAE / Claude Code / Cursor / Windsurf 等 |
| 多语言 | MyMemory 翻译 API | AI 原生多语言能力 |

## 2. 跨平台兼容策略

### 2.1 核心原则

一套 `SKILL.md` 核心内容，所有平台通用。平台差异通过安装说明和适配层处理。

### 2.2 Skill 目录结构

```
hackathon-topic-advisor/
├── SKILL.md                       # 核心方法论（平台无关）
├── references/                    # 参考数据（按需加载）
│   ├── concept-map.md              # 100+ 中英概念映射表
│   ├── common-patterns.md         # 25+ 常见项目模式库
│   ├── blue-ocean.md              # 8 个蓝海方向 + 18 个加分因素
│   └── scoring-rules.md           # 三维评分规则详解
├── scripts/
│   └── topic_scorer.py            # 轻量级评分脚本（纯 Python 标准库）
├── install/
│   ├── trae.md                    # TRAE 安装说明
│   ├── claude-code.md             # Claude Code 安装说明
│   └── other-tools.md            # Cursor / Windsurf 等适配说明
└── README.md                      # 跨平台使用指南
```

### 2.3 Frontmatter 兼容设计

`SKILL.md` 的 frontmatter 同时包含两个平台的字段。各平台忽略不认识的字段，不会报错：

```yaml
---
# === 通用字段（所有平台都读）===
name: hackathon-topic-advisor
description: >
  Hackathon topic validation advisor. Analyzes project ideas for
  scarcity, originality, and social impact. Invoke when user
  mentions hackathon, asks for project ideas, or wants to validate
  a topic before building.

# === Claude Code 专属字段（TRAE 忽略）===
version: "1.0"
triggers:
  - "hackathon"
  - "hackathon topic"
  - "project idea"
  - "选题"
  - "黑客松"
  - "项目查重"
  - "蓝海"
tags:
  - hackathon
  - topic-selection
  - research
  - scoring
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Bash
---
```

### 2.4 各平台安装路径

| 平台 | 安装路径 | 备注 |
|------|---------|------|
| TRAE | `.trae/skills/hackathon-topic-advisor/` | 项目级 skill |
| Claude Code | `.claude/skills/hackathon-topic-advisor/` | 项目级 skill |
| Claude Code (全局) | `~/.claude/skills/hackathon-topic-advisor/` | 用户级 skill |
| Cursor | `.cursor/skills/hackathon-topic-advisor/` | 参照 Cursor rules 机制 |
| Windsurf | `.windsurf/skills/hackathon-topic-advisor/` | 参照 Windsurf rules 机制 |

### 2.5 渐进式披露策略

遵循 Claude Code Skills 的三层加载机制 [$TRAE_REF](https://www.cnblogs.com/vibecodinghuanzhe/p/21064794)：

- **Level 1（常驻）**：frontmatter 的 `description`，让 AI 判断是否激活该 skill
- **Level 2（按需）**：`SKILL.md` 正文，激活后加载完整方法论
- **Level 3（深读）**：`references/` 目录中的详细数据表，仅在需要具体查重或评分时读取

这确保 skill 不会浪费 token——100+ 概念映射表和 25+ 模式库只在真正需要时加载。

## 3. 交互流程设计

### 3.1 整体流程

```
用户描述创意
    │
    ▼
┌─────────────────────────┐
│  Phase 1: 反问澄清       │  AI 提出 2-3 个关键问题
│  (Clarify)              │  目标用户？核心场景？技术偏好？
└──────────┬──────────────┘
           │ 用户回答后
           ▼
┌─────────────────────────┐
│  Phase 2: 同类项目搜索    │  WebSearch 搜索 GitHub/Devpost
│  (Search Similar)       │  统计同类项目数量和质量
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Phase 3: 社媒需求发现    │  搜索 Reddit/Twitter/论坛等
│  (Social Demand)        │  "要是有一个能XXX的工具就好了"
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Phase 4: 三维评分        │  调用 topic_scorer.py
│  (Score)                │  原创性 + 稀缺度 + 意义感
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Phase 5: 分析报告        │  蓝黄红海判定 + 查重结果
│  (Report)               │  差异化策略 + 蓝海推荐
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Phase 6: 迭代优化        │  基于报告，AI 再次反问
│  (Iterate)              │  引导用户调整方向，回到 Phase 2
└─────────────────────────┘
```

### 3.2 Phase 1: 反问澄清

AI 在收到用户的项目创意描述后，**不直接搜索**，而是先提出 2-3 个关键问题。问题从以下维度中选择（根据用户描述的完整度动态选取最缺失的维度）：

**维度 1: 目标用户**
- "这个产品主要服务谁？能具体描述一下这类用户的特征吗？"
- "他们目前是怎么解决这个问题的？"

**维度 2: 核心场景**
- "用户在什么情况下会用到这个产品？能描述一个具体的使用场景吗？"
- "最核心的 1 个功能是什么？"

**维度 3: 差异化认知**
- "你知道市面上有没有类似的产品？你觉得你的想法和它们有什么不同？"
- "是什么让你觉得这个方向值得做？"

**维度 4: 黑客松约束**
- "这次黑客松多长时间？团队几个人？有什么技术偏好吗？"
- "有没有指定的赛道或主题？"

**规则**：
- 最多问 3 个问题，合并相关问题，不要逐一追问
- 如果用户描述已经足够清晰，跳过反问直接搜索
- 用自然对话语气，不要像填表
- 用户回答后，AI 先用一句话总结理解，再进入搜索阶段

### 3.3 Phase 2: 同类项目搜索

AI 使用 WebSearch 工具进行多渠道搜索。搜索策略：

**搜索查询构建**：
1. 从用户描述中提取核心概念（参考 `references/concept-map.md` 的中英映射）
2. 构建英文搜索词（取 2-3 个最核心的概念词组合）
3. 构建中文搜索词（用于中文平台搜索）

**搜索渠道与查询模板**：

| 渠道 | 搜索查询模板 | 目的 |
|------|------------|------|
| GitHub | `site:github.com <关键词> hackathon` | 找同类开源项目 |
| GitHub | `site:github.com <关键词> <技术栈>` | 找技术实现参考 |
| Devpost | `site:devpost.com <关键词>` | 找黑客松同类参赛项目 |
| Product Hunt | `site:producthunt.com <关键词>` | 找已发布的同类产品 |
| 通用搜索 | `<关键词> app OR tool OR platform` | 找市场上的同类产品 |

**搜索结果分析**：
- 统计同类项目总数（搜索结果数量）
- 查看前 5-8 个结果的描述，判断相关度
- 记录高 Star / 高点赞的同类项目（说明方向已有强者）
- 记录项目的技术栈和核心功能（用于差异化分析）

### 3.4 Phase 3: 社媒需求发现

这是 Skill 版本**新增**的能力，原 App 没有。搜索社交媒体上用户自发表达的需求和痛点，验证选题方向的真实需求强度。

**搜索策略**：

| 平台 | 搜索查询模板 | 目的 |
|------|------------|------|
| Reddit | `site:reddit.com "I wish there was" <关键词>` | 找英文用户需求 |
| Reddit | `site:reddit.com "why is there no" <关键词>` | 找英文用户抱怨 |
| Twitter/X | `site:twitter.com OR site:x.com "要是有一个" <中文关键词>` | 找中文用户需求 |
| V2EX / 即刻 | `site:v2ex.com OR site:okjike.com <关键词> 工具` | 找中文技术社区需求 |
| 知乎 | `site:zhihu.com <关键词> 有没有` | 找中文用户提问 |

**社媒需求分析**：
- 提取用户真实表达的原话（"要是有一个可以记录梦境的工具就好了"）
- 统计需求出现的频率和情感强度
- 分析需求背后的真实痛点
- 判断需求是否有明确的付费意愿或强烈使用意愿

**需求强度评级**：
- **强需求**：找到 3+ 条不同用户的独立需求表达，且情感强烈
- **中等需求**：找到 1-2 条用户需求表达
- **弱需求**：未找到明确的用户需求表达
- **伪需求**：找到相关讨论但用户认为现有方案已够用

### 3.5 Phase 4: 三维评分

评分由 `scripts/topic_scorer.py` 脚本执行，AI 将搜索结果和模式匹配结果输入脚本，脚本输出确定性评分。

**评分输入**（JSON 格式）：

```json
{
  "description": "用户的项目描述",
  "search_total_count": 150,
  "search_hit_ratio": 0.3,
  "matched_patterns": [
    {"pattern": "待办事项/任务管理应用", "match_ratio": 0.8}
  ],
  "matched_boosters": ["accessibility", "elderly"],
  "social_demand_level": "strong"
}
```

**评分输出**（JSON 格式）：

```json
{
  "originality": 72,
  "scarcity": 55,
  "meaning": 68,
  "composite": 64,
  "ocean_type": "yellow",
  "verdict": "黄海项目。方向有一定竞争，但通过差异化策略可以脱颖而出。"
}
```

**评分算法**（从 `js/app.js` 的 `analyzeTopic()` 函数移植）：

- **稀缺度**（40% 权重）：基于搜索结果总数和命中百分比
  - 0 结果 → 95 分（极度稀缺）
  - <10 结果 → 85-90 分
  - 10-50 → 70-85 分
  - 50-200 → 55-70 分
  - 200-1000 → 35-55 分
  - >1000 → 10-35 分
  - 命中百分比越低加分越多（说明大部分结果不相关）

- **原创性**（35% 权重）：基于模式匹配扣分 + 加分因素
  - 基础分 70
  - 匹配常见模式按 matchRatio × originalityPenalty 扣分
  - 匹配加分因素每个加 3-6 分
  - 叠加稀缺度 15% 加权

- **意义感**（25% 权重）：基于加分因素和模式的意义评级
  - 基础分 50
  - 匹配加分因素每个加 10-20 分
  - 匹配常见模式按 meaning 等级封顶

- **社媒需求修正**（新增）：
  - 强需求 → 意义感 +10
  - 中等需求 → 意义感 +5
  - 弱需求 → 不修正
  - 伪需求 → 意义感 -10

- **综合分** = 稀缺度 × 0.4 + 原创性 × 0.35 + 意义感 × 0.25

- **海域判定**：
  - ≥70 → 蓝海
  - 45-69 → 黄海
  - <45 → 红海

### 3.6 Phase 5: 分析报告

AI 整合所有分析结果，输出结构化报告。报告格式：

```markdown
# 选题分析报告

## 项目概述
- **项目描述**：（用户描述摘要）
- **目标用户**：（从反问中获取）
- **核心场景**：（从反问中获取）

## 稀缺度分析
- GitHub 同类仓库数：XXX
- 命中相关项目：X/8
- 命中百分比：XX%
- Devpost 同类项目：XX 个
- **稀缺度评分**：XX/100

## 社媒需求发现
- 需求强度：强/中/弱
- 用户原话摘录：
  > "要是有一个能XXX的工具就好了" — Reddit 用户
  > "为什么没有XXX" — V2EX 用户
- 需求分析：（AI 分析需求背后的痛点）

## 三维评分
| 维度 | 得分 | 说明 |
|------|------|------|
| 原创性 | XX/100 | （评分依据） |
| 稀缺度 | XX/100 | （评分依据） |
| 意义感 | XX/100 | （评分依据） |
| **综合** | **XX/100** | |

## 海域判定
🌊/⚡/🔥 [判定结果] + [一句话说明]

## 查重结果
（列出匹配到的常见模式，及对应的差异化策略）

## 差异化建议
（3-4 条具体的差异化策略，来自模式库的 differentiation 字段）

## 蓝海方向推荐
（推荐 2-3 个相关的蓝海方向）
```

### 3.7 Phase 6: 迭代优化

报告输出后，AI 主动提出迭代引导：

- 如果是红海："这个方向竞争很激烈。我注意到差异化策略中有几个方向可能值得深入，你想调整哪个维度？"
- 如果是黄海："方向不错但需要差异化。你觉得哪个差异化策略最可行？我们可以深入搜索验证。"
- 如果是蓝海："这是个很好的方向！要不要我帮你进一步搜索这个方向的技术可行性？"

用户可以调整项目描述，AI 重新进入 Phase 2-5 进行新一轮分析。多轮迭代直到用户满意。

## 4. 核心数据资产

以下数据从 HackCheck 的 `js/data.js` 移植到 `references/` 目录，格式从 JS 对象转为 Markdown 表格。

### 4.1 概念映射表（concept-map.md）

从 `TOPIC_DATA.conceptMap` 移植，100+ 条中文 → 英文搜索关键词映射。用于 AI 构建精准搜索查询。

示例格式：

| 中文概念 | 英文搜索词 | 类型 |
|---------|-----------|------|
| 老年人 | elderly, senior, aging, older adults | domain |
| 用药 | medication, medicine, pill, prescription | feature |
| 语音识别 | speech recognition, voice, ASR | tech |

### 4.2 常见项目模式库（common-patterns.md）

从 `TOPIC_DATA.commonPatterns` 移植，25+ 个常见黑客松项目模式，每个包含：
- 模式名称和关键词
- 出现频率（极高/高/中）
- 原创性扣分（1-10）
- 稀缺度评级（1-5）
- 意义感评级（1-5）
- 海域类型（红/黄/蓝）
- 差异化策略（4 条具体建议）

### 4.3 蓝海方向与加分因素（blue-ocean.md）

从 `TOPIC_DATA.blueOceanDirections` 和 `TOPIC_DATA.originalityBoosters` 移植：
- 8 个蓝海方向（银发经济、残障辅助、乡村数字化、应急安全、心理健康、碳中和、文化遗产、小众群体）
- 18 个加分因素（无障碍、可持续、心理健康、教育公平、AR/VR、IoT 等）

### 4.4 评分规则详解（scoring-rules.md）

从 `analyzeTopic()` 函数逻辑文档化，供 AI 理解评分逻辑和向用户解释评分依据。

## 5. 评分脚本设计（topic_scorer.py）

### 5.1 设计约束

- **纯 Python 标准库**：不依赖 pip install，任何有 Python 环境的工具都能运行
- **单文件**：所有逻辑在一个文件内，方便部署
- **JSON 输入输出**：通过 stdin/argv 接收 JSON，stdout 输出 JSON
- **无副作用**：不读写文件，不访问网络，纯计算

### 5.2 接口设计

```bash
# 方式1: 通过命令行参数传入 JSON 文件
python topic_scorer.py --input results.json

# 方式2: 通过 stdin 传入 JSON
echo '{"description":"...", ...}' | python topic_scorer.py

# 方式3: 通过命令行参数直接传值
python topic_scorer.py --desc "项目描述" --total 150 --hit-ratio 0.3
```

### 5.3 核心函数

```python
def analyze_topic(description, search_total_count, search_hit_ratio,
                  matched_patterns, matched_boosters, social_demand_level):
    """
    移植自 js/app.js 的 analyzeTopic() 函数
    返回: {originality, scarcity, meaning, composite, ocean_type, verdict}
    """
    # 1. 计算稀缺度（基于搜索结果数量和命中百分比）
    scarcity = calc_scarcity(search_total_count, search_hit_ratio)

    # 2. 计算加分因素
    originality_base = 70
    meaning_base = 50
    for booster in matched_boosters:
        originality_base += booster['boost'] * 2
        meaning_base += booster['meaning_boost'] * 5

    # 3. 常见模式扣分
    pattern_penalty = 0
    for pattern in matched_patterns:
        pattern_penalty += pattern['originality_penalty'] * pattern['match_ratio']
        meaning_base = min(meaning_base, 100 - (5 - pattern['meaning']) * 8)

    # 4. 计算三维分数
    originality = clamp(originality_base - pattern_penalty + len(matched_boosters) * 3 + scarcity * 0.15, 10, 98)
    meaning = clamp(meaning_base, 10, 98)

    # 5. 社媒需求修正
    meaning = apply_social_demand_modifier(meaning, social_demand_level)

    # 6. 综合分
    composite = round(scarcity * 0.4 + originality * 0.35 + meaning * 0.25)

    # 7. 海域判定
    ocean_type = 'blue' if composite >= 70 else ('yellow' if composite >= 45 else 'red')

    return {...}
```

### 5.4 脚本内嵌数据

脚本内嵌精简版模式库和加分因素表（仅保留评分需要的字段），避免依赖外部文件。完整版数据在 `references/` 中供 AI 阅读。

## 6. SKILL.md 内容设计

### 6.1 正文结构

```markdown
# Hackathon Topic Advisor

## When to Use
（触发条件描述）

## Workflow
### Step 1: Clarify (反问澄清)
### Step 2: Search Similar Projects (同类项目搜索)
### Step 3: Discover Social Demand (社媒需求发现)
### Step 4: Score (三维评分)
### Step 5: Report (分析报告)
### Step 6: Iterate (迭代优化)

## Search Strategy
（搜索查询构建指南，参考 concept-map.md）

## Scoring
（评分调用方式：将搜索结果传给 topic_scorer.py）

## Reference Data
（指引 AI 在需要时读取 references/ 目录）

## Output Format
（报告模板）

## Iteration Guidance
（各海域的迭代引导话术）
```

### 6.2 关键 Prompt 设计

在 SKILL.md 正文中嵌入以下 prompt 指导，确保 AI 行为一致：

**反问 Prompt**：
> 在收到用户的项目描述后，不要立即搜索。先评估描述的完整度。如果以下任何维度不清晰，提出最多 3 个问题：
> - 目标用户是否明确？
> - 核心使用场景是否具体？
> - 用户是否知道同类产品？差异化认知是否清晰？
> - 黑客松的约束（时长、团队、赛道）是否已知？
> 用自然对话语气提问，合并相关问题，不要像填表。

**社媒搜索 Prompt**：
> 搜索社交媒体上用户自发表达的需求。使用以下查询模式：
> - Reddit: "I wish there was" + 关键词
> - Reddit: "why is there no" + 关键词
> - 中文社区: "要是有一个" + 关键词
> - 中文社区: "为什么没有" + 关键词
> 提取用户原话，分析需求强度。

**报告 Prompt**：
> 输出结构化的 Markdown 报告。包含项目概述、稀缺度分析、社媒需求发现、三维评分表格、海域判定、查重结果、差异化建议、蓝海方向推荐。社媒需求部分要引用用户原话。

## 7. 安装与使用

### 7.1 TRAE 安装

```bash
# 复制到项目级 skill 目录
cp -r hackathon-topic-advisor/ .trae/skills/

# 或复制到全局 skill 目录
cp -r hackathon-topic-advisor/ ~/.trae-cn/skills/
```

### 7.2 Claude Code 安装

```bash
# 复制到项目级 skill 目录
cp -r hackathon-topic-advisor/ .claude/skills/

# 或复制到用户级 skill 目录
cp -r hackathon-topic-advisor/ ~/.claude/skills/
```

### 7.3 使用方式

在任意支持 skill 的 AI 工具中，用户只需自然表达：

```
用户：我想做一个黑客松项目，帮老年人管理用药的应用
AI：（自动触发 skill）→ 反问 → 搜索 → 评分 → 报告
```

或显式调用：

```
用户：/hackathon-topic-advisor 帮我分析这个选题
```

### 7.4 评分脚本依赖

- Python 3.6+（仅使用标准库 json、sys、argparse、math）
- 无需 pip install 任何包
- 无需网络访问

## 8. 测试验证

### 8.1 测试用例

| 用例 | 描述 | 预期结果 |
|------|------|---------|
| 红海项目 | "待办事项管理应用" | 综合分 <45，红海，匹配 todo_app 模式 |
| 黄海项目 | "老年人用药提醒应用" | 综合分 45-70，黄海，匹配 medication + elderly 加分 |
| 蓝海项目 | "AI 手语翻译手套" | 综合分 >70，蓝海，匹配 accessibility + disaster 加分 |
| 社媒需求 | "梦境记录工具" | 发现 Reddit 上的 "I wish there was a dream journal app" |
| 多轮迭代 | 先输入红海项目，再根据建议调整 | 第二轮评分应高于第一轮 |

### 8.2 跨平台验证

- [ ] TRAE 中 skill 正确触发
- [ ] Claude Code 中 skill 正确触发
- [ ] 评分脚本在 Windows / macOS / Linux 上运行正常
- [ ] WebSearch 搜索查询返回有效结果
- [ ] 报告格式正确渲染

## 9. 风险与限制

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| WebSearch 结果质量不稳定 | 评分波动 | 多渠道搜索取平均，AI 判断异常值 |
| 不同 AI 工具搜索能力差异 | 跨平台体验不一致 | SKILL.md 中明确搜索策略，降低对单次搜索的依赖 |
| Python 未安装 | 评分脚本无法运行 | 降级方案：AI 根据评分规则自行估算 |
| 概念映射表不全 | 中文描述映射失败 | AI 用自身翻译能力兜底，同时建议用户补充关键词 |
| 社媒搜索结果有限 | 需求验证不足 | 多平台搜索 + 通用搜索兜底 |

## 10. 文件清单与交付物

| 文件 | 内容 | 状态 |
|------|------|------|
| `SKILL.md` | 核心方法论 | 待创建 |
| `references/concept-map.md` | 100+ 概念映射表 | 待创建（从 data.js 移植） |
| `references/common-patterns.md` | 25+ 常见模式库 | 待创建（从 data.js 移植） |
| `references/blue-ocean.md` | 蓝海方向 + 加分因素 | 待创建（从 data.js 移植） |
| `references/scoring-rules.md` | 评分规则详解 | 待创建（从 app.js 移植） |
| `scripts/topic_scorer.py` | 评分脚本 | 待创建（从 app.js 移植） |
| `install/trae.md` | TRAE 安装说明 | 待创建 |
| `install/claude-code.md` | Claude Code 安装说明 | 待创建 |
| `install/other-tools.md` | 其他工具适配说明 | 待创建 |
| `README.md` | 跨平台使用指南 | 待创建 |

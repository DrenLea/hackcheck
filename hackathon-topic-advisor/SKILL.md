---
name: hackathon-topic-advisor
description: >
  Hackathon topic validation advisor. Analyzes project ideas for
  scarcity, originality, and social impact through multi-round dialogue,
  multi-channel search, and social demand discovery. Invoke when user
  mentions hackathon, asks for project ideas, wants to validate a topic
  before building, or asks about project originality/scarcity.
version: "1.0"
triggers:
  - "hackathon"
  - "hackathon topic"
  - "project idea"
  - "选题"
  - "黑客松"
  - "项目查重"
  - "蓝海"
  - "选题评审"
  - "项目创意"
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

# Hackathon Topic Advisor

A systematic approach to validating hackathon project ideas. Helps users avoid common "reskin" projects, find blue ocean directions, and quantify their project's scarcity, originality, and social impact.

## When to Use

Activate this skill when the user:
- Mentions they're participating in a hackathon
- Describes a project idea and wants feedback
- Asks whether their project idea is good/original/competitive
- Wants to find a hackathon project direction
- Mentions "选题" (topic selection), "查重" (duplicate check), or "蓝海" (blue ocean)

## Workflow

Follow these 6 phases in order. Do NOT skip phases unless the user's description is already very detailed.

### Phase 1: Clarify (反问澄清)

**CRITICAL**: Do NOT immediately search after receiving the user's project description. First assess completeness. If any of these dimensions are unclear, ask 2-3 questions (maximum):

**Dimension 1 — Target User**:
- "Who is the primary user of this product? Can you describe their characteristics?"
- "How do they currently solve this problem?"

**Dimension 2 — Core Scenario**:
- "In what situation would they use this product? Describe a specific use case."
- "What is the single most important feature?"

**Dimension 3 — Differentiation Awareness**:
- "Do you know of similar products on the market? How is your idea different?"
- "What makes you think this direction is worth pursuing?"

**Dimension 4 — Hackathon Constraints**:
- "How long is this hackathon? How many team members? Any tech preferences?"
- "Is there a specific track or theme?"

**Rules**:
- Ask at most 3 questions. Merge related questions. Do NOT interrogate.
- If the description is already clear and specific, skip to Phase 2.
- Use a conversational tone, not a form-filling style.
- After the user answers, summarize your understanding in one sentence before proceeding to search.

### Phase 2: Search Similar Projects (同类项目搜索)

Use WebSearch to search for similar projects across multiple channels.

**Step 1 — Extract keywords**:
Read `references/concept-map.md` to find Chinese-to-English keyword mappings. Extract 2-3 core concept words for English search. Also prepare Chinese keywords for Chinese platform search.

If no concept map match is found, use your own translation capability as fallback.

**Step 2 — Execute searches**:

| Channel | Search Query Template | Purpose |
|---------|----------------------|---------|
| GitHub | `site:github.com <keywords> hackathon` | Find similar open-source projects |
| Devpost | `site:devpost.com <keywords>` | Find hackathon entries |
| Product Hunt | `site:producthunt.com <keywords>` | Find launched products |
| General | `<keywords> app OR tool OR platform` | Find market products |

**Step 3 — Analyze results**:
- Count total search results (estimate if exact count unavailable)
- Check top 5-8 results for relevance
- Record high-star/popular projects (indicates established competitors)
- Note tech stacks and core features of similar projects
- Calculate hit ratio: what fraction of results are truly relevant to the user's idea?

### Phase 3: Discover Social Demand (社媒需求发现)

Search social media for organic user demand expressions to validate real-world need.

**Search queries**:

| Platform | Query Template | Purpose |
|----------|---------------|---------|
| Reddit | `site:reddit.com "I wish there was" <keywords>` | English user wishes |
| Reddit | `site:reddit.com "why is there no" <keywords>` | English user complaints |
| Twitter/X | `site:twitter.com OR site:x.com "要是有一个" <keywords>` | Chinese user wishes |
| V2EX | `site:v2ex.com <keywords> 工具` | Chinese tech community |
| 知乎 | `site:zhihu.com <keywords> 有没有` | Chinese Q&A |

**Analyze and rate demand**:
- **Strong**: 3+ independent user demand expressions with strong emotion
- **Medium**: 1-2 demand expressions found
- **Weak**: No clear demand found
- **False demand**: Discussion found but users think existing solutions suffice

**Extract user quotes** — record the actual words users posted (e.g., "I wish there was a tool that could..."). These will be cited in the report.

### Phase 4: Score (三维评分)

Run the scoring script to get deterministic scores.

**Step 1 — Match common patterns**:
Read `references/common-patterns.md`. For each pattern, check how many of its keywords appear in the user's description. Record matched patterns with their match ratio.

**Step 2 — Identify boosters**:
Read `references/blue-ocean.md` booster table. Check if the user's description contains any booster keywords.

**Step 3 — Run scoring script**:

```bash
echo '{"description":"<user description>","search_total_count":<number>,"search_hit_ratio":<0.0-1.0>,"matched_patterns":[<list>],"matched_boosters":[<list>],"social_demand_level":"<strong|medium|weak|false_demand>"}' | python scripts/topic_scorer.py
```

If Python is not available, use the rules in `references/scoring-rules.md` to manually calculate scores.

**Step 4 — Read scoring output**:
The script outputs JSON with: originality, scarcity, meaning, composite, ocean_type, verdict.

### Phase 5: Report (分析报告)

Output a structured Markdown report using this template:

````markdown
# 🏆 选题分析报告

## 📋 项目概述
- **项目描述**: [summary]
- **目标用户**: [from Phase 1]
- **核心场景**: [from Phase 1]

## 📈 稀缺度分析
- GitHub 同类仓库数: [count]
- 命中相关项目: [matched]/[total checked]
- 命中百分比: [ratio]%
- **稀缺度评分**: [score]/100

## 💬 社媒需求发现
- 需求强度: [Strong/Medium/Weak/False]
- 用户原话摘录:
  > "[quote 1]" — [platform] user
  > "[quote 2]" — [platform] user
- 需求分析: [AI analysis of the real pain point]

## 📊 三维评分
| 维度 | 得分 | 说明 |
|------|------|------|
| 原创性 | [score]/100 | [rationale] |
| 稀缺度 | [score]/100 | [rationale] |
| 意义感 | [score]/100 | [rationale] |
| **综合** | **[score]/100** | |

## 🌊 海域判定
[icon] [Blue/Yellow/Red Ocean] — [verdict text]

## 🔍 查重结果
[List matched common patterns with their match ratio and advice]

## 💡 差异化建议
[3-4 specific differentiation strategies from the matched pattern's differentiation list]

## 🧭 蓝海方向推荐
[Recommend 2-3 related blue ocean directions from references/blue-ocean.md]
````

### Phase 6: Iterate (迭代优化)

After the report, proactively offer to iterate:

- **If Red Ocean**: "This direction is very competitive. I noticed some differentiation strategies that might be worth exploring — which dimension would you like to adjust?"
- **If Yellow Ocean**: "Good direction but needs differentiation. Which strategy feels most feasible to you? We can search deeper to validate."
- **If Blue Ocean**: "Excellent direction! Would you like me to help assess the technical feasibility next?"

The user can adjust their project description, and you re-enter Phase 2-5 for another round. Iterate until the user is satisfied.

## Reference Data Files

Read these files ON DEMAND (do not load all at once):

| File | When to Read |
|------|-------------|
| `references/concept-map.md` | Phase 2: to build search queries from Chinese descriptions |
| `references/common-patterns.md` | Phase 4: to match user's description against common patterns |
| `references/blue-ocean.md` | Phase 4: to identify boosters; Phase 5: to recommend blue ocean directions |
| `references/scoring-rules.md` | Phase 4: if script unavailable, to manually calculate scores; to explain scoring rationale |

## Important Notes

- Always cite user quotes from social media in the report — this is the most compelling evidence
- The scoring script provides deterministic scores; do NOT override its output with your own estimation
- If the script is unavailable, fall back to manual scoring using `references/scoring-rules.md`
- Recommend blue ocean directions that are **related** to the user's topic, not random ones
- Keep the conversation in the user's language (Chinese or English)

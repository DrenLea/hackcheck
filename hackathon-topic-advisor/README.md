# 🏆 Hackathon Topic Advisor

> Stop building "another todo app." Find a blue ocean topic before you write a single line of code.

A cross-platform **AI Skill** that validates your hackathon project idea through multi-round dialogue, multi-channel search, social demand discovery, and three-dimensional scoring. Works with TRAE, Claude Code, Cursor, Windsurf, and any tool that reads Markdown.

---

## Why This Exists

66% of hackathon projects are "reskins" — todo apps, weather dashboards, GPT wrappers. They don't win. **The #1 factor that determines hackathon success is topic selection**, not code quality. This skill helps you pick a topic that is:

- **Rare** — not already built by 500 other teams
- **Original** — not a reskin of a common pattern
- **Meaningful** — solves a real problem with real users

## How It Works

```
User describes idea
       │
       ▼
┌──────────────┐
│  1. Clarify   │  AI asks 2-3 sharp questions
│  (反问)       │  Who's the user? What's the core scenario?
└──────┬───────┘
       ▼
┌──────────────┐
│  2. Search    │  GitHub · Devpost · Product Hunt
│  (同类搜索)   │  How many similar projects exist?
└──────┬───────┘
       ▼
┌──────────────┐
│  3. Discover  │  Reddit · Twitter · V2EX · Zhihu
│  (社媒需求)   │  "I wish there was a tool that..."
└──────┬───────┘
       ▼
┌──────────────┐
│  4. Score     │  Python script → deterministic score
│  (三维评分)   │  Scarcity + Originality + Meaning
└──────┬───────┘
       ▼
┌──────────────┐
│  5. Report    │  🌊 Blue / ⚡ Yellow / 🔥 Red
│  (分析报告)   │  + differentiation strategies
└──────┬───────┘
       ▼
┌──────────────┐
│  6. Iterate   │  Adjust idea → re-analyze
│  (迭代优化)   │  until you find a winner
└──────────────┘
```

## Scoring System

**Composite = Scarcity × 40% + Originality × 35% + Meaning × 25%**

| Score | Ocean Type | What It Means |
|-------|-----------|---------------|
| ≥ 70 | 🌊 **Blue Ocean** | Scarce, original, high social value — go build it! |
| 45–69 | ⚡ **Yellow Ocean** | Some competition, but you can differentiate |
| < 45 | 🔥 **Red Ocean** | Saturated. Pivot or find a unique angle. |

### What Makes Each Dimension

| Dimension | Weight | How It's Calculated |
|-----------|--------|-------------------|
| **Scarcity** | 40% | GitHub + Devpost search result count and hit ratio. 0 results = 95 pts; 5000+ results = 10 pts. |
| **Originality** | 35% | Base 70. Subtract penalty for matched common patterns (25 patterns in library). Add bonus for originality boosters (accessibility, AI agent, AR, etc.). |
| **Meaning** | 25% | Base 50. Add bonus for social impact boosters (elderly, disaster relief, rural, etc.). **New:** social demand modifier from Reddit/Twitter quotes (+10 / -10). |

## Quick Start

### Install

**TRAE** (project-level):
```bash
cp -r hackathon-topic-advisor/ .trae/skills/
```

**Claude Code** (project-level):
```bash
cp -r hackathon-topic-advisor/ .claude/skills/
```

**Cursor / Windsurf / others**: see [install/other-tools.md](install/other-tools.md)

### Use

Just talk naturally — the skill auto-activates when you mention hackathons:

> **You:** "我想参加黑客松，想做一个帮老年人管理用药的App"
>
> **AI:** "这个方向有意思。在搜索之前我想确认几点：1. 你的目标用户是独居老人还是养老院？2. 核心功能是提醒吃药还是药物相互作用检测？..."

Or explicitly invoke: `/hackathon-topic-advisor`

## Example Output

```markdown
# 🏆 选题分析报告

## 📊 三维评分
| 维度 | 得分 | 说明 |
|------|------|------|
| 原创性 | 82/100 | 匹配 accessibility + deaf 加分 |
| 稀缺度 | 89/100 | GitHub 仅5个同类仓库 |
| 意义感 | 76/100 | 社媒强需求 +10 |
| **综合** | **83/100** | |

## 🌊 海域判定
🌊 蓝海项目！这个方向稀缺度高，社会价值显著，有很大机会脱颖而出。

## 💬 社媒需求发现
- 需求强度: Strong
- 用户原话摘录:
  > "I wish there was a real-time sign language translator..." — Reddit user
  > "要是有一个能把手语翻译成文字的工具就好了" — V2EX 用户
```

## What's Inside

```
hackathon-topic-advisor/
├── SKILL.md                    # Core methodology (6-phase workflow)
├── references/
│   ├── concept-map.md          # 110 CN→EN keyword mappings
│   ├── common-patterns.md     # 25 common "reskin" patterns + differentiation strategies
│   ├── blue-ocean.md           # 8 blue ocean directions + 18 originality boosters
│   └── scoring-rules.md        # Scoring algorithm with worked examples
├── scripts/
│   └── topic_scorer.py         # Pure Python scorer (stdlib only, no pip install)
├── tests/
│   └── test_topic_scorer.py    # 9 unit tests (all passing)
├── install/
│   ├── trae.md                 # TRAE setup
│   ├── claude-code.md          # Claude Code setup
│   └── other-tools.md          # Cursor / Windsurf / AGENTS.md
└── README.md                   # You are here
```

## Data Assets

| Asset | Count | Source |
|-------|-------|--------|
| CN→EN concept mappings | 110 | From HackCheck's `conceptMap` |
| Common project patterns | 25 | From HackCheck's `commonPatterns` |
| Blue ocean directions | 8 | From HackCheck's `blueOceanDirections` |
| Originality boosters | 18 | From HackCheck's `originalityBoosters` |

## Try the Scorer Standalone

```bash
echo '{"description":"AI sign language glove","search_total_count":5,"search_hit_ratio":0.2,"matched_patterns":[],"matched_boosters":["accessibility","deaf"],"social_demand_level":"strong"}' | python scripts/topic_scorer.py
```

Output:
```json
{
  "originality": 82,
  "scarcity": 89,
  "meaning": 76,
  "composite": 83,
  "ocean_type": "blue",
  "verdict": "蓝海项目！这个方向稀缺度高，社会价值显著，有很大机会脱颖而出。"
}
```

## Cross-Platform Compatibility

| Platform | Status | How It Works |
|----------|--------|-------------|
| TRAE | ✅ Native | Reads `.trae/skills/` — uses `name` + `description` fields |
| Claude Code | ✅ Native | Reads `.claude/skills/` — uses full frontmatter (triggers, tags, allowed-tools) |
| Cursor | ✅ Adapted | Copy SKILL.md body to `.cursor/rules/` |
| Windsurf | ✅ Adapted | Copy SKILL.md body to `.windsurfrules` |
| Any AGENTS.md tool | ✅ Adapted | Reference SKILL.md in `AGENTS.md` |

The `SKILL.md` frontmatter includes fields for both TRAE and Claude Code. Each platform reads what it needs and ignores the rest — **one file, all platforms**.

## Requirements

- Python 3.6+ (only for the scoring script; AI falls back to manual scoring if unavailable)
- Any AI coding tool that supports custom instructions/skills

## Origin

Derived from [HackCheck](https://github.com/DrenLea/hackcheck) — a hackathon full-process assistant web app. The topic validation module was extracted, enhanced with social demand discovery and multi-round dialogue, and packaged as a portable skill.

**Enhancements over the original web app:**
- AI asks clarifying questions before searching (multi-round dialogue)
- Searches social media for real user demand quotes (Reddit, Twitter, V2EX, Zhihu)
- Cross-platform — works in any vibe-coding tool, not just a browser
- Lightweight Python scoring script — deterministic, testable, no dependencies

## License

MIT

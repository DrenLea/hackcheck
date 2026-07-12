# Hackathon Topic Advisor Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a cross-platform AI skill (`hackathon-topic-advisor`) that validates hackathon project ideas through multi-round dialogue, multi-channel search, social demand discovery, and three-dimensional scoring.

**Architecture:** A skill package with a platform-agnostic `SKILL.md` core, `references/` data files migrated from HackCheck's `js/data.js`, a pure-Python scoring script ported from `js/app.js`'s `analyzeTopic()`, and platform-specific install guides. Compatible with TRAE, Claude Code, Cursor, and Windsurf.

**Tech Stack:** Python 3.6+ (standard library only), Markdown, YAML frontmatter

**Source files:** `js/data.js` (TOPIC_DATA), `js/app.js` (analyzeTopic, extractKeywords, calculateHitRatio functions)

---

## File Structure

```
hackathon-topic-advisor/
├── SKILL.md                        # Core methodology (platform-agnostic)
├── references/
│   ├── concept-map.md              # 100+ CN→EN concept mapping table
│   ├── common-patterns.md         # 25+ common project pattern library
│   ├── blue-ocean.md               # 8 blue ocean directions + 18 boosters
│   └── scoring-rules.md            # Three-dimensional scoring rules detail
├── scripts/
│   └── topic_scorer.py             # Lightweight scoring script (pure stdlib)
├── tests/
│   └── test_topic_scorer.py        # Unit tests for scoring script
├── install/
│   ├── trae.md                     # TRAE installation guide
│   ├── claude-code.md              # Claude Code installation guide
│   └── other-tools.md             # Cursor/Windsurf adaptation guide
└── README.md                       # Cross-platform usage guide
```

**Responsibility split:**
- `SKILL.md` — workflow definition, search strategy, prompt design, output format. The AI reads this to know *what to do*.
- `references/*.md` — structured data tables (concept map, patterns, boosters). The AI reads these *on demand* for specific lookups.
- `scripts/topic_scorer.py` — deterministic scoring calculation. Called by the AI after gathering search results.
- `install/*.md` — platform-specific setup instructions for human users.
- `README.md` — overview and quick-start for human users.

---

### Task 1: Create Directory Structure

**Files:**
- Create: `hackathon-topic-advisor/` (root directory with all subdirectories)

- [ ] **Step 1: Create all directories**

Run:
```powershell
$base = 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor'
New-Item -ItemType Directory -Path "$base\references" -Force
New-Item -ItemType Directory -Path "$base\scripts" -Force
New-Item -ItemType Directory -Path "$base\tests" -Force
New-Item -ItemType Directory -Path "$base\install" -Force
```
Expected: 4 directories created under `hackathon-topic-advisor/`

- [ ] **Step 2: Verify structure**

Run:
```powershell
Get-ChildItem -Recurse 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor' -Directory | Select-Object FullName
```
Expected: 5 directories listed (root + references + scripts + tests + install)

- [ ] **Step 3: Commit**

```bash
git add hackathon-topic-advisor/
git commit -m "chore: create hackathon-topic-advisor skill directory structure"
```

---

### Task 2: Create the Python Scoring Script (TDD)

**Files:**
- Create: `hackathon-topic-advisor/scripts/topic_scorer.py`
- Test: `hackathon-topic-advisor/tests/test_topic_scorer.py`

This script ports the `analyzeTopic()` function from `js/app.js` (lines 864-953) to Python. It embeds a compact version of the pattern library and booster table from `js/data.js` (lines 133-181).

- [ ] **Step 1: Write the failing test file**

Create `hackathon-topic-advisor/tests/test_topic_scorer.py`:

```python
"""Tests for topic_scorer.py - ported from js/app.js analyzeTopic() logic."""
import json
import subprocess
import sys
import os

SCRIPT_PATH = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'topic_scorer.py')


def run_scorer(input_data):
    """Run topic_scorer.py with JSON input via stdin, return parsed output."""
    result = subprocess.run(
        [sys.executable, SCRIPT_PATH],
        input=json.dumps(input_data),
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Script failed: {result.stderr}"
    return json.loads(result.stdout)


def test_red_ocean_todo_app():
    """A generic todo app should score low (red ocean)."""
    result = run_scorer({
        "description": "一个待办事项管理应用，可以添加和完成任务",
        "search_total_count": 5000,
        "search_hit_ratio": 0.8,
        "matched_patterns": [
            {"pattern": "todo_app", "originality_penalty": 8, "meaning": 2, "match_ratio": 0.8}
        ],
        "matched_boosters": [],
        "social_demand_level": "weak"
    })
    assert result["ocean_type"] == "red"
    assert result["composite"] < 45
    assert result["scarcity"] < 35


def test_blue_ocean_accessibility_project():
    """An accessibility project for deaf users should score high (blue ocean)."""
    result = run_scorer({
        "description": "AI手语翻译手套，帮助聋人与健听人实时沟通",
        "search_total_count": 5,
        "search_hit_ratio": 0.2,
        "matched_patterns": [],
        "matched_boosters": ["accessibility", "deaf"],
        "social_demand_level": "strong"
    })
    assert result["ocean_type"] == "blue"
    assert result["composite"] >= 70
    assert result["scarcity"] >= 85


def test_yellow_ocean_elderly_medication():
    """An elderly medication reminder app should be yellow ocean."""
    result = run_scorer({
        "description": "老年人用药提醒应用，支持语音交互",
        "search_total_count": 80,
        "search_hit_ratio": 0.3,
        "matched_patterns": [
            {"pattern": "note_app", "originality_penalty": 5, "meaning": 2, "match_ratio": 0.3}
        ],
        "matched_boosters": ["elderly", "voice"],
        "social_demand_level": "medium"
    })
    assert result["ocean_type"] == "yellow"
    assert 45 <= result["composite"] < 70


def test_scarcity_zero_results():
    """Zero search results should give max scarcity."""
    result = run_scorer({
        "description": "some novel idea",
        "search_total_count": 0,
        "search_hit_ratio": 0,
        "matched_patterns": [],
        "matched_boosters": [],
        "social_demand_level": "weak"
    })
    assert result["scarcity"] == 95


def test_scarcity_high_count():
    """Thousands of results should give low scarcity."""
    result = run_scorer({
        "description": "another weather app",
        "search_total_count": 10000,
        "search_hit_ratio": 0.9,
        "matched_patterns": [
            {"pattern": "weather_app", "originality_penalty": 8, "meaning": 2, "match_ratio": 0.9}
        ],
        "matched_boosters": [],
        "social_demand_level": "weak"
    })
    assert result["scarcity"] <= 15


def test_social_demand_strong_boosts_meaning():
    """Strong social demand should add +10 to meaning score."""
    base_input = {
        "description": "some project",
        "search_total_count": 100,
        "search_hit_ratio": 0.3,
        "matched_patterns": [],
        "matched_boosters": [],
        "social_demand_level": "weak"
    }
    strong_input = dict(base_input)
    strong_input["social_demand_level"] = "strong"

    base_result = run_scorer(base_input)
    strong_result = run_scorer(strong_input)
    assert strong_result["meaning"] >= base_result["meaning"] + 10


def test_social_demand_false_demand_reduces_meaning():
    """False demand should subtract 10 from meaning score."""
    base_input = {
        "description": "some project",
        "search_total_count": 100,
        "search_hit_ratio": 0.3,
        "matched_patterns": [],
        "matched_boosters": [],
        "social_demand_level": "weak"
    }
    false_input = dict(base_input)
    false_input["social_demand_level"] = "false_demand"

    base_result = run_scorer(base_input)
    false_result = run_scorer(false_input)
    assert false_result["meaning"] <= base_result["meaning"] - 10


def test_output_has_all_fields():
    """Output should contain all required fields."""
    result = run_scorer({
        "description": "test",
        "search_total_count": 50,
        "search_hit_ratio": 0.3,
        "matched_patterns": [],
        "matched_boosters": [],
        "social_demand_level": "weak"
    })
    for field in ["originality", "scarcity", "meaning", "composite", "ocean_type", "verdict"]:
        assert field in result, f"Missing field: {field}"


def test_verdict_text_matches_ocean_type():
    """Verdict text should match ocean type."""
    for ocean, expected_text in [("blue", "蓝海"), ("yellow", "黄海"), ("red", "红海")]:
        if ocean == "blue":
            count, hit = 0, 0
        elif ocean == "yellow":
            count, hit = 100, 0.3
        else:
            count, hit = 5000, 0.9
        result = run_scorer({
            "description": "test",
            "search_total_count": count,
            "search_hit_ratio": hit,
            "matched_patterns": [],
            "matched_boosters": [],
            "social_demand_level": "weak"
        })
        assert expected_text in result["verdict"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```powershell
cd 'd:\Programs\00C-hackthon-checker\hackthon-checker-01'; python -m pytest hackathon-topic-advisor/tests/test_topic_scorer.py -v
```
Expected: All tests FAIL with ModuleNotFoundError or similar (script doesn't exist yet)

- [ ] **Step 3: Write the scoring script**

Create `hackathon-topic-advisor/scripts/topic_scorer.py`:

```python
#!/usr/bin/env python3
"""
Hackathon Topic Scorer
Ports the analyzeTopic() logic from js/app.js to Python.
Calculates three-dimensional scores: originality, scarcity, meaning.

Usage:
    echo '{"description":"...","search_total_count":150,...}' | python topic_scorer.py
    python topic_scorer.py --input results.json
    python topic_scorer.py --desc "project" --total 150 --hit-ratio 0.3
"""
import json
import sys
import argparse
import math

# ============================================
# Embedded data (compact version of js/data.js)
# ============================================

# Originality boosters (from TOPIC_DATA.originalityBoosters)
BOOSTERS = {
    "accessibility": {"boost": 3, "meaning_boost": 3},
    "sustainability": {"boost": 3, "meaning_boost": 3},
    "mental health": {"boost": 2, "meaning_boost": 3},
    "education": {"boost": 2, "meaning_boost": 3},
    "ar": {"boost": 3, "meaning_boost": 2},
    "iot": {"boost": 2, "meaning_boost": 2},
    "privacy": {"boost": 2, "meaning_boost": 3},
    "elderly": {"boost": 3, "meaning_boost": 4},
    "rural": {"boost": 3, "meaning_boost": 4},
    "disaster": {"boost": 4, "meaning_boost": 5},
    "healthcare": {"boost": 2, "meaning_boost": 4},
    "agent": {"boost": 3, "meaning_boost": 2},
    "multimodal": {"boost": 3, "meaning_boost": 2},
    "voice": {"boost": 2, "meaning_boost": 3},
    "low code": {"boost": 2, "meaning_boost": 3},
    "children": {"boost": 2, "meaning_boost": 4},
    "digital inclusion": {"boost": 2, "meaning_boost": 3},
    "local first": {"boost": 2, "meaning_boost": 2},
    # Additional domain boosters
    "deaf": {"boost": 3, "meaning_boost": 5},
    "blind": {"boost": 3, "meaning_boost": 5},
    "disability": {"boost": 3, "meaning_boost": 5},
    "agriculture": {"boost": 3, "meaning_boost": 4},
    "mental health": {"boost": 2, "meaning_boost": 3},
    "carbon": {"boost": 3, "meaning_boost": 5},
    "emergency": {"boost": 4, "meaning_boost": 5},
}

# Common patterns (compact: only scoring-relevant fields)
PATTERNS = {
    "todo_app": {"originality_penalty": 8, "meaning": 2},
    "weather_app": {"originality_penalty": 8, "meaning": 2},
    "chatbot_wrapper": {"originality_penalty": 9, "meaning": 1},
    "calculator": {"originality_penalty": 7, "meaning": 2},
    "blog_cms": {"originality_penalty": 6, "meaning": 2},
    "ecommerce": {"originality_penalty": 5, "meaning": 2},
    "portfolio": {"originality_penalty": 5, "meaning": 2},
    "social_clone": {"originality_penalty": 6, "meaning": 2},
    "note_app": {"originality_penalty": 5, "meaning": 2},
    "pomodoro": {"originality_penalty": 6, "meaning": 2},
    "expense_tracker": {"originality_penalty": 5, "meaning": 3},
    "habit_tracker": {"originality_penalty": 5, "meaning": 3},
    "chat_gpt_clone": {"originality_penalty": 10, "meaning": 1},
    "image_classifier": {"originality_penalty": 6, "meaning": 2},
    "music_player": {"originality_penalty": 5, "meaning": 2},
    "translate_app": {"originality_penalty": 5, "meaning": 3},
    "text_summarizer": {"originality_penalty": 6, "meaning": 2},
    "map_location": {"originality_penalty": 4, "meaning": 3},
    "dashboard": {"originality_penalty": 4, "meaning": 3},
    "landing_page": {"originality_penalty": 4, "meaning": 2},
    "quiz_flashcard": {"originality_penalty": 5, "meaning": 3},
    "sentiment_analyzer": {"originality_penalty": 5, "meaning": 3},
    "qr_scanner": {"originality_penalty": 6, "meaning": 2},
    "file_manager": {"originality_penalty": 4, "meaning": 2},
    "password_manager": {"originality_penalty": 5, "meaning": 3},
}

# ============================================
# Scoring functions (ported from js/app.js)
# ============================================

def clamp(value, min_val, max_val):
    """Clamp value to [min_val, max_val] range. Ported from clamp() in app.js."""
    return max(min_val, min(max_val, value))


def calc_scarcity(total_count, hit_ratio):
    """
    Calculate scarcity score based on search results.
    Ported from analyzeTopic() scarcity logic in app.js (lines 891-907).
    """
    if total_count == 0:
        return 95
    elif total_count < 10:
        return clamp(int(90 - hit_ratio * 5), 5, 98)
    elif total_count < 50:
        return clamp(int(78 - hit_ratio * 8), 5, 98)
    elif total_count < 200:
        return clamp(int(65 - hit_ratio * 10), 5, 98)
    elif total_count < 1000:
        return clamp(int(45 - hit_ratio * 10), 5, 98)
    elif total_count < 5000:
        return clamp(int(30 - hit_ratio * 8), 5, 98)
    else:
        return clamp(int(15 - hit_ratio * 5), 5, 98)


def apply_social_demand_modifier(meaning_score, social_demand_level):
    """
    Apply social demand modifier to meaning score.
    This is NEW in the skill version (not in original app.js).
    """
    modifiers = {
        "strong": 10,
        "medium": 5,
        "weak": 0,
        "false_demand": -10,
    }
    modifier = modifiers.get(social_demand_level, 0)
    return clamp(meaning_score + modifier, 10, 98)


def analyze_topic(description, search_total_count, search_hit_ratio,
                  matched_patterns, matched_boosters, social_demand_level):
    """
    Main scoring function. Ported from analyzeTopic() in app.js (lines 864-953).

    Args:
        description: User's project description text
        search_total_count: Total GitHub/Devpost search results count
        search_hit_ratio: Hit ratio (0.0-1.0) of relevant results
        matched_patterns: List of {pattern, originality_penalty, meaning, match_ratio}
        matched_boosters: List of booster keyword strings
        social_demand_level: "strong" | "medium" | "weak" | "false_demand"

    Returns:
        Dict with originality, scarcity, meaning, composite, ocean_type, verdict
    """
    # 1. Calculate scarcity (based on search results)
    scarcity = calc_scarcity(search_total_count, search_hit_ratio)

    # 2. Apply booster bonuses
    originality_base = 70
    meaning_base = 50

    for booster_key in matched_boosters:
        booster = BOOSTERS.get(booster_key)
        if booster:
            originality_base += booster["boost"] * 2
            meaning_base += booster["meaning_boost"] * 5

    # 3. Apply pattern penalties
    pattern_penalty = 0
    for pattern in matched_patterns:
        penalty = pattern.get("originality_penalty", 0)
        match_ratio = pattern.get("match_ratio", 0)
        meaning_level = pattern.get("meaning", 3)
        pattern_penalty += penalty * match_ratio
        # Cap meaning_base based on pattern's meaning level
        meaning_base = min(meaning_base, 100 - (5 - meaning_level) * 8)

    # 4. Calculate three-dimensional scores
    originality = clamp(
        int(round(originality_base - pattern_penalty + len(matched_boosters) * 3 + scarcity * 0.15)),
        10, 98
    )
    meaning = clamp(int(round(meaning_base)), 10, 98)

    # 5. Apply social demand modifier (NEW)
    meaning = apply_social_demand_modifier(meaning, social_demand_level)

    # 6. Calculate composite score
    composite = round(scarcity * 0.4 + originality * 0.35 + meaning * 0.25)

    # 7. Determine ocean type
    if composite >= 70:
        ocean_type = "blue"
    elif composite >= 45:
        ocean_type = "yellow"
    else:
        ocean_type = "red"

    # 8. Generate verdict text
    verdicts = {
        "blue": "蓝海项目！这个方向稀缺度高，社会价值显著，有很大机会脱颖而出。",
        "yellow": "黄海项目。方向有一定竞争，但通过差异化策略可以脱颖而出。",
        "red": "红海项目。这个方向已有大量同类项目，需要找到独特切入点。",
    }

    return {
        "originality": originality,
        "scarcity": scarcity,
        "meaning": meaning,
        "composite": composite,
        "ocean_type": ocean_type,
        "verdict": verdicts[ocean_type],
    }


# ============================================
# CLI interface
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Hackathon topic scoring script")
    parser.add_argument("--input", help="Path to JSON input file")
    parser.add_argument("--desc", help="Project description")
    parser.add_argument("--total", type=int, help="Search total count")
    parser.add_argument("--hit-ratio", type=float, help="Search hit ratio (0.0-1.0)")
    parser.add_argument("--boosters", nargs="*", default=[], help="Matched booster keywords")
    parser.add_argument("--social", default="weak", help="Social demand level")
    args = parser.parse_args()

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
    elif args.desc:
        data = {
            "description": args.desc,
            "search_total_count": args.total or 0,
            "search_hit_ratio": args.hit_ratio or 0,
            "matched_patterns": [],
            "matched_boosters": args.boosters,
            "social_demand_level": args.social,
        }
    elif not sys.stdin.isatty():
        data = json.load(sys.stdin)
    else:
        parser.print_help()
        sys.exit(1)

    result = analyze_topic(
        description=data.get("description", ""),
        search_total_count=data.get("search_total_count", 0),
        search_hit_ratio=data.get("search_hit_ratio", 0),
        matched_patterns=data.get("matched_patterns", []),
        matched_boosters=data.get("matched_boosters", []),
        social_demand_level=data.get("social_demand_level", "weak"),
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```powershell
cd 'd:\Programs\00C-hackthon-checker\hackthon-checker-01'; python -m pytest hackathon-topic-advisor/tests/test_topic_scorer.py -v
```
Expected: All 9 tests PASS

- [ ] **Step 5: Test the CLI manually**

Run:
```powershell
echo '{"description":"老年人用药提醒","search_total_count":80,"search_hit_ratio":0.3,"matched_patterns":[],"matched_boosters":["elderly","voice"],"social_demand_level":"medium"}' | python hackathon-topic-advisor/scripts/topic_scorer.py
```
Expected: JSON output with `ocean_type: "yellow"` and composite score in 45-69 range

- [ ] **Step 6: Commit**

```bash
git add hackathon-topic-advisor/scripts/topic_scorer.py hackathon-topic-advisor/tests/test_topic_scorer.py
git commit -m "feat: add topic_scorer.py scoring script with tests"
```

---

### Task 3: Create Concept Map Reference (concept-map.md)

**Files:**
- Create: `hackathon-topic-advisor/references/concept-map.md`

Migrates `TOPIC_DATA.conceptMap` from `js/data.js` (lines 19-130) to Markdown table format. Each entry maps a Chinese concept to English search keywords, classified by type (domain/feature/tech).

- [ ] **Step 1: Create the concept map file**

Create `hackathon-topic-advisor/references/concept-map.md` with the full 100+ entry table. The file should have this structure:

```markdown
# Concept Map: Chinese → English Search Keywords

> Source: Migrated from `js/data.js` TOPIC_DATA.conceptMap
> Usage: AI reads this file to construct precise English search queries from Chinese project descriptions.
> Types: `domain` = target user/field, `feature` = product function, `tech` = technology keyword

## Domain Concepts (Target Users / Fields)

| 中文概念 | English Search Keywords | Type |
|---------|------------------------|------|
| 老年人 | elderly, senior, aging, older adults | domain |
| 老人 | elderly, senior, aging | domain |
| 适老 | elderly, accessibility, senior | domain |
| 儿童 | children, kids, child | domain |
| 学生 | student, education, school | domain |
| 乡村 | rural, village, countryside, agriculture | domain |
| 盲人 | blind, visually impaired, accessibility, screen reader | domain |
| 聋 | deaf, hearing, sign language, accessibility | domain |
| 残障 | disability, accessibility, a11y, assistive | domain |
| 无障碍 | accessibility, a11y, disability, inclusive | domain |
| 隐私 | privacy, security, encryption, GDPR | domain |
| 安全 | security, privacy, safe, encryption | domain |
| 环保 | sustainability, green, eco, recycling, carbon | domain |
| 心理 | mental health, psychology, wellness, mindfulness | domain |
| 情绪 | emotion, sentiment, mood, mental health | domain |
| 压力 | stress, mental health, wellness | domain |
| 应急 | emergency, disaster, rescue, response | domain |
| 灾害 | disaster, emergency, rescue, alert | domain |

## Feature Concepts (Product Functions)

| 中文概念 | English Search Keywords | Type |
|---------|------------------------|------|
| 用药 | medication, medicine, pill, prescription | feature |
| 提醒 | reminder, alert, notification | feature |
| 就医 | medical, healthcare, hospital, doctor | feature |
| 医疗 | medical, healthcare, health | feature |
| 健康 | health, wellness, medical | feature |
| 语音 | voice, speech, audio | feature |
| 聊天 | chat, chatbot, conversation | feature |
| 机器人 | bot, robot, assistant | feature |
| 教育 | education, learning, teaching, edtech | feature |
| 学习 | learning, education, study | feature |
| 购物 | shopping, ecommerce, commerce, store | feature |
| 电商 | ecommerce, commerce, shop, store | feature |
| 支付 | payment, stripe, checkout, fintech | feature |
| 金融 | finance, fintech, banking, investment | feature |
| 记账 | expense, budget, finance, money | feature |
| 预算 | budget, finance, money | feature |
| 天气 | weather, forecast, meteorology | feature |
| 地图 | map, location, geolocation, navigation | feature |
| 导航 | navigation, map, direction, route | feature |
| 社交 | social, community, network, friend | feature |
| 笔记 | note, notebook, memo, knowledge | feature |
| 日记 | journal, diary, daily | feature |
| 任务 | task, todo, productivity | feature |
| 待办 | todo, task, checklist, productivity | feature |
| 习惯 | habit, tracker, productivity | feature |
| 番茄 | pomodoro, timer, focus, productivity | feature |
| 专注 | focus, productivity, timer, concentration | feature |
| 音乐 | music, audio, player, playlist | feature |
| 视频 | video, stream, media, youtube | feature |
| 图片 | image, photo, picture, vision | feature |
| 翻译 | translate, translation, language, i18n | feature |
| 摘要 | summarize, summary, tldr, NLP | feature |
| 问答 | quiz, flashcard, Q&A, study | feature |
| 闪卡 | flashcard, quiz, study, memorize | feature |
| 密码 | password, vault, security, auth | feature |
| 回收 | recycling, waste, sustainability | feature |
| 日程 | calendar, schedule, planner | feature |
| 文件 | file, storage, cloud, drive | feature |
| 邮件 | email, mail, smtp | feature |
| 短信 | SMS, message, twilio, notification | feature |
| 推荐 | recommendation, recommend, suggestion, personalize | feature |
| 分析 | analytics, analysis, insight, data | feature |
| 监控 | monitor, surveillance, track, observe | feature |
| 预约 | booking, appointment, reservation, schedule | feature |
| 排队 | queue, waiting, line | feature |
| 物流 | logistics, delivery, shipping, supply chain | feature |
| 餐饮 | restaurant, food, delivery, menu | feature |
| 美食 | food, recipe, cooking, restaurant | feature |
| 菜谱 | recipe, cooking, food | feature |
| 旅游 | travel, trip, tourism, guide | feature |
| 酒店 | hotel, booking, reservation | feature |
| 房产 | real estate, property, housing, rent | feature |
| 租房 | rent, rental, housing, property | feature |
| 宠物 | pet, animal, veterinary | feature |
| 运动 | fitness, exercise, workout, sport | feature |
| 健身 | fitness, workout, exercise, health | feature |
| 睡眠 | sleep, rest, health, tracking | feature |
| 饮食 | diet, nutrition, food, health | feature |
| 日历 | calendar, schedule, event, planner | feature |
| 简历 | resume, CV, portfolio, job | feature |
| 作品集 | portfolio, resume, showcase | feature |
| 招聘 | job, recruitment, hiring, career | feature |
| 会议 | meeting, conference, video call | feature |
| 协作 | collaboration, team, workspace, productivity | feature |
| 文档 | document, doc, wiki, knowledge base | feature |
| 知识 | knowledge, wiki, documentation, learning | feature |
| 搜索 | search, search engine, query | feature |
| 客服 | customer service, support, chatbot, helpdesk | feature |
| 营销 | marketing, campaign, growth, SEO | feature |
| 广告 | advertising, ads, marketing | feature |
| 二维码 | QR code, barcode, scan | feature |
| 直播 | livestream, broadcast, live video | feature |
| 短视频 | short video, tiktok, clip | feature |
| 播客 | podcast, audio, RSS | feature |
| 新闻 | news, media, feed, journalism | feature |

## Technology Concepts

| 中文概念 | English Search Keywords | Type |
|---------|------------------------|------|
| 语音识别 | speech recognition, voice, ASR | tech |
| 自然语言 | NLP, natural language, text | tech |
| AI | AI, artificial intelligence, machine learning | tech |
| 人工智能 | AI, artificial intelligence, deep learning | tech |
| 数据可视化 | data visualization, dashboard, chart, analytics | tech |
| 看板 | dashboard, analytics, visualization, monitor | tech |
| AR | AR, augmented reality, XR | tech |
| VR | VR, virtual reality, XR | tech |
| 物联网 | IoT, internet of things, sensor, embedded | tech |
| IoT | IoT, internet of things, sensor | tech |
| 区块链 | blockchain, web3, crypto, smart contract | tech |
| 实时 | real-time, live, websocket, stream | tech |

## Usage Guide for AI

1. Scan the user's project description for any Chinese concepts in this table
2. Extract the corresponding English keywords
3. Classify matched keywords by type: `feature` + `domain` are used for searching similar projects, `tech` keywords are used only for finding technical references
4. Build search query: prioritize `feature` + `domain` keywords (max 3 words), avoid `tech` keywords for similarity search (they return generic libraries, not similar products)
5. If no concepts match, use AI's own translation capability as fallback
```

- [ ] **Step 2: Verify the file was created with sufficient entries**

Run:
```powershell
(Get-Content 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor\references\concept-map.md' | Select-String '\|.*\|.*\|').Count
```
Expected: 90+ table rows

- [ ] **Step 3: Commit**

```bash
git add hackathon-topic-advisor/references/concept-map.md
git commit -m "feat: add concept map reference (100+ CN→EN mappings)"
```

---

### Task 4: Create Common Patterns Reference (common-patterns.md)

**Files:**
- Create: `hackathon-topic-advisor/references/common-patterns.md`

Migrates `TOPIC_DATA.commonPatterns` from `js/data.js` (lines 133-159) to Markdown format. Each pattern includes differentiation strategies.

- [ ] **Step 1: Create the patterns file**

Create `hackathon-topic-advisor/references/common-patterns.md` with all 25 patterns. Structure:

```markdown
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

[... Continue with all 25 patterns in the same format. Each pattern follows the structure above with: title, keywords, frequency/penalty/scarcity/meaning/ocean, advice, and 4 differentiation strategies. The patterns are: todo_app, weather_app, chatbot_wrapper, calculator, blog_cms, ecommerce, portfolio, social_clone, note_app, pomodoro, expense_tracker, habit_tracker, chat_gpt_clone, image_classifier, music_player, translate_app, text_summarizer, map_location, dashboard, landing_page, quiz_flashcard, sentiment_analyzer, qr_scanner, file_manager, password_manager ...]
```

**Note for implementer**: Copy all 25 patterns from `js/data.js` lines 133-159. Each pattern's `differentiation` array becomes a numbered list. The `advice` field becomes the "Advice" line.

- [ ] **Step 2: Verify pattern count**

Run:
```powershell
(Get-Content 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor\references\common-patterns.md' | Select-String '^### \d+\.').Count
```
Expected: 25

- [ ] **Step 3: Commit**

```bash
git add hackathon-topic-advisor/references/common-patterns.md
git commit -m "feat: add common patterns reference (25 patterns with differentiation strategies)"
```

---

### Task 5: Create Blue Ocean Reference (blue-ocean.md)

**Files:**
- Create: `hackathon-topic-advisor/references/blue-ocean.md`

Migrates `TOPIC_DATA.blueOceanDirections` and `TOPIC_DATA.originalityBoosters` from `js/data.js` (lines 162-193).

- [ ] **Step 1: Create the blue ocean file**

Create `hackathon-topic-advisor/references/blue-ocean.md`:

```markdown
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
```

- [ ] **Step 2: Verify booster count**

Run:
```powershell
(Get-Content 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor\references\blue-ocean.md' | Select-String '^\| .* \| .* \| \d \|').Count
```
Expected: 18

- [ ] **Step 3: Commit**

```bash
git add hackathon-topic-advisor/references/blue-ocean.md
git commit -m "feat: add blue ocean directions and boosters reference"
```

---

### Task 6: Create Scoring Rules Reference (scoring-rules.md)

**Files:**
- Create: `hackathon-topic-advisor/references/scoring-rules.md`

Documents the scoring algorithm from `js/app.js` `analyzeTopic()` function (lines 864-953) in human-readable format for AI reference.

- [ ] **Step 1: Create the scoring rules file**

Create `hackathon-topic-advisor/references/scoring-rules.md`:

```markdown
# Scoring Rules: Three-Dimensional Topic Evaluation

> Source: Ported from `js/app.js` analyzeTopic() function (lines 864-953)
> Usage: AI reads this to understand how scores are calculated and to explain scoring rationale to users.
> Script: The actual calculation is in `scripts/topic_scorer.py`

## Overview

The scoring system evaluates hackathon project ideas across three dimensions:
- **Scarcity** (40% weight) — How rare is this project direction?
- **Originality** (35% weight) — How creative vs. common is the idea?
- **Meaning** (25% weight) — What is the social value and impact?

Final composite score = Scarcity × 0.4 + Originality × 0.35 + Meaning × 0.25

## Ocean Type Thresholds

| Score Range | Ocean Type | Icon | Meaning |
|------------|-----------|------|---------|
| ≥ 70 | Blue | 🌊 | Scarce, original, high social value — great opportunity |
| 45 - 69 | Yellow | ⚡ | Some competition, can stand out with differentiation |
| < 45 | Red | 🔥 | Saturated, needs a unique angle |

## Scarcity Score (40% weight)

Based on total search result count from GitHub + Devpost and the hit ratio (percentage of results that are actually relevant).

| Search Result Count | Base Score | Hit Ratio Adjustment |
|--------------------|------------|---------------------|
| 0 results | 95 (extremely scarce) | No adjustment |
| < 10 | 90 | - hitRatio × 5 |
| 10 - 49 | 78 | - hitRatio × 8 |
| 50 - 199 | 65 | - hitRatio × 10 |
| 200 - 999 | 45 | - hitRatio × 10 |
| 1000 - 4999 | 30 | - hitRatio × 8 |
| ≥ 5000 | 15 | - hitRatio × 5 |

**Logic**: More results = more common = lower scarcity. Lower hit ratio = most results aren't truly relevant = slight boost (the project direction is more unique than the raw count suggests).

Final scarcity is clamped to range [5, 98].

## Originality Score (35% weight)

Starting base: 70 points

**Additions**:
- Each matched originality booster: + booster.boost × 2
- Each matched booster (count bonus): + 3
- Scarcity weighted bonus: + scarcity × 0.15

**Deductions**:
- Each matched common pattern: - originalityPenalty × matchRatio

Final originality is clamped to range [10, 98].

**Example**: "AI todo app with voice"
- Base: 70
- + voice booster (boost 2): +4
- + booster count bonus: +3
- + scarcity (say 60): +9
- - todo_app pattern (penalty 8, matchRatio 0.6): -4.8
- = 81.2 → 81

## Meaning Score (25% weight)

Starting base: 50 points

**Additions**:
- Each matched booster: + booster.meaningBoost × 5

**Caps**:
- Each matched pattern caps meaning_base: min(meaning_base, 100 - (5 - pattern.meaning) × 8)
  - Pattern with meaning=1: caps at 68
  - Pattern with meaning=2: caps at 76
  - Pattern with meaning=3: caps at 84

**Social Demand Modifier** (NEW in skill version):
- Strong demand: +10
- Medium demand: +5
- Weak demand: 0
- False demand: -10

Final meaning is clamped to range [10, 98].

## Social Demand Assessment (NEW)

This dimension is unique to the skill version (not in original app). It validates whether real users actually want this type of product by searching social media.

### Search Strategy
- Reddit: "I wish there was" + keywords
- Reddit: "why is there no" + keywords
- Chinese platforms: "要是有一个" + keywords
- Chinese platforms: "为什么没有" + keywords

### Rating Levels
| Level | Criteria | Meaning Modifier |
|-------|----------|-----------------|
| Strong | 3+ independent user demand expressions with strong emotion | +10 |
| Medium | 1-2 user demand expressions | +5 |
| Weak | No clear demand expressions found | 0 |
| False demand | Discussion found but users think existing solutions suffice | -10 |

## Worked Examples

### Example 1: Red Ocean — "Todo List App"
- Search results: 5000+, hit ratio: 0.9
- Scarcity: 15 - 0.9×5 = 10
- Originality: 70 - 8×0.9 + 0 + 10×0.15 = 63.8 → 64
- Meaning: min(50, 100-24) = 50, no social demand = 50
- Composite: 10×0.4 + 64×0.35 + 50×0.25 = 4 + 22.4 + 12.5 = 39 → 🔥 Red

### Example 2: Yellow Ocean — "Elderly Medication Reminder"
- Search results: 80, hit ratio: 0.3
- Scarcity: 65 - 0.3×10 = 62
- Originality: 70 + 3×2 + 2×2 + 2×3 + 62×0.15 = 70+6+4+6+9.3 = 95.3 → 95
- Meaning: 50 + 4×5 + 3×5 + 3×5 = 50+20+15+15 = 100 → capped at 98, +5 medium demand = 98
- Composite: 62×0.4 + 95×0.35 + 98×0.25 = 24.8 + 33.25 + 24.5 = 83 → 🌊 Blue

### Example 3: Blue Ocean — "AI Sign Language Translation Glove"
- Search results: 5, hit ratio: 0.2
- Scarcity: 90 - 0.2×5 = 89
- Originality: 70 + 3×2 + 3×2 + 2×3 + 89×0.15 = 70+6+6+6+13.35 = 101 → capped at 98
- Meaning: 50 + 5×5 + 5×5 = 50+25+25 = 100 → capped at 98, +10 strong demand = 98
- Composite: 89×0.4 + 98×0.35 + 98×0.25 = 35.6 + 34.3 + 24.5 = 94 → 🌊 Blue
```

- [ ] **Step 2: Commit**

```bash
git add hackathon-topic-advisor/references/scoring-rules.md
git commit -m "feat: add scoring rules reference with worked examples"
```

---

### Task 7: Create SKILL.md (Core Methodology)

**Files:**
- Create: `hackathon-topic-advisor/SKILL.md`

This is the core file that any AI tool reads to execute the hackathon topic advisory workflow.

- [ ] **Step 1: Create SKILL.md**

Create `hackathon-topic-advisor/SKILL.md`:

```markdown
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

```markdown
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
```

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
```

- [ ] **Step 2: Verify SKILL.md frontmatter is valid YAML**

Run:
```powershell
python -c "import yaml; f=open('d:/Programs/00C-hackthon-checker/hackthon-checker-01/hackathon-topic-advisor/SKILL.md','r',encoding='utf-8'); content=f.read(); parts=content.split('---',2); yaml.safe_load(parts[1]); print('YAML frontmatter valid')"
```
Expected: `YAML frontmatter valid`

- [ ] **Step 3: Commit**

```bash
git add hackathon-topic-advisor/SKILL.md
git commit -m "feat: add SKILL.md core methodology file"
```

---

### Task 8: Create Install Guides

**Files:**
- Create: `hackathon-topic-advisor/install/trae.md`
- Create: `hackathon-topic-advisor/install/claude-code.md`
- Create: `hackathon-topic-advisor/install/other-tools.md`

- [ ] **Step 1: Create TRAE install guide**

Create `hackathon-topic-advisor/install/trae.md`:

```markdown
# TRAE Installation Guide

## Project-Level Installation

1. Copy the `hackathon-topic-advisor/` directory to your project:
   ```
   .trae/skills/hackathon-topic-advisor/
   ├── SKILL.md
   ├── references/
   ├── scripts/
   └── ...
   ```

2. Restart TRAE or reload the workspace.

3. The skill activates when you mention hackathon topics in conversation.

## Global Installation

1. Copy to the global skills directory:
   ```
   ~/.trae-cn/skills/hackathon-topic-advisor/
   ```

2. Available across all projects.

## Verification

Ask TRAE: "我想参加黑客松，帮我分析一下选题" — the skill should activate and start the clarify phase.

## Notes

- TRAE reads the `name` and `description` fields from the YAML frontmatter
- The `triggers`, `tags`, `allowed-tools`, and `version` fields are ignored by TRAE but used by Claude Code
- The scoring script requires Python 3.6+ to be installed
```

- [ ] **Step 2: Create Claude Code install guide**

Create `hackathon-topic-advisor/install/claude-code.md`:

```markdown
# Claude Code Installation Guide

## Project-Level Installation

1. Copy the `hackathon-topic-advisor/` directory to your project:
   ```
   .claude/skills/hackathon-topic-advisor/
   ├── SKILL.md
   ├── references/
   ├── scripts/
   └── ...
   ```

2. Claude Code auto-detects skills in `.claude/skills/`. No restart needed (hot reload).

3. Trigger by typing: `/hackathon-topic-advisor` or by mentioning hackathon topics naturally.

## Global Installation

1. Copy to the user-level skills directory:
   ```
   ~/.claude/skills/hackathon-topic-advisor/
   ```

2. Available across all projects and sessions.

## Frontmatter Fields

Claude Code uses these fields from the YAML frontmatter:

| Field | Purpose |
|-------|---------|
| `name` | Skill identifier (kebab-case) |
| `description` | Always loaded — Claude uses this to decide when to activate |
| `triggers` | Keywords that auto-activate the skill |
| `tags` | Categorization for skill management |
| `allowed-tools` | Restricts which tools the skill can use |
| `version` | Skill version for compatibility |

## Progressive Disclosure

Claude Code follows the three-level loading:
1. `description` is always in context (Level 1)
2. `SKILL.md` body loads when skill is activated (Level 2)
3. `references/` files load on demand when referenced (Level 3)

This minimizes token usage — the 100+ concept map only loads when actually needed.

## Verification

In Claude Code, type: "I'm doing a hackathon, can you validate my project idea?"
The skill should activate and start asking clarifying questions.

## Notes

- Claude Code Skills follow the agentskills.io open standard
- The `allowed-tools` field ensures the skill can use WebSearch, WebFetch, Read, and Bash
- The scoring script is executed via the Bash tool
```

- [ ] **Step 3: Create other tools install guide**

Create `hackathon-topic-advisor/install/other-tools.md`:

```markdown
# Other Tools Installation Guide (Cursor, Windsurf, etc.)

## General Approach

Most vibe-coding tools support custom instructions or rules. The `SKILL.md` file is standard Markdown with YAML frontmatter — it can be adapted to any tool that reads project-level instruction files.

## Cursor

Cursor uses `.cursorrules` or `.cursor/rules/` for project instructions:

1. Create `.cursor/rules/hackathon-topic-advisor.md` in your project
2. Copy the content of `SKILL.md` (excluding the YAML frontmatter) into this file
3. Cursor will load these rules when working in the project

Alternatively, use Cursor's custom commands:
1. Create `.cursor/commands/hackathon-topic-advisor.md`
2. Copy the SKILL.md body content
3. Invoke with `/hackathon-topic-advisor` in Cursor chat

## Windsurf

Windsurf uses `.windsurfrules` for project instructions:

1. Create `.windsurfrules` in your project root (or append to existing)
2. Add the SKILL.md body content
3. Windsurf reads this file as project context

## Generic AGENTS.md

If your tool supports the AGENTS.md standard (30+ tools compatible):

1. Create or open `AGENTS.md` in your project root
2. Add a section pointing to the skill:
   ```markdown
   ## Hackathon Topic Advisor
   When the user asks about hackathon topics, project ideas, or topic validation,
   follow the instructions in `hackathon-topic-advisor/SKILL.md`.
   ```
3. The AI will read the SKILL.md when the topic comes up

## Manual Usage

If your tool doesn't support any of the above:

1. Copy the content of `SKILL.md` into your AI chat
2. Provide the reference files when needed
3. Run the scoring script manually:
   ```bash
   echo '{"description":"your project","search_total_count":100,"search_hit_ratio":0.3,"matched_patterns":[],"matched_boosters":[],"social_demand_level":"medium"}' | python hackathon-topic-advisor/scripts/topic_scorer.py
   ```

## Scoring Script

The scoring script (`scripts/topic_scorer.py`) works on any platform with Python 3.6+:
- No pip install required (stdlib only)
- No internet access needed
- No external file dependencies
```

- [ ] **Step 4: Commit**

```bash
git add hackathon-topic-advisor/install/
git commit -m "feat: add cross-platform installation guides"
```

---

### Task 9: Create README.md

**Files:**
- Create: `hackathon-topic-advisor/README.md`

- [ ] **Step 1: Create README.md**

Create `hackathon-topic-advisor/README.md`:

```markdown
# Hackathon Topic Advisor

A cross-platform AI skill that validates hackathon project ideas through multi-round dialogue, multi-channel search, social demand discovery, and three-dimensional scoring.

## What It Does

Helps hackathon participants answer: **"Is my project idea worth building?"**

The skill:
1. **Asks clarifying questions** — AI helps you articulate your target user, core scenario, and differentiation
2. **Searches for similar projects** — GitHub, Devpost, Product Hunt, and general web
3. **Discovers social demand** — Finds real user quotes on Reddit, Twitter, V2EX, Zhihu expressing need for this type of product
4. **Scores your idea** — Three-dimensional scoring: Originality + Scarcity + Social Impact
5. **Recommends blue ocean directions** — If your idea is in a red ocean, suggests how to pivot
6. **Iterates** — Adjust your idea and re-analyze until you find a winning direction

## Cross-Platform Compatibility

| Platform | Status | Install Guide |
|----------|--------|---------------|
| TRAE | ✅ Supported | [install/trae.md](install/trae.md) |
| Claude Code | ✅ Supported | [install/claude-code.md](install/claude-code.md) |
| Cursor | ✅ Adapted | [install/other-tools.md](install/other-tools.md) |
| Windsurf | ✅ Adapted | [install/other-tools.md](install/other-tools.md) |
| AGENTS.md tools | ✅ Adapted | [install/other-tools.md](install/other-tools.md) |

## Quick Start

1. Install the skill to your preferred platform (see links above)
2. Start a conversation: "I'm participating in a hackathon and want to validate my project idea"
3. The AI will guide you through the workflow

## Scoring System

| Score | Ocean Type | Meaning |
|-------|-----------|---------|
| ≥ 70 | 🌊 Blue | Scarce, original, high social value |
| 45-69 | ⚡ Yellow | Some competition, needs differentiation |
| < 45 | 🔥 Red | Saturated, needs unique angle |

Score = Scarcity (40%) + Originality (35%) + Meaning (25%)

See [references/scoring-rules.md](references/scoring-rules.md) for full scoring algorithm.

## Source

This skill is derived from [HackCheck](https://github.com/DrenLea/hackcheck), a hackathon full-process assistant web app. The topic validation module's logic has been extracted and enhanced with:
- Multi-round dialogue (AI asks clarifying questions)
- Social demand discovery (searching for real user needs)
- Cross-platform compatibility (works in any vibe-coding tool)
- Lightweight Python scoring script

## Requirements

- Python 3.6+ (for the scoring script; AI can fall back to manual scoring if unavailable)
- A vibe-coding tool that supports custom skills/rules (TRAE, Claude Code, Cursor, etc.)

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add hackathon-topic-advisor/README.md
git commit -m "feat: add README with cross-platform usage guide"
```

---

### Task 10: Run Full Test Suite & Verify

**Files:**
- Test: all files in `hackathon-topic-advisor/`

- [ ] **Step 1: Run the scoring script tests**

Run:
```powershell
cd 'd:\Programs\00C-hackthon-checker\hackthon-checker-01'; python -m pytest hackathon-topic-advisor/tests/test_topic_scorer.py -v
```
Expected: All 9 tests PASS

- [ ] **Step 2: Test CLI with red ocean input**

Run:
```powershell
echo '{"description":"todo app","search_total_count":5000,"search_hit_ratio":0.9,"matched_patterns":[{"pattern":"todo_app","originality_penalty":8,"meaning":2,"match_ratio":0.8}],"matched_boosters":[],"social_demand_level":"weak"}' | python hackathon-topic-advisor/scripts/topic_scorer.py
```
Expected: `ocean_type: "red"`, composite < 45

- [ ] **Step 3: Test CLI with blue ocean input**

Run:
```powershell
echo '{"description":"AI sign language glove","search_total_count":5,"search_hit_ratio":0.2,"matched_patterns":[],"matched_boosters":["accessibility","deaf"],"social_demand_level":"strong"}' | python hackathon-topic-advisor/scripts/topic_scorer.py
```
Expected: `ocean_type: "blue"`, composite >= 70

- [ ] **Step 4: Verify all files exist**

Run:
```powershell
Get-ChildItem -Recurse 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor' -File | Select-Object FullName
```
Expected: 11 files listed (SKILL.md, 4 reference files, 1 script, 1 test, 3 install guides, 1 README)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "test: verify full skill package — all tests pass"
```

---

### Task 11: Install to TRAE & Smoke Test

**Files:**
- Install: copy `hackathon-topic-advisor/` to `.trae/skills/`

- [ ] **Step 1: Copy skill to TRAE project-level skills directory**

Run:
```powershell
New-Item -ItemType Directory -Path 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\.trae\skills' -Force
Copy-Item -Recurse 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\hackathon-topic-advisor' 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\.trae\skills\'
```
Expected: Directory created, files copied

- [ ] **Step 2: Verify installation**

Run:
```powershell
Test-Path 'd:\Programs\00C-hackthon-checker\hackthon-checker-01\.trae\skills\hackathon-topic-advisor\SKILL.md'
```
Expected: True

- [ ] **Step 3: Commit the TRAE skill installation**

```bash
git add .trae/
git commit -m "chore: install hackathon-topic-advisor skill to TRAE"
```

- [ ] **Step 4: Smoke test in TRAE**

In a new TRAE conversation, type: "我想参加黑客松，帮我分析一个选题：老年人用药提醒应用"

Verify that:
- The AI asks clarifying questions (Phase 1)
- After answering, AI searches for similar projects (Phase 2)
- AI searches for social demand (Phase 3)
- AI runs or references the scoring script (Phase 4)
- AI outputs a structured report (Phase 5)
- AI offers to iterate (Phase 6)

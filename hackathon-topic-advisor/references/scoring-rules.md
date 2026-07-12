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

The intermediate result is converted to an integer via `int()` (truncation toward zero) before clamping. Final scarcity is clamped to range [5, 98].

### Scarcity Calculation Code Reference

```python
def calc_scarcity(total_count, hit_ratio):
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
    else:  # >= 5000
        return clamp(int(15 - hit_ratio * 5), 5, 98)
```

## Originality Score (35% weight)

Starting base: 70 points

**Additions**:
- Each matched originality booster: + `booster.boost` (the raw boost value, added directly without extra multiplier)
- Each matched booster (count bonus): + 1 per booster (i.e., `len(matched_boosters)`)
- Scarcity weighted bonus: + `scarcity × 0.04`

**Deductions**:
- Each matched common pattern: - `originality_penalty × match_ratio` (accumulated into `pattern_penalty`)

Final originality formula:
```
originality = clamp(
    int(round(originality_base - pattern_penalty + len(matched_boosters) + scarcity * 0.04)),
    10, 98
)
```

Final originality is clamped to range [10, 98].

## Meaning Score (25% weight)

Starting base: 50 points

**Additions**:
- Each matched booster: + `booster.meaning_boost × 2` (the meaning_boost value is multiplied by 2)

**Caps** (applied per matched pattern):
- Each matched pattern caps meaning_base: `meaning_base = min(meaning_base, 100 - (5 - pattern.meaning) × 8)`
  - Pattern with meaning=1: caps at 68
  - Pattern with meaning=2: caps at 76
  - Pattern with meaning=3: caps at 84
  - Pattern with meaning=4: caps at 92
  - Pattern with meaning=5: caps at 100 (no effective cap)

**Social Demand Modifier** (NEW in skill version):
- Strong demand: +10
- Medium demand: +5
- Weak demand: 0
- False demand (`false_demand`): -10

Final meaning formula:
```
meaning = clamp(int(round(meaning_base)), 10, 98)
meaning = clamp(meaning + social_demand_modifier, 10, 98)
```

Final meaning is clamped to range [10, 98] (applied twice: once after rounding meaning_base, once after adding the social demand modifier).

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
| False demand (`false_demand`) | Discussion found but users think existing solutions suffice | -10 |

## Booster Parameters Reference

The following table lists all booster keywords and their actual parameter values used in `topic_scorer.py` (the `BOOSTERS` dictionary).

| Booster Keyword | boost (Originality) | meaning_boost (×2 to Meaning) |
|----------------|---------------------|-------------------------------|
| accessibility | 3 | 3 |
| sustainability | 3 | 3 |
| mental health | 2 | 3 |
| education | 2 | 3 |
| ar | 3 | 2 |
| iot | 2 | 2 |
| privacy | 2 | 3 |
| elderly | 3 | 4 |
| rural | 3 | 4 |
| disaster | 4 | 5 |
| healthcare | 2 | 4 |
| agent | 3 | 2 |
| multimodal | 3 | 2 |
| voice | 2 | 3 |
| low code | 2 | 3 |
| children | 2 | 4 |
| digital inclusion | 2 | 3 |
| local first | 2 | 2 |
| deaf | 3 | 5 |
| blind | 3 | 5 |
| disability | 3 | 5 |
| agriculture | 3 | 4 |
| carbon | 3 | 5 |
| emergency | 4 | 5 |

## Common Pattern Parameters Reference

The following table lists all common patterns and their actual parameter values used in `topic_scorer.py` (the `PATTERNS` dictionary).

| Pattern Key | originality_penalty | meaning | Meaning Cap |
|-------------|---------------------|---------|-------------|
| todo_app | 8 | 2 | 76 |
| weather_app | 8 | 2 | 76 |
| chatbot_wrapper | 9 | 1 | 68 |
| calculator | 7 | 2 | 76 |
| blog_cms | 6 | 2 | 76 |
| ecommerce | 5 | 2 | 76 |
| portfolio | 5 | 2 | 76 |
| social_clone | 6 | 2 | 76 |
| note_app | 5 | 2 | 76 |
| pomodoro | 6 | 2 | 76 |
| expense_tracker | 5 | 3 | 84 |
| habit_tracker | 5 | 3 | 84 |
| chat_gpt_clone | 10 | 1 | 68 |
| image_classifier | 6 | 2 | 76 |
| music_player | 5 | 2 | 76 |
| translate_app | 5 | 3 | 84 |
| text_summarizer | 6 | 2 | 76 |
| map_location | 4 | 3 | 84 |
| dashboard | 4 | 3 | 84 |
| landing_page | 4 | 2 | 76 |
| quiz_flashcard | 5 | 3 | 84 |
| sentiment_analyzer | 5 | 3 | 84 |
| qr_scanner | 6 | 2 | 76 |
| file_manager | 4 | 2 | 76 |
| password_manager | 5 | 3 | 84 |

## Worked Examples

### Example 1: Red Ocean — "Todo List App"

**Input**:
- search_total_count: 5000, hit_ratio: 0.9
- matched_patterns: todo_app (originality_penalty=8, meaning=2, match_ratio=0.9)
- matched_boosters: []
- social_demand_level: weak

**Scarcity calculation**:
- total_count ≥ 5000 → base 15
- 15 - 0.9 × 5 = 15 - 4.5 = 10.5 → `int(10.5)` = 10
- Scarcity = **10**

**Originality calculation**:
- originality_base = 70
- no boosters (boost additions = 0, count bonus = 0)
- pattern_penalty = 8 × 0.9 = 7.2
- scarcity bonus = 10 × 0.04 = 0.4
- originality = round(70 - 7.2 + 0 + 0.4) = round(63.2) = **63**

**Meaning calculation**:
- meaning_base = 50
- no boosters
- pattern cap (meaning=2): min(50, 100 - (5-2)×8) = min(50, 76) = 50
- meaning = round(50) = 50
- social demand (weak): +0
- Meaning = **50**

**Composite**:
- 10 × 0.4 + 63 × 0.35 + 50 × 0.25 = 4 + 22.05 + 12.5 = 38.55 → round = **39**
- 39 < 45 → 🔥 Red

**Verification command**:
```powershell
echo '{"description":"todo app","search_total_count":5000,"search_hit_ratio":0.9,"matched_patterns":[{"pattern":"todo_app","originality_penalty":8,"meaning":2,"match_ratio":0.9}],"matched_boosters":[],"social_demand_level":"weak"}' | python 'scripts/topic_scorer.py'
```

Expected output: `{"originality": 63, "scarcity": 10, "meaning": 50, "composite": 39, "ocean_type": "red", ...}`

### Example 2: Yellow Ocean — "Elderly Medication Reminder"

**Input**:
- search_total_count: 80, hit_ratio: 0.3
- matched_boosters: elderly, voice
- matched_patterns: []
- social_demand_level: weak

**Scarcity calculation**:
- 50 ≤ 80 < 200 → base 65
- 65 - 0.3 × 10 = 65 - 3 = 62
- Scarcity = **62**

**Originality calculation**:
- originality_base = 70
- elderly: +3 → 73; voice: +2 → 75
- count bonus: +2 (two boosters)
- scarcity bonus = 62 × 0.04 = 2.48
- no patterns → pattern_penalty = 0
- originality = round(75 - 0 + 2 + 2.48) = round(79.48) = **79**

**Meaning calculation**:
- meaning_base = 50
- elderly: meaning_boost=4 → +4×2=8 → 58; voice: meaning_boost=3 → +3×2=6 → 64
- no patterns cap
- meaning = round(64) = 64
- social demand (weak): +0
- Meaning = **64**

**Composite**:
- 62 × 0.4 + 79 × 0.35 + 64 × 0.25 = 24.8 + 27.65 + 16 = 68.45 → round = **68**
- 45 ≤ 68 < 70 → ⚡ Yellow

### Example 3: Blue Ocean — "AI Sign Language Translation Glove"

**Input**:
- search_total_count: 5, hit_ratio: 0.2
- matched_boosters: accessibility, deaf
- matched_patterns: []
- social_demand_level: strong

**Scarcity calculation**:
- total_count < 10 → base 90
- 90 - 0.2 × 5 = 90 - 1 = 89
- Scarcity = **89**

**Originality calculation**:
- originality_base = 70
- accessibility: +3 → 73; deaf: +3 → 76
- count bonus: +2 (two boosters)
- scarcity bonus = 89 × 0.04 = 3.56
- no patterns → pattern_penalty = 0
- originality = round(76 - 0 + 2 + 3.56) = round(81.56) = **82**

**Meaning calculation**:
- meaning_base = 50
- accessibility: meaning_boost=3 → +3×2=6 → 56; deaf: meaning_boost=5 → +5×2=10 → 66
- no patterns cap
- meaning = round(66) = 66
- social demand (strong): +10
- Meaning = clamp(66 + 10, 10, 98) = **76**

**Composite**:
- 89 × 0.4 + 82 × 0.35 + 76 × 0.25 = 35.6 + 28.7 + 19 = 83.3 → round = **83**
- 83 ≥ 70 → 🌊 Blue

## Key Implementation Notes

1. **Integer truncation in scarcity**: The `int()` call truncates toward zero (not round) BEFORE clamping. For example, `int(10.9)` becomes `10`, not `11`.

2. **Rounding in originality and meaning**: Both use `int(round(...))` — proper rounding (round half to even in Python 3) before truncation.

3. **Booster meaning_boost is doubled**: The code applies `booster["meaning_boost"] * 2` when adding to meaning_base. This is an important detail — a booster with meaning_boost=5 actually contributes +10 to meaning.

4. **Pattern meaning cap is a `min` operation**: It can only lower meaning_base, never raise it. If multiple patterns match, the cap is applied iteratively, so the most restrictive cap (lowest meaning level) wins.

5. **Social demand modifier key**: Use the string `false_demand` (with underscore), not `false` or `false-demand`.

6. **Clamp range**: All three final scores use [10, 98] except scarcity which uses [5, 98]. Meaning is clamped twice (once after rounding meaning_base, once after the social demand modifier).

7. **Composite rounding**: The final composite uses Python's built-in `round()` (round half to even).

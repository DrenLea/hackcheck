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
            originality_base += booster["boost"]
            meaning_base += booster["meaning_boost"] * 2

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
        int(round(originality_base - pattern_penalty + len(matched_boosters) + scarcity * 0.04)),
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

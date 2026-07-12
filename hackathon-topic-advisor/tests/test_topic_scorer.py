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

# tools/test_ai_proxy.py
"""Tests for ai_proxy.py core logic (no network, fetch injected)."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ai_proxy


# ---------- load_env ----------

def test_load_env_parses_key_value(tmp_path):
    p = tmp_path / ".env"
    p.write_text("HACKCHECK_API_KEY=sk-abc123\nAI_MODEL=gpt-4o-mini\n", encoding="utf-8")
    env = ai_proxy.load_env(str(p))
    assert env["HACKCHECK_API_KEY"] == "sk-abc123"
    assert env["AI_MODEL"] == "gpt-4o-mini"


def test_load_env_skips_comments_and_blank(tmp_path):
    p = tmp_path / ".env"
    p.write_text("# comment\n\nHACKCHECK_API_KEY=sk-x\nbareline\n", encoding="utf-8")
    env = ai_proxy.load_env(str(p))
    assert env == {"HACKCHECK_API_KEY": "sk-x"}


def test_load_env_missing_file_returns_empty():
    assert ai_proxy.load_env("/nonexistent/.env") == {}


def test_load_env_value_may_contain_equals(tmp_path):
    p = tmp_path / ".env"
    p.write_text("AI_BASE_URL=https://x.com/v1?a=b\n", encoding="utf-8")
    assert ai_proxy.load_env(str(p))["AI_BASE_URL"] == "https://x.com/v1?a=b"


# ---------- handle_ai_request ----------

GOOD_BODY = {"task": "understand", "messages": [{"role": "user", "content": "hi"}]}
ENV = {"HACKCHECK_API_KEY": "sk-test"}


def fake_fetch_ok(url, key, body):
    content = json.dumps({"summary": "s"})
    return 200, json.dumps({"choices": [{"message": {"content": content}}]})


def test_no_key_returns_no_key_error():
    status, resp = ai_proxy.handle_ai_request(GOOD_BODY, {}, fetch=fake_fetch_ok)
    assert status == 200
    assert resp == {"ok": False, "error": "no_key"}


def test_invalid_task_rejected():
    body = {"task": "hack", "messages": [{"role": "user", "content": "x"}]}
    status, resp = ai_proxy.handle_ai_request(body, ENV, fetch=fake_fetch_ok)
    assert status == 400
    assert resp["error"] == "bad_request"


def test_compare_task_accepted():
    body = {"task": "compare", "messages": [{"role": "user", "content": "x"}]}
    status, resp = ai_proxy.handle_ai_request(body, ENV, fetch=fake_fetch_ok)
    assert status == 200
    assert resp["ok"] is True


def test_missing_messages_rejected():
    status, resp = ai_proxy.handle_ai_request({"task": "understand"}, ENV, fetch=fake_fetch_ok)
    assert status == 400


def test_success_parses_content_json():
    status, resp = ai_proxy.handle_ai_request(GOOD_BODY, ENV, fetch=fake_fetch_ok)
    assert status == 200
    assert resp == {"ok": True, "data": {"summary": "s"}}


def test_upstream_401_maps_to_auth():
    status, resp = ai_proxy.handle_ai_request(
        GOOD_BODY, ENV, fetch=lambda u, k, b: (401, "unauthorized"))
    assert resp == {"ok": False, "error": "auth"}


def test_upstream_500_maps_to_upstream():
    status, resp = ai_proxy.handle_ai_request(
        GOOD_BODY, ENV, fetch=lambda u, k, b: (500, "boom"))
    assert resp == {"ok": False, "error": "upstream"}


def test_network_failure_maps_to_timeout():
    status, resp = ai_proxy.handle_ai_request(
        GOOD_BODY, ENV, fetch=lambda u, k, b: (0, ""))
    assert resp == {"ok": False, "error": "timeout"}


def test_malformed_content_maps_to_invalid_json():
    bad = json.dumps({"choices": [{"message": {"content": "not json {"}}]})
    status, resp = ai_proxy.handle_ai_request(
        GOOD_BODY, ENV, fetch=lambda u, k, b: (200, bad))
    assert resp == {"ok": False, "error": "invalid_json"}


def test_upstream_body_uses_env_and_defaults():
    captured = {}

    def spy(url, key, body):
        captured.update({"url": url, "key": key, "body": body})
        return 200, json.dumps({"choices": [{"message": {"content": "{}"}}]})

    ai_proxy.handle_ai_request(GOOD_BODY, ENV, fetch=spy)
    assert captured["url"] == "https://api.openai-next.com/v1/chat/completions"
    assert captured["key"] == "sk-test"
    assert captured["body"]["model"] == "deepseek-v4-flash"
    assert captured["body"]["temperature"] == 0.3
    assert captured["body"]["response_format"] == {"type": "json_object"}


# ---------- is_forbidden_path ----------

def test_dotfiles_forbidden():
    assert ai_proxy.is_forbidden_path('/.env')
    assert ai_proxy.is_forbidden_path('/.git/config')
    assert ai_proxy.is_forbidden_path('/docs/.hidden/x.md')


def test_normal_paths_allowed():
    assert not ai_proxy.is_forbidden_path('/')
    assert not ai_proxy.is_forbidden_path('/index.html')
    assert not ai_proxy.is_forbidden_path('/js/core.js')

#!/usr/bin/env python3
"""HackCheck 本地 AI 代理 + 静态文件服务器（纯标准库）。

用法: python tools/ai_proxy.py [port]     # 默认 8080
读取仓库根目录 .env: HACKCHECK_API_KEY / AI_BASE_URL / AI_MODEL
"""
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_BASE_URL = 'https://api.openai-next.com/v1'
DEFAULT_MODEL = 'gpt-4o-mini'
VALID_TASKS = {'understand', 'assess', 'advise'}
UPSTREAM_TIMEOUT = 18  # 秒，须小于前端的 20s 超时


def load_env(path):
    """解析 KEY=VALUE 行；跳过注释、空行、无 = 的行。"""
    env = {}
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, _, v = line.partition('=')
                env[k.strip()] = v.strip()
    except (FileNotFoundError, OSError):
        pass
    return env


def classify_upstream_error(status):
    return 'auth' if status in (401, 403) else 'upstream'


def _http_fetch(url, key, body):
    """POST 上游。返回 (status, text)；status=0 表示网络异常/超时。"""
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + key},
        method='POST')
    try:
        with urllib.request.urlopen(req, timeout=UPSTREAM_TIMEOUT) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')
    except Exception:
        return 0, ''


def handle_ai_request(body, env, fetch=None):
    """处理 {task, messages}。返回 (http_status, response_dict)。fetch 可注入用于测试。"""
    key = env.get('HACKCHECK_API_KEY', '')
    if not key:
        return 200, {'ok': False, 'error': 'no_key'}
    task = body.get('task')
    messages = body.get('messages')
    if task not in VALID_TASKS or not isinstance(messages, list) or not messages:
        return 400, {'ok': False, 'error': 'bad_request'}
    upstream_body = {
        'model': env.get('AI_MODEL', DEFAULT_MODEL),
        'messages': messages,
        'response_format': {'type': 'json_object'},
        'temperature': 0.3,
    }
    base = env.get('AI_BASE_URL', DEFAULT_BASE_URL).rstrip('/')
    if fetch is None:
        fetch = _http_fetch
    status, text = fetch(base + '/chat/completions', key, upstream_body)
    if status == 0:
        return 200, {'ok': False, 'error': 'timeout'}
    if status != 200:
        return 200, {'ok': False, 'error': classify_upstream_error(status)}
    try:
        content = json.loads(text)['choices'][0]['message']['content']
        return 200, {'ok': True, 'data': json.loads(content)}
    except (KeyError, IndexError, ValueError, TypeError):
        return 200, {'ok': False, 'error': 'invalid_json'}

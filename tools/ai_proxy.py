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
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_BASE_URL = 'https://api.openai-next.com/v1'
# 低成本模型；ds-v4-pro 在该中转站无渠道（中继报 no available channels），
# 用 deepseek-v4-flash（DeepSeek 最新代费率最低）替代，JSON 结构化输出稳定。
DEFAULT_MODEL = 'deepseek-v4-flash'
VALID_TASKS = {'understand', 'assess', 'advise', 'compare'}
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
    """POST 上游。返回 (status, text)；status=0 表示网络异常/超时。
    须带浏览器 UA：中转站前置 Cloudflare 会对 Python-urllib 默认 UA 返回 403（error 1010），
    与真实的 key 认证失败（auth）无法区分。"""
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + key,
                 'Accept': 'application/json',
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                               'AppleWebKit/537.36 (KHTML, like Gecko) '
                               'Chrome/126.0 Safari/537.36'},
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


def is_forbidden_path(path):
    """含点段的路径（.env、.git 等）一律拒绝。"""
    return any(part.startswith('.') for part in path.split('/') if part)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _send_json(self, status, obj):
        data = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/api/ai':
            env = load_env(os.path.join(ROOT, '.env'))
            self._send_json(200, {'ok': True,
                                  'hasKey': bool(env.get('HACKCHECK_API_KEY'))})
            return
        if is_forbidden_path(path):
            self._send_json(403, {'ok': False, 'error': 'forbidden'})
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/api/ai':
            self._send_json(404, {'ok': False, 'error': 'not_found'})
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length).decode('utf-8'))
        except (ValueError, TypeError):
            self._send_json(400, {'ok': False, 'error': 'bad_request'})
            return
        env = load_env(os.path.join(ROOT, '.env'))
        status, resp = handle_ai_request(body, env)
        self._send_json(status, resp)

    def log_message(self, fmt, *args):
        pass  # 静默访问日志，保持终端干净


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f'HackCheck: http://localhost:{port}  (Ctrl+C 停止)')
    try:
        ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
    except KeyboardInterrupt:
        print('\nbye')


if __name__ == '__main__':
    main()

// api/ai.js — Vercel Serverless Function
// 与 tools/ai_proxy.py 的 handle_ai_request 遵循同一契约，改一处必须同步改另一处。
const DEFAULT_BASE_URL = 'https://api.openai-next.com/v1';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const VALID_TASKS = new Set(['understand', 'assess', 'advise', 'compare']);
const UPSTREAM_TIMEOUT_MS = 18000; // 须小于前端 20s

export default async function handler(req, res) {
  const key = process.env.HACKCHECK_API_KEY || '';
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hasKey: !!key });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'bad_request' });
  }
  if (!key) {
    return res.status(200).json({ ok: false, error: 'no_key' });
  }
  const { task, messages } = req.body || {};
  if (!VALID_TASKS.has(task) || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }
  const base = (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || DEFAULT_MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: ctrl.signal,
    });
    if (r.status === 401 || r.status === 403) {
      return res.status(200).json({ ok: false, error: 'auth' });
    }
    if (!r.ok) {
      return res.status(200).json({ ok: false, error: 'upstream' });
    }
    const j = await r.json();
    const data = JSON.parse(j.choices[0].message.content);
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    const code = e.name === 'AbortError' ? 'timeout'
      : e instanceof SyntaxError || e instanceof TypeError ? 'invalid_json'
      : 'upstream';
    return res.status(200).json({ ok: false, error: code });
  } finally {
    clearTimeout(timer);
  }
}

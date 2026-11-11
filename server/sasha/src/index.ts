import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { findBannedPhrase, SAFE_FALLBACK } from './honesty.js';

/**
 * Sasha, the guide. POST /guide with { system, context, messages } as the app sends it.
 *
 * The app ships its own system prompt (built from the colour knowledge base) and the scan's
 * measured numbers. This service adds the model key, enforces size limits and rate limits,
 * sends the request to Claude, and filters the reply through the same honesty rules the app
 * uses. It stores nothing. No images or audio ever reach it; the app never sends them.
 */

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.SASHA_MODEL ?? 'claude-opus-5-5';
const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;
const RATE_PER_MIN = Number(process.env.SASHA_RATE_PER_MIN ?? 30);
const API_TOKEN = process.env.SASHA_APP_TOKEN ?? null; // optional shared secret the app sends as Bearer

const client = new Anthropic(); // ANTHROPIC_API_KEY from the environment

interface GuideRequest {
  system: string;
  context: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  b.count += 1;
  return b.count > RATE_PER_MIN;
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, limit = 64 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function validate(raw: unknown): GuideRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.system !== 'string' || typeof r.context !== 'string' || !Array.isArray(r.messages)) return null;
  if (r.system.length > 12_000 || r.context.length > MAX_CHARS) return null;
  const messages: GuideRequest['messages'] = [];
  for (const m of r.messages.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== 'object') return null;
    const mm = m as Record<string, unknown>;
    if ((mm.role !== 'user' && mm.role !== 'assistant') || typeof mm.content !== 'string') return null;
    messages.push({ role: mm.role, content: mm.content.slice(0, MAX_CHARS) });
  }
  if (!messages.length || messages[messages.length - 1]!.role !== 'user') return null;
  return { system: r.system, context: r.context, messages };
}

async function guide(body: GuideRequest): Promise<string> {
  // The knowledge-base system prompt is stable across requests, so it is cached; the per-scan
  // context changes per user and sits after the cache breakpoint.
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 1024,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: body.system, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `This user's scan:\n${body.context}` },
    ],
    messages: body.messages,
  });
  if (response.stop_reason === 'refusal') return SAFE_FALLBACK;
  const text = response.content
    .filter((b): b is Extract<(typeof response.content)[number], { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text || findBannedPhrase(text)) return SAFE_FALLBACK;
  return text;
}

const server = createServer(async (req, res) => {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.socket.remoteAddress ?? 'unknown').trim();
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, model: MODEL });
  if (req.method !== 'POST' || req.url !== '/guide') return json(res, 404, { error: 'not found' });
  if (API_TOKEN && req.headers.authorization !== `Bearer ${API_TOKEN}`) return json(res, 401, { error: 'unauthorised' });
  if (rateLimited(ip)) return json(res, 429, { error: 'slow down' });
  try {
    const body = validate(JSON.parse(await readBody(req)));
    if (!body) return json(res, 400, { error: 'invalid request' });
    const reply = await guide(body);
    return json(res, 200, { reply });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(res, 503, { error: 'busy', reply: SAFE_FALLBACK });
    if (e instanceof Anthropic.APIError) return json(res, 502, { error: 'upstream', reply: SAFE_FALLBACK });
    return json(res, 400, { error: 'bad request' });
  }
});

server.listen(PORT, () => {
  console.log(`Sasha listening on :${PORT} (model ${MODEL})`);
});

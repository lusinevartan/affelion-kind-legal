# Sasha server

A small Node service for the Affelion Aura guide. It holds the Anthropic API key so the app never
does, enforces request limits, and filters every reply through the same honesty rules as the app.

```bash
cd server/sasha
npm install
ANTHROPIC_API_KEY=... SASHA_APP_TOKEN=... npm run dev     # listens on :8787
curl -s localhost:8787/health
```

Deploy anywhere that runs Node 20+ (Fly, Render, Railway, a VPS). Set in the app build:
`EXPO_PUBLIC_GUIDE_ENDPOINT=https://<host>/guide`. If you set `SASHA_APP_TOKEN`, send it from
the app as a Bearer header (see `src/services/ai/guide.ts`).

The system prompt is the server's own (`src/systemPrompt.ts`). It is generated from the app's
colour knowledge base with `npm run sync:guide-prompt` in `affelion-aura`, and a test in the app
fails if the two drift. A prompt sent by a client is ignored, because the app token is public.
Set `SASHA_TRUST_PROXY=1` only when a proxy in front of the service sets `X-Forwarded-For`.

Model: `claude-opus-5-5` at low effort (short, grounded answers), with server-side refusal
fallbacks enabled. Override with `SASHA_MODEL`. Nothing is logged or stored.

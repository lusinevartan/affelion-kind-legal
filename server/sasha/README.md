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

Model: `claude-opus-5-5` at low effort (short, grounded answers), with server-side refusal
fallbacks enabled. Override with `SASHA_MODEL`. Nothing is logged or stored.

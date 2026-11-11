/// <reference types="node" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { askGuide, buildScanContext, GUIDE_NAME, GUIDE_SYSTEM_PROMPT, localGuideAnswer, sanitiseGuideReply } from '../src/services/ai/guide';
import { mapBiometricsToAura } from '../src/core/color';
import type { ScanRecord } from '../src/core/types';

const heart = { bpm: 78, rmssd: 34, sdnn: 40, pnn50: 12, beatCount: 50, quality: 0.85, durationSec: 40 };
const voice = { dominantPitchHz: 175, variance: 0.4, stability: 0.7, pitchVarianceSemitones: 1.8, energyVariance: 0.3, spectralCentroidHz: 1300, voicedRatio: 0.55, quality: 0.8, durationSec: 5 };
const record: ScanRecord = {
  id: 'scan_test',
  createdAt: 1_700_000_000_000,
  heart,
  voice,
  aura: mapBiometricsToAura({ heart, voice }),
  portraitUri: null,
  stillUri: null,
};

describe('guide guardrails', () => {
  test('the guide is Sasha, named as an assistant, and the prompt forbids the usual claims', () => {
    expect(GUIDE_NAME).toBe('Sasha');
    expect(GUIDE_SYSTEM_PROMPT).toContain('You are Sasha');
    expect(GUIDE_SYSTEM_PROMPT).toContain('not a person');
    expect(GUIDE_SYSTEM_PROMPT).toContain('Never diagnose');
  });

  test('context contains the real numbers and no invented claims', () => {
    const ctx = buildScanContext(record);
    expect(ctx).toContain('78 bpm');
    expect(ctx).toContain('RMSSD 34 ms');
    expect(ctx).toContain('175 Hz');
    expect(ctx).toContain('Colour family rule applied');
  });

  test('psychic or predictive replies are replaced', () => {
    expect(sanitiseGuideReply('Your energy field is strong and your destiny is bright.')).not.toContain('energy field');
    expect(sanitiseGuideReply('I can read your energy through the camera.')).not.toContain('read your energy');
    expect(sanitiseGuideReply('This could diagnose anxiety.')).not.toContain('diagnos');
  });

  test('grounded replies pass through unchanged', () => {
    const ok = 'Your pulse averaged 78 bpm, which the knowledge base maps to sky blue.';
    expect(sanitiseGuideReply(ok)).toBe(ok);
  });

  test('local answers are grounded and honest for every suggestion', () => {
    for (const q of ['Why is my centre this colour?', 'What does the halo mean?', 'How did my voice change the portrait?', 'Am I sick?', 'Tell me my future']) {
      const a = localGuideAnswer(q, record);
      expect(sanitiseGuideReply(a)).toBe(a);
      expect(a.length).toBeGreaterThan(20);
    }
    expect(localGuideAnswer('What does the halo mean?', record)).toContain('34 ms');
    expect(localGuideAnswer('Am I sick?', record)).toContain('not a medical device');
  });

  test('remote replies are sanitised and failures fall back locally', async () => {
    const bad = async () => new Response(JSON.stringify({ reply: 'Your chakra is open.' }), { status: 200 });
    const r1 = await askGuide('hello', record, [], { endpoint: 'https://example.invalid/guide', fetchImpl: bad as unknown as typeof fetch });
    expect(r1).not.toContain('chakra');
    const failing = async () => new Response('nope', { status: 500 });
    const r2 = await askGuide('What does the halo mean?', record, [], { endpoint: 'https://example.invalid/guide', fetchImpl: failing as unknown as typeof fetch });
    expect(r2).toContain('34 ms');
  });
});

describe('the server owns the prompt', () => {
  const serverDir = path.join(__dirname, '..', '..', 'server', 'sasha', 'src');

  test("the server's copy of the system prompt matches the app's (run `npm run sync:guide-prompt` if this fails)", () => {
    const file = fs.readFileSync(path.join(serverDir, 'systemPrompt.ts'), 'utf8');
    const literal = file.slice(file.indexOf('= ') + 2, file.lastIndexOf(';'));
    expect(JSON.parse(literal)).toBe(GUIDE_SYSTEM_PROMPT);
  });

  test('the server never reads a prompt from the request', () => {
    const index = fs.readFileSync(path.join(serverDir, 'index.ts'), 'utf8');
    expect(index).toContain('text: SYSTEM_PROMPT');
    expect(index).not.toMatch(/body\.system|r\.system/);
  });

  test('the app does not send a prompt', async () => {
    let sent: Record<string, unknown> = {};
    const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => {
      sent = JSON.parse(String(init?.body));
      return { ok: true, json: async () => ({ reply: 'Your pulse averaged 78 bpm.' }) };
    }) as unknown as typeof fetch;
    await askGuide('What does my centre mean?', record, [], { endpoint: 'https://example.invalid/guide', fetchImpl });
    expect(sent.system).toBeUndefined();
    expect(String(sent.context)).toContain('78 bpm');
  });

  test('health questions get the not-a-medical-device answer even when they mention the pulse', () => {
    for (const q of ['Is my heart rate a sign of disease?', 'What illness do I have?', 'Does my pulse mean anxiety?']) {
      expect(localGuideAnswer(q, record)).toContain('not a medical device');
    }
  });
});

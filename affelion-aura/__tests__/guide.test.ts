import { askGuide, buildScanContext, localGuideAnswer, sanitiseGuideReply } from '../src/services/ai/guide';
import { mapBiometricsToAura } from '../src/core/color';
import type { ScanRecord } from '../src/core/types';

const heart = { bpm: 78, rmssd: 34, sdnn: 40, pnn50: 12, beatCount: 50, quality: 0.85, durationSec: 40 };
const voice = { medianPitchHz: 175, pitchVarianceSemitones: 1.8, energyVariance: 0.3, spectralCentroidHz: 1300, voicedRatio: 0.55, quality: 0.8, durationSec: 6 };
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
  test('context contains the real numbers and no invented claims', () => {
    const ctx = buildScanContext(record);
    expect(ctx).toContain('78 bpm');
    expect(ctx).toContain('RMSSD 34 ms');
    expect(ctx).toContain('175 Hz');
  });

  test('psychic or predictive replies are replaced', () => {
    expect(sanitiseGuideReply('Your energy field is strong and your destiny is bright.')).not.toContain('energy field');
    expect(sanitiseGuideReply('I can read your energy through the camera.')).not.toContain('read your energy');
    expect(sanitiseGuideReply('This could diagnose anxiety.')).not.toContain('diagnos');
  });

  test('grounded replies pass through unchanged', () => {
    const ok = 'Your pulse averaged 78 bpm, which maps to lime green in the colour system.';
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

import {
  mapBiometricsToAura,
  mapBiometricsToColor,
  selectFamily,
  selectAchromatic,
  AURA_COLORS,
  COLOR_KNOWLEDGE_BASE,
  KB_BY_ID,
  findBannedPhrase,
  FAMILY_HUE,
} from '../src/core/color';
import type { BiometricInput, HeartMetrics, MappingInput, VoiceMetrics } from '../src/core/types';

const heart = (bpm: number, rmssd: number): HeartMetrics => ({
  bpm,
  rmssd,
  sdnn: rmssd * 1.2,
  pnn50: rmssd > 40 ? 30 : 5,
  beatCount: 40,
  quality: 0.9,
  durationSec: 40,
});

const voice = (variance: number, stability: number, pitch = 180): VoiceMetrics => ({
  dominantPitchHz: pitch,
  variance,
  stability,
  pitchVarianceSemitones: variance * 4,
  energyVariance: variance,
  spectralCentroidHz: 1200,
  voicedRatio: 0.6,
  quality: 0.8,
  durationSec: 5,
});

const input = (h: HeartMetrics, v: VoiceMetrics | null = voice(0.3, 0.6)): BiometricInput => ({ heart: h, voice: v });
const m = (bpm: number, hrv: number, vocalVariance = 0.3, vocalStability = 0.6, vocalPitchHz = 180): MappingInput => ({
  bpm,
  hrv,
  vocalPitchHz,
  vocalVariance,
  vocalStability,
});

const inRange = (hue: number, [lo, hi]: readonly [number, number]) => hue >= lo && hue <= hi;
const inReds = (hue: number) => hue <= 40 || hue >= 345;
const ACHROMATIC = ['soft_white', 'pearl', 'muted_gray', 'earth_brown', 'charcoal'];
const isAchromatic = (id: string) => ACHROMATIC.includes(id);

describe('family rules (evaluated in the specified order)', () => {
  test('hrv >= 55 and bpm <= 78 → greens/teals, hue 140–190, low turbulence', () => {
    for (const [bpm, hrv] of [[55, 55], [78, 60], [70, 95], [62, 70]]) {
      const out = mapBiometricsToColor(m(bpm!, hrv!));
      expect(out.family).toBe('greensTeals');
      expect(inRange(out.hue, FAMILY_HUE.greensTeals)).toBe(true);
      expect(out.turbulence).toBeLessThanOrEqual(0.25);
      expect([...ACHROMATIC, 'emerald', 'teal', 'aqua']).toContain(out.primaryColorId);
    }
  });

  test('bpm >= 92 or hrv <= 28 → reds/oranges with higher turbulence and pulse speed', () => {
    for (const [bpm, hrv] of [[92, 60], [110, 40], [80, 28], [75, 15]]) {
      const out = mapBiometricsToColor(m(bpm!, hrv!));
      expect(out.family).toBe('redsOranges');
      expect(inReds(out.hue)).toBe(true);
      expect(out.turbulence).toBeGreaterThanOrEqual(0.6);
      expect(['deep_red', 'crimson', 'bright_orange', 'amber']).toContain(out.primaryColorId);
    }
    const calm = mapBiometricsToColor(m(70, 60));
    const fast = mapBiometricsToColor(m(100, 60));
    expect(fast.pulseSpeed).toBeGreaterThan((100 / 60) * 1.1);
    expect(fast.pulseSpeed).toBeGreaterThan(calm.pulseSpeed);
  });

  test('bpm <= 62 → blues/indigos, hue 200–270, low turbulence', () => {
    for (const [bpm, hrv] of [[62, 45], [50, 50], [45, 40]]) {
      const out = mapBiometricsToColor(m(bpm!, hrv!));
      expect(out.family).toBe('bluesIndigos');
      expect(out.turbulence).toBeLessThanOrEqual(0.2);
      if (isAchromatic(out.primaryColorId)) continue;
      expect(inRange(out.hue, FAMILY_HUE.bluesIndigos)).toBe(true);
      expect(['sky_blue', 'cobalt', 'indigo', 'violet', 'lavender']).toContain(out.primaryColorId);
    }
  });

  test('otherwise → sky blue 195–215', () => {
    for (const [bpm, hrv] of [[70, 45], [85, 50], [63, 30], [91, 54]]) {
      const out = mapBiometricsToColor(m(bpm!, hrv!));
      expect(out.family).toBe('skyBlue');
      if (isAchromatic(out.primaryColorId)) continue;
      expect(inRange(out.hue, FAMILY_HUE.skyBlue)).toBe(true);
      expect(out.primaryColorId).toBe('sky_blue');
    }
  });

  test('rule order: greens before reds, reds before blues', () => {
    expect(selectFamily(m(60, 60))).toBe('greensTeals');
    expect(selectFamily(m(60, 20))).toBe('redsOranges');
    expect(selectFamily(m(60, 40))).toBe('bluesIndigos');
  });
});

describe('vocal signals', () => {
  test('vocalVariance raises saturation and triggers a brighter accent', () => {
    const flat = mapBiometricsToColor(m(70, 45, 0.1, 0.6));
    const varied = mapBiometricsToColor(m(70, 45, 0.9, 0.6));
    expect(varied.saturation).toBeGreaterThan(flat.saturation + 0.2);
    expect(flat.accentStrength).toBe(0);
    expect(varied.accentStrength).toBeGreaterThan(0.5);
  });

  test('vocalStability sets lightness', () => {
    const shaky = mapBiometricsToColor(m(70, 45, 0.3, 0.1));
    const steady = mapBiometricsToColor(m(70, 45, 0.3, 0.95));
    expect(steady.lightness).toBeGreaterThan(shaky.lightness + 0.1);
  });
});

describe('shade refinement by secondary signals', () => {
  test('deep red vs crimson: crimson needs high BPM with moderate-to-high vocal variance', () => {
    expect(mapBiometricsToColor(m(112, 20, 0.2, 0.5)).primaryColorId).toBe('deep_red');
    expect(mapBiometricsToColor(m(112, 20, 0.8, 0.5)).primaryColorId).toBe('crimson');
    expect(inRange(mapBiometricsToColor(m(112, 20, 0.8, 0.5)).hue, KB_BY_ID.crimson.hueRange!)).toBe(true);
  });

  test('bright orange vs amber: amber needs positive vocal energy without high BPM', () => {
    expect(mapBiometricsToColor(m(80, 28, 0.2, 0.5)).primaryColorId).toBe('bright_orange');
    expect(mapBiometricsToColor(m(80, 28, 0.7, 0.5)).primaryColorId).toBe('amber');
  });

  test('teal vs aqua: aqua needs an open, steady voice', () => {
    expect(mapBiometricsToColor(m(58, 98, 0.1, 0.9)).primaryColorId).toBe('teal');
    expect(mapBiometricsToColor(m(58, 98, 0.7, 0.9)).primaryColorId).toBe('aqua');
    expect(mapBiometricsToColor(m(76, 56, 0.3, 0.6)).primaryColorId).toBe('emerald');
  });

  test('cobalt, indigo, violet, lavender inside the blues family', () => {
    expect(mapBiometricsToColor(m(58, 45, 0.3, 0.9)).primaryColorId).toBe('cobalt');
    expect(mapBiometricsToColor(m(60, 45, 0.3, 0.3)).primaryColorId).toBe('sky_blue');
    expect(mapBiometricsToColor(m(52, 45, 0.5, 0.5)).primaryColorId).toBe('indigo');
    expect(mapBiometricsToColor(m(46, 45, 0.5, 0.9)).primaryColorId).toBe('violet');
    expect(mapBiometricsToColor(m(46, 45, 0.2, 0.5)).primaryColorId).toBe('lavender');
  });

  test('every chromatic primary lands inside its own knowledge-base hue range', () => {
    for (let bpm = 42; bpm <= 125; bpm += 3) {
      for (let hrv = 8; hrv <= 130; hrv += 7) {
        for (const [vv, vs] of [[0.05, 0.9], [0.3, 0.6], [0.55, 0.75], [0.9, 0.2]]) {
          const out = mapBiometricsToColor(m(bpm, hrv, vv!, vs!));
          const kb = KB_BY_ID[out.primaryColorId];
          if (kb.hueRange) expect(inRange(out.hue, kb.hueRange)).toBe(true);
          expect(out.secondaryColorId).not.toBe(out.primaryColorId);
        }
      }
    }
  });
});

describe('achromatic tones from the knowledge base', () => {
  test('charcoal for very low energy markers', () => {
    expect(selectAchromatic(m(48, 20, 0.1, 0.5), true)).toBe('charcoal');
    const out = mapBiometricsToColor(m(48, 20, 0.1, 0.5));
    expect(out.primaryColorId).toBe('charcoal');
    expect(out.lightness).toBeLessThan(0.25);
  });
  test('muted gray for low activation or a flat voice, never over strong HRV', () => {
    expect(mapBiometricsToColor(m(58, 35, 0.3, 0.5)).primaryColorId).toBe('muted_gray');
    expect(mapBiometricsToColor(m(66, 50, 0.05, 0.9)).primaryColorId).toBe('muted_gray');
    expect(mapBiometricsToColor(m(58, 98, 0.05, 0.9)).primaryColorId).toBe('teal');
  });
  test('earth brown for moderate-low BPM with reduced HRV', () => {
    const out = mapBiometricsToColor(m(66, 30, 0.3, 0.5));
    expect(out.primaryColorId).toBe('earth_brown');
    expect(out.saturation).toBeLessThan(0.3);
  });
  test('soft white and pearl for strong HRV', () => {
    expect(mapBiometricsToColor(m(64, 90, 0.4, 0.8)).primaryColorId).toBe('soft_white');
    expect(mapBiometricsToColor(m(64, 72, 0.5, 0.4)).primaryColorId).toBe('pearl');
  });
  test('without a voice sample, voice-dependent tones are not selected', () => {
    expect(selectAchromatic(m(64, 90, 0, 0.5), false)).toBeNull();
    expect(selectAchromatic(m(66, 50, 0, 0.5), false)).toBeNull();
  });
});

describe('determinism and copy', () => {
  test('identical inputs produce identical outputs', () => {
    const a = mapBiometricsToAura(input(heart(72, 45)));
    const b = mapBiometricsToAura(input(heart(72, 45)));
    expect(b).toEqual(a);
  });

  test('inputs within the quantisation step are identical', () => {
    const a = mapBiometricsToAura(input(heart(72.2, 45.3)));
    const b = mapBiometricsToAura(input(heart(71.8, 44.7)));
    expect(b.hue).toBe(a.hue);
    expect(b.seed).toBe(a.seed);
    expect(b.primaryColorId).toBe(a.primaryColorId);
  });

  test('outputs stay in range across a grid and copy stays honest', () => {
    for (let bpm = 40; bpm <= 125; bpm += 5) {
      for (let hrv = 8; hrv <= 130; hrv += 12) {
        for (const v of [null, voice(0.1, 0.9), voice(0.5, 0.5), voice(0.95, 0.1)]) {
          const p = mapBiometricsToAura(input(heart(bpm, hrv), v));
          expect(p.hue).toBeGreaterThanOrEqual(0);
          expect(p.hue).toBeLessThan(360);
          expect(p.saturation).toBeGreaterThanOrEqual(0.05);
          expect(p.saturation).toBeLessThanOrEqual(0.98);
          expect(p.lightness).toBeGreaterThanOrEqual(0.15);
          expect(p.lightness).toBeLessThanOrEqual(0.92);
          expect(p.turbulence).toBeGreaterThanOrEqual(0);
          expect(p.turbulence).toBeLessThanOrEqual(1);
          expect(p.pulseSpeed).toBeGreaterThanOrEqual(0.6);
          expect(p.pulseSpeed).toBeLessThanOrEqual(2.2);
          expect(p.regions).toHaveLength(2);
          for (const r of p.regions) {
            expect(findBannedPhrase(r.explanation)).toBeNull();
            expect(r.explanation).toContain(KB_BY_ID[r.colorId].explanation);
          }
          expect(findBannedPhrase(p.summary)).toBeNull();
        }
      }
    }
  });

  test('explanations quote the knowledge base and the actual numbers', () => {
    const p = mapBiometricsToAura(input(heart(88, 23), voice(0.4, 0.7, 165)));
    const core = p.regions.find((r) => r.id === 'core')!;
    expect(core.explanation).toContain(KB_BY_ID[p.primaryColorId].explanation);
    expect(core.explanation).toContain('88 bpm');
    expect(core.explanation).toContain('HRV 23 ms');
    expect(core.explanation).toContain('165 Hz');
    expect(p.summary).toContain(KB_BY_ID[p.primaryColorId].name);
    const noVoice = mapBiometricsToAura(input(heart(88, 23), null));
    expect(noVoice.regions[0]!.explanation).toContain('No usable voice sample');
  });

  test('the knowledge base is complete and swatches exist for every entry', () => {
    expect(COLOR_KNOWLEDGE_BASE).toHaveLength(20);
    for (const c of COLOR_KNOWLEDGE_BASE) {
      expect(AURA_COLORS[c.id].hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(AURA_COLORS[c.id].explanation).toBe(c.explanation);
    }
  });
});

describe('every colour in the knowledge base can appear', () => {
  const withRecovery = (bpm: number, hrv: number, recovery: number, vv = 0.3, vs = 0.6): MappingInput => ({ ...m(bpm, hrv, vv, vs), recovery });

  test('all twenty entries are reachable as a primary colour, with or without a voice', () => {
    const seen = new Set<string>();
    for (const voiceAvailable of [true, false]) {
      for (let bpm = 42; bpm <= 124; bpm += 2) {
        for (let hrv = 8; hrv <= 110; hrv += 3) {
          for (const vv of [0.05, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
            for (const vs of [0.2, 0.4, 0.6, 0.8, 0.95]) {
              for (const recovery of [0, 0.6]) {
                seen.add(mapBiometricsToColor(withRecovery(bpm, hrv, recovery, voiceAvailable ? vv : 0, voiceAvailable ? vs : 0.5), voiceAvailable).primaryColorId);
              }
            }
          }
        }
      }
    }
    expect([...seen].sort()).toEqual(COLOR_KNOWLEDGE_BASE.map((c) => c.id).sort());
  });

  test('golden yellow: balanced-to-active state with vocal variance', () => {
    const out = mapBiometricsToColor(m(80, 45, 0.7, 0.6));
    expect(out.primaryColorId).toBe('golden_yellow');
    expect(inRange(out.hue, KB_BY_ID.golden_yellow.hueRange!)).toBe(true);
    expect(out.family).toBe('skyBlue');
    // The same pulse and variability with a quiet voice stays sky blue.
    expect(mapBiometricsToColor(m(80, 45, 0.3, 0.6)).primaryColorId).toBe('sky_blue');
    // And it needs a voice sample at all.
    expect(mapBiometricsToColor(m(80, 45, 0, 0.5), false).primaryColorId).toBe('sky_blue');
  });

  test('magenta: mixed activation (raised pulse, strong variability) with an expressive voice', () => {
    const out = mapBiometricsToColor(m(85, 60, 0.7, 0.5));
    expect(out.primaryColorId).toBe('magenta');
    expect(inRange(out.hue, KB_BY_ID.magenta.hueRange!)).toBe(true);
    // With a calmer pulse the first rule still wins.
    expect(mapBiometricsToColor(m(76, 60, 0.7, 0.5)).family).toBe('greensTeals');
  });

  test('lime green: the reading itself shows recovery', () => {
    const out = mapBiometricsToColor(withRecovery(80, 45, 0.6));
    expect(out.primaryColorId).toBe('lime');
    expect(inRange(out.hue, KB_BY_ID.lime.hueRange!)).toBe(true);
    // No recovery, no lime.
    expect(mapBiometricsToColor(withRecovery(80, 45, 0.2)).primaryColorId).not.toBe('lime');
    // Recovery never repaints a calm reading or a strongly activated one.
    expect(mapBiometricsToColor(withRecovery(66, 70, 0.9)).family).toBe('greensTeals');
    expect(mapBiometricsToColor(withRecovery(66, 70, 0.9)).primaryColorId).not.toBe('lime');
    expect(mapBiometricsToColor(withRecovery(116, 14, 0.9)).primaryColorId).not.toBe('lime');
    // It may soften a reading that is only just past the activation thresholds.
    expect(mapBiometricsToColor(withRecovery(93, 40, 0.8)).primaryColorId).toBe('lime');
  });

  test('the four family rules still decide which rule is reported', () => {
    expect(selectFamily(m(80, 45))).toBe('skyBlue');
    expect(mapBiometricsToColor(withRecovery(80, 45, 0.6)).family).toBe('skyBlue');
  });

  test('a saved reading without a recovery value behaves as it always did', () => {
    const a = mapBiometricsToAura(input(heart(80, 45)));
    const b = mapBiometricsToAura(input({ ...heart(80, 45), recovery: 0 }));
    expect(a.primaryColorId).toBe(b.primaryColorId);
    expect(a.hue).toBe(b.hue);
    expect(a.seed).toBe(b.seed);
  });
});

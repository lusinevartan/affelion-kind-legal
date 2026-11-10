import { mapBiometricsToAura, normalise, AURA_COLORS, findBannedPhrase, hslToHex } from '../src/core/color';
import type { BiometricInput, HeartMetrics, VoiceMetrics } from '../src/core/types';

const heart = (bpm: number, rmssd: number, extra: Partial<HeartMetrics> = {}): HeartMetrics => ({
  bpm,
  rmssd,
  sdnn: rmssd * 1.2,
  pnn50: rmssd > 40 ? 30 : 5,
  beatCount: 40,
  quality: 0.9,
  durationSec: 40,
  ...extra,
});

const voice = (pitchVar: number, energyVar = 0.3, centroid = 1200): VoiceMetrics => ({
  medianPitchHz: 180,
  pitchVarianceSemitones: pitchVar,
  energyVariance: energyVar,
  spectralCentroidHz: centroid,
  voicedRatio: 0.6,
  quality: 0.8,
  durationSec: 6,
});

const input = (h: HeartMetrics, v: VoiceMetrics | null = voice(1.5)): BiometricInput => ({ heart: h, voice: v });

const isWarm = (hue: number) => hue <= 50 || hue >= 345;
const isGreenTeal = (hue: number) => hue >= 80 && hue <= 185;
const isBlueIndigo = (hue: number) => hue >= 195 && hue <= 270;

describe('deterministic biometric → aura mapping', () => {
  test('identical inputs produce identical outputs', () => {
    const a = mapBiometricsToAura(input(heart(72, 45)));
    const b = mapBiometricsToAura(input(heart(72, 45)));
    expect(b).toEqual(a);
  });

  test('inputs within the quantisation step produce identical outputs', () => {
    const a = mapBiometricsToAura(input(heart(72.2, 45.3)));
    const b = mapBiometricsToAura(input(heart(71.8, 44.7)));
    expect(b.hue).toBe(a.hue);
    expect(b.seed).toBe(a.seed);
    expect(b.dominant).toBe(a.dominant);
  });

  test('high BPM → reds/oranges with high turbulence', () => {
    const p = mapBiometricsToAura(input(heart(105, 20)));
    expect(isWarm(p.hue)).toBe(true);
    expect(['deepRed', 'brightOrange']).toContain(p.dominant);
    expect(p.turbulence).toBeGreaterThan(0.6);
  });

  test('low HRV at a mid pulse pulls toward red/orange', () => {
    const p = mapBiometricsToAura(input(heart(80, 14)));
    expect(p.hue <= 60 || p.hue >= 340).toBe(true);
    expect(p.turbulence).toBeGreaterThan(0.5);
  });

  test('high HRV + calm BPM → greens/teals with smooth motion', () => {
    const p = mapBiometricsToAura(input(heart(62, 85)));
    expect(isGreenTeal(p.hue)).toBe(true);
    expect(['teal', 'limeGreen']).toContain(p.dominant);
    expect(p.turbulence).toBeLessThan(0.35);
  });

  test('low BPM → blues/indigos', () => {
    const p = mapBiometricsToAura(input(heart(50, 40)));
    expect(isBlueIndigo(p.hue)).toBe(true);
    expect(['skyBlue', 'indigo', 'violet']).toContain(p.dominant);
  });

  test('vocal variance raises saturation and adds a bright accent', () => {
    const flat = mapBiometricsToAura(input(heart(70, 45), voice(0.4, 0.05, 600)));
    const varied = mapBiometricsToAura(input(heart(70, 45), voice(3.8, 0.9, 2400)));
    expect(varied.saturation).toBeGreaterThan(flat.saturation + 0.15);
    expect(varied.accent).toBe('goldenYellow');
    expect(varied.accentStrength).toBeGreaterThan(0.3);
  });

  test('low energy and low coherence yields muted earth tones', () => {
    const p = mapBiometricsToAura(input(heart(52, 12), voice(0.3, 0.05, 500)));
    expect(p.saturation).toBeLessThan(0.3);
    expect(p.dominant).toBe('earth');
  });

  test('very high coherence lifts toward soft white', () => {
    const p = mapBiometricsToAura(input(heart(58, 110), voice(0.5)));
    expect(p.lightness).toBeGreaterThan(0.7);
    expect(p.dominant).toBe('softWhite');
  });

  test('pulse speed follows BPM', () => {
    expect(mapBiometricsToAura(input(heart(60, 40))).pulseSpeed).toBeCloseTo(1, 2);
    expect(mapBiometricsToAura(input(heart(90, 40))).pulseSpeed).toBeCloseTo(1.5, 2);
  });

  test('all parameters stay in range across a grid of inputs', () => {
    for (let bpm = 40; bpm <= 120; bpm += 5) {
      for (let rmssd = 8; rmssd <= 130; rmssd += 12) {
        for (const v of [null, voice(0.3), voice(2), voice(4.5, 1, 3000)]) {
          const p = mapBiometricsToAura(input(heart(bpm, rmssd), v));
          expect(p.hue).toBeGreaterThanOrEqual(0);
          expect(p.hue).toBeLessThan(360);
          expect(p.saturation).toBeGreaterThanOrEqual(0.14);
          expect(p.saturation).toBeLessThanOrEqual(0.95);
          expect(p.lightness).toBeGreaterThanOrEqual(0.3);
          expect(p.lightness).toBeLessThanOrEqual(0.9);
          expect(p.turbulence).toBeGreaterThanOrEqual(0);
          expect(p.turbulence).toBeLessThanOrEqual(1);
          expect(p.pulseSpeed).toBeGreaterThanOrEqual(0.6);
          expect(p.pulseSpeed).toBeLessThanOrEqual(2.2);
          expect(p.regions.length).toBeGreaterThanOrEqual(2);
          expect(p.regions.length).toBeLessThanOrEqual(3);
          expect(p.secondary).not.toBe(p.dominant);
          for (const r of p.regions) expect(findBannedPhrase(r.explanation)).toBeNull();
          expect(findBannedPhrase(p.summary)).toBeNull();
        }
      }
    }
  });

  test('normalisation is monotonic in BPM and RMSSD', () => {
    const a = normalise(input(heart(55, 30)));
    const b = normalise(input(heart(95, 30)));
    expect(b.activation).toBeGreaterThan(a.activation);
    const c = normalise(input(heart(70, 20)));
    const d = normalise(input(heart(70, 80)));
    expect(d.coherence).toBeGreaterThan(c.coherence);
  });

  test('explanations reference the actual numbers', () => {
    const p = mapBiometricsToAura(input(heart(88, 23)));
    const core = p.regions.find((r) => r.id === 'core')!;
    expect(core.explanation).toContain('88 bpm');
    expect(core.explanation).toContain('23 ms');
    expect(p.summary).toContain('88 bpm');
  });

  test('colour system hex values match their HSL definitions closely', () => {
    for (const c of Object.values(AURA_COLORS)) {
      const fromHsl = hslToHex(c.hsl);
      const a = parseInt(fromHsl.slice(1), 16);
      const b = parseInt(c.hex.slice(1), 16);
      const dr = Math.abs(((a >> 16) & 255) - ((b >> 16) & 255));
      const dg = Math.abs(((a >> 8) & 255) - ((b >> 8) & 255));
      const db = Math.abs((a & 255) - (b & 255));
      expect(Math.max(dr, dg, db)).toBeLessThan(14);
    }
  });
});

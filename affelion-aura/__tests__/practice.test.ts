import { practiceReducer, initialPracticeState, PRACTICE, cycleSeconds, type PracticeState } from '../src/core/practice/practiceMachine';
import { auraFromWindow, blendAuraParams } from '../src/core/color/live';
import { computeBaseline, hrvTrend, scanInsight } from '../src/core/insight/baseline';
import { mapBiometricsToAura } from '../src/core/color';
import type { ScanRecord } from '../src/core/types';

const ticks = (s: PracticeState, n: number, dt = 0.5) => Array.from({ length: n }).reduce<PracticeState>((st) => practiceReducer(st, { type: 'TICK', dt }), s);

describe('practice machine', () => {
  test('settle waits for coverage and enough beats, then breathes for the duration', () => {
    let s = practiceReducer(initialPracticeState, { type: 'START', durationSec: 120 });
    s = ticks(s, 10);
    expect(s.phase).toBe('settle');
    s = practiceReducer(s, { type: 'COVERAGE', covered: true });
    s = practiceReducer(s, { type: 'SETTLE_PROGRESS', beats: PRACTICE.settleMinBeats });
    s = practiceReducer(s, { type: 'TICK', dt: 0.5 });
    expect(s.phase).toBe('breathe');
    s = ticks(s, 100); // 50 s
    expect(s.elapsed).toBeCloseTo(50, 5);
    expect(['inhale', 'exhale']).toContain(s.breathing);
    s = ticks(s, 200);
    expect(s.phase).toBe('done');
    expect(s.elapsed).toBe(120);
  });

  test('a lifted finger pauses the timer instead of counting', () => {
    let s = practiceReducer(initialPracticeState, { type: 'START' });
    s = practiceReducer(s, { type: 'COVERAGE', covered: true });
    s = practiceReducer(s, { type: 'SETTLE_PROGRESS', beats: 12 });
    s = practiceReducer(s, { type: 'TICK', dt: 0.5 });
    s = ticks(s, 20);
    const before = s.elapsed;
    s = practiceReducer(s, { type: 'COVERAGE', covered: false });
    s = ticks(s, 20);
    expect(s.elapsed).toBe(before);
    expect(s.uncoveredFor).toBeGreaterThan(PRACTICE.coverageGraceSec);
  });

  test('settle fails after the cap', () => {
    let s = practiceReducer(initialPracticeState, { type: 'START' });
    s = ticks(s, PRACTICE.settleMaxSec * 2 + 2);
    expect(s.phase).toBe('failed');
  });

  test('breath phase follows the pacer rate and the find-rate mode steps through rates', () => {
    expect(cycleSeconds(6)).toBe(10);
    let s = practiceReducer(initialPracticeState, { type: 'START', mode: 'findRate' });
    s = practiceReducer(s, { type: 'COVERAGE', covered: true });
    s = practiceReducer(s, { type: 'SETTLE_PROGRESS', beats: 12 });
    s = practiceReducer(s, { type: 'TICK', dt: 0.5 });
    expect(s.breathsPerMinute).toBe(6.5);
    s = ticks(s, PRACTICE.resonanceSegmentSec * 2 + 1);
    expect(s.breathsPerMinute).toBe(6);
    expect(s.rateIndex).toBe(1);
    s = ticks(s, PRACTICE.resonanceSegmentSec * 2 * 3);
    expect(s.phase).toBe('done');
  });

  test('early finish only once an after-window exists', () => {
    let s = practiceReducer(initialPracticeState, { type: 'START' });
    s = practiceReducer(s, { type: 'COVERAGE', covered: true });
    s = practiceReducer(s, { type: 'SETTLE_PROGRESS', beats: 12 });
    s = practiceReducer(s, { type: 'TICK', dt: 0.5 });
    s = ticks(s, 20);
    expect(practiceReducer(s, { type: 'FINISH_EARLY' }).phase).toBe('breathe');
    s = ticks(s, PRACTICE.afterWindowSec * 2);
    expect(practiceReducer(s, { type: 'FINISH_EARLY' }).phase).toBe('done');
  });
});

describe('live aura', () => {
  const voice = { vocalPitchHz: 170, vocalVariance: 0.3, vocalStability: 0.6 };
  test('coherence lowers turbulence and keeps the family rule', () => {
    const a = auraFromWindow({ bpm: 70, hrv: 60, coherence: 0 }, voice, true);
    const b = auraFromWindow({ bpm: 70, hrv: 60, coherence: 1 }, voice, true);
    expect(a.family).toBe('greensTeals');
    expect(b.turbulence).toBeLessThan(a.turbulence);
    expect(b.turbulence).toBeCloseTo(a.turbulence * 0.5, 5);
  });
  test('blend eases continuous parameters and keeps the seed', () => {
    const a = auraFromWindow({ bpm: 95, hrv: 30, coherence: 0.2 }, voice, true);
    const b = auraFromWindow({ bpm: 60, hrv: 70, coherence: 0.8 }, voice, true);
    const mid = blendAuraParams(a, b, 0.5);
    expect(mid.saturation).toBeCloseTo((a.saturation + b.saturation) / 2, 5);
    expect(mid.primaryColorId).toBe(b.primaryColorId);
    expect(mid.seed).toBe(a.seed);
    expect(blendAuraParams(null, b, 0.5)).toEqual(b);
  });
});

describe('baseline and trend', () => {
  const scan = (i: number, bpm: number, rmssd: number): ScanRecord => {
    const heart = { bpm, rmssd, sdnn: rmssd, pnn50: 10, beatCount: 40, quality: 0.9, durationSec: 40 };
    return { id: `s${i}`, createdAt: 1_700_000_000_000 + i * 86_400_000, heart, voice: null, aura: mapBiometricsToAura({ heart, voice: null }), portraitUri: null, stillUri: null };
  };
  // newest first, as storage returns them
  const rising = [scan(6, 66, 62), scan(5, 68, 58), scan(4, 70, 52), scan(3, 70, 47), scan(2, 72, 43), scan(1, 74, 40)];

  test('needs three scans', () => {
    expect(computeBaseline(rising.slice(0, 2))).toBeNull();
    expect(computeBaseline(rising)!.scans).toBe(6);
  });
  test('detects an improving HRV trend and presents it as lime', () => {
    expect(hrvTrend(rising)).toBe('improving');
    const insight = scanInsight(rising[0]!, rising);
    expect(insight.trend).toBe('improving');
    expect(insight.trendColorId).toBe('lime');
    expect(insight.sentence).toContain('62 ms');
    expect(insight.sentence).toContain('trending up');
  });
  test('steady and declining', () => {
    const flat = [scan(3, 70, 50), scan(2, 71, 51), scan(1, 69, 49)];
    expect(hrvTrend(flat)).toBe('steady');
    expect(hrvTrend([...rising].reverse().map((s, i) => ({ ...s, id: `d${i}` })))).toBe('declining');
  });
  test('baseline excludes the scan being explained', () => {
    const insight = scanInsight(rising[0]!, rising);
    expect(insight.baseline!.scans).toBe(5);
    expect(insight.rmssdDelta).toBeGreaterThan(0);
  });
});

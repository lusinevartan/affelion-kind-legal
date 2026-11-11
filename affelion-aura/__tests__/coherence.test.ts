import { CoherenceAnalyzer, pickResonanceRate } from '../src/core/signal/coherence';

/** Beat times from an interval model, seconds. */
function beats(ibiFn: (t: number) => number, seconds: number, seed = 3): number[] {
  const out: number[] = [];
  let t = 0;
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296 - 0.5;
  };
  while (t < seconds) {
    out.push(t);
    t += ibiFn(t) / 1000 + rnd() * 0.004;
  }
  return out;
}

describe('CoherenceAnalyzer', () => {
  test('paced breathing at 6/min yields high coherence with a 0.1 Hz peak and large RSA', () => {
    const a = new CoherenceAnalyzer();
    for (const b of beats((t) => 900 + 70 * Math.sin(2 * Math.PI * 0.1 * t), 60)) a.pushBeat(b);
    const e = a.estimate()!;
    expect(e).not.toBeNull();
    expect(e.level).toBe('high');
    expect(e.score).toBeGreaterThan(0.7);
    expect(Math.abs(e.peakHz! - 0.1)).toBeLessThan(0.02);
    expect(e.rsaMs).toBeGreaterThan(100);
    expect(Math.abs(e.bpm - 66.7)).toBeLessThan(2);
  });

  test('irregular rhythm yields low coherence', () => {
    const a = new CoherenceAnalyzer();
    let s = 11;
    const noise = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s / 4294967296 - 0.5) * 2;
    };
    for (const b of beats(() => 850 + 60 * noise(), 60)) a.pushBeat(b);
    const e = a.estimate()!;
    expect(e.level).toBe('low');
    expect(e.score).toBeLessThan(0.35);
  });

  test('breathing sync is high on the pacer frequency and low off it', () => {
    const on = new CoherenceAnalyzer();
    for (const b of beats((t) => 900 + 60 * Math.sin(2 * Math.PI * 0.1 * t), 60)) on.pushBeat(b);
    const off = new CoherenceAnalyzer();
    for (const b of beats((t) => 900 + 60 * Math.sin(2 * Math.PI * 0.2 * t), 60)) off.pushBeat(b);
    expect(CoherenceAnalyzer.breathingSync(on.estimate(), 0.1)).toBeGreaterThan(0.7);
    expect(CoherenceAnalyzer.breathingSync(off.estimate(), 0.1)).toBeLessThan(0.2);
  });

  test('needs enough beats and ignores out-of-order beats', () => {
    const a = new CoherenceAnalyzer();
    for (const b of beats(() => 900, 5)) a.pushBeat(b);
    expect(a.estimate()).toBeNull();
    a.pushBeat(1); // out of order
    expect(a.beatCount).toBe(beats(() => 900, 5).length);
  });

  test('a sliding window forgets old beats', () => {
    const a = new CoherenceAnalyzer({ windowSec: 32 });
    for (const b of beats(() => 900, 120)) a.pushBeat(b);
    expect(a.beatCount).toBeLessThan(45);
  });
});

describe('pickResonanceRate', () => {
  test('chooses the rate with the largest RSA, coherence breaking ties', () => {
    const pick = pickResonanceRate([
      { breathsPerMinute: 6.5, rsaMs: 80, coherence: 0.5 },
      { breathsPerMinute: 6, rsaMs: 120, coherence: 0.6 },
      { breathsPerMinute: 5.5, rsaMs: 120, coherence: 0.8 },
      { breathsPerMinute: 5, rsaMs: 90, coherence: 0.9 },
    ]);
    expect(pick?.breathsPerMinute).toBe(5.5);
    expect(pickResonanceRate([])).toBeNull();
  });
});

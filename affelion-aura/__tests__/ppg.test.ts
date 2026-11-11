import { PpgProcessor, estimateCoverage, recoveryFromChange } from '../src/core/signal';

/** Synthesise a realistic torch-PPG red channel: baseline + pulse waveform + drift + noise. */
function synthesise(bpmFn: (t: number) => number, seconds: number, fps = 29.7, noise = 0.004) {
  const samples = [];
  let phase = 0;
  let t = 0;
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };
  while (t < seconds) {
    const dt = 1 / fps + rnd() * 0.004; // frame jitter
    const bpm = bpmFn(t);
    phase += (bpm / 60) * dt * 2 * Math.PI;
    // Systolic peak = absorption = red dip. Add a dicrotic notch harmonic.
    const pulse = Math.sin(phase) + 0.3 * Math.sin(2 * phase + 0.8);
    const drift = 0.02 * Math.sin(t * 0.15);
    const r = 0.72 + drift - 0.015 * pulse + rnd() * noise;
    samples.push({ t, r, g: 0.12 + rnd() * 0.002, b: 0.06 + rnd() * 0.002 });
    t += dt;
  }
  return samples;
}

describe('coverage detection', () => {
  test('finger over torch is covered', () => {
    expect(estimateCoverage({ t: 0, r: 0.75, g: 0.15, b: 0.08 }).covered).toBe(true);
  });
  test('ordinary scene is not covered', () => {
    expect(estimateCoverage({ t: 0, r: 0.45, g: 0.42, b: 0.4 }).covered).toBe(false);
  });
  test('dark frame is reported as too dark', () => {
    expect(estimateCoverage({ t: 0, r: 0.05, g: 0.02, b: 0.01 }).reason).toBe('tooDark');
  });
  test('blown-out frame is reported as saturated', () => {
    expect(estimateCoverage({ t: 0, r: 0.995, g: 0.95, b: 0.9 }).reason).toBe('saturated');
  });
});

describe('PpgProcessor', () => {
  test('recovers a steady heart rate within 1.5 bpm', () => {
    const p = new PpgProcessor();
    for (const s of synthesise(() => 72, 40)) p.push(s);
    const m = p.finish();
    expect(m).not.toBeNull();
    expect(Math.abs(m!.bpm - 72)).toBeLessThan(1.5);
    expect(m!.quality).toBeGreaterThan(0.6);
    expect(m!.beatCount).toBeGreaterThan(35);
  });

  test('tracks a fast heart rate', () => {
    const p = new PpgProcessor();
    for (const s of synthesise(() => 118, 35)) p.push(s);
    const m = p.finish()!;
    expect(Math.abs(m.bpm - 118)).toBeLessThan(2.5);
  });

  test('tracks a slow heart rate', () => {
    const p = new PpgProcessor();
    for (const s of synthesise(() => 48, 45)) p.push(s);
    const m = p.finish()!;
    expect(Math.abs(m.bpm - 48)).toBeLessThan(1.5);
  });

  test('a perfectly regular rhythm has near-zero RMSSD, a variable one does not', () => {
    const steady = new PpgProcessor();
    for (const s of synthesise(() => 66, 40)) steady.push(s);
    const variable = new PpgProcessor();
    // Respiratory sinus arrhythmia: ±8 bpm at 0.25 Hz breathing.
    for (const s of synthesise((t) => 66 + 8 * Math.sin(2 * Math.PI * 0.25 * t), 40)) variable.push(s);
    const a = steady.finish()!;
    const b = variable.finish()!;
    expect(a.rmssd).toBeLessThan(12);
    expect(b.rmssd).toBeGreaterThan(a.rmssd + 15);
    expect(b.sdnn).toBeGreaterThan(a.sdnn);
  });

  test('live state reports coverage time and a bpm estimate', () => {
    const p = new PpgProcessor();
    const samples = synthesise(() => 80, 12);
    for (const s of samples) p.push(s);
    const live = p.live();
    expect(live.coveredSec).toBeGreaterThan(11);
    expect(live.bpm).not.toBeNull();
    expect(Math.abs(live.bpm! - 80)).toBeLessThan(3);
    expect(live.waveform.length).toBeGreaterThan(0);
  });

  test('returns null when the finger is not on the lens', () => {
    const p = new PpgProcessor();
    for (let i = 0; i < 600; i++) p.push({ t: i / 30, r: 0.4, g: 0.4, b: 0.38 });
    expect(p.finish()).toBeNull();
    expect(p.live().coveredSec).toBe(0);
  });
});

describe('finger lifts and missed beats', () => {
  test('a lifted finger does not invent beats or distort the reading', () => {
    const clean = new PpgProcessor();
    for (const s of synthesise(() => 70, 50)) clean.push(s);
    const lifted = new PpgProcessor();
    for (const s of synthesise(() => 70, 50)) {
      // Six seconds with the finger off the lens: an ordinary room, not a red frame.
      if (s.t > 20 && s.t < 26) lifted.push({ t: s.t, r: 0.4, g: 0.38, b: 0.36 });
      else lifted.push(s);
    }
    const a = clean.finish()!;
    const b = lifted.finish()!;
    expect(b).not.toBeNull();
    expect(Math.abs(b.bpm - 70)).toBeLessThan(1.5);
    // Variability must not be inflated by the gap.
    expect(b.rmssd).toBeLessThan(a.rmssd + 6);
    // The usable signal is shorter than the clean one by at least the gap.
    expect(b.durationSec).toBeLessThan(a.durationSec - 5);
  });

  test('a short flicker of coverage is bridged, not split', () => {
    const p = new PpgProcessor();
    for (const s of synthesise(() => 70, 30)) {
      if (s.t > 12 && s.t < 12.2) p.push({ t: s.t, r: 0.4, g: 0.38, b: 0.36 });
      else p.push(s);
    }
    const m = p.finish()!;
    expect(Math.abs(m.bpm - 70)).toBeLessThan(1.5);
    expect(m.durationSec).toBeGreaterThan(25);
  });

  test('recovery is measured when the pulse slows and variability rises through the reading', () => {
    const settling = new PpgProcessor();
    // 88 bpm easing to 72, with breathing variability growing from 1 to 7 bpm.
    for (const s of synthesise((t) => 88 - 16 * Math.min(1, t / 40) + (1 + 6 * Math.min(1, t / 40)) * Math.sin(2 * Math.PI * 0.2 * t), 42)) settling.push(s);
    const steady = new PpgProcessor();
    for (const s of synthesise(() => 80, 42)) steady.push(s);
    const rising = new PpgProcessor();
    for (const s of synthesise((t) => 70 + 14 * Math.min(1, t / 40), 42)) rising.push(s);
    expect(settling.finish()!.recovery).toBeGreaterThan(0.35);
    expect(steady.finish()!.recovery).toBe(0);
    expect(rising.finish()!.recovery).toBe(0);
  });
});

describe('recoveryFromChange', () => {
  test('needs an unambiguous direction', () => {
    expect(recoveryFromChange(84, 76, 30, 42)).toBeGreaterThan(0.35);
    expect(recoveryFromChange(76, 84, 30, 42)).toBe(0); // pulse rose
    expect(recoveryFromChange(84, 80, 40, 30)).toBe(0); // variability fell
    expect(recoveryFromChange(80, 80, 40, 41)).toBe(0); // nothing changed
  });
});

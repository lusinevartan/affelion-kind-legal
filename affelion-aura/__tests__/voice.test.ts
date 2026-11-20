import { VoiceAnalyzer, yinPitch, fft } from '../src/core/signal';

function tone(freqFn: (t: number) => number, seconds: number, sr = 16000, amp = 0.3) {
  const n = Math.floor(seconds * sr);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    phase += (2 * Math.PI * freqFn(t)) / sr;
    // Voice-like: fundamental plus a couple of harmonics.
    out[i] = amp * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase));
  }
  return out;
}

describe('fft', () => {
  test('finds the bin of a pure tone', () => {
    const n = 1024;
    const re = new Float32Array(n);
    const im = new Float32Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.sin((2 * Math.PI * 64 * i) / n);
    fft(re, im);
    let best = 0;
    for (let i = 1; i < n / 2; i++) if (Math.hypot(re[i]!, im[i]!) > Math.hypot(re[best]!, im[best]!)) best = i;
    expect(best).toBe(64);
  });
});

describe('yinPitch', () => {
  test('estimates 220 Hz within 1 %', () => {
    const frame = tone(() => 220, 1024 / 16000);
    const p = yinPitch(frame, 16000)!;
    expect(p).not.toBeNull();
    expect(Math.abs(p.hz - 220) / 220).toBeLessThan(0.01);
    expect(p.confidence).toBeGreaterThan(0.8);
  });
  test('returns null for noise', () => {
    const frame = new Float32Array(1024);
    let seed = 7;
    for (let i = 0; i < frame.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      frame[i] = seed / 4294967296 - 0.5;
    }
    expect(yinPitch(frame, 16000)).toBeNull();
  });
});

describe('VoiceAnalyzer', () => {
  test('a monotone voice has low pitch variance', () => {
    const a = new VoiceAnalyzer();
    a.push(tone(() => 150, 5));
    const m = a.finish()!;
    expect(Math.abs(m.dominantPitchHz - 150)).toBeLessThan(3);
    expect(m.pitchVarianceSemitones).toBeLessThan(0.3);
    expect(m.variance).toBeLessThan(0.15);
    expect(m.stability).toBeGreaterThan(0.8);
    expect(m.voicedRatio).toBeGreaterThan(0.9);
    expect(m.quality).toBeGreaterThan(0.7);
  });

  test('an expressive voice has high pitch variance', () => {
    const a = new VoiceAnalyzer();
    // Glide over ±5 semitones at 0.5 Hz.
    a.push(tone((t) => 180 * Math.pow(2, (5 * Math.sin(2 * Math.PI * 0.5 * t)) / 12), 5));
    const m = a.finish()!;
    expect(m.pitchVarianceSemitones).toBeGreaterThan(2.5);
    expect(m.variance).toBeGreaterThan(0.4);
  });

  test('silence yields zero quality', () => {
    const a = new VoiceAnalyzer();
    a.push(new Float32Array(16000 * 3));
    const m = a.finish()!;
    expect(m.quality).toBe(0);
    expect(m.voicedRatio).toBe(0);
  });

  test('handles chunked input identically to one buffer', () => {
    const whole = new VoiceAnalyzer();
    const chunked = new VoiceAnalyzer();
    const pcm = tone(() => 200, 4);
    whole.push(pcm);
    for (let i = 0; i < pcm.length; i += 700) chunked.push(pcm.subarray(i, Math.min(pcm.length, i + 700)));
    const a = whole.finish()!;
    const b = chunked.finish()!;
    expect(Math.abs(a.dominantPitchHz - b.dominantPitchHz)).toBeLessThan(0.5);
  });
});

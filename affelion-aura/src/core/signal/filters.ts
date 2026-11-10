/**
 * Minimal IIR filtering utilities. Biquads are Direct Form I with coefficients from the
 * Audio EQ Cookbook (Robert Bristow-Johnson). A 2nd-order Butterworth corresponds to Q = 1/√2.
 */
export interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export function lowpassBiquad(fs: number, fc: number, q = Math.SQRT1_2): Biquad {
  const w0 = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: (1 - cos) / 2 / a0,
    b1: (1 - cos) / a0,
    b2: (1 - cos) / 2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

export function highpassBiquad(fs: number, fc: number, q = Math.SQRT1_2): Biquad {
  const w0 = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cos) / 2 / a0,
    b1: -(1 + cos) / a0,
    b2: (1 + cos) / 2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

export function applyBiquad(x: Float32Array, c: Biquad, out?: Float32Array): Float32Array {
  const y = out ?? new Float32Array(x.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const x0 = x[i]!;
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    y[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return y;
}

function reverseInPlace(a: Float32Array) {
  for (let i = 0, j = a.length - 1; i < j; i++, j--) {
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
}

/** Zero-phase (forward-backward) filtering, used for offline analysis of a buffered window. */
export function filtfilt(x: Float32Array, c: Biquad): Float32Array {
  const y = applyBiquad(x, c);
  reverseInPlace(y);
  const z = applyBiquad(y, c);
  reverseInPlace(z);
  return z;
}

/** Zero-phase Butterworth bandpass built from a highpass and a lowpass biquad. */
export function bandpassZeroPhase(x: Float32Array, fs: number, lo: number, hi: number): Float32Array {
  const hp = highpassBiquad(fs, lo);
  const lp = lowpassBiquad(fs, hi);
  return filtfilt(filtfilt(x, hp), lp);
}

/** Remove a linear trend (least squares) in place and return the array. */
export function detrend(x: Float32Array): Float32Array {
  const n = x.length;
  if (n < 2) return x;
  let sx = 0,
    sy = 0,
    sxx = 0,
    sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += x[i]!;
    sxx += i * i;
    sxy += i * x[i]!;
  }
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  for (let i = 0; i < n; i++) x[i] = x[i]! - (intercept + slope * i);
  return x;
}

/** Running mean streaming helper for live display. */
export class ExponentialSmoother {
  private value: number | null = null;
  constructor(private readonly alpha: number) {}
  push(x: number): number {
    this.value = this.value === null ? x : this.value + this.alpha * (x - this.value);
    return this.value;
  }
  get(): number | null {
    return this.value;
  }
  reset() {
    this.value = null;
  }
}

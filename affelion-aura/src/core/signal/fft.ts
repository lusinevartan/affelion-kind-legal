/** In-place iterative radix-2 FFT. `re` and `im` must have power-of-two length. */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n <= 1) return;
  if ((n & (n - 1)) !== 0) throw new Error('fft: length must be a power of two');
  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]!;
      re[i] = re[j]!;
      re[j] = t;
      t = im[i]!;
      im[i] = im[j]!;
      im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1,
        ci = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const tr = re[b]! * cr - im[b]! * ci;
        const ti = re[b]! * ci + im[b]! * cr;
        re[b] = re[a]! - tr;
        im[b] = im[a]! - ti;
        re[a] = re[a]! + tr;
        im[a] = im[a]! + ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

export function hannWindow(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

/** Magnitude spectrum (n/2 + 1 bins) of a real windowed frame. */
export function magnitudeSpectrum(frame: Float32Array, window?: Float32Array): Float32Array {
  const n = frame.length;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = frame[i]! * (window ? window[i]! : 1);
  fft(re, im);
  const bins = (n >> 1) + 1;
  const mag = new Float32Array(bins);
  for (let i = 0; i < bins; i++) mag[i] = Math.hypot(re[i]!, im[i]!);
  return mag;
}

export function spectralCentroid(mag: Float32Array, sampleRate: number, fftSize: number): number {
  let num = 0,
    den = 0;
  for (let i = 0; i < mag.length; i++) {
    const f = (i * sampleRate) / fftSize;
    num += f * mag[i]!;
    den += mag[i]!;
  }
  return den > 0 ? num / den : 0;
}

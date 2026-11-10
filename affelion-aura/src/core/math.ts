export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hermite smoothstep from edge0 to edge1. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Linear map of x in [inLo, inHi] to [0, 1], clamped. */
export function norm(x: number, inLo: number, inHi: number): number {
  return clamp01((x - inLo) / (inHi - inLo));
}

/** Piecewise-linear interpolation over sorted (x, y) knots. Clamps outside the range. */
export function piecewise(knots: ReadonlyArray<readonly [number, number]>, x: number): number {
  const first = knots[0];
  const last = knots[knots.length - 1];
  if (!first || !last) return 0;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < knots.length; i++) {
    const a = knots[i - 1]!;
    const b = knots[i]!;
    if (x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0]);
      return lerp(a[1], b[1], t);
    }
  }
  return last[1];
}

export const wrapHue = (h: number) => ((h % 360) + 360) % 360;

/** Interpolate between hues along the shortest arc. */
export function mixHue(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return wrapHue(a + d * t);
}

/** Round to a fixed step so near-identical inputs map to identical outputs. */
export const quantize = (v: number, step: number) => Math.round(v / step) * step;

/** FNV-1a 32-bit hash of a string, returned as an unsigned integer. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mean(xs: ArrayLike<number>): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i]!;
  return s / xs.length;
}

export function stddev(xs: ArrayLike<number>): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (let i = 0; i < xs.length; i++) {
    const d = xs[i]! - m;
    s += d * d;
  }
  return Math.sqrt(s / (xs.length - 1));
}

export function median(xs: ArrayLike<number>): number {
  if (xs.length === 0) return 0;
  const a = Array.from(xs).sort((x, y) => x - y);
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid]! : (a[mid - 1]! + a[mid]!) / 2;
}

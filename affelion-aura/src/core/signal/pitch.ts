/**
 * YIN fundamental-frequency estimator (de Cheveigné & Kawahara, 2002).
 * Returns the pitch in Hz and a confidence 0..1, or null when no periodicity is found.
 */
export interface PitchEstimate {
  hz: number;
  /** 1 − aperiodicity. Higher is more confident. */
  confidence: number;
}

export function yinPitch(
  frame: Float32Array,
  sampleRate: number,
  opts: { minHz?: number; maxHz?: number; threshold?: number } = {},
): PitchEstimate | null {
  const minHz = opts.minHz ?? 65;
  const maxHz = opts.maxHz ?? 600;
  const threshold = opts.threshold ?? 0.15;
  const n = frame.length;
  const maxTau = Math.min(Math.floor(sampleRate / minHz), n >> 1);
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  if (maxTau <= minTau) return null;

  const half = n >> 1;
  const d = new Float32Array(maxTau + 1);
  for (let tau = minTau; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < half; i++) {
      const diff = frame[i]! - frame[i + tau]!;
      s += diff * diff;
    }
    d[tau] = s;
  }
  // Cumulative mean normalised difference.
  const cmnd = new Float32Array(maxTau + 1);
  let running = 0;
  for (let tau = minTau; tau <= maxTau; tau++) {
    running += d[tau]!;
    const k = tau - minTau + 1;
    cmnd[tau] = running > 0 ? (d[tau]! * k) / running : 1;
  }
  // Absolute threshold: first tau below threshold, then descend to the local minimum.
  let tau = -1;
  for (let t = minTau + 1; t <= maxTau; t++) {
    if (cmnd[t]! < threshold) {
      while (t + 1 <= maxTau && cmnd[t + 1]! < cmnd[t]!) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) {
    // Fall back to the global minimum if it is reasonably periodic.
    let best = minTau + 1;
    for (let t = minTau + 1; t <= maxTau; t++) if (cmnd[t]! < cmnd[best]!) best = t;
    if (cmnd[best]! > 0.4) return null;
    tau = best;
  }
  // Parabolic interpolation around tau.
  const x0 = tau > minTau ? tau - 1 : tau;
  const x2 = tau + 1 <= maxTau ? tau + 1 : tau;
  let betterTau = tau;
  if (x0 !== tau && x2 !== tau) {
    const s0 = cmnd[x0]!,
      s1 = cmnd[tau]!,
      s2 = cmnd[x2]!;
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterTau = tau + (s2 - s0) / denom;
  }
  const hz = sampleRate / betterTau;
  if (hz < minHz || hz > maxHz) return null;
  return { hz, confidence: 1 - Math.min(1, Math.max(0, cmnd[tau]!)) };
}

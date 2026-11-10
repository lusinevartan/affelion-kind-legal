import type { AuraColorId, HSL, RGB } from '../types';

/**
 * The Affelion colour system. Single source of truth for every visual and every
 * explanation in the app. Each colour is tied to a measurable state. The `meaning`
 * strings describe a physiological or vocal pattern, never anything psychic.
 */
export interface AuraColorDef {
  id: AuraColorId;
  name: string;
  hex: string;
  hsl: HSL;
  /** Short label used in the UI. */
  meaning: string;
  /** Plain-language description of the measured state this colour represents. */
  description: string;
  /** Which metric most often produces this colour. */
  primaryMetric: 'heartRate' | 'hrv' | 'voice' | 'combined';
}

export const AURA_COLORS: Record<AuraColorId, AuraColorDef> = {
  deepRed: {
    id: 'deepRed',
    name: 'Deep red',
    hex: '#C8322B',
    hsl: { h: 3, s: 0.64, l: 0.48 },
    meaning: 'High activation',
    description:
      'A fast pulse and low beat-to-beat variability. The body is working hard, alert or under load.',
    primaryMetric: 'heartRate',
  },
  brightOrange: {
    id: 'brightOrange',
    name: 'Bright orange',
    hex: '#F0781E',
    hsl: { h: 26, s: 0.87, l: 0.53 },
    meaning: 'Vitality and intensity',
    description:
      'An elevated pulse with reasonable variability. Energised and engaged rather than strained.',
    primaryMetric: 'heartRate',
  },
  goldenYellow: {
    id: 'goldenYellow',
    name: 'Golden yellow',
    hex: '#F2C230',
    hsl: { h: 45, s: 0.88, l: 0.57 },
    meaning: 'Mental clarity',
    description:
      'A moderately raised pulse paired with good variability, or a bright, well-articulated voice.',
    primaryMetric: 'combined',
  },
  limeGreen: {
    id: 'limeGreen',
    name: 'Lime green',
    hex: '#9BD53A',
    hsl: { h: 82, s: 0.65, l: 0.53 },
    meaning: 'Growth',
    description:
      'Variability trending upward with a steady, mid-range pulse. The system is recovering and adapting.',
    primaryMetric: 'hrv',
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    hex: '#1FB5A3',
    hsl: { h: 173, s: 0.71, l: 0.42 },
    meaning: 'High coherence',
    description:
      'High beat-to-beat variability with a calm pulse. Breathing and heart rhythm are moving together.',
    primaryMetric: 'hrv',
  },
  skyBlue: {
    id: 'skyBlue',
    name: 'Sky blue',
    hex: '#4FA8E8',
    hsl: { h: 205, s: 0.77, l: 0.61 },
    meaning: 'Calm ease',
    description: 'A low, steady pulse with healthy variability. Settled and unhurried.',
    primaryMetric: 'heartRate',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    hex: '#4A4BC0',
    hsl: { h: 239, s: 0.49, l: 0.52 },
    meaning: 'Deep rest',
    description: 'A very low pulse. The body is in a resting, conserving state.',
    primaryMetric: 'heartRate',
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    hex: '#8E5BD6',
    hsl: { h: 265, s: 0.6, l: 0.6 },
    meaning: 'Quiet insight',
    description:
      'A low pulse with a soft, low-variance voice. Inward, reflective and quiet rather than flat.',
    primaryMetric: 'combined',
  },
  softWhite: {
    id: 'softWhite',
    name: 'Soft white',
    hex: '#F3EFE6',
    hsl: { h: 42, s: 0.35, l: 0.93 },
    meaning: 'Strong coherence',
    description:
      'Unusually high variability for the pulse rate, with a steady voice. Appears as light at the centre of the portrait.',
    primaryMetric: 'hrv',
  },
  earth: {
    id: 'earth',
    name: 'Muted earth',
    hex: '#8C6F55',
    hsl: { h: 28, s: 0.25, l: 0.44 },
    meaning: 'Low energy',
    description:
      'A low pulse with low variability and a quiet, flat voice. Depleted or tired rather than rested.',
    primaryMetric: 'combined',
  },
};

export const AURA_COLOR_IDS = Object.keys(AURA_COLORS) as AuraColorId[];

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hh = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return { r: l, g: l, b: l };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t0: number) => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: hue2rgb(hh + 1 / 3), g: hue2rgb(hh), b: hue2rgb(hh - 1 / 3) };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/** Shortest angular distance between two hues in degrees (0..180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Nearest chromatic colour in the system to a given hue. Soft white and earth are
 * not chromatic anchors, so they are excluded here and chosen explicitly by the mapping.
 */
export function nearestChromaticColor(hue: number): AuraColorId {
  const candidates: AuraColorId[] = [
    'deepRed',
    'brightOrange',
    'goldenYellow',
    'limeGreen',
    'teal',
    'skyBlue',
    'indigo',
    'violet',
  ];
  let best: AuraColorId = 'teal';
  let bestD = Infinity;
  for (const id of candidates) {
    const d = hueDistance(hue, AURA_COLORS[id].hsl.h);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

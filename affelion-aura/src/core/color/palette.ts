import type { HSL, RGB } from '../types';
import { COLOR_KNOWLEDGE_BASE, KB_BY_ID, SWATCH_HSL, type AuraColorId, type KnowledgeBaseColor } from './knowledgeBase';

export { COLOR_KNOWLEDGE_BASE, KB_BY_ID, AURA_COLOR_IDS, SWATCH_HSL } from './knowledgeBase';
export type { AuraColorId, KnowledgeBaseColor } from './knowledgeBase';

/** Knowledge-base entry plus presentation values, for legends, swatches and placeholders. */
export interface AuraColorDef extends KnowledgeBaseColor {
  hex: string;
  hsl: HSL;
}

export const AURA_COLORS: Record<AuraColorId, AuraColorDef> = Object.fromEntries(
  COLOR_KNOWLEDGE_BASE.map((c) => {
    const hsl = SWATCH_HSL[c.id];
    return [c.id, { ...c, hsl, hex: hslToHex(hsl) }];
  }),
) as Record<AuraColorId, AuraColorDef>;

export function colorName(id: AuraColorId): string {
  return KB_BY_ID[id].name;
}

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

/** Distance from a hue to an inclusive hue range (0 when inside), on the circle. */
export function hueRangeDistance(hue: number, range: readonly [number, number]): number {
  const h = ((hue % 360) + 360) % 360;
  const [lo, hi] = range;
  if (h >= lo && h <= hi) return 0;
  return Math.min(hueDistance(h, lo), hueDistance(h, hi));
}

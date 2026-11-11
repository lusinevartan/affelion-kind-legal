/**
 * Honesty rules shared with the app (affelion-aura/src/core/color/explain.ts). Keep the two lists
 * identical; the app also filters every reply client-side, so the server list is defence in depth.
 */
export const BANNED_PHRASES: readonly string[] = [
  'energy field', 'energetic field', 'chakra', 'psychic', 'spirit guide', 'spirits', 'your soul',
  'past life', 'past lives', 'reads your energy', 'read your energy', 'detects your energy',
  'detect your energy', 'sense your energy', 'senses your energy', 'invisible energy', 'invisible light',
  'life force', 'third eye', 'manifest', 'destiny', 'fortune', 'predict', 'prophecy', 'twin flame',
  'soulmate', 'cosmic', 'divine message', 'the universe is telling', 'diagnos', 'cure', 'treat your',
  'medical advice',
];

export function findBannedPhrase(text: string): string | null {
  const t = text.toLowerCase();
  for (const p of BANNED_PHRASES) if (t.includes(p)) return p;
  return null;
}

export const SAFE_FALLBACK =
  'I can only speak to what was measured in this scan: your pulse, its variability, and the shape of your voice. Tap a region of the portrait to see exactly which number produced which colour.';

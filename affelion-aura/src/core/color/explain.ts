import type { AuraRegion, MappingInput } from '../types';
import { KB_BY_ID, type AuraColorId } from './knowledgeBase';

/**
 * Grounded copy. Every sentence is either the knowledge base's own text or a statement of the
 * user's measured numbers. Nothing may describe energy fields, psychic phenomena, futures or
 * diagnoses. `assertHonest` runs on all generated copy and on every AI reply.
 */

export const BANNED_PHRASES: readonly string[] = [
  'energy field',
  'energetic field',
  'chakra',
  'psychic',
  'spirit guide',
  'spirits',
  'your soul',
  'past life',
  'past lives',
  'reads your energy',
  'read your energy',
  'detects your energy',
  'detect your energy',
  'sense your energy',
  'senses your energy',
  'invisible energy',
  'invisible light',
  'life force',
  'third eye',
  'manifest',
  'destiny',
  'fortune',
  'predict',
  'prophecy',
  'twin flame',
  'soulmate',
  'cosmic',
  'divine message',
  'the universe is telling',
  'diagnos',
  'cure',
  'treat your',
  'medical advice',
];

export function findBannedPhrase(text: string): string | null {
  const t = text.toLowerCase();
  for (const p of BANNED_PHRASES) if (t.includes(p)) return p;
  return null;
}

export function assertHonest(text: string): void {
  const hit = findBannedPhrase(text);
  if (hit) throw new Error(`Copy violates honesty rules (contains "${hit}"): ${text}`);
}

const r0 = (n: number) => Math.round(n).toString();
const pct = (n: number) => `${Math.round(n * 100)}%`;

function metricsSentence(m: MappingInput, voiceAvailable: boolean): string {
  const voice = voiceAvailable
    ? ` Your voice had a dominant pitch of ${r0(m.vocalPitchHz)} Hz, variance ${pct(m.vocalVariance)} and stability ${pct(m.vocalStability)}.`
    : ' No usable voice sample was recorded, so only your pulse shaped this portrait.';
  return `Measured: ${r0(m.bpm)} bpm, HRV ${r0(m.hrv)} ms.${voice}`;
}

export function buildRegionExplanation(region: AuraRegion['id'], colorId: AuraColorId, m: MappingInput, voiceAvailable: boolean): string {
  const c = KB_BY_ID[colorId];
  const where = region === 'core' ? 'The centre of your portrait' : 'The outer halo';
  const text = `${where} is ${c.name.toLowerCase()}. ${c.explanation} ${metricsSentence(m, voiceAvailable)}`;
  assertHonest(text);
  return text;
}

export function buildSummary(primary: AuraColorId, m: MappingInput, voiceAvailable: boolean): string {
  const c = KB_BY_ID[primary];
  const voice = voiceAvailable ? `, voice variance ${pct(m.vocalVariance)}` : '';
  const text = `${c.name}: ${c.primary.toLowerCase()}. From ${r0(m.bpm)} bpm and HRV ${r0(m.hrv)} ms${voice}.`;
  assertHonest(text);
  return text;
}

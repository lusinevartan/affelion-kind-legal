import type { AuraColorId, AuraRegion, BiometricInput, NormalisedState } from '../types';
import { AURA_COLORS } from './palette';

/**
 * Grounded explanation copy. Every sentence references the user's actual numbers.
 * No sentence may describe energy fields, chakras, auras as physical things, futures,
 * or other people's intentions. `assertHonest` is used in tests and before showing
 * any AI-generated text.
 */

export const BANNED_PHRASES: readonly string[] = [
  'energy field',
  'energetic field',
  'chakra',
  'psychic',
  'spirit guide',
  'spirits',
  'vibration of your soul',
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

function bpmWord(a: number): string {
  if (a < 0.2) return 'very low';
  if (a < 0.4) return 'low';
  if (a < 0.62) return 'mid-range';
  if (a < 0.82) return 'elevated';
  return 'high';
}

function hrvWord(c: number): string {
  if (c < 0.25) return 'low';
  if (c < 0.5) return 'moderate';
  if (c < 0.78) return 'good';
  return 'high';
}

function voiceWord(v: number): string {
  if (v < 0.2) return 'steady and quiet';
  if (v < 0.45) return 'even';
  if (v < 0.7) return 'expressive';
  return 'highly varied';
}

const r0 = (n: number) => Math.round(n).toString();
const r1 = (n: number) => (Math.round(n * 10) / 10).toString();

export function buildRegionExplanation(
  region: AuraRegion['id'],
  colorId: AuraColorId,
  input: BiometricInput,
  state: NormalisedState,
): string {
  const color = AURA_COLORS[colorId];
  const { heart, voice } = input;
  const bpm = r0(heart.bpm);
  const rmssd = r0(heart.rmssd);

  let text: string;
  switch (region) {
    case 'core':
      text = `The centre is ${color.name.toLowerCase()} because your pulse averaged ${bpm} bpm (${bpmWord(
        state.activation,
      )}) with ${hrvWord(state.coherence)} variability (RMSSD ${rmssd} ms). ${color.meaning}: ${color.description}`;
      break;
    case 'halo':
      text = `The outer halo is ${color.name.toLowerCase()}, set by your heart-rate variability. An RMSSD of ${rmssd} ms is ${hrvWord(
        state.coherence,
      )} for a pulse of ${bpm} bpm, which is why the edge ${
        state.coherence >= 0.5 ? 'moves smoothly' : 'moves with more turbulence'
      }. ${color.meaning}: ${color.description}`;
      break;
    case 'accent':
    default: {
      if (voice && voice.quality > 0.2) {
        text = `The ${color.name.toLowerCase()} accents come from your voice: a median pitch of ${r0(
          voice.medianPitchHz,
        )} Hz with ${r1(voice.pitchVarianceSemitones)} semitones of variation, which reads as ${voiceWord(
          state.vocalVariance,
        )}. More variation raises saturation and adds brighter accents. ${color.meaning}: ${color.description}`;
      } else {
        text = `The ${color.name.toLowerCase()} accents are muted because the voice sample was too quiet to analyse, so only your pulse shaped this portrait. ${color.meaning}: ${color.description}`;
      }
    }
  }
  assertHonest(text);
  return text;
}

export function buildSummary(dominant: AuraColorId, input: BiometricInput, state: NormalisedState): string {
  const color = AURA_COLORS[dominant];
  const { heart, voice } = input;
  const voicePart =
    voice && voice.quality > 0.2 ? ` and a ${voiceWord(state.vocalVariance)} voice` : '';
  const text = `${color.name} centre: a ${bpmWord(state.activation)} pulse of ${r0(
    heart.bpm,
  )} bpm with ${hrvWord(state.coherence)} variability${voicePart}, which the colour system reads as ${color.meaning.toLowerCase()}.`;
  assertHonest(text);
  return text;
}

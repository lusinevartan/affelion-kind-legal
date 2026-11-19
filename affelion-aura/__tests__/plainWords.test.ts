import { COLOR_KNOWLEDGE_BASE, PLAIN_WORDS } from '../src/core/color/knowledgeBase';
import { findBannedPhrase } from '../src/core/color/explain';
import { mapBiometricsToAura } from '../src/core/color/mapping';
import { localGuideAnswer } from '../src/services/ai/guide';
import type { BiometricInput, ScanRecord } from '../src/core/types';

/**
 * Everything a person reads about their portrait is written for a high school reader:
 * common words, short sentences, no technical terms. Numbers and units are fine.
 */
const TECHNICAL = /\b(coheren\w*|parasympathetic|sympathetic|biometrics?|activation|hrv|rmssd|sdnn|pnn50|variability|variance|metrics?|parameters?|baseline|vocal|dominant|markers?|physiolog\w*|arousal|restorative|turbulen\w*|saturation|clinician|photopleth\w*|indicat\w*|elevated|utiliz\w*)\b/i;
const MAX_WORDS_PER_SENTENCE = 26;

function check(text: string) {
  expect(text).not.toMatch(TECHNICAL);
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    if (words > MAX_WORDS_PER_SENTENCE) throw new Error(`Sentence too long (${words} words): ${sentence}`);
  }
}

const heart = (bpm: number, rmssd: number, recovery = 0) => ({ bpm, rmssd, sdnn: rmssd * 1.1, pnn50: 10, beatCount: 44, quality: 0.9, durationSec: 40, recovery });
const voice = (variance: number, stability: number) => ({ dominantPitchHz: 170, variance, stability, pitchVarianceSemitones: variance * 4, energyVariance: variance * 0.8, spectralCentroidHz: 1300, voicedRatio: 0.6, quality: 0.8, durationSec: 5 });

describe('plain words', () => {
  it('has a plain meaning and a plain reason for every color', () => {
    expect(Object.keys(PLAIN_WORDS).sort()).toEqual(COLOR_KNOWLEDGE_BASE.map((c) => c.id).sort());
    for (const c of COLOR_KNOWLEDGE_BASE) {
      const p = PLAIN_WORDS[c.id];
      expect(p.meaning.split(/\s+/).length).toBeLessThanOrEqual(6);
      expect(p.why.length).toBeGreaterThan(30);
      check(p.meaning);
      check(p.why);
      expect(findBannedPhrase(p.meaning)).toBeNull();
      expect(findBannedPhrase(p.why)).toBeNull();
    }
  });

  it('keeps the portrait summary and every tappable explanation plain, with and without a voice sample', () => {
    for (const recovery of [0, 0.6]) {
      for (let bpm = 44; bpm <= 120; bpm += 4) {
        for (let rmssd = 8; rmssd <= 100; rmssd += 6) {
          for (const v of [null, voice(0.08, 0.9), voice(0.5, 0.6), voice(0.9, 0.3)]) {
            const input: BiometricInput = { heart: heart(bpm, rmssd, recovery), voice: v };
            const p = mapBiometricsToAura(input);
            check(p.summary);
            for (const r of p.regions) check(r.explanation);
          }
        }
      }
    }
  });

  it("keeps Sasha's built-in answers plain", () => {
    const input: BiometricInput = { heart: heart(88, 23), voice: voice(0.4, 0.7) };
    const record = { id: 'x', createdAt: 0, heart: input.heart, voice: input.voice, aura: mapBiometricsToAura(input) } as unknown as ScanRecord;
    for (const q of ['Why am I this color?', 'What does the outer color mean?', 'How did my voice change it?', 'How can I move toward teal?', 'Am I sick?', 'Tell me a joke']) {
      check(localGuideAnswer(q, record));
    }
  });
});

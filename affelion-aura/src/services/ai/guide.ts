import type { ScanRecord } from '../../core/types';
import { AURA_COLORS } from '../../core/color/palette';
import { findBannedPhrase } from '../../core/color/explain';

/**
 * Grounded AI guide. Every answer is anchored to the user's measured numbers and to the
 * Affelion colour system. The system prompt forbids psychic, medical and predictive claims,
 * and every response is checked against the same banned-phrase list the copy engine uses.
 *
 * Network: requests go to a server-side endpoint that holds the model API key
 * (`EXPO_PUBLIC_GUIDE_ENDPOINT`). The app never embeds a model key. When no endpoint is
 * configured, the guide answers from the local grounded templates instead.
 */

export interface GuideMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GUIDE_NAME = 'Sasha';

export const GUIDE_SYSTEM_PROMPT = `You are Sasha, the Affelion Aura guide. You explain a user's aura portrait, which is a visualisation of measured physical signals: heart rate (BPM) and heart-rate variability (RMSSD, SDNN, pNN50) from fingertip photoplethysmography, and the pitch and variation of a short voice sample.

Rules you must follow:
1. Only speak about the numbers provided and what the Affelion colour system maps them to. Tie every statement to a specific measurement.
2. The portrait is a translation of physiology and voice into colour. Never describe it as detecting, reading or sensing energy, energy fields, chakras, spirits, intentions, destiny or anything that cannot be measured. Never make predictions.
3. Never diagnose, name a medical condition, or give medical advice. If asked, say the app is not a medical device and suggest speaking to a clinician for health concerns.
4. Be warm, concise and plain. Two to five sentences unless asked for more. No emojis. You are an assistant named Sasha, not a person; if asked, say so.
5. If a question is outside the scan data, say so briefly and return to what the data shows.

Colour knowledge base (the only meanings and explanations you may use; quote them, do not extend them):
${Object.values(AURA_COLORS)
  .map((c) => `- ${c.name} [${c.id}]: ${c.primary}. Biometric: ${c.biometric}. Explanation: ${c.explanation}`)
  .join('\n')}`;

export function buildScanContext(record: ScanRecord): string {
  const { heart, voice, aura } = record;
  const lines = [
    `Scan date: ${new Date(record.createdAt).toISOString()}`,
    `Heart rate: ${heart.bpm.toFixed(0)} bpm over ${heart.durationSec.toFixed(0)} s (${heart.beatCount} beats, signal quality ${(heart.quality * 100).toFixed(0)}%)`,
    `HRV: RMSSD ${heart.rmssd.toFixed(0)} ms, SDNN ${heart.sdnn.toFixed(0)} ms, pNN50 ${heart.pnn50.toFixed(0)}%`,
    voice && voice.quality > 0.2
      ? `Voice: dominant pitch ${voice.dominantPitchHz.toFixed(0)} Hz, variance ${(voice.variance * 100).toFixed(0)}/100, stability ${(voice.stability * 100).toFixed(0)}/100, voiced ${(voice.voicedRatio * 100).toFixed(0)}% of the sample`
      : 'Voice: no usable sample (skipped or too quiet); vocal variance treated as 0 and stability as neutral',
    `Colour family rule applied: ${aura.family}`,
    `Portrait: centre ${AURA_COLORS[aura.primaryColorId].name} (${AURA_COLORS[aura.primaryColorId].primary}), halo ${AURA_COLORS[aura.secondaryColorId].name} (${AURA_COLORS[aura.secondaryColorId].primary})${
      aura.accentStrength > 0 ? `, brighter accents from vocal variance` : ''
    }`,
    `Shader parameters: hue ${aura.hue}°, saturation ${aura.saturation}, lightness ${aura.lightness}, turbulence ${aura.turbulence}, pulse ${aura.pulseSpeed} Hz`,
    `Summary shown to the user: ${aura.summary}`,
  ];
  return lines.join('\n');
}

const SAFE_FALLBACK =
  'I can only speak to what was measured in this scan: your pulse, its variability, and the shape of your voice. Tap a region of the portrait to see exactly which number produced which colour.';

/** Reject anything that crosses the honesty line; return a safe substitute instead. */
export function sanitiseGuideReply(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return SAFE_FALLBACK;
  return findBannedPhrase(trimmed) ? SAFE_FALLBACK : trimmed;
}

/** Local answers when no endpoint is configured. Template-based and fully grounded. */
export function localGuideAnswer(question: string, record: ScanRecord): string {
  const q = question.toLowerCase();
  const { heart, voice, aura } = record;
  const dom = AURA_COLORS[aura.primaryColorId];
  const sec = AURA_COLORS[aura.secondaryColorId];
  if (/(hrv|variab|rmssd|coheren|halo|edge)/.test(q)) {
    return `Your HRV (RMSSD) was ${heart.rmssd.toFixed(0)} ms. The halo is ${sec.name.toLowerCase()}: ${sec.explanation} HRV of 55 ms or more with a pulse of 78 bpm or less selects greens and teals with low turbulence; HRV of 28 ms or less selects reds and oranges with more turbulence.`;
  }
  if (/(voice|pitch|speak|accent|sound)/.test(q)) {
    if (voice && voice.quality > 0.2) {
      return `Your voice sample had a dominant pitch of ${voice.dominantPitchHz.toFixed(0)} Hz, variance ${Math.round(voice.variance * 100)}% and stability ${Math.round(voice.stability * 100)}%. Variance raises saturation${
        aura.accentStrength > 0 ? ' and triggered brighter accents' : ''
      }; stability sets lightness. Nothing you said was stored or transcribed; only pitch and loudness statistics were used.`;
    }
    return 'The voice step was skipped or too quiet to analyse, so only your pulse and HRV shaped this portrait. Saturation stayed at its baseline.';
  }
  if (/(red|orange|stress|activ|fast|heart rate|bpm|pulse)/.test(q)) {
    return `Your pulse averaged ${heart.bpm.toFixed(0)} bpm. The centre of the portrait is ${dom.name.toLowerCase()}: ${dom.explanation} A pulse of 92 bpm or more, or HRV of 28 ms or less, selects reds and oranges with higher turbulence and pulse speed; a pulse of 62 bpm or less selects blues and indigos.`;
  }
  if (/(mean|why|what|explain|colour|color)/.test(q)) {
    return `${aura.summary} ${dom.explanation} The halo follows your HRV (${heart.rmssd.toFixed(0)} ms) and the saturation and brightness follow your voice. Every colour in the portrait maps to one of those measurements and nothing else.`;
  }
  if (/(doctor|medical|health|disease|diagnos|sick|anxiety|depress)/.test(q)) {
    return 'Affelion Aura is not a medical device and cannot assess health conditions. It visualises a short pulse and voice sample. If you have a health concern, please speak with a clinician.';
  }
  return SAFE_FALLBACK;
}

export interface GuideClientOptions {
  endpoint?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function askGuide(
  question: string,
  record: ScanRecord,
  history: GuideMessage[],
  opts: GuideClientOptions = {},
): Promise<string> {
  const endpoint = opts.endpoint ?? process.env.EXPO_PUBLIC_GUIDE_ENDPOINT ?? null;
  if (!endpoint) return sanitiseGuideReply(localGuideAnswer(question, record));
  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: GUIDE_SYSTEM_PROMPT,
        context: buildScanContext(record),
        messages: [...history, { role: 'user', content: question }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Guide endpoint returned ${res.status}`);
    const json = (await res.json()) as { reply?: string };
    return sanitiseGuideReply(json.reply ?? '');
  } catch {
    // Degrade gracefully to the grounded local answer.
    return sanitiseGuideReply(localGuideAnswer(question, record));
  } finally {
    clearTimeout(timer);
  }
}

import type { ScanRecord } from '../../core/types';
import { AURA_COLORS } from '../../core/color/palette';
import { findBannedPhrase } from '../../core/color/explain';

/**
 * Grounded AI guide. Every answer is anchored to the user's measured numbers and to the
 * Affelion color system. The system prompt forbids psychic, medical and predictive claims,
 * and every response is checked against the same banned-phrase list the copy engine uses.
 *
 * Network: requests go to a server-side endpoint that holds the model API key and its own copy
 * of the system prompt (`EXPO_PUBLIC_GUIDE_ENDPOINT`). The app sends only the scan's numbers and
 * the conversation; it never embeds a model key and the server never takes instructions from it. When no endpoint is
 * configured, the guide answers from the local grounded templates instead.
 */

export interface GuideMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GUIDE_NAME = 'Sasha';

export const GUIDE_SYSTEM_PROMPT = `You are Sasha, the Affelion Halo guide. You explain a user's Halo portrait, which is a visualization of measured physical signals: heart rate (BPM) and heart-rate variability (RMSSD, SDNN, pNN50) from fingertip photoplethysmography, and the pitch and variation of a short voice sample.

Rules you must follow:
1. Only speak about the numbers provided and what the Affelion color system maps them to. Tie every statement to a specific measurement.
2. The portrait is a translation of physiology and voice into color. Never describe it as detecting, reading or sensing energy, energy fields, chakras, spirits, intentions, destiny or anything that cannot be measured. Never make predictions.
3. Never diagnose, name a medical condition, or give medical advice. If asked, say the app is not a medical device and suggest talking to a doctor about health concerns.
4. Use everyday words a teenager would know. Say "heartbeat variation" and explain it in a few words the first time, rather than HRV or RMSSD. Say "main color" for the color nearest the body and "outer color" for the one further out. Give a number only when it helps. Write at a high school reading level: short sentences, common words, one idea at a time. Say \"steady heart rhythm\" rather than coherence, \"your usual\" rather than baseline, and \"how much your voice moved\" rather than vocal variance. Be warm, brief and plain. Two to five sentences unless asked for more. No emojis. You are an AI assistant named Sasha, not a person; if asked, say so. The app shows a portrait for you; it is a generated image, not a photograph of anyone, and if asked you say that too.
5. If a question is outside the scan data, say so briefly and return to what the data shows.

Color knowledge base (the only meanings and explanations you may use; do not extend them). When you speak, use the \"Plain\" wording, which says the same thing in everyday words:
${Object.values(AURA_COLORS)
  .map((c) => `- ${c.name} [${c.id}]: ${c.primary}. Biometric: ${c.biometric}. Explanation: ${c.explanation} Plain: ${c.meaning}. ${c.why}`)
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
    `Color family rule applied: ${aura.family}`,
    `Portrait: main color ${AURA_COLORS[aura.primaryColorId].name} (${AURA_COLORS[aura.primaryColorId].primary}), outer color ${AURA_COLORS[aura.secondaryColorId].name} (${AURA_COLORS[aura.secondaryColorId].primary})${
      aura.accentStrength > 0 ? `, brighter accents from vocal variance` : ''
    }`,
    `Shader parameters: hue ${aura.hue}°, saturation ${aura.saturation}, lightness ${aura.lightness}, turbulence ${aura.turbulence}, pulse ${aura.pulseSpeed} Hz`,
    `Summary shown to the user: ${aura.summary}`,
  ];
  return lines.join('\n');
}

const SAFE_FALLBACK =
  'I can only talk about what this scan measured: your pulse, how much it varies, and your voice. Tap a part of the portrait to see which number led to which color.';

/** Reject anything that crosses the honesty line; return a safe substitute instead. */
export function sanitizeGuideReply(text: string): string {
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
  // Health questions are answered first, whatever else the question mentions.
  if (/(doctor|medical|medic|health|disease|diagnos|sick|ill\b|illness|anxiety|depress|condition|symptom|blood pressure|heart attack|arrhythm|dying|die\b)/.test(q)) {
    return 'Affelion Halo is for wellness and self-reflection. It is not a medical device and cannot tell you anything about a health condition. It turns a short pulse and voice sample into color. Talk to a doctor about any health concern.';
  }
  if (/(hrv|variab|rmssd|coheren|halo|edge|outer|steady)/.test(q)) {
    return `Your heartbeat variation was ${heart.rmssd.toFixed(0)} ms. That is how much the gap between beats changes from one beat to the next. Your outer color is ${sec.name.toLowerCase()}: ${sec.why} Strong variation with a calm pulse gives greens and teals. Low variation gives reds and oranges.`;
  }
  if (/(voice|pitch|speak|accent|sound)/.test(q)) {
    if (voice && voice.quality > 0.2) {
      return `Your voice sat around ${voice.dominantPitchHz.toFixed(0)} Hz. It moved around by ${Math.round(voice.variance * 100)}% and was ${Math.round(voice.stability * 100)}% steady. A livelier voice makes the color stronger${
        aura.accentStrength > 0 ? ' and added brighter flecks' : ''
      }. A steadier voice makes it lighter. Nothing you said was saved or written down. Only how high and how loud your voice was got used.`;
    }
    return 'The voice step was skipped or too quiet to use, so only your heartbeat shaped this portrait.';
  }
  if (/(red|orange|stress|activ|fast|heart rate|bpm|pulse|main|why am i)/.test(q)) {
    return `Your pulse was about ${heart.bpm.toFixed(0)} beats a minute, read through your phone camera. Your main color is ${dom.name.toLowerCase()}: ${dom.why} A fast pulse, 92 or more, or very low heartbeat variation gives reds and oranges. A slow pulse, 62 or less, gives blues and purples.`;
  }
  if (/(mean|why|what|explain|colour|color|teal|move|shift|change)/.test(q)) {
    return `${aura.summary} ${dom.why} The outer color follows your heartbeat variation, which was ${heart.rmssd.toFixed(0)} ms. How strong and how light the color is follows your voice. Every color comes from one of those readings and nothing else.`;
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
  if (!endpoint) return sanitizeGuideReply(localGuideAnswer(question, record));
  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const token = process.env.EXPO_PUBLIC_GUIDE_TOKEN;
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        context: buildScanContext(record),
        messages: [...history, { role: 'user', content: question }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Guide endpoint returned ${res.status}`);
    const json = (await res.json()) as { reply?: string };
    return sanitizeGuideReply(json.reply ?? '');
  } catch {
    // Degrade gracefully to the grounded local answer.
    return sanitizeGuideReply(localGuideAnswer(question, record));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The Affelion Aura colour knowledge base. Single source of truth for all visuals, tappable
 * explanations, summaries and AI responses. The data below is the specification, verbatim.
 * Nothing in the app may describe a colour in words that are not in this file.
 */

export type AuraColorId =
  | 'deep_red'
  | 'crimson'
  | 'bright_orange'
  | 'amber'
  | 'golden_yellow'
  | 'lime'
  | 'emerald'
  | 'teal'
  | 'aqua'
  | 'sky_blue'
  | 'cobalt'
  | 'indigo'
  | 'violet'
  | 'lavender'
  | 'magenta'
  | 'soft_white'
  | 'pearl'
  | 'muted_gray'
  | 'earth_brown'
  | 'charcoal';

export interface KnowledgeBaseColor {
  id: AuraColorId;
  name: string;
  /** Inclusive hue range in degrees, or null for achromatic / special tones. */
  hueRange: readonly [number, number] | null;
  primary: string;
  biometric: string;
  explanation: string;
}

export const COLOR_KNOWLEDGE_BASE: readonly KnowledgeBaseColor[] = [
  { id: 'deep_red', name: 'Deep Red', hueRange: [0, 12], primary: 'Intense activation or stress', biometric: 'High BPM or very low HRV', explanation: 'Deep red appears when your heart rate is elevated or HRV is low, reflecting strong physical or nervous-system activation.' },
  { id: 'crimson', name: 'Crimson', hueRange: [345, 360], primary: 'Passionate or forceful energy', biometric: 'High BPM with moderate-to-high vocal variance', explanation: 'Crimson shows intense energy. Your metrics indicated high activation paired with dynamic vocal expression.' },
  { id: 'bright_orange', name: 'Bright Orange', hueRange: [18, 38], primary: 'Vitality and drive', biometric: 'Elevated BPM or rising activation', explanation: 'Bright orange reflects energized vitality. Your body showed clear physical or mental drive during the scan.' },
  { id: 'amber', name: 'Amber', hueRange: [35, 50], primary: 'Warm creativity and enthusiasm', biometric: 'Moderate-high BPM with positive vocal energy', explanation: 'Amber appears with warm, active energy. It often pairs with engaged speech and moderate physiological arousal.' },
  { id: 'golden_yellow', name: 'Golden Yellow', hueRange: [48, 65], primary: 'Mental clarity and optimism', biometric: 'Balanced-to-active state + vocal variance', explanation: 'Golden yellow signals bright mental energy. Your voice and overall metrics suggested focus, ideas, or optimistic engagement.' },
  { id: 'lime', name: 'Lime Green', hueRange: [75, 110], primary: 'Fresh growth and renewal', biometric: 'Improving HRV or recovering from activation', explanation: 'Lime green indicates renewal. Your readings showed energy moving toward greater balance and recovery.' },
  { id: 'emerald', name: 'Emerald Green', hueRange: [120, 150], primary: 'Healing and heart-centered balance', biometric: 'Solid HRV with calm-to-moderate BPM', explanation: 'Emerald reflects balanced, restorative energy. Your HRV and heart rate pointed to a centered, coherent state.' },
  { id: 'teal', name: 'Teal', hueRange: [160, 185], primary: 'High coherence and calm focus', biometric: 'High HRV + calm BPM', explanation: 'Teal appears when HRV is strong and your system is balanced — a clear sign of coherence and focused calm.' },
  { id: 'aqua', name: 'Aqua', hueRange: [175, 195], primary: 'Clear communication and ease', biometric: 'Good HRV with open, steady voice', explanation: 'Aqua shows relaxed clarity. Your biometrics and vocal tone suggested ease and open expression.' },
  { id: 'sky_blue', name: 'Sky Blue', hueRange: [195, 215], primary: 'Calm presence', biometric: 'Lower-moderate BPM + stable voice', explanation: 'Sky blue reflects a calm, present state. Your heart rate and voice indicated low tension and steady energy.' },
  { id: 'cobalt', name: 'Cobalt Blue', hueRange: [210, 230], primary: 'Deep calm and steadiness', biometric: 'Low BPM with high vocal stability', explanation: 'Cobalt blue appears in quieter, steady states. Your metrics showed reduced activation and consistent calm.' },
  { id: 'indigo', name: 'Indigo', hueRange: [230, 255], primary: 'Inner focus and deep rest', biometric: 'Low BPM or strong parasympathetic markers', explanation: 'Indigo signals a deeply quiet or inward state. Your body was in a low-activation, restorative mode.' },
  { id: 'violet', name: 'Violet', hueRange: [260, 280], primary: 'Quiet insight', biometric: 'Very calm BPM + clear, steady voice', explanation: 'Violet emerges with deep calm and clear vocal tone, often linked to reflective or insightful states.' },
  { id: 'lavender', name: 'Lavender', hueRange: [270, 290], primary: 'Soft intuition and gentleness', biometric: 'Calm metrics with low vocal variance', explanation: 'Lavender reflects gentle, soft energy. Your readings showed low activation and a smooth, unforced voice.' },
  { id: 'magenta', name: 'Magenta', hueRange: [300, 330], primary: 'Creative emotional blend', biometric: 'Mixed activation with expressive voice', explanation: 'Magenta appears when emotional and creative energy mix. Your metrics showed moderate activation with dynamic expression.' },
  { id: 'soft_white', name: 'Soft White / Bright', hueRange: null, primary: 'High overall coherence', biometric: 'Strong HRV + balanced metrics across the board', explanation: 'Bright or near-white areas indicate high coherence. Multiple signals aligned in a clear, integrated state.' },
  { id: 'pearl', name: 'Pearl / Iridescent', hueRange: null, primary: 'Shifting clarity', biometric: 'High HRV with moderate vocal variance', explanation: 'Pearl tones suggest fluid clarity. Your system showed strong coherence with gentle variation in expression.' },
  { id: 'muted_gray', name: 'Muted Gray', hueRange: null, primary: 'Low energy or fatigue', biometric: 'Low overall activation or flat vocal tone', explanation: 'Muted gray appears when energy is low. Your heart-rate and vocal metrics suggested fatigue or a need for rest.' },
  { id: 'earth_brown', name: 'Earth Brown / Taupe', hueRange: null, primary: 'Grounded but heavy', biometric: 'Moderate-low BPM with reduced HRV or flat voice', explanation: 'Earth tones reflect a grounded yet heavier state. Your readings showed lower vitality or emotional weight.' },
  { id: 'charcoal', name: 'Charcoal / Dark', hueRange: null, primary: 'Significant fatigue or withdrawal', biometric: 'Very low energy markers', explanation: 'Darker tones indicate markedly low energy. Your biometrics pointed to deep fatigue or strong inward withdrawal.' },
];

export const KB_BY_ID: Record<AuraColorId, KnowledgeBaseColor> = Object.fromEntries(
  COLOR_KNOWLEDGE_BASE.map((c) => [c.id, c]),
) as Record<AuraColorId, KnowledgeBaseColor>;

export const AURA_COLOR_IDS: readonly AuraColorId[] = COLOR_KNOWLEDGE_BASE.map((c) => c.id);

/**
 * Representative swatch for UI legends and placeholders. Chromatic entries use the centre of
 * their hue range; achromatic entries use fixed HSL that matches the tone's name. These are
 * presentation values only; the portrait itself is coloured by the mapping output.
 */
export const SWATCH_HSL: Record<AuraColorId, { h: number; s: number; l: number }> = {
  deep_red: { h: 6, s: 0.7, l: 0.42 },
  crimson: { h: 352, s: 0.72, l: 0.46 },
  bright_orange: { h: 28, s: 0.88, l: 0.54 },
  amber: { h: 42, s: 0.85, l: 0.55 },
  golden_yellow: { h: 56, s: 0.85, l: 0.58 },
  lime: { h: 92, s: 0.6, l: 0.52 },
  emerald: { h: 135, s: 0.55, l: 0.42 },
  teal: { h: 172, s: 0.65, l: 0.42 },
  aqua: { h: 185, s: 0.65, l: 0.55 },
  sky_blue: { h: 205, s: 0.7, l: 0.6 },
  cobalt: { h: 220, s: 0.65, l: 0.48 },
  indigo: { h: 242, s: 0.5, l: 0.45 },
  violet: { h: 270, s: 0.55, l: 0.55 },
  lavender: { h: 280, s: 0.45, l: 0.7 },
  magenta: { h: 315, s: 0.65, l: 0.55 },
  soft_white: { h: 45, s: 0.25, l: 0.93 },
  pearl: { h: 190, s: 0.25, l: 0.86 },
  muted_gray: { h: 210, s: 0.06, l: 0.52 },
  earth_brown: { h: 28, s: 0.28, l: 0.36 },
  charcoal: { h: 220, s: 0.06, l: 0.2 },
};

import { Platform } from 'react-native';

/**
 * Affelion Aura design tokens: "Specimen".
 *
 * The portrait is the object. Everything else is a label on a dark table: one grotesque for
 * words, one monospace for measurements, hairline rules instead of cards, no pills, one accent
 * reserved for the single action on a screen. Results print on paper, like a plate in an
 * archive. References: General Matter (one object, one line), Letterform Archive (the artefact
 * on black, a single serif paragraph), Castimedia (mono captions in the corners).
 */
export const colors = {
  /** Live screens: the table. */
  ink: '#0E100F',
  ink2: '#151715',
  /** Keepsake / results: the sheet. */
  paper: '#EDE9DE',
  paper2: '#E4DFD2',
  bone: '#F6F3E3',
  bone70: 'rgba(246, 243, 227, 0.72)',
  bone50: 'rgba(246, 243, 227, 0.5)',
  bone30: 'rgba(246, 243, 227, 0.3)',
  bone60: '#9FA395',
  /** Text on paper. */
  inkText: '#1A1A17',
  inkText70: 'rgba(26, 26, 23, 0.7)',
  inkText50: 'rgba(26, 26, 23, 0.5)',
  hairline: 'rgba(246, 243, 227, 0.16)',
  hairlineStrong: 'rgba(246, 243, 227, 0.28)',
  hairlineOnPaper: 'rgba(26, 26, 23, 0.16)',
  clay: '#C4714B',
  clayLink: '#CE7E58',
  danger: '#D9705C',
  success: '#7FB89A',
  overlay: 'rgba(14, 16, 15, 0.6)',
  polaroidPaper: '#EDE9DE',
  // Compatibility aliases for screens not yet converted.
  night: '#0E100F',
  black: '#0E100F',
  surface: '#151715',
  surfaceRaised: '#1C1F1C',
  claySoft: 'rgba(196, 113, 75, 0.18)',
  polaroidShadow: 'rgba(0,0,0,0.55)',
  brass: '#C4714B',
  brassDeep: '#A85E3B',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 2, md: 4, lg: 8, xl: 12, pill: 999 } as const;

export const fonts = {
  grotesk: 'InterTight_400Regular',
  groteskMedium: 'InterTight_500Medium',
  groteskLight: 'InterTight_300Light',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  serif: 'Fraunces_300Light',
  // Compatibility aliases
  serifLight: 'Fraunces_300Light',
  serifMedium: 'Fraunces_500Medium',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
} as const;

export const type = {
  /** One line of large grotesque, tight. */
  display: { fontFamily: fonts.groteskLight, fontSize: 44, lineHeight: 46, letterSpacing: -1.2 },
  title: { fontFamily: fonts.groteskLight, fontSize: 30, lineHeight: 32, letterSpacing: -0.8 },
  heading: { fontFamily: fonts.grotesk, fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontFamily: fonts.grotesk, fontSize: 16, lineHeight: 23, letterSpacing: -0.1 },
  bodySmall: { fontFamily: fonts.grotesk, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.groteskMedium, fontSize: 15, lineHeight: 18 },
  /** Measurement captions. */
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  monoLarge: { fontFamily: fonts.mono, fontSize: 15, lineHeight: 20 },
  /** Figure numbers: "FIG. 01 PULSE". */
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  caption: { fontFamily: fonts.grotesk, fontSize: 12, lineHeight: 16 },
  /** Keepsake caption in serif, the one place it survives. */
  serifCaption: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 26, letterSpacing: -0.2 },
} as const;

export const TOUCH_MIN = 44;
void Platform;

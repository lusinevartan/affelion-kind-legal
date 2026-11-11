import { Platform } from 'react-native';

/**
 * Affelion Aura design tokens: "Luminous".
 *
 * Off-white paper, ink type, and the aura painted on the page like pigment. The person is the
 * hero and their colour is the only colour; chrome is ink and grey. One grotesque for words,
 * one monospace for measurements, hairlines instead of boxes, flat ink actions. Camera stages
 * stay dark because the feed is the ground there. References: the 2025 Awwwards Site of the
 * Year (a face on #F4F3F1 with ink and one accent), Scout Motors, Immersive Garden, Floema.
 */
export const colors = {
  /** The app: warm off-white paper, ink text, grey captions. */
  ground: '#F4F3F1',
  ground2: '#ECEAE6',
  fg: '#1E201C',
  fg70: 'rgba(30, 32, 28, 0.72)',
  fg50: 'rgba(30, 32, 28, 0.5)',
  fg30: 'rgba(30, 32, 28, 0.3)',
  fg60: '#7F8177',
  hairline: 'rgba(30, 32, 28, 0.14)',
  hairlineStrong: 'rgba(30, 32, 28, 0.28)',
  /** Camera stages stay dark: the feed is the ground. */
  stage: '#0E100F',
  stage2: '#151715',
  stageFg: '#F4F3F1',
  stageFg70: 'rgba(244, 243, 241, 0.72)',
  stageFg50: 'rgba(244, 243, 241, 0.5)',
  stageHairline: 'rgba(244, 243, 241, 0.22)',
  /** One accent, used sparingly: the signal, never the chrome. */
  accent: '#CBF902',
  clay: '#C4714B',
  danger: '#C8503C',
  success: '#4E8F6A',
  overlay: 'rgba(14, 16, 15, 0.6)',
  // Compatibility aliases (older screens): map onto the paper system.
  ink: '#F4F3F1',
  ink2: '#ECEAE6',
  paper: '#F4F3F1',
  paper2: '#ECEAE6',
  bone: '#1E201C',
  bone70: 'rgba(30, 32, 28, 0.72)',
  bone50: 'rgba(30, 32, 28, 0.5)',
  bone30: 'rgba(30, 32, 28, 0.3)',
  bone60: '#7F8177',
  inkText: '#1E201C',
  inkText70: 'rgba(30, 32, 28, 0.72)',
  inkText50: 'rgba(30, 32, 28, 0.5)',
  hairlineOnPaper: 'rgba(30, 32, 28, 0.14)',
  clayLink: '#C4714B',
  polaroidPaper: '#F4F3F1',
  night: '#F4F3F1',
  black: '#1E201C',
  surface: '#ECEAE6',
  surfaceRaised: '#E4E2DD',
  claySoft: 'rgba(196, 113, 75, 0.18)',
  polaroidShadow: 'rgba(0,0,0,0.25)',
  brass: '#1E201C',
  brassDeep: '#1E201C',
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

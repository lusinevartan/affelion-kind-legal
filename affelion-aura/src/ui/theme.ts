import { Platform } from 'react-native';

/**
 * Affelion design tokens, taken from the Affelion brand system used by Kind:
 * night green ground, bone type, clay accent, Fraunces for display at light weight with tight
 * tracking, Inter for everything else, spaced uppercase eyebrows in muted bone, and quiet
 * hairlines rather than boxes. The aura supplies the colour; the chrome stays still.
 */
export const colors = {
  night: '#1D2A21',
  black: '#0E100F',
  /** Slightly lifted ground for cards. */
  surface: '#243329',
  surfaceRaised: '#2C3D32',
  hairline: 'rgba(246, 243, 227, 0.14)',
  hairlineStrong: 'rgba(246, 243, 227, 0.22)',
  bone: '#F6F3E3',
  bone70: 'rgba(246, 243, 227, 0.74)',
  bone60: '#9FA395',
  bone50: 'rgba(246, 243, 227, 0.5)',
  bone30: 'rgba(246, 243, 227, 0.3)',
  clay: '#C4714B',
  clayLink: '#CE7E58',
  claySoft: 'rgba(196, 113, 75, 0.18)',
  danger: '#D9705C',
  success: '#7FB89A',
  overlay: 'rgba(14, 16, 15, 0.72)',
  polaroidPaper: '#F6F3E3',
  polaroidShadow: 'rgba(0,0,0,0.55)',
  /** Kept for compatibility with earlier screens; prefer `clay`. */
  brass: '#C4714B',
  brassDeep: '#A85E3B',
  ink: '#0E100F',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Font family names as registered with expo-font (see `src/ui/fonts.ts`). */
export const fonts = {
  serifLight: 'Fraunces_300Light',
  serif: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
} as const;

export const type = {
  display: { fontFamily: fonts.serifLight, fontSize: 38, lineHeight: 44, letterSpacing: -0.4 },
  title: { fontFamily: fonts.serifLight, fontSize: 28, lineHeight: 33, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, letterSpacing: -0.1 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 26 },
  bodySmall: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 16, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
} as const;

/** Minimum touch target per WCAG 2.5.5 / platform guidance. */
export const TOUCH_MIN = 44;

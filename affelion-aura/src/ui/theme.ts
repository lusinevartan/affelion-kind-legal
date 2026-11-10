import { Platform } from 'react-native';

/**
 * Design tokens. Dark, quiet, premium. The aura supplies the colour; the chrome stays neutral
 * so the portrait is always the brightest thing on screen.
 */
export const colors = {
  night: '#0B0C10',
  ink: '#111318',
  surface: '#171A21',
  surfaceRaised: '#1F232C',
  hairline: 'rgba(243, 239, 230, 0.10)',
  hairlineStrong: 'rgba(243, 239, 230, 0.18)',
  bone: '#F3EFE6',
  bone70: 'rgba(243, 239, 230, 0.72)',
  bone50: 'rgba(243, 239, 230, 0.5)',
  bone30: 'rgba(243, 239, 230, 0.3)',
  brass: '#D8B06A',
  brassDeep: '#B8893E',
  danger: '#E0655A',
  success: '#5FBF9F',
  overlay: 'rgba(11, 12, 16, 0.72)',
  polaroidPaper: '#F4F1EA',
  polaroidShadow: 'rgba(0,0,0,0.55)',
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

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const sans = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export const type = {
  display: { fontFamily: serif, fontSize: 36, lineHeight: 42, letterSpacing: -0.5, fontWeight: '500' as const },
  title: { fontFamily: serif, fontSize: 26, lineHeight: 32, letterSpacing: -0.3, fontWeight: '500' as const },
  heading: { fontFamily: sans, fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontFamily: sans, fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontFamily: sans, fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontFamily: sans, fontSize: 12, lineHeight: 16, letterSpacing: 0.2, fontWeight: '500' as const },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
} as const;

/** Minimum touch target per WCAG 2.5.5 / platform guidance. */
export const TOUCH_MIN = 44;

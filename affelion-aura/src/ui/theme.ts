import { Platform } from 'react-native';

/**
 * Affelion Aura design tokens: "Stage".
 *
 * The app itself is greyscale. Colour belongs to the person: it only ever appears inside a
 * portrait, on a black stage, as light around a black-and-white photograph. Everything else is
 * a pale grey canvas, charcoal type and hairlines. One typeface, light, set large and tight;
 * hierarchy comes from scale and line breaks, not weight, boxes or a second family. Actions
 * are capsules: charcoal on grey, white on the stage. Media is square-edged.
 *
 * References: Josephmark (black theatrical canvas, light grotesk, colour only in the work) and
 * Dash Digital (pale grey and charcoal, tiny captions against large media).
 */
export const colors = {
  /** The app is greyscale. Pale grey canvas, charcoal ink, grey captions, hairline rules. */
  ground: '#F0F0F0',
  ground2: '#E6E6E6',
  white: '#FAFAFA',
  fg: '#2A2A2A',
  fg70: 'rgba(42, 42, 42, 0.74)',
  fg60: '#757575',
  fg50: 'rgba(42, 42, 42, 0.56)',
  fg30: 'rgba(42, 42, 42, 0.3)',
  hairline: '#D6D6D6',
  hairlineStrong: '#949494',
  /** The stage is black. It is where colour lives: the camera and every portrait. */
  stage: '#000000',
  stage2: '#161616',
  stageFg: '#FFFFFF',
  stageFg70: 'rgba(255, 255, 255, 0.76)',
  stageFg50: 'rgba(255, 255, 255, 0.56)',
  stageHairline: 'rgba(255, 255, 255, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.55)',
  /** No brand colour. These exist only so older call sites stay neutral. */
  accent: '#FFFFFF',
  clay: '#2A2A2A',
  danger: '#2A2A2A',
  success: '#2A2A2A',
  ink: '#F0F0F0',
  ink2: '#E6E6E6',
  paper: '#F0F0F0',
  paper2: '#E6E6E6',
  bone: '#2A2A2A',
  bone70: 'rgba(42, 42, 42, 0.74)',
  bone50: 'rgba(42, 42, 42, 0.56)',
  bone30: 'rgba(42, 42, 42, 0.3)',
  bone60: '#757575',
  inkText: '#2A2A2A',
  inkText70: 'rgba(42, 42, 42, 0.74)',
  inkText50: 'rgba(42, 42, 42, 0.56)',
  hairlineOnPaper: '#D6D6D6',
  clayLink: '#2A2A2A',
  polaroidPaper: '#FAFAFA',
  night: '#F0F0F0',
  black: '#2A2A2A',
  surface: '#E6E6E6',
  surfaceRaised: '#DCDCDC',
  claySoft: 'rgba(42, 42, 42, 0.3)',
  polaroidShadow: 'rgba(0,0,0,0.25)',
  brass: '#2A2A2A',
  brassDeep: '#2A2A2A',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 2, md: 4, lg: 8, xl: 12, pill: 999 } as const;

export const fonts = {
  grotesk: 'InterTight_400Regular',
  groteskMedium: 'InterTight_500Medium',
  groteskLight: 'InterTight_300Light',
  // One family. These aliases keep older call sites on it.
  mono: 'InterTight_400Regular',
  monoMedium: 'InterTight_500Medium',
  serif: 'InterTight_300Light',
  serifLight: 'InterTight_300Light',
  serifMedium: 'InterTight_500Medium',
  sans: 'InterTight_400Regular',
  sansMedium: 'InterTight_500Medium',
  sansSemi: 'InterTight_500Medium',
} as const;

const tabular = ['tabular-nums'] as 'tabular-nums'[];

export const type = {
  /** The voice: light, large, tight. Colour names, statements, prices. */
  hero: { fontFamily: fonts.groteskLight, fontSize: 68, lineHeight: 64, letterSpacing: -2.6 },
  display: { fontFamily: fonts.groteskLight, fontSize: 44, lineHeight: 44, letterSpacing: -1.5 },
  title: { fontFamily: fonts.groteskLight, fontSize: 30, lineHeight: 33, letterSpacing: -0.9 },
  heading: { fontFamily: fonts.grotesk, fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  body: { fontFamily: fonts.grotesk, fontSize: 17, lineHeight: 24, letterSpacing: -0.25 },
  bodySmall: { fontFamily: fonts.grotesk, fontSize: 15, lineHeight: 21, letterSpacing: -0.15 },
  label: { fontFamily: fonts.groteskMedium, fontSize: 15, lineHeight: 18, letterSpacing: -0.1 },
  /** Measurements in running text: same family, tabular figures. */
  mono: { fontFamily: fonts.grotesk, fontSize: 13, lineHeight: 18, letterSpacing: -0.05, fontVariant: tabular },
  monoLarge: { fontFamily: fonts.grotesk, fontSize: 15, lineHeight: 20, fontVariant: tabular },
  /** Tiny catalogue caption. */
  eyebrow: { fontFamily: fonts.groteskMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  caption: { fontFamily: fonts.grotesk, fontSize: 12, lineHeight: 16, letterSpacing: -0.05 },
  serifCaption: { fontFamily: fonts.groteskLight, fontSize: 30, lineHeight: 33, letterSpacing: -0.9 },
} as const;

export const TOUCH_MIN = 44;
void Platform;

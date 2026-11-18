import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, type } from '../theme';

type Variant = keyof typeof type;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
}

/**
 * Text follows the person's text-size setting. Reading sizes grow without a ceiling. The very
 * large display sizes are already big, so they grow less, which keeps a one-word headline on
 * the screen at the largest accessibility settings.
 */
const MAX_SCALE: Partial<Record<Variant, number>> = { hero: 1.15, display: 1.25, title: 1.5, serifCaption: 1.5 };

export function Text({ variant = 'body', color = colors.fg, align, style, maxFontSizeMultiplier, ...rest }: TextProps) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_SCALE[variant]} {...rest} style={[type[variant], { color, textAlign: align }, style]} />;
}

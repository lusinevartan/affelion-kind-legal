import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, type } from '../theme';

type Variant = keyof typeof type;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function Text({ variant = 'body', color = colors.fg, align, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[type[variant], { color, textAlign: align }, style]} />;
}

import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, space } from '../theme';

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
});

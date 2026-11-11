import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, space } from '../theme';

/** A section on the canvas: a one-pixel rule above, no box, no fill. */
export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'transparent', paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.hairline },
});

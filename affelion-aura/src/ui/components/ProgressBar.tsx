import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

export function ProgressBar({ value, tint = colors.clay, label }: { value: number; tint?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: radius.pill, backgroundColor: colors.hairlineStrong, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../ui/theme';

/** Lightweight bar waveform for the live PPG trace. No SVG dependency. */
export function Waveform({ samples, height = 56, tint = colors.bone }: { samples: Float32Array; height?: number; tint?: string }) {
  const bars = 48;
  const step = Math.max(1, Math.floor(samples.length / bars));
  const values: number[] = [];
  for (let i = 0; i < bars; i++) {
    const idx = Math.min(samples.length - 1, i * step);
    values.push(samples.length ? samples[idx]! : 0);
  }
  return (
    <View style={[styles.row, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {values.map((v, i) => {
        const h = Math.max(2, Math.min(1, Math.abs(v)) * (height / 2));
        return <View key={i} style={[styles.bar, { height: h * 2, backgroundColor: tint, opacity: 0.35 + 0.65 * Math.min(1, Math.abs(v)) }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { flex: 1, borderRadius: 2 },
});

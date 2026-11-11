import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../../ui/theme';
import { Text } from '../../ui/components/Text';

/** Bar sparkline with min/max labels. Accessible summary in the label. */
export function Sparkline({ values, tint }: { values: number[]; tint: string }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);
  const first = values[0]!;
  const last = values[values.length - 1]!;
  return (
    <View accessible accessibilityLabel={`From ${first.toFixed(0)} to ${last.toFixed(0)}, lowest ${min.toFixed(0)}, highest ${max.toFixed(0)}`}>
      <View style={styles.bars}>
        {values.map((v, i) => (
          <View key={i} style={[styles.bar, { height: 12 + ((v - min) / span) * 44, backgroundColor: tint, opacity: i === values.length - 1 ? 1 : 0.55 }]} />
        ))}
      </View>
      <View style={styles.labels}>
        <Text variant="caption" color={colors.bone50}>
          {min.toFixed(0)}
        </Text>
        <Text variant="caption" color={colors.bone50}>
          {max.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60, marginTop: space.sm },
  bar: { flex: 1, borderRadius: 3, maxWidth: 24 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
});

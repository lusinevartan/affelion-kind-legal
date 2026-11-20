import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';
import { Text } from './Text';

export function MetricRow({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${note ? `. ${note}` : ''}`}>
      <View style={styles.left}>
        <Text variant="bodySmall" color={colors.bone70}>
          {label}
        </Text>
        {note ? (
          <Text variant="caption" color={colors.bone50}>
            {note}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text variant="heading">{value}</Text>
        {unit ? (
          <Text variant="caption" color={colors.bone50}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    gap: space.lg,
  },
  left: { flex: 1, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
});

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Text } from './Text';

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'live' | 'warn' | 'good' }) {
  const dot = tone === 'live' ? colors.clay : tone === 'warn' ? colors.danger : tone === 'good' ? colors.success : colors.bone50;
  return (
    <View style={styles.pill} accessibilityRole="text" accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text variant="caption" color={colors.bone70}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../ui/theme';
import { Text } from '../../ui/components/Text';
import { PRACTICE } from '../../core/practice/practiceMachine';

/**
 * Breathing pacer: a ring that grows on the inhale and shrinks on the exhale, driven directly by
 * the machine's breath phase so it never drifts from the timer. Plain views, no animation library,
 * so it stays exact at 10 Hz updates.
 */
export function BreathPacer({ phase, breathing, size = 200, tint = colors.bone }: { phase: number; breathing: 'inhale' | 'exhale'; size?: number; tint?: string }) {
  const inhale = PRACTICE.inhaleFraction;
  // Ease in/out within each half so the motion feels like breath, not a metronome.
  const local = breathing === 'inhale' ? phase / inhale : 1 - (phase - inhale) / (1 - inhale);
  const eased = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
  const scale = 0.55 + 0.45 * eased;
  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityRole="image" accessibilityLabel={breathing === 'inhale' ? 'Breathe in' : 'Breathe out'} accessibilityLiveRegion="polite">
      <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2, borderColor: tint }]} />
      <View style={[styles.inner, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint, transform: [{ scale }] }]} />
      <Text variant="heading" color={colors.night} style={styles.label}>
        {breathing === 'inhale' ? 'In' : 'Out'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  outer: { position: 'absolute', borderWidth: 1, opacity: 0.35 },
  inner: { position: 'absolute', opacity: 0.92 },
  label: { position: 'absolute' },
});

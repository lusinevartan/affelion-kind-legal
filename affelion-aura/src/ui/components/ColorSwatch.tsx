import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AURA_COLORS } from '../../core/color/palette';
import type { AuraColorId } from '../../core/types';
import { colors, radius, space } from '../theme';
import { Text } from './Text';

export function ColorSwatch({ id, onPress, selected }: { id: AuraColorId; onPress?: () => void; selected?: boolean }) {
  const c = AURA_COLORS[id];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${c.name}, ${c.meaning}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.dot, { backgroundColor: c.hex }]} />
      <View style={{ flex: 1 }}>
        <Text variant="bodySmall">{c.name}</Text>
        <Text variant="caption" color={colors.bone50}>
          {c.meaning}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderRadius: radius.md },
  selected: { backgroundColor: colors.surfaceRaised },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairlineStrong },
});

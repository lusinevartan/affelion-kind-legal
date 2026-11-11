import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, space, TOUCH_MIN } from '../theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  /** primary: the one action on the screen. secondary: outlined. ghost: text with arrow. danger. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  block?: boolean;
  hint?: string;
  /** Render for a paper (light) ground. */
  onPaper?: boolean;
}

/**
 * Rectangular, hairline, no pill. The primary is a flat clay block with dark text; the rest are
 * outlines or bare text with an arrow, the way a label on a table would read.
 */
export function Button({ label, variant = 'primary', loading, disabled, style, block, hint, onPress, onPaper = false, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' ? colors.ink : variant === 'danger' ? colors.danger : onPaper ? colors.inkText : colors.bone;
  const border = onPaper ? colors.hairlineOnPaper : colors.hairlineStrong;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={(e) => {
        void Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && [styles.secondary, { borderColor: border }],
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        block && styles.block,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator color={fg} /> : null}
        <Text variant="label" color={fg}>
          {label}
        </Text>
        {variant === 'ghost' ? (
          <Text variant="label" color={fg}>
            →
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, minWidth: TOUCH_MIN, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  block: { alignSelf: 'stretch' },
  primary: { backgroundColor: colors.clay },
  secondary: { backgroundColor: 'transparent', borderWidth: 1 },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: 0, alignItems: 'flex-start' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});

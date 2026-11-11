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
  /** Render for a paper (light) ground. Default true; pass false on a dark camera stage. */
  onPaper?: boolean;
}

/**
 * Capsules. The primary is solid: charcoal on the grey canvas, white on the black stage. The
 * secondary is a one-pixel outline. Ghost is text with an arrow. No colour, no shadow.
 */
export function Button({ label, variant = 'primary', loading, disabled, style, block, hint, onPress, onPaper = true, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' ? (onPaper ? colors.ground : colors.stage) : variant === 'danger' ? colors.danger : onPaper ? colors.fg : colors.stageFg;
  const border = onPaper ? colors.fg : colors.stageFg;
  const primaryBg = onPaper ? colors.fg : colors.stageFg;
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
        variant === 'primary' && [styles.primary, { backgroundColor: primaryBg }],
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
  base: { minHeight: 56, minWidth: TOUCH_MIN, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  block: { alignSelf: 'stretch' },
  primary: {},
  secondary: { backgroundColor: 'transparent', borderWidth: 1 },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: 0, alignItems: 'flex-start', minHeight: TOUCH_MIN, borderRadius: 0 },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});

import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, space, TOUCH_MIN } from '../theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Fill the available width. */
  block?: boolean;
  hint?: string;
}

export function Button({ label, variant = 'primary', loading, disabled, style, block, hint, onPress, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
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
        styles[variant],
        block && styles.block,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator color={variant === 'primary' ? colors.black : colors.bone} /> : null}
        <Text variant="label" color={variant === 'primary' ? colors.black : variant === 'danger' ? colors.danger : colors.bone}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    minWidth: TOUCH_MIN,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  block: { alignSelf: 'stretch' },
  primary: { backgroundColor: colors.clay },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hairlineStrong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.danger },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});

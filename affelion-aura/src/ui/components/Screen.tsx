import * as React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, space } from '../theme';

export interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content with padding, or a fixed layout. */
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra bottom padding for a docked action bar. */
  bottomInset?: number;
}

export function Screen({ children, scroll = false, padded = true, style, contentStyle, bottomInset = 0 }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + space.lg,
    paddingBottom: insets.bottom + space.lg + bottomInset,
    paddingHorizontal: padded ? space.xl : 0,
  };
  return (
    <View style={[styles.root, style]}>
      <StatusBar style="dark" />
      {scroll ? (
        <>
          <ScrollView contentContainerStyle={[padding, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {/* A solid band behind the status bar, so scrolled text never runs under the clock. */}
          <View pointerEvents="none" style={[styles.statusBand, { height: insets.top }]} />
        </>
      ) : (
        <View style={[styles.fill, padding, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  fill: { flex: 1 },
  statusBand: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.ground },
});

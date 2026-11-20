import * as React from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import Constants from 'expo-constants';
import { Button, Rule, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { debugPanelEnabled } from '../features/debug/debugFlag';
import { buildDebugReport, useDebugSnapshot } from '../features/debug/debugStore';

/**
 * TestFlight-only debug screen: what the last scan or practice actually measured, so a failed
 * reading can be described exactly. Hidden in App Store builds (see debugFlag.ts).
 */
function meta() {
  const c = Constants as unknown as { nativeBuildVersion?: string | null; deviceName?: string | null };
  return {
    appVersion: Constants.expoConfig?.version ?? 'n/a',
    build: c.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber ?? 'n/a',
    device: c.deviceName ?? Platform.OS,
    os: `${Platform.OS} ${String(Platform.Version)}`,
  };
}

export default function DebugScreen() {
  // Decided before any hook runs: an App Store build never mounts the screen at all.
  if (!debugPanelEnabled()) return <Redirect href="/home" />;
  return <DebugPanel />;
}

function DebugPanel() {
  const snap = useDebugSnapshot();
  const report = buildDebugReport(snap, meta());
  const gateColor = snap.gate ? (snap.gate.ok ? colors.fg : colors.fg70) : colors.fg60;
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="eyebrow" color={colors.bone70} onPress={() => router.back()} accessibilityRole="button">
          ← Back
        </Text>
        <Text variant="eyebrow" color={colors.bone70}>
          TestFlight only
        </Text>
      </View>
      <Text variant="display" style={{ marginTop: space.xl }}>
        Debug
      </Text>
      <Text variant="bodySmall" color={colors.fg70} style={{ marginTop: space.sm }}>
        Do a scan or a practice, then come back here. Tap Share report and send it to Claude with what you did.
      </Text>
      {snap.gate ? (
        <Text variant="heading" color={gateColor} style={{ marginTop: space.lg }}>
          Reading gate: {snap.gate.ok ? 'PASS' : 'RETRY'} · {snap.gate.reason}
        </Text>
      ) : null}
      <Rule style={{ marginTop: space.lg }} />
      <Text variant="mono" selectable style={{ marginTop: space.lg }}>
        {report}
      </Text>
      <Button label="Share report" onPress={() => void Share.share({ message: report }).catch(() => undefined)} block style={{ marginTop: space.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

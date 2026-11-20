import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { useAppState } from '../features/store/AppStore';
import { AURA_COLORS } from '../core/color/palette';
import { scanInsight } from '../core/insight/baseline';
import { AuraView } from '../render/fluid/AuraView';
import { getCachedMask } from '../features/scan/sessionCache';
import { PREVIEW_PARAMS } from '../features/scan/previewParams';
import { formatDate } from '../ui/format';
import { freeScanStatus } from '../services/entitlements';
import { isToday, weeklyStreak } from '../core/insight/streak';
import { useNow } from '../ui/useNow';

/**
 * Home is two fields. A black stage with the latest portrait, the only color on the screen,
 * and a gray sheet that names it in one large word and offers one action.
 */
export default function Home() {
  const { scans, entitlement, canScan, nextFreeScanAt, practices } = useAppState();
  const insets = useSafeAreaInsets();
  const latest = scans[0] ?? null;
  const insight = latest ? scanInsight(latest, scans) : null;
  // No outline yet means no silhouette: the aura is drawn as a soft cloud, never around a stand-in figure.
  const mask = React.useMemo(() => (latest ? getCachedMask(latest.id) : null), [latest]);
  const params = latest?.aura ?? PREVIEW_PARAMS;
  const now = useNow();
  const streak = React.useMemo(() => weeklyStreak(scans.map((s) => s.createdAt), now), [scans, now]);
  const when = latest ? (isToday(latest.createdAt, now) ? "Today's color" : `Latest · ${formatDate(latest.createdAt)}`) : 'Preview';
  const openLatest = () => latest && router.push({ pathname: '/portrait/[id]', params: { id: latest.id } });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Pressable
        style={styles.stage}
        disabled={!latest}
        accessibilityRole={latest ? 'button' : undefined}
        accessibilityLabel={latest ? `Open your latest portrait, ${AURA_COLORS[latest.aura.primaryColorId].name}` : 'Preview portrait'}
        onPress={openLatest}
      >
        <AuraView params={params} mask={mask} stillUri={latest?.stillUri ?? null} quality="medium" style={StyleSheet.absoluteFill} />
        <View style={styles.scrimTop} pointerEvents="none" />
        <View style={styles.scrimBottom} pointerEvents="none" />
        <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
          <Text variant="eyebrow" color={colors.stageFg}>
            Affelion Halo
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={16} onPress={() => router.push('/settings')}>
            <Text variant="eyebrow" color={colors.stageFg}>
              Settings
            </Text>
          </Pressable>
        </View>
        <View style={styles.stageCaption}>
          <Text variant="eyebrow" color={colors.stageFg}>
            {streak >= 2 ? `${when} · ${streak} weeks in a row` : when}
          </Text>
          {latest ? (
            <Text variant="eyebrow" color={colors.stageFg}>
              Open →
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
        {latest ? (
          <View>
            <Text variant="hero" accessibilityRole="header">
              {AURA_COLORS[latest.aura.primaryColorId].name}
            </Text>
            <Text variant="mono" color={colors.fg60} style={{ marginTop: space.sm }}>
              {Math.round(latest.heart.bpm)} bpm · variation {Math.round(latest.heart.rmssd)} ms
              {latest.voice && latest.voice.quality > 0.2 ? ` · voice ${Math.round(latest.voice.variance * 100)}%` : ''}
            </Text>
            {insight?.baseline ? (
              <Text variant="bodySmall" color={colors.fg70} style={{ marginTop: space.md }}>
                {insight.sentence}
              </Text>
            ) : null}
          </View>
        ) : (
          <View>
            <Text variant="display" accessibilityRole="header">
              See how{'\n'}you are.
            </Text>
            <Text variant="bodySmall" color={colors.fg70} style={{ marginTop: space.md }}>
              About a minute: your outline, a fingertip on the rear camera, a few words aloud. Your portrait is built from those readings.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button label={canScan ? (latest ? 'New scan' : 'Begin scan') : 'Unlock scans'} onPress={() => router.push(canScan ? '/scan' : '/paywall')} block />
          <View style={styles.links}>
            {latest ? (
              <Button label={practices.length ? 'Practice' : 'First practice, free'} variant="ghost" onPress={() => router.push({ pathname: '/practice', params: { scanId: latest.id } })} />
            ) : null}
            {scans.length > 0 ? <Button label="History" variant="ghost" onPress={() => router.push('/history')} /> : null}
            {!latest ? <Button label="How it works" variant="ghost" onPress={() => router.push('/how')} /> : null}
          </View>
          <Text variant="caption" color={colors.fg60}>
            {entitlement.isPro ? 'Pro · unlimited' : freeScanStatus(nextFreeScanAt, now)} · Not a medical device
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  stage: { flex: 1, backgroundColor: colors.stage, overflow: 'hidden' },
  // Labels sit on the picture; these keep them readable over even the brightest aura.
  scrimTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 120, experimental_backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0))' },
  scrimBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, experimental_backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))' },
  top: { position: 'absolute', left: space.xl, right: space.xl, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  stageCaption: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.xl },
  actions: { marginTop: space.xl, gap: space.sm },
  links: { flexDirection: 'row', gap: space.xl },
});

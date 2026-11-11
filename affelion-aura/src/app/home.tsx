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
import { placeholderMask } from '../render/fluid/FluidSim';
import { getCachedMask } from '../features/scan/sessionCache';
import { PREVIEW_PARAMS } from '../features/scan/previewParams';
import { formatDate } from '../ui/format';

/**
 * Home is two fields. A black stage with the latest portrait, the only colour on the screen,
 * and a grey sheet that names it in one large word and offers one action.
 */
export default function Home() {
  const { scans, entitlement, canScan, freeScansLeft: left, practices } = useAppState();
  const insets = useSafeAreaInsets();
  const latest = scans[0] ?? null;
  const insight = latest ? scanInsight(latest, scans) : null;
  const mask = React.useMemo(() => (latest ? getCachedMask(latest.id) ?? placeholderMask() : placeholderMask()), [latest]);
  const params = latest?.aura ?? PREVIEW_PARAMS;
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
        <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
          <Text variant="eyebrow" color={colors.stageFg}>
            Affelion Aura
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={16} onPress={() => router.push('/settings')}>
            <Text variant="eyebrow" color={colors.stageFg}>
              Settings
            </Text>
          </Pressable>
        </View>
        <View style={styles.stageCaption}>
          <Text variant="eyebrow" color={colors.stageFg70}>
            {latest ? `Latest · ${formatDate(latest.createdAt)}` : 'Preview'}
          </Text>
          {latest ? (
            <Text variant="eyebrow" color={colors.stageFg70}>
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
              {Math.round(latest.heart.bpm)} bpm · HRV {Math.round(latest.heart.rmssd)} ms
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
          </View>
          <Text variant="caption" color={colors.fg60}>
            {entitlement.isPro ? 'Pro · unlimited' : left > 0 ? `${left} of 3 free scans left` : 'Free scans used'} · Not a medical device
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  stage: { flex: 1, backgroundColor: colors.stage, overflow: 'hidden' },
  top: { position: 'absolute', left: space.xl, right: space.xl, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  stageCaption: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.xl },
  actions: { marginTop: space.xl, gap: space.sm },
  links: { flexDirection: 'row', gap: space.xl },
});

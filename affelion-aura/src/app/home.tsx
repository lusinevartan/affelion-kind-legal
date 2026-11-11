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
 * Home: the latest portrait fills the screen; words sit in the corners like labels on a specimen.
 */
export default function Home() {
  const { scans, entitlement, canScan, freeScansLeft: left, practices } = useAppState();
  const insets = useSafeAreaInsets();
  const latest = scans[0] ?? null;
  const insight = latest ? scanInsight(latest, scans) : null;
  const mask = React.useMemo(() => (latest ? getCachedMask(latest.id) ?? placeholderMask() : placeholderMask()), [latest]);
  const params = latest?.aura ?? PREVIEW_PARAMS;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <AuraView params={params} mask={mask} quality="medium" paper style={StyleSheet.absoluteFill} />
      <View style={styles.scrim} pointerEvents="none" />

      <View style={[styles.top, { paddingTop: insets.top + space.lg }]}>
        <Text variant="eyebrow" color={colors.bone70}>
          Affelion Aura
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={12} onPress={() => router.push('/settings')}>
          <Text variant="eyebrow" color={colors.bone70}>
            Settings
          </Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        {latest ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Open your latest portrait" onPress={() => router.push({ pathname: '/portrait/[id]', params: { id: latest.id } })}>
            <Text variant="eyebrow" color={colors.bone50}>
              Fig. 01  Latest · {formatDate(latest.createdAt)}
            </Text>
            <Text variant="display" style={{ marginTop: space.sm }}>
              {AURA_COLORS[latest.aura.primaryColorId].name}
            </Text>
            <Text variant="mono" color={colors.bone70} style={{ marginTop: space.sm }}>
              {Math.round(latest.heart.bpm)} bpm · HRV {Math.round(latest.heart.rmssd)} ms
              {latest.voice && latest.voice.quality > 0.2 ? ` · voice ${Math.round(latest.voice.variance * 100)}%` : ''}
            </Text>
            {insight?.baseline ? (
              <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.md, maxWidth: 320 }}>
                {insight.sentence}
              </Text>
            ) : null}
          </Pressable>
        ) : (
          <View>
            <Text variant="eyebrow" color={colors.bone50}>
              Fig. 00  Preview
            </Text>
            <Text variant="display" style={{ marginTop: space.sm }}>
              Your pulse,{'\n'}painted.
            </Text>
            <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.md, maxWidth: 320 }}>
              About a minute: your outline, your fingertip on the rear camera, a few words. The colours above are a neutral preview until then.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button label={canScan ? 'Begin scan' : 'Unlock scans'} onPress={() => router.push(canScan ? '/scan' : '/paywall')} block />
          <View style={styles.links}>
            {latest ? (
              <Button label={practices.length ? 'Practice' : 'First practice, free'} variant="ghost" onPress={() => router.push({ pathname: '/practice', params: { scanId: latest.id } })} />
            ) : null}
            {scans.length > 0 ? <Button label="History" variant="ghost" onPress={() => router.push('/history')} /> : null}
          </View>
          <Text variant="mono" color={colors.bone50}>
            {entitlement.isPro ? 'Pro · unlimited' : left > 0 ? `${left} of 3 free scans left` : 'Free scans used'} · not a medical device
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  top: { position: 'absolute', left: space.xl, right: space.xl, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  bottom: { position: 'absolute', left: space.xl, right: space.xl, bottom: 0 },
  actions: { marginTop: space.xl, gap: space.md },
  links: { flexDirection: 'row', gap: space.xl },
});

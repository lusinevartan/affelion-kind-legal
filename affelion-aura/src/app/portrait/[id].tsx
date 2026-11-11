import * as React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Figure, Rule, Text } from '../../ui/components';
import { colors, space } from '../../ui/theme';
import { useAppActions, useAppState } from '../../features/store/AppStore';
import { getCachedMask } from '../../features/scan/sessionCache';
import { AuraView } from '../../render/fluid/AuraView';
import { placeholderMask } from '../../render/fluid/FluidSim';
import { AURA_COLORS } from '../../core/color/palette';
import type { AuraRegion } from '../../core/types';
import { usePolaroidExport } from '../../features/portrait/usePolaroidExport';
import { formatDate } from '../../ui/format';

/**
 * The portrait. A black stage edge to edge with the developed picture, then a grey sheet that
 * names the colour in one large word, gives the three readings and one action. Two numbered
 * markers on the stage open knowledge-base explanations. The paywall is only offered from
 * here, after the portrait exists.
 */
export default function PortraitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, entitlement } = useAppState();
  const { refreshScans } = useAppActions();
  const insets = useSafeAreaInsets();
  const record = scans.find((s) => s.id === id) ?? null;
  const plateNo = record ? String(scans.length - scans.indexOf(record)).padStart(3, '0') : '000';
  const mask = React.useMemo(() => (id ? getCachedMask(id) ?? placeholderMask() : placeholderMask()), [id]);
  const [region, setRegion] = React.useState<AuraRegion | null>(null);
  const exportOpts = React.useMemo(() => ({ clean: entitlement.isPro, exportWidth: entitlement.isPro ? 720 : 480, onSaved: refreshScans }), [entitlement.isPro, refreshScans]);
  const { auraRef, busy, run: exportPortrait, exportCard } = usePolaroidExport(record, exportOpts);

  const width = Dimensions.get('window').width;
  const plateH = Math.round(Math.min(width * 1.25, Dimensions.get('window').height * 0.62));

  if (!record) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space.xl, paddingHorizontal: space.xl }]}>
        <Text variant="title" color={colors.inkText}>
          Portrait not found
        </Text>
        <Button label="Home" variant="secondary" onPaper onPress={() => router.replace('/home')} style={{ marginTop: space.xl }} />
      </View>
    );
  }

  const { heart, voice, aura } = record;
  const regions = aura.regions.slice(0, 2);
  const openFull = () => {
    if (entitlement.isPro) router.push({ pathname: '/report/[id]', params: { id: record.id } });
    else router.push({ pathname: '/paywall', params: { from: record.id } });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        <View style={[styles.plate, { width, height: plateH }]}>
          <AuraView ref={auraRef} params={aura} mask={mask} stillUri={record.stillUri} style={StyleSheet.absoluteFill} />
          <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Home" hitSlop={16} onPress={() => router.replace('/home')}>
              <Text variant="eyebrow" color={colors.stageFg}>
                ← Home
              </Text>
            </Pressable>
            <Text variant="eyebrow" color={colors.stageFg70}>
              No. {plateNo} · {formatDate(record.createdAt)}
            </Text>
          </View>
          {regions.map((r, i) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityLabel={`${AURA_COLORS[r.colorId].name} region, tap to explain`}
              accessibilityState={{ selected: region?.id === r.id }}
              onPress={() => setRegion(region?.id === r.id ? null : r)}
              style={[styles.marker, r.id === 'core' ? styles.markerCore : styles.markerHalo]}
            >
              <View style={[styles.markerDot, region?.id === r.id && styles.markerDotOn]}>
                <Text variant="caption" color={region?.id === r.id ? colors.stage : colors.stageFg}>
                  {i + 1}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sheet}>
        <Text variant="hero" accessibilityRole="header">
          {AURA_COLORS[aura.primaryColorId].name}
        </Text>
        <Text variant="body" color={colors.fg70} style={{ marginTop: space.md }}>
          {aura.summary}
        </Text>

        <Rule onPaper style={{ marginTop: space.xl }} />
        <View style={styles.figures}>
          <Figure label="Pulse" value={Math.round(heart.bpm).toString()} unit="bpm" />
          <Figure label="HRV" value={Math.round(heart.rmssd).toString()} unit="ms" />
          <Figure label="Voice" value={voice && voice.quality > 0.2 ? `${Math.round(voice.variance * 100)}` : '—'} unit={voice && voice.quality > 0.2 ? '% var' : undefined} onPaper />
        </View>
        <Rule onPaper />

        {region ? (
          <View style={styles.explain} accessibilityLiveRegion="polite">
            <Text variant="eyebrow" color={colors.inkText50}>
              {regions.findIndex((r) => r.id === region.id) + 1} · {AURA_COLORS[region.colorId].name}
            </Text>
            <Text variant="body" color={colors.inkText} style={{ marginTop: space.sm }}>
              {region.explanation}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color={colors.inkText50} style={{ marginTop: space.md }}>
            Tap a number on the portrait to see which reading made that colour.
          </Text>
        )}

        <View style={{ marginTop: space.xl, gap: space.md }}>
          <Button label={entitlement.isPro ? 'Full breakdown' : 'See the full breakdown'} onPress={openFull} block />
          <View style={styles.links}>
            <Button label="Save" variant="ghost" onPaper onPress={() => void exportPortrait('save')} loading={busy === 'save'} />
            <Button label="Share" variant="ghost" onPaper onPress={() => void exportPortrait('share')} loading={busy === 'share'} />
          </View>
        </View>
        </View>
      </ScrollView>
      {exportCard}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  plate: { backgroundColor: colors.stage, overflow: 'hidden' },
  top: { position: 'absolute', left: space.xl, right: space.xl, top: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.xl },
  marker: { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  markerCore: { left: '50%', top: '66%', marginLeft: -24 },
  markerHalo: { right: '9%', top: '24%' },
  markerDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.stageFg, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  markerDotOn: { backgroundColor: colors.stageFg },
  figures: { flexDirection: 'row', justifyContent: 'space-between' },
  explain: { marginTop: space.lg },
  links: { flexDirection: 'row', gap: space.xl },
});

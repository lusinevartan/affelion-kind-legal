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
 * The sheet. A plate of the portrait printed on paper, labelled like an archive specimen:
 * figure numbers, measurements in mono, one serif caption. Two markers open knowledge-base
 * explanations. The paywall is only offered from here, after the portrait exists.
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

  const width = Dimensions.get('window').width - space.xl * 2;
  const plateH = Math.round(width * 1.2);

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
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.xl }}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Home" hitSlop={12} onPress={() => router.replace('/home')}>
            <Text variant="eyebrow" color={colors.inkText70}>
              ← Home
            </Text>
          </Pressable>
          <Text variant="eyebrow" color={colors.inkText50}>
            Plate {plateNo} · {formatDate(record.createdAt)}
          </Text>
        </View>

        <View style={[styles.plate, { width, height: plateH }]}>
          <AuraView ref={auraRef} params={aura} mask={mask} style={StyleSheet.absoluteFill} />
          {regions.map((r, i) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityLabel={`${AURA_COLORS[r.colorId].name} region, tap to explain`}
              onPress={() => setRegion(region?.id === r.id ? null : r)}
              style={[styles.marker, r.id === 'core' ? styles.markerCore : styles.markerHalo, region?.id === r.id && styles.markerOn]}
            >
              <Text variant="mono" color={colors.bone}>
                {String(i + 1).padStart(2, '0')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="serifCaption" color={colors.inkText} style={{ marginTop: space.lg }}>
          {AURA_COLORS[aura.primaryColorId].name}
        </Text>
        <Text variant="body" color={colors.inkText70} style={{ marginTop: space.xs }}>
          {aura.summary}
        </Text>

        <Rule onPaper style={{ marginTop: space.xl }} />
        <View style={styles.figures}>
          <Figure n="01" label="Pulse" value={Math.round(heart.bpm).toString()} unit="bpm" onPaper />
          <Figure n="02" label="HRV" value={Math.round(heart.rmssd).toString()} unit="ms" onPaper />
          <Figure n="03" label="Voice" value={voice && voice.quality > 0.2 ? `${Math.round(voice.variance * 100)}` : '—'} unit={voice && voice.quality > 0.2 ? '% var' : undefined} onPaper />
        </View>
        <Rule onPaper />

        {region ? (
          <View style={styles.explain} accessibilityLiveRegion="polite">
            <Text variant="eyebrow" color={colors.inkText50}>
              Marker {String(regions.findIndex((r) => r.id === region.id) + 1).padStart(2, '0')} · {AURA_COLORS[region.colorId].name}
            </Text>
            <Text variant="body" color={colors.inkText} style={{ marginTop: space.sm }}>
              {region.explanation}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color={colors.inkText50} style={{ marginTop: space.md }}>
            Tap a marker on the plate to see which measurement made that colour.
          </Text>
        )}

        <View style={{ marginTop: space.xl, gap: space.md }}>
          <Button label={entitlement.isPro ? 'Full breakdown' : 'See the full breakdown'} onPress={openFull} block />
          <View style={styles.links}>
            <Button label="Save" variant="ghost" onPaper onPress={() => void exportPortrait('save')} loading={busy === 'save'} />
            <Button label="Share" variant="ghost" onPaper onPress={() => void exportPortrait('share')} loading={busy === 'share'} />
          </View>
        </View>
      </ScrollView>
      {exportCard}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  plate: { backgroundColor: colors.ink, overflow: 'hidden' },
  marker: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  markerCore: { left: '50%', top: '40%', marginLeft: -22 },
  markerHalo: { right: '10%', top: '16%' },
  markerOn: { backgroundColor: 'rgba(246,243,227,0.18)' },
  figures: { flexDirection: 'row', justifyContent: 'space-between' },
  explain: { marginTop: space.lg },
  links: { flexDirection: 'row', gap: space.xl },
});

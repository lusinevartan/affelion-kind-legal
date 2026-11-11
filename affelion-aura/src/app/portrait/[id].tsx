import * as React from 'react';
import { formatDate, formatDateTime } from '../../ui/format';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Screen, Text } from '../../ui/components';
import { colors, radius, space } from '../../ui/theme';
import { useAppActions, useAppState } from '../../features/store/AppStore';
import { getCachedMask } from '../../features/scan/sessionCache';
import { PolaroidCard } from '../../render/polaroid/PolaroidCard';
import { AURA_COLORS } from '../../core/color/palette';
import type { AuraRegion } from '../../core/types';
import { usePolaroidExport } from '../../features/portrait/usePolaroidExport';

/**
 * The free teaser. Real value first: the finished Polaroid, one honest sentence, and one or
 * two tappable regions. The paywall is offered only after this, never before.
 */
export default function PortraitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, entitlement } = useAppState();
  const { refreshScans } = useAppActions();
  const record = scans.find((s) => s.id === id) ?? null;
  const mask = React.useMemo(() => (id ? getCachedMask(id) : null), [id]);
  const [region, setRegion] = React.useState<AuraRegion | null>(null);
  const exportOpts = React.useMemo(() => ({ clean: entitlement.isPro, exportWidth: entitlement.isPro ? 720 : 480, onSaved: refreshScans }), [entitlement.isPro, refreshScans]);
  const { auraRef, busy, run: exportPortrait, exportCard } = usePolaroidExport(record, exportOpts);

  const width = Math.min(Dimensions.get('window').width - space.xl * 2, 380);

  if (!record) {
    return (
      <Screen>
        <Text variant="title">Portrait not found</Text>
        <Button label="Home" variant="secondary" onPress={() => router.replace('/home')} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const teaserRegions = record.aura.regions.slice(0, 2);

  const openFull = () => {
    if (entitlement.isPro) router.push({ pathname: '/report/[id]', params: { id: record.id } });
    else router.push({ pathname: '/paywall', params: { from: record.id } });
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Home" hitSlop={12} onPress={() => router.replace('/home')}>
          <Text variant="bodySmall" color={colors.bone70}>
            Home
          </Text>
        </Pressable>
        <Text variant="caption" color={colors.bone50}>
          {formatDateTime(record.createdAt)}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <PolaroidCard
          auraRef={auraRef}
          width={width}
          stillUri={record.stillUri}
          aura={{ kind: 'live', params: record.aura, mask }}
          caption={AURA_COLORS[record.aura.primaryColorId].name}
          subcaption={formatDate(record.createdAt)}
          showWordmark={!entitlement.isPro}
          overlay={
            <>
              {teaserRegions.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${AURA_COLORS[r.colorId].name} region, tap to explain`}
                  onPress={() => setRegion(region?.id === r.id ? null : r)}
                  style={[styles.hotspot, r.id === 'core' ? styles.hotspotCore : styles.hotspotHalo, region?.id === r.id && styles.hotspotActive]}
                >
                  <View style={[styles.hotspotDot, { backgroundColor: AURA_COLORS[r.colorId].hex }]} />
                </Pressable>
              ))}
            </>
          }
        />
      </View>

      <Text variant="body" style={{ marginTop: space.xl }}>
        {record.aura.summary}
      </Text>

      {region ? (
        <View style={styles.explain} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={[styles.hotspotDot, { backgroundColor: AURA_COLORS[region.colorId].hex }]} />
            <Text variant="heading">{AURA_COLORS[region.colorId].name}</Text>
          </View>
          <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
            {region.explanation}
          </Text>
        </View>
      ) : (
        <Text variant="caption" color={colors.bone50} style={{ marginTop: space.md }}>
          Tap a marker on the portrait to see which measurement made that colour.
        </Text>
      )}

      <View style={{ marginTop: space.xl, gap: space.md }}>
        <Button label={entitlement.isPro ? 'Full breakdown' : 'See the full breakdown'} onPress={openFull} block />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button label="Save" variant="secondary" onPress={() => void exportPortrait('save')} loading={busy === 'save'} style={{ flex: 1 }} />
          <Button label="Share" variant="secondary" onPress={() => void exportPortrait('share')} loading={busy === 'share'} style={{ flex: 1 }} />
        </View>
      </View>
      {exportCard}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotspot: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotCore: { left: '50%', top: '38%', marginLeft: -22 },
  hotspotHalo: { right: '8%', top: '18%' },
  hotspotActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  hotspotDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  explain: { marginTop: space.lg, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
});

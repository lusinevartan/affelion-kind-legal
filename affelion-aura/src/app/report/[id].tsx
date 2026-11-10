import * as React from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, ColorSwatch, MetricRow, Screen, Text } from '../../ui/components';
import { colors, space } from '../../ui/theme';
import { useAppActions, useAppState } from '../../features/store/AppStore';
import { getCachedMask } from '../../features/scan/sessionCache';
import { PolaroidCard } from '../../render/polaroid/PolaroidCard';
import { AURA_COLOR_IDS, AURA_COLORS } from '../../core/color/palette';
import { usePolaroidExport } from '../../features/portrait/usePolaroidExport';

/**
 * Paid full breakdown. Every colour in the portrait is tied to a number from this scan, in the
 * language of the colour system. Nothing is added that was not measured.
 */
export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, entitlement } = useAppState();
  const { refreshScans } = useAppActions();
  const record = scans.find((s) => s.id === id) ?? null;
  const mask = React.useMemo(() => (id ? getCachedMask(id) : null), [id]);
  const exportOpts = React.useMemo(() => ({ clean: true, exportWidth: 720, onSaved: refreshScans }), [refreshScans]);
  const { auraRef, busy, run: exportHiRes, exportCard } = usePolaroidExport(record, exportOpts);

  React.useEffect(() => {
    if (!entitlement.isPro && record) router.replace({ pathname: '/paywall', params: { from: record.id } });
  }, [entitlement.isPro, record]);

  if (!record) {
    return (
      <Screen>
        <Text variant="title">Scan not found</Text>
        <Button label="Home" variant="secondary" onPress={() => router.replace('/home')} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const { heart, voice, aura } = record;
  const width = Math.min(Dimensions.get('window').width - space.xl * 2, 320);

  const hrvWord = aura.state.coherence < 0.25 ? 'low' : aura.state.coherence < 0.5 ? 'moderate' : aura.state.coherence < 0.78 ? 'good' : 'high';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text variant="bodySmall" color={colors.bone70}>
            Back
          </Text>
        </Pressable>
        <Text variant="caption" color={colors.bone50}>
          {new Date(record.createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <PolaroidCard auraRef={auraRef} width={width} stillUri={record.stillUri} aura={{ kind: 'live', params: aura, mask }} caption={AURA_COLORS[aura.dominant].name} subcaption={new Date(record.createdAt).toLocaleDateString()} showWordmark={false} />
      </View>

      <Text variant="title" style={{ marginTop: space.xxl }}>
        What made this portrait
      </Text>
      <Text variant="body" color={colors.bone70} style={{ marginTop: space.sm }}>
        {aura.summary}
      </Text>

      <Card style={{ marginTop: space.xl }}>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>
          MEASUREMENTS
        </Text>
        <MetricRow label="Heart rate" value={heart.bpm.toFixed(0)} unit="bpm" note={`${heart.beatCount} beats over ${heart.durationSec.toFixed(0)} s`} />
        <MetricRow label="Variability (RMSSD)" value={heart.rmssd.toFixed(0)} unit="ms" note={`${hrvWord} for this pulse`} />
        <MetricRow label="Variability (SDNN)" value={heart.sdnn.toFixed(0)} unit="ms" />
        <MetricRow label="pNN50" value={heart.pnn50.toFixed(0)} unit="%" note="Beats differing by more than 50 ms" />
        <MetricRow label="Signal quality" value={`${Math.round(heart.quality * 100)}`} unit="%" />
        {voice && voice.quality > 0.2 ? (
          <>
            <MetricRow label="Voice pitch (median)" value={voice.medianPitchHz.toFixed(0)} unit="Hz" />
            <MetricRow label="Pitch variation" value={voice.pitchVarianceSemitones.toFixed(1)} unit="semitones" />
            <MetricRow label="Loudness variation" value={Math.round(voice.energyVariance * 100).toString()} unit="%" />
            <MetricRow label="Voiced" value={Math.round(voice.voicedRatio * 100).toString()} unit="% of sample" />
          </>
        ) : (
          <MetricRow label="Voice" value="—" note="Skipped or too quiet; only the pulse shaped this portrait" />
        )}
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>
          REGIONS
        </Text>
        {aura.regions.map((r) => (
          <View key={r.id} style={{ marginTop: space.lg }}>
            <ColorSwatch id={r.colorId} />
            <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.xs, paddingHorizontal: space.sm }}>
              {r.explanation}
            </Text>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>
          SHADER PARAMETERS
        </Text>
        <MetricRow label="Hue" value={`${aura.hue}`} unit="°" />
        <MetricRow label="Saturation" value={aura.saturation.toFixed(2)} note="Raised by vocal variation" />
        <MetricRow label="Lightness" value={aura.lightness.toFixed(2)} note="Lifted by high variability" />
        <MetricRow label="Turbulence" value={aura.turbulence.toFixed(2)} note="Faster pulse and lower variability add motion" />
        <MetricRow label="Pulse" value={aura.pulseSpeed.toFixed(2)} unit="Hz" note="The fluid breathes at your heart rate" />
        <Text variant="caption" color={colors.bone50} style={{ marginTop: space.md }}>
          Identical measurements always produce identical parameters.
        </Text>
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>
          THE COLOUR SYSTEM
        </Text>
        <View style={{ marginTop: space.sm }}>
          {AURA_COLOR_IDS.map((cid) => (
            <ColorSwatch key={cid} id={cid} selected={cid === aura.dominant || cid === aura.secondary || cid === aura.accent} />
          ))}
        </View>
      </Card>

      <View style={{ marginTop: space.xl, gap: space.md }}>
        <Button label="Ask the guide" onPress={() => router.push({ pathname: '/guide/[id]', params: { id: record.id } })} block />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button label="Save clean export" variant="secondary" onPress={() => void exportHiRes('save')} loading={busy === 'save'} style={{ flex: 1 }} />
          <Button label="Share" variant="secondary" onPress={() => void exportHiRes('share')} loading={busy === 'share'} style={{ flex: 1 }} />
        </View>
      </View>
      {exportCard}
      <Text variant="caption" color={colors.bone30} style={{ marginTop: space.xxl }} align="center">
        Not a medical device. For health concerns, speak with a clinician.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

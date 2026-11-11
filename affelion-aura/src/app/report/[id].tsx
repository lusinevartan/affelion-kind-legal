import * as React from 'react';
import { formatDateTime } from '../../ui/format';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, ColorSwatch, Figure, MetricRow, Rule, Screen, Text } from '../../ui/components';
import { colors, space } from '../../ui/theme';
import { useAppActions, useAppState } from '../../features/store/AppStore';
import { getCachedMask } from '../../features/scan/sessionCache';
import { AuraView } from '../../render/fluid/AuraView';
import { placeholderMask } from '../../render/fluid/FluidSim';
import { AURA_COLOR_IDS } from '../../core/color/palette';
import { usePolaroidExport } from '../../features/portrait/usePolaroidExport';
import { scanInsight } from '../../core/insight/baseline';
import { FRAME_STYLE_IDS, FRAME_STYLES } from '../../render/polaroid/styles';

/**
 * Paid full breakdown. Every colour in the portrait is tied to a number from this scan, in the
 * language of the colour system. Nothing is added that was not measured.
 */
export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, entitlement, frameStyle } = useAppState();
  const { refreshScans, setFrameStyle } = useAppActions();
  const record = scans.find((s) => s.id === id) ?? null;
  const mask = React.useMemo(() => (id ? getCachedMask(id) ?? placeholderMask() : placeholderMask()), [id]);
  const exportOpts = React.useMemo(() => ({ clean: true, exportWidth: 720, onSaved: refreshScans, frame: frameStyle }), [refreshScans, frameStyle]);
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
  const width = Dimensions.get('window').width - space.xl * 2;

  const insight = scanInsight(record, scans);
  const hrvWord = aura.state.coherence < 0.25 ? 'low' : aura.state.coherence < 0.5 ? 'moderate' : aura.state.coherence < 0.78 ? 'good' : 'high';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text variant="eyebrow" color={colors.bone70}>
            ← Back
          </Text>
        </Pressable>
        <Text variant="eyebrow" color={colors.bone50}>
          {formatDateTime(record.createdAt)}
        </Text>
      </View>

      <View style={[styles.plate, { width, height: Math.round(width * 1.2), marginTop: space.lg }]}>
        <AuraView ref={auraRef} params={aura} mask={mask} paper style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.frameRow} accessibilityRole="radiogroup" accessibilityLabel="Export frame">
        <Text variant="eyebrow" color={colors.bone50}>
          Export frame
        </Text>
        {FRAME_STYLE_IDS.map((id) => (
          <Pressable key={id} accessibilityRole="radio" accessibilityState={{ selected: frameStyle === id }} accessibilityLabel={FRAME_STYLES[id].name} onPress={() => void setFrameStyle(id)} hitSlop={8}>
            <Text variant="eyebrow" color={frameStyle === id ? colors.bone : colors.bone50} style={frameStyle === id ? { textDecorationLine: 'underline' } : undefined}>
              {FRAME_STYLES[id].name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="display" style={{ marginTop: space.xxl }}>
        What made this portrait
      </Text>
      <Text variant="body" color={colors.bone70} style={{ marginTop: space.sm }}>
        {aura.summary}
      </Text>
      <Rule style={{ marginTop: space.xl }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Figure n="01" label="Pulse" value={heart.bpm.toFixed(0)} unit="bpm" />
        <Figure n="02" label="HRV" value={heart.rmssd.toFixed(0)} unit="ms" />
        <Figure n="03" label="Voice" value={voice && voice.quality > 0.2 ? Math.round(voice.variance * 100).toString() : '—'} unit={voice && voice.quality > 0.2 ? '% var' : undefined} />
      </View>
      <Rule />

      <Card style={{ marginTop: space.xl }}>
        <Text variant="eyebrow" color={colors.bone60}>
          MEASUREMENTS
        </Text>
        <MetricRow label="Heart rate" value={heart.bpm.toFixed(0)} unit="bpm" note={`${heart.beatCount} beats over ${heart.durationSec.toFixed(0)} s`} />
        <MetricRow label="Variability (RMSSD)" value={heart.rmssd.toFixed(0)} unit="ms" note={`${hrvWord} for this pulse`} />
        <MetricRow label="Variability (SDNN)" value={heart.sdnn.toFixed(0)} unit="ms" />
        <MetricRow label="pNN50" value={heart.pnn50.toFixed(0)} unit="%" note="Beats differing by more than 50 ms" />
        <MetricRow label="Signal quality" value={`${Math.round(heart.quality * 100)}`} unit="%" />
        {voice && voice.quality > 0.2 ? (
          <>
            <MetricRow label="Dominant pitch" value={voice.dominantPitchHz.toFixed(0)} unit="Hz" />
            <MetricRow label="Vocal variance" value={Math.round(voice.variance * 100).toString()} unit="%" note={`${voice.pitchVarianceSemitones.toFixed(1)} semitones of pitch spread`} />
            <MetricRow label="Vocal stability" value={Math.round(voice.stability * 100).toString()} unit="%" />
            <MetricRow label="Voiced" value={Math.round(voice.voicedRatio * 100).toString()} unit="% of sample" />
          </>
        ) : (
          <MetricRow label="Voice" value="—" note="Skipped or too quiet; only the pulse shaped this portrait" />
        )}
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          AGAINST YOUR BASELINE
        </Text>
        {insight.trendColorId ? (
          <View style={{ marginTop: space.sm }}>
            <ColorSwatch id={insight.trendColorId} />
          </View>
        ) : null}
        <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.sm }}>
          {insight.sentence}
        </Text>
        <Button label="Practice from this scan" variant="secondary" onPress={() => router.push({ pathname: '/practice', params: { scanId: record.id } })} style={{ marginTop: space.lg }} />
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
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
        <Text variant="eyebrow" color={colors.bone60}>
          SHADER PARAMETERS
        </Text>
        <MetricRow label="Hue" value={`${aura.hue}`} unit="°" />
        <MetricRow label="Saturation" value={aura.saturation.toFixed(2)} note="Raised by vocal variance" />
        <MetricRow label="Lightness" value={aura.lightness.toFixed(2)} note="Set by vocal stability" />
        <MetricRow label="Turbulence" value={aura.turbulence.toFixed(2)} note="Higher for elevated BPM or low HRV" />
        <MetricRow label="Pulse" value={aura.pulseSpeed.toFixed(2)} unit="Hz" note="The fluid breathes at your heart rate" />
        <Text variant="caption" color={colors.bone50} style={{ marginTop: space.md }}>
          Identical measurements always produce identical parameters.
        </Text>
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          THE COLOUR KNOWLEDGE BASE
        </Text>
        <View style={{ marginTop: space.sm }}>
          {AURA_COLOR_IDS.map((cid) => (
            <ColorSwatch key={cid} id={cid} selected={cid === aura.primaryColorId || cid === aura.secondaryColorId} />
          ))}
        </View>
      </Card>

      <View style={{ marginTop: space.xl, gap: space.md }}>
        <Button label="Ask Sasha" onPress={() => router.push({ pathname: '/guide/[id]', params: { id: record.id } })} block />
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
  plate: { backgroundColor: colors.ground, overflow: 'hidden' },
  frameRow: { flexDirection: 'row', gap: space.lg, marginTop: space.md, flexWrap: 'wrap' },
});

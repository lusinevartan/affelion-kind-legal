import * as React from 'react';
import { formatDateTime } from '../../ui/format';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, ColorSwatch, Figure, MetricRow, Rule, Screen, Text } from '../../ui/components';
import { colors, space } from '../../ui/theme';
import { useAppActions, useAppState } from '../../features/store/AppStore';
import { getCachedMask } from '../../features/scan/sessionCache';
import { AuraView } from '../../render/fluid/AuraView';
import { AURA_COLOR_IDS } from '../../core/color/palette';
import { usePolaroidExport } from '../../features/portrait/usePolaroidExport';
import { SashaAvatar } from '../../features/guide/Sasha';
import { scanInsight } from '../../core/insight/baseline';
import { FRAME_STYLE_IDS, FRAME_STYLES } from '../../render/polaroid/styles';

/**
 * Paid full breakdown. Every color in the portrait is tied to a number from this scan, in the
 * language of the color system. Nothing is added that was not measured.
 */
export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scans, entitlement, frameStyle } = useAppState();
  const { refreshScans, setFrameStyle } = useAppActions();
  const record = scans.find((s) => s.id === id) ?? null;
  const mask = React.useMemo(() => (id ? getCachedMask(id) : null), [id]);
  const exportOpts = React.useMemo(() => ({ clean: true, exportWidth: 720, onSaved: refreshScans, frame: frameStyle }), [refreshScans, frameStyle]);
  const { auraRef, busy, run: exportHiRes, exportCard } = usePolaroidExport(record, exportOpts);

  React.useEffect(() => {
    if (!entitlement.isPro && record) router.replace({ pathname: '/paywall', params: { from: record.id } });
  }, [entitlement.isPro, record]);

  // While the redirect to the paywall is in flight, show nothing rather than Pro content.
  if (record && !entitlement.isPro) return <Screen>{null}</Screen>;

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
        <AuraView ref={auraRef} params={aura} mask={mask} stillUri={record.stillUri} style={StyleSheet.absoluteFill} />
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
        <Figure label="Pulse" value={heart.bpm.toFixed(0)} unit="bpm" />
        <Figure label="Variation" value={heart.rmssd.toFixed(0)} unit="ms" />
        <Figure label="Voice" value={voice && voice.quality > 0.2 ? Math.round(voice.variance * 100).toString() : '—'} unit={voice && voice.quality > 0.2 ? '% moved' : undefined} />
      </View>
      <Rule />

      <Card style={{ marginTop: space.xl }}>
        <Text variant="eyebrow" color={colors.bone60}>
          MEASUREMENTS
        </Text>
        <MetricRow label="Heart rate" value={heart.bpm.toFixed(0)} unit="bpm" note={`${heart.beatCount} beats over ${heart.durationSec.toFixed(0)} s`} />
        <MetricRow label="Heartbeat variation" value={heart.rmssd.toFixed(0)} unit="ms" note={`${hrvWord} for this pulse · RMSSD`} />
        <MetricRow label="Variation over the whole scan" value={heart.sdnn.toFixed(0)} unit="ms" note="SDNN" />
        <MetricRow label="Big jumps between beats" value={heart.pnn50.toFixed(0)} unit="%" note="Share of beats that differ by more than 50 ms · pNN50" />
        <MetricRow label="Signal quality" value={`${Math.round(heart.quality * 100)}`} unit="%" />
        {voice && voice.quality > 0.2 ? (
          <>
            <MetricRow label="Main pitch" value={voice.dominantPitchHz.toFixed(0)} unit="Hz" />
            <MetricRow label="Voice movement" value={Math.round(voice.variance * 100).toString()} unit="%" note={`Your pitch ranged over ${voice.pitchVarianceSemitones.toFixed(1)} half steps`} />
            <MetricRow label="Voice steadiness" value={Math.round(voice.stability * 100).toString()} unit="%" />
            <MetricRow label="Time speaking" value={Math.round(voice.voicedRatio * 100).toString()} unit="% of the sample" />
          </>
        ) : (
          <MetricRow label="Voice" value="—" note="Skipped or too quiet; only the pulse shaped this portrait" />
        )}
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          AGAINST YOUR USUAL
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
          HOW THE PORTRAIT IS DRAWN
        </Text>
        <MetricRow label="Hue" value={`${aura.hue}`} unit="°" />
        <MetricRow label="Color strength" value={aura.saturation.toFixed(2)} note="Stronger when your voice moves more" />
        <MetricRow label="Lightness" value={aura.lightness.toFixed(2)} note="Lighter when your voice is steadier" />
        <MetricRow label="Motion" value={aura.turbulence.toFixed(2)} note="More when your pulse is fast or its variation is low" />
        <MetricRow label="Pulse" value={aura.pulseSpeed.toFixed(2)} unit="Hz" note="The color beats at your heart rate" />
        <Text variant="caption" color={colors.bone50} style={{ marginTop: space.md }}>
          The same numbers always draw the same portrait.
        </Text>
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="eyebrow" color={colors.bone60}>
          THE COLOR KNOWLEDGE BASE
        </Text>
        <View style={{ marginTop: space.sm }}>
          {AURA_COLOR_IDS.map((cid) => (
            <ColorSwatch key={cid} id={cid} selected={cid === aura.primaryColorId || cid === aura.secondaryColorId} />
          ))}
        </View>
      </Card>

      <View style={{ marginTop: space.xl, gap: space.md }}>
        <View style={styles.sasha} accessible accessibilityLabel="Sasha, your guide. She answers only from your readings">
          <SashaAvatar size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Sasha</Text>
            <Text variant="bodySmall" color={colors.fg70}>
              Your guide. She answers only from your readings.
            </Text>
          </View>
        </View>
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
  plate: { backgroundColor: colors.stage, overflow: 'hidden' },
  sasha: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  frameRow: { flexDirection: 'row', gap: space.lg, marginTop: space.md, flexWrap: 'wrap' },
});

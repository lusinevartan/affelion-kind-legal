import * as React from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, MetricRow, Screen, StatusPill, Text } from '../ui/components';
import { colors, radius, space } from '../ui/theme';
import { useAppActions, useAppState } from '../features/store/AppStore';
import { usePracticeSession } from '../features/practice/usePracticeSession';
import { BreathPacer } from '../features/practice/BreathPacer';
import { getCachedMask } from '../features/scan/sessionCache';
import { AuraView, type AuraViewRef } from '../render/fluid/AuraView';
import { PolaroidCard } from '../render/polaroid/PolaroidCard';
import { PRACTICE, PRACTICE_COPY } from '../core/practice/practiceMachine';
import { AURA_COLORS } from '../core/color/palette';
import { placeholderMask } from '../render/fluid/FluidSim';
import type { PracticeMode } from '../core/practice/practiceMachine';

/**
 * Practice: paced breathing with the aura responding live to heart-rhythm coherence.
 * What is being trained is stated plainly on screen: heart-rate variability and coherence,
 * measured from the fingertip, the same numbers the portrait is made from.
 */
export default function PracticeScreen() {
  const { scanId } = useLocalSearchParams<{ scanId?: string }>();
  const { scans, resonanceRate, canPractice, entitlement } = useAppState();
  const { recordPractice, setResonanceRate } = useAppActions();
  const insets = useSafeAreaInsets();
  const scan = React.useMemo(() => (scanId ? scans.find((s) => s.id === scanId) ?? null : scans[0] ?? null), [scanId, scans]);
  const mask = React.useMemo(() => (scan ? getCachedMask(scan.id) ?? placeholderMask() : placeholderMask()), [scan]);
  const session = usePracticeSession(scan);
  const auraRef = React.useRef<AuraViewRef>(null);
  const [mode, setMode] = React.useState<PracticeMode>('practice');
  const [duration, setDuration] = React.useState<number>(PRACTICE.defaultDurationSec);
  const [beforeShot, setBeforeShot] = React.useState<string | null>(null);
  const [afterShot, setAfterShot] = React.useState<string | null>(null);
  const saved = React.useRef(false);
  const shotTaken = React.useRef(false);

  const { state, live, aura, result } = session;
  const rate = resonanceRate ?? PRACTICE.defaultBreathsPerMinute;

  // Snapshot the aura just after breathing starts (before) and when done (after).
  React.useEffect(() => {
    if (state.phase === 'breathe' && state.elapsed > 3 && !shotTaken.current) {
      shotTaken.current = true;
      auraRef.current?.snapshot().then((s) => setBeforeShot(s.uri)).catch(() => {});
    }
  }, [state.phase, state.elapsed]);
  React.useEffect(() => {
    if (state.phase === 'done' && !afterShot) {
      auraRef.current?.snapshot().then((s) => setAfterShot(s.uri)).catch(() => {});
    }
  }, [state.phase, afterShot]);

  // Persist once the record and after-shot exist (or after a short grace if no shot).
  React.useEffect(() => {
    if (!result || saved.current) return;
    saved.current = true;
    const rec = { ...result, beforePortraitUri: beforeShot, afterPortraitUri: afterShot };
    recordPractice(rec).catch((e) => Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error'));
    if (session.resonance) void setResonanceRate(session.resonance.breathsPerMinute);
  }, [result, beforeShot, afterShot, recordPractice, session.resonance, setResonanceRate]);

  const begin = async () => {
    const cam = await Camera.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert('Camera access is needed', 'The practice reads your pulse through the rear camera and flash.');
      return;
    }
    shotTaken.current = false;
    saved.current = false;
    setBeforeShot(null);
    setAfterShot(null);
    session.start(mode, duration, rate);
  };

  const confirmStop = () => {
    Alert.alert('Stop the session?', 'Nothing will be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => { session.cancel(); router.back(); } },
    ]);
  };

  if (!canPractice) {
    return (
      <Screen>
        <Text variant="title">Practice is part of Pro</Text>
        <Text variant="body" color={colors.bone70} style={{ marginTop: space.md }}>
          Your free session is used. Pro includes unlimited guided practice with live feedback, before-and-after portraits, and your personal baseline.
        </Text>
        <Button label="See plans" onPress={() => router.push('/paywall')} style={{ marginTop: space.xl }} block />
        <Button label="Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: space.sm }} block />
      </Screen>
    );
  }

  // Set-up
  if (state.phase === 'idle') {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
            <Text variant="bodySmall" color={colors.bone70}>Back</Text>
          </Pressable>
          {!entitlement.isPro ? <Text variant="caption" color={colors.bone50}>FREE SESSION</Text> : null}
        </View>
        <Text variant="title" style={{ marginTop: space.xl }}>Steady your rhythm</Text>
        <Text variant="body" color={colors.bone70} style={{ marginTop: space.md }}>
          Slow, even breathing at about six breaths a minute makes the heart rate rise and fall in one smooth wave. That wave is what the portrait responds to: as your rhythm steadies, the colours settle and the motion smooths. The numbers behind it are heart-rate variability and coherence, measured from your fingertip.
        </Text>
        <Card style={{ marginTop: space.xl, gap: space.md }}>
          <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>MODE</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {([
              ['practice', `Breathe at ${rate} per minute`],
              ['findRate', 'Find my rate (3 min)'],
            ] as const).map(([m, label]) => (
              <Pressable key={m} accessibilityRole="radio" accessibilityState={{ selected: mode === m }} onPress={() => setMode(m)} style={[styles.chip, mode === m && styles.chipOn]}>
                <Text variant="bodySmall" color={mode === m ? colors.night : colors.bone}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {mode === 'practice' ? (
            <>
              <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1, marginTop: space.sm }}>LENGTH</Text>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {PRACTICE.durations.map((d) => (
                  <Pressable key={d} accessibilityRole="radio" accessibilityState={{ selected: duration === d }} onPress={() => setDuration(d)} style={[styles.chip, duration === d && styles.chipOn]}>
                    <Text variant="bodySmall" color={duration === d ? colors.night : colors.bone}>{d / 60} min</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <Text variant="caption" color={colors.bone50}>
              Four rounds at 6.5, 6, 5.5 and 5 breaths per minute. The rate that produces the largest, smoothest heart wave becomes your default.
            </Text>
          )}
          {resonanceRate ? <Text variant="caption" color={colors.bone50}>Your found rate: {resonanceRate} breaths per minute.</Text> : null}
        </Card>
        <Button label="Begin" onPress={() => void begin()} block style={{ marginTop: space.xl }} />
        <Text variant="caption" color={colors.bone30} align="center" style={{ marginTop: space.lg }}>
          Not a medical device. Stop if you feel light-headed and breathe normally.
        </Text>
      </Screen>
    );
  }

  // Result
  if (state.phase === 'done' && result) {
    const w = Math.min((Dimensions.get('window').width - space.xl * 2 - space.md) / 2, 190);
    const dHrv = result.after.rmssd - result.before.rmssd;
    const dBpm = result.after.bpm - result.before.bpm;
    const dCoh = result.after.coherence - result.before.coherence;
    return (
      <Screen scroll>
        <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 2 }}>SESSION COMPLETE</Text>
        <Text variant="title" style={{ marginTop: space.sm }}>{PRACTICE_COPY.done.body}</Text>
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xl, justifyContent: 'center' }}>
          <PolaroidCard width={w} stillUri={scan?.stillUri ?? null} aura={beforeShot ? { kind: 'image', uri: beforeShot } : { kind: 'live', params: result.beforeAura, mask, paused: true }} caption="Before" subcaption={AURA_COLORS[result.beforeAura.primaryColorId].name} showWordmark={false} />
          <PolaroidCard width={w} stillUri={scan?.stillUri ?? null} aura={afterShot ? { kind: 'image', uri: afterShot } : { kind: 'live', params: result.afterAura, mask, paused: true }} caption="After" subcaption={AURA_COLORS[result.afterAura.primaryColorId].name} showWordmark={false} />
        </View>
        <Card style={{ marginTop: space.xl }}>
          <Text variant="caption" color={colors.bone50} style={{ letterSpacing: 1 }}>WHAT CHANGED</Text>
          <MetricRow label="Coherence" value={`${Math.round(result.before.coherence * 100)} → ${Math.round(result.after.coherence * 100)}`} unit="/100" note={dCoh >= 0.05 ? 'Your heart rhythm became more regular with your breath' : dCoh <= -0.05 ? 'Less regular than at the start' : 'About the same'} />
          <MetricRow label="HRV (RMSSD)" value={`${Math.round(result.before.rmssd)} → ${Math.round(result.after.rmssd)}`} unit="ms" note={dHrv > 3 ? 'Variability rose' : dHrv < -3 ? 'Variability fell' : 'About the same'} />
          <MetricRow label="Heart rate" value={`${Math.round(result.before.bpm)} → ${Math.round(result.after.bpm)}`} unit="bpm" note={dBpm < -2 ? 'Pulse slowed' : dBpm > 2 ? 'Pulse rose' : 'About the same'} />
          <MetricRow label="Heart wave size" value={Math.round(result.after.rsaMs).toString()} unit="ms" note="Peak-to-peak heart-rate swing per breath" />
          <MetricRow label="Time at high coherence" value={Math.round(result.highCoherenceSec).toString()} unit="s" note={`of ${result.durationSec} s`} />
          <MetricRow label="Breathing sync" value={Math.round(result.breathingSync * 100).toString()} unit="%" note={`at ${result.breathsPerMinute} breaths per minute`} />
        </Card>
        {session.resonance ? (
          <Card style={{ marginTop: space.lg }}>
            <Text variant="heading">Your rate: {session.resonance.breathsPerMinute} breaths per minute</Text>
            <Text variant="bodySmall" color={colors.bone70} style={{ marginTop: space.xs }}>
              This pace produced your largest heart wave ({Math.round(session.resonance.rsaMs)} ms). It is now the default for practice.
            </Text>
          </Card>
        ) : null}
        <Text variant="caption" color={colors.bone50} style={{ marginTop: space.lg }}>
          Portraits are rendered from the first and last 45 seconds of this session using the same colour rules as a scan. Short-term changes vary from day to day; the trend over many sessions is what matters.
        </Text>
        <Button label="Done" onPress={() => router.replace('/home')} block style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  // Failed
  if (state.phase === 'failed') {
    return (
      <Screen>
        <Text variant="title">Session paused</Text>
        <Text variant="body" color={colors.bone70} style={{ marginTop: space.md }}>{state.failure}</Text>
        <Button label="Try again" onPress={() => void begin()} block style={{ marginTop: space.xl }} />
        <Button label="Back" variant="ghost" onPress={() => { session.cancel(); router.back(); }} block style={{ marginTop: space.sm }} />
      </Screen>
    );
  }

  // Live session
  const copy = state.phase === 'settle' ? PRACTICE_COPY.settle : !state.covered && state.uncoveredFor > PRACTICE.coverageGraceSec ? PRACTICE_COPY.uncovered : state.mode === 'findRate' ? PRACTICE_COPY.findRate : PRACTICE_COPY.breathe;
  const tint = aura ? AURA_COLORS[aura.primaryColorId].hex : colors.bone;
  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <AuraView ref={auraRef} params={aura} mask={mask} quality="medium" style={StyleSheet.absoluteFill} />
        <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
          <StatusPill label={state.phase === 'settle' ? 'Finding pulse' : `${Math.round(state.elapsed)} s of ${state.durationSec} s · ${state.breathsPerMinute}/min`} tone={state.covered ? 'live' : 'warn'} />
          <Pressable accessibilityRole="button" accessibilityLabel="Stop session" onPress={confirmStop} hitSlop={12} style={styles.cancel}>
            <Text variant="bodySmall" color={colors.bone}>Stop</Text>
          </Pressable>
        </View>
        <View style={styles.centre} pointerEvents="none">
          {state.phase === 'breathe' ? <BreathPacer phase={state.breathPhase} breathing={state.breathing} tint={colors.bone} /> : null}
        </View>
      </View>
      <ScrollView style={styles.panel} contentContainerStyle={{ paddingBottom: insets.bottom + space.lg }}>
        <View style={styles.liveRow}>
          <View style={styles.liveStat}>
            <Text variant="display">{Math.round(live.coherence * 100)}</Text>
            <Text variant="caption" color={colors.bone50}>COHERENCE</Text>
          </View>
          <View style={styles.liveStat}>
            <Text variant="display">{live.bpm ? Math.round(live.bpm) : '—'}</Text>
            <Text variant="caption" color={colors.bone50}>BPM</Text>
          </View>
          <View style={styles.liveStat}>
            <View style={[styles.dot, { backgroundColor: tint }]} />
            <Text variant="caption" color={colors.bone50}>{aura ? AURA_COLORS[aura.primaryColorId].name.toUpperCase() : '—'}</Text>
          </View>
        </View>
        <Text variant="title" style={{ marginTop: space.md }} accessibilityLiveRegion="polite">{copy.title}</Text>
        <Text variant="body" color={colors.bone70} style={{ marginTop: space.xs }}>{copy.body}</Text>
        {state.phase === 'breathe' && state.elapsed >= PRACTICE.afterWindowSec ? (
          <Button label="Finish now" variant="ghost" onPress={session.finishEarly} style={{ marginTop: space.md }} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stage: { flex: 1, backgroundColor: '#07080b', overflow: 'hidden' },
  topBar: { position: 'absolute', left: space.lg, right: space.lg, top: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancel: { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.overlay },
  centre: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  panel: { maxHeight: 260, paddingHorizontal: space.xl, paddingTop: space.lg, backgroundColor: colors.night },
  liveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  liveStat: { alignItems: 'center', gap: 2, minWidth: 90 },
  dot: { width: 28, height: 28, borderRadius: 14, marginBottom: 6 },
  chip: { paddingVertical: 10, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairlineStrong },
  chipOn: { backgroundColor: colors.bone, borderColor: colors.bone },
});

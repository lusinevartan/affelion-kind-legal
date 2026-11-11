import * as React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Camera } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffelionSilhouetteView, type AffelionSilhouetteViewRef } from '../../modules/affelion-silhouette';
import { Button, ProgressBar, Screen, Text } from '../ui/components';
import { colors, space } from '../ui/theme';
import { useScanSession } from '../features/scan/useScanSession';
import { Waveform } from '../features/scan/Waveform';
import { cacheMask } from '../features/scan/sessionCache';
import { GUIDANCE_COPY, SCAN_TIMING } from '../core/scan/scanMachine';
import { useAppActions } from '../features/store/AppStore';
import { AuraView } from '../render/fluid/AuraView';
import { PREVIEW_PARAMS } from '../features/scan/previewParams';

/**
 * The scan. One screen, three phases, always-visible status (what we are doing, how far
 * along, what to do next), and a cancel that is never hidden.
 */
export default function ScanScreen() {
  const session = useScanSession();
  const { recordScan } = useAppActions();
  const insets = useSafeAreaInsets();
  const silhouetteRef = React.useRef<AffelionSilhouetteViewRef>(null);
  const [permission, setPermission] = React.useState<'pending' | 'granted' | 'denied'>('pending');
  const saved = React.useRef(false);

  const registerStillCapture = session.silhouette.registerStillCapture;
  React.useEffect(() => {
    registerStillCapture(() => {
      const v = silhouetteRef.current;
      if (!v) return Promise.reject(new Error('Camera not ready'));
      return v.captureStill();
    });
    return () => registerStillCapture(null);
  }, [registerStillCapture]);

  // Ask for both permissions up front with the reasons already explained in onboarding.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const cam = await Camera.requestCameraPermissionsAsync();
      const mic = await Camera.requestMicrophonePermissionsAsync();
      if (cancelled) return;
      if (cam.granted) {
        setPermission('granted');
        if (!mic.granted) {
          Alert.alert('Microphone off', 'The voice step will be skipped. You can enable the microphone later in Settings.');
        }
        session.start({ voice: mic.granted });
      } else {
        setPermission('denied');
      }
    })().catch(() => setPermission('denied'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Done: persist and hand off to the teaser.
  React.useEffect(() => {
    if (session.state.phase !== 'done' || !session.result || saved.current) return;
    saved.current = true;
    const record = session.result;
    cacheMask(record.id, session.stillMask ?? session.mask);
    recordScan(record)
      .then(() => router.replace({ pathname: '/portrait/[id]', params: { id: record.id } }))
      .catch((e) => Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error'));
  }, [session.state.phase, session.result, session.mask, session.stillMask, recordScan]);

  const { state, live } = session;
  const guidance = GUIDANCE_COPY[state.guidance];
  const phaseLabel =
    state.phase === 'face'
      ? '01 / 03  Outline · preview colours'
      : state.phase === 'finger'
        ? '02 / 03  Pulse'
        : state.phase === 'voice'
          ? '03 / 03  Voice'
          : state.phase === 'computing'
            ? 'Composing'
            : state.phase === 'failed'
              ? 'Paused'
              : 'Preparing';

  const confirmCancel = () => {
    Alert.alert('Stop the scan?', 'Nothing has been saved yet.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: () => {
          session.cancel();
          router.back();
        },
      },
    ]);
  };

  if (permission === 'denied') {
    return (
      <Screen>
        <Text variant="title">Camera access is needed</Text>
        <Text variant="body" color={colors.bone70} style={{ marginTop: space.md }}>
          The scan uses the front camera for your outline and the rear camera with the flash for your pulse. Allow camera access in Settings, then try again.
        </Text>
        <Button label="Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      {/* Stage */}
      <View style={styles.stage}>
        {state.phase === 'face' || state.phase === 'idle' ? (
          <AffelionSilhouetteView
            ref={silhouetteRef}
            active={session.silhouette.active}
            maskSize={160}
            maskFps={15}
            onMask={session.silhouette.onMask}
            onFace={session.silhouette.onFace}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {state.phase === 'face' ? (
          <>
            <AuraView params={PREVIEW_PARAMS} mask={session.mask} quality="low" style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={[styles.oval, live.faceDetected && styles.ovalActive]} />
          </>
        ) : null}

        {state.phase === 'finger' ? (
          <View style={styles.fingerStage}>
            <View style={[styles.pulseDisc, { transform: [{ scale: 1 + 0.08 * Math.min(1, live.waveform.length ? Math.abs(live.waveform[live.waveform.length - 1] ?? 0) : 0) }] }]}>
              <Text variant="display" color={colors.stageFg}>
                {live.bpm ? Math.round(live.bpm) : '—'}
              </Text>
              <Text variant="caption" color={colors.stageFg50}>
                BPM
              </Text>
            </View>
            <View style={{ width: '100%', paddingHorizontal: space.xl, marginTop: space.xl }}>
              <Waveform samples={live.waveform} tint={live.coverage === 'ok' ? colors.stageFg : colors.stageFg50} />
            </View>
            <Text variant="caption" color={colors.stageFg50} style={{ marginTop: space.lg }}>
              {Math.round(state.fingerCovered)} s of {SCAN_TIMING.fingerTargetSec} s · signal {Math.round(state.fingerQuality * 100)}%
            </Text>
          </View>
        ) : null}

        {state.phase === 'voice' ? (
          <View style={styles.fingerStage}>
            <View style={styles.levelRow}>
              {Array.from({ length: 24 }).map((_, i) => {
                const on = live.voiceLevel * 24 > i;
                return <View key={i} style={[styles.levelBar, { height: 10 + i * 2, opacity: on ? 1 : 0.2 }]} />;
              })}
            </View>
            <Text variant="display" color={colors.stageFg} style={{ marginTop: space.xl }}>
              {live.voicePitch ? `${Math.round(live.voicePitch)} Hz` : '· · ·'}
            </Text>
            <Text variant="caption" color={colors.stageFg50} style={{ marginTop: space.sm }}>
              {Math.round(state.voicedSec * 10) / 10} s of voice heard
            </Text>
          </View>
        ) : null}

        {state.phase === 'computing' ? (
          <View style={StyleSheet.absoluteFill}>
            <AuraView params={session.result?.aura ?? null} mask={session.stillMask ?? session.mask} stillUri={session.stillUri} style={StyleSheet.absoluteFill} />
          </View>
        ) : null}

        <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
          <Text variant="eyebrow" color={colors.stageFg70}>
            {phaseLabel}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Stop scan" onPress={confirmCancel} hitSlop={12}>
            <Text variant="eyebrow" color={colors.stageFg70}>
              Stop
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Guidance */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + space.lg }]}>
        <ProgressBar value={state.totalProgress} label="Scan progress" tint={colors.stageFg} />
        <Text variant="title" color={colors.stageFg} style={{ marginTop: space.lg }} accessibilityLiveRegion="polite">
          {guidance.title}
        </Text>
        <Text variant="bodySmall" color={colors.stageFg70} style={{ marginTop: space.sm }}>
          {session.error ?? guidance.body}
        </Text>
        {state.phase === 'failed' ? (
          <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
            <Button label="Try again" onPaper={false} onPress={session.retry} style={{ flex: 1 }} />
            {state.guidance === 'failedVoice' ? <Button label="Skip voice" variant="secondary" onPaper={false} onPress={session.skipVoice} style={{ flex: 1 }} /> : null}
          </View>
        ) : null}
        {state.phase === 'voice' ? (
          <Button label="Skip the voice step" variant="ghost" onPaper={false} onPress={session.skipVoice} style={{ marginTop: space.md }} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.stage },
  stage: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  oval: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: '12%',
    bottom: '22%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246,243,227,0.35)',
  },
  ovalActive: { borderColor: colors.stageFg },
  topBar: { position: 'absolute', left: space.lg, right: space.lg, top: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fingerStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseDisc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stageHairline,
  },
  levelRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60 },
  levelBar: { width: 6, borderRadius: 3, backgroundColor: colors.stageFg },
  panel: { paddingHorizontal: space.xl, paddingTop: space.lg, backgroundColor: colors.stage, minHeight: 200 },
});

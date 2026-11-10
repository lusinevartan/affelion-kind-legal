import * as React from 'react';
import { AppState as RNAppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AffelionPpg, type PpgSampleEvent } from '../../../modules/affelion-ppg';
import { AffelionAudio, pcmToFloat32 } from '../../../modules/affelion-audio';
import type { FaceEvent, MaskEvent, StillResult } from '../../../modules/affelion-silhouette';
import { base64ToBytes } from '../../native/base64';
import { PpgProcessor, VoiceAnalyzer } from '../../core/signal';
import { initialScanState, scanReducer, type ScanState } from '../../core/scan/scanMachine';
import { mapBiometricsToAura } from '../../core/color/mapping';
import type { HeartMetrics, ScanRecord, VoiceMetrics } from '../../core/types';
import type { SilhouetteMask } from '../../render/fluid/FluidSim';
import { newScanId } from '../../services/storage';

/**
 * Orchestrates one scan: drives the pure state machine with a 10 Hz tick, wires the native
 * modules to the signal processors per phase, and produces a ScanRecord at the end.
 *
 * Phase → hardware:
 *   face    → silhouette view (front camera) active; last mask and a still are kept
 *   finger  → rear camera + torch PPG module
 *   voice   → microphone PCM module
 */
export interface ScanLive {
  bpm: number | null;
  ppgQuality: number;
  waveform: Float32Array;
  coverage: 'ok' | 'noFinger' | 'tooDark' | 'saturated' | 'notRed';
  voiceLevel: number;
  voicePitch: number | null;
  faceDetected: boolean;
}

export interface ScanSession {
  state: ScanState;
  live: ScanLive;
  mask: SilhouetteMask | null;
  stillUri: string | null;
  result: ScanRecord | null;
  error: string | null;
  start(): void;
  cancel(): void;
  retry(): void;
  skipVoice(): void;
  /** Handlers to attach to the silhouette view. */
  silhouette: {
    active: boolean;
    onMask: (e: { nativeEvent: MaskEvent }) => void;
    onFace: (e: { nativeEvent: FaceEvent }) => void;
    /** Register the function that captures a still from the silhouette view. */
    registerStillCapture: (fn: (() => Promise<StillResult>) | null) => void;
  };
}

const TICK_MS = 100;

export function useScanSession(): ScanSession {
  const [state, dispatch] = React.useReducer(scanReducer, initialScanState);
  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [live, setLive] = React.useState<ScanLive>({
    bpm: null,
    ppgQuality: 0,
    waveform: new Float32Array(0),
    coverage: 'noFinger',
    voiceLevel: 0,
    voicePitch: null,
    faceDetected: false,
  });
  const [mask, setMask] = React.useState<SilhouetteMask | null>(null);
  const [stillUri, setStillUri] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ScanRecord | null>(null);
  const error = state.failure;

  const ppg = React.useMemo(() => new PpgProcessor(), []);
  const voice = React.useMemo(() => new VoiceAnalyzer(), []);
  const captureStillRef = React.useRef<(() => Promise<StillResult>) | null>(null);
  const lastMaskAt = React.useRef(0);
  const lastBeatAt = React.useRef<number | null>(null);
  const stillRequested = React.useRef(false);
  const computed = React.useRef(false);

  // 10 Hz tick while scanning.
  React.useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'done' || state.phase === 'failed') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      dispatch({ type: 'TICK', dt });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.phase]);

  // Face phase: capture a still once the face has been steady for a couple of seconds.
  React.useEffect(() => {
    if (state.phase !== 'face') return;
    if (state.faceElapsed > 2.5 && !stillRequested.current && captureStillRef.current) {
      stillRequested.current = true;
      captureStillRef
        .current()
        .then((r) => setStillUri(r.uri))
        .catch(() => {
          stillRequested.current = false;
        });
    }
  }, [state.phase, state.faceElapsed]);

  // Finger phase: rear camera + torch.
  React.useEffect(() => {
    if (state.phase !== 'finger') return;
    let cancelled = false;
    ppg.reset();
    const sub = AffelionPpg.addListener('onSample', (s: PpgSampleEvent) => {
      if (cancelled || !s.locked) return; // ignore warm-up frames before exposure lock
      const cov = ppg.push({ t: s.t, r: s.r, g: s.g, b: s.b });
      dispatch({ type: 'FINGER_COVERAGE', covered: cov.covered, reason: cov.reason });
    });
    const statusSub = AffelionPpg.addListener('onStatus', (st) => {
      if (st.state === 'error') dispatch({ type: 'FAIL', reason: st.message ?? 'Camera error' });
    });
    AffelionPpg.start({ torchLevel: 0.6, fps: 30, roi: 0.5, warmupSeconds: 1.2 }).catch((e: unknown) => {
      if (!cancelled) dispatch({ type: 'FAIL', reason: e instanceof Error ? e.message : 'Could not start the rear camera' });
    });
    const liveId = setInterval(() => {
      const l = ppg.live();
      dispatch({ type: 'PPG_QUALITY', quality: l.quality });
      setLive((prev) => ({ ...prev, bpm: l.bpm, ppgQuality: l.quality, waveform: l.waveform, coverage: l.coverage.reason }));
      if (l.lastBeatAt != null && l.lastBeatAt !== lastBeatAt.current) {
        lastBeatAt.current = l.lastBeatAt;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }, 500);
    return () => {
      cancelled = true;
      clearInterval(liveId);
      sub.remove();
      statusSub.remove();
      AffelionPpg.stop().catch(() => {});
    };
  }, [state.phase, ppg]);

  // Voice phase: microphone.
  React.useEffect(() => {
    if (state.phase !== 'voice') return;
    let cancelled = false;
    voice.reset();
    const sub = AffelionAudio.addListener('onPcm', (e) => {
      if (cancelled) return;
      voice.push(pcmToFloat32(e.data));
    });
    AffelionAudio.start().catch((e: unknown) => {
      if (!cancelled) dispatch({ type: 'FAIL', reason: e instanceof Error ? e.message : 'Could not start the microphone' });
    });
    const liveId = setInterval(() => {
      const l = voice.live();
      dispatch({ type: 'VOICE_PROGRESS', voicedSec: l.voicedSec, level: l.level });
      setLive((prev) => ({ ...prev, voiceLevel: l.level, voicePitch: l.pitchHz }));
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(liveId);
      sub.remove();
      AffelionAudio.stop().catch(() => {});
    };
  }, [state.phase, voice]);

  // Computing: finalise metrics and build the record. Runs in a task, not synchronously in
  // the effect body, because finishing the processors is real work and updates state.
  const voiceSkipped = state.voiceSkipped;
  const phase = state.phase;
  React.useEffect(() => {
    if (phase !== 'computing') return;
    const id = setTimeout(() => {
      if (computed.current) return;
      computed.current = true;
      const heart: HeartMetrics | null = ppg.finish();
      if (!heart) {
        computed.current = false;
        dispatch({ type: 'FAIL', reason: 'The pulse signal was too noisy to measure. Try again with a lighter, steadier touch.' });
        return;
      }
      const voiceMetrics: VoiceMetrics | null = voiceSkipped ? null : voice.finish();
      const aura = mapBiometricsToAura({ heart, voice: voiceMetrics });
      const record: ScanRecord = {
        id: newScanId(),
        createdAt: Date.now(),
        heart,
        voice: voiceMetrics,
        aura,
        portraitUri: null,
        stillUri,
      };
      setResult(record);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      dispatch({ type: 'COMPUTED' });
    }, 0);
    return () => clearTimeout(id);
  }, [phase, voiceSkipped, ppg, voice, stillUri]);

  // If the app is backgrounded mid-scan, stop hardware and fail softly.
  React.useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      const phase = stateRef.current.phase;
      if (s !== 'active' && (phase === 'finger' || phase === 'voice' || phase === 'face')) {
        dispatch({ type: 'FAIL', reason: 'The scan was interrupted. Start again when you are ready.' });
      }
    });
    return () => sub.remove();
  }, []);

  const onMask = React.useCallback((e: { nativeEvent: MaskEvent }) => {
    const now = Date.now();
    if (now - lastMaskAt.current < 60) return;
    lastMaskAt.current = now;
    const { width, height, imageAspect, data } = e.nativeEvent;
    setMask({ width, height, imageAspect, data: base64ToBytes(data) });
  }, []);

  const onFace = React.useCallback((e: { nativeEvent: FaceEvent }) => {
    const detected = !!e.nativeEvent.detected;
    setLive((prev) => (prev.faceDetected === detected ? prev : { ...prev, faceDetected: detected }));
    dispatch({ type: 'FACE_DETECTED', detected });
  }, []);

  const start = React.useCallback(() => {
    computed.current = false;
    stillRequested.current = false;
    setResult(null);
    setStillUri(null);
    dispatch({ type: 'START' });
  }, []);

  const cancel = React.useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const retry = React.useCallback(() => {
    computed.current = false;
    dispatch({ type: 'RETRY_PHASE' });
  }, []);

  const skipVoice = React.useCallback(() => {
    dispatch({ type: 'SKIP_VOICE' });
  }, []);

  const registerStillCapture = React.useCallback((fn: (() => Promise<StillResult>) | null) => {
    captureStillRef.current = fn;
  }, []);

  return {
    state,
    live,
    mask,
    stillUri,
    result,
    error,
    start,
    cancel,
    retry,
    skipVoice,
    silhouette: { active: state.phase === 'face', onMask, onFace, registerStillCapture },
  };
}

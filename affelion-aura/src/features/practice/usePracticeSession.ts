import * as React from 'react';
import { AppState as RNAppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AffelionPpg, type PpgSampleEvent } from '../../../modules/affelion-ppg';
import { PpgProcessor } from '../../core/signal';
import { CoherenceAnalyzer, pickResonanceRate, type ResonanceCandidate } from '../../core/signal/coherence';
import { initialPracticeState, PRACTICE, practiceReducer, type PracticeMode, type PracticeState } from '../../core/practice/practiceMachine';
import { auraFromWindow, blendAuraParams } from '../../core/color/live';
import { mapBiometricsToAura } from '../../core/color/mapping';
import type { AuraParams, PracticeRecord, ScanRecord, WindowMetrics } from '../../core/types';
import { newPracticeId } from '../../services/storage';

/**
 * Runs a practice session: rear-camera PPG → beats → sliding coherence → live aura, with the
 * pure practice machine deciding phase. Produces a PracticeRecord with before/after windows.
 */
export interface PracticeLive {
  bpm: number | null;
  coherence: number;
  level: 'low' | 'medium' | 'high';
  breathingSync: number;
  rsaMs: number;
  covered: boolean;
}

export interface PracticeSession {
  state: PracticeState;
  live: PracticeLive;
  aura: AuraParams | null;
  result: PracticeRecord | null;
  resonance: ResonanceCandidate | null;
  start(mode: PracticeMode, durationSec: number, breathsPerMinute: number): void;
  finishEarly(): void;
  cancel(): void;
}

const TICK_MS = 100;
const ANALYSIS_MS = 500;

export function usePracticeSession(scan: ScanRecord | null): PracticeSession {
  const [state, dispatch] = React.useReducer(practiceReducer, initialPracticeState);
  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [live, setLive] = React.useState<PracticeLive>({ bpm: null, coherence: 0, level: 'low', breathingSync: 0, rsaMs: 0, covered: false });
  const [aura, setAura] = React.useState<AuraParams | null>(scan?.aura ?? null);
  const [result, setResult] = React.useState<PracticeRecord | null>(null);
  const [resonance, setResonance] = React.useState<ResonanceCandidate | null>(null);

  const ppg = React.useMemo(() => new PpgProcessor({ windowSec: 90 }), []);
  const coherence = React.useMemo(() => new CoherenceAnalyzer({ windowSec: 32 }), []);
  const auraRef = React.useRef<AuraParams | null>(scan?.aura ?? null);
  const beforeRef = React.useRef<WindowMetrics | null>(null);
  const beforeAuraRef = React.useRef<AuraParams | null>(null);
  const samples = React.useRef<{ t: number; coherence: number; sync: number; bpm: number; rmssd: number; rsa: number; rate: number }[]>([]);
  const finished = React.useRef(false);

  const voice = React.useMemo(() => {
    const v = scan?.voice;
    const available = !!v && v.quality > 0.2 && v.voicedRatio > 0.15;
    return {
      available,
      inputs: { vocalPitchHz: available ? v!.dominantPitchHz : 0, vocalVariance: available ? v!.variance : 0, vocalStability: available ? v!.stability : 0.5 },
    };
  }, [scan]);

  // Tick.
  React.useEffect(() => {
    if (state.phase !== 'settle' && state.phase !== 'breathe') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      dispatch({ type: 'TICK', dt: (now - last) / 1000 });
      last = now;
    }, TICK_MS);
    return () => clearInterval(id);
  }, [state.phase]);

  // Camera + analysis while active.
  React.useEffect(() => {
    if (state.phase !== 'settle' && state.phase !== 'breathe') return;
    let cancelled = false;
    const sub = AffelionPpg.addListener('onSample', (s: PpgSampleEvent) => {
      if (cancelled || !s.locked) return;
      const cov = ppg.push({ t: s.t, r: s.r, g: s.g, b: s.b });
      dispatch({ type: 'COVERAGE', covered: cov.covered });
    });
    const statusSub = AffelionPpg.addListener('onStatus', (st) => {
      if (st.state === 'error') dispatch({ type: 'FAIL', reason: st.message ?? 'Camera error' });
    });
    AffelionPpg.start({ torchLevel: 0.6, fps: 30, roi: 0.5, warmupSeconds: 1.2 }).catch((e: unknown) => {
      if (!cancelled) dispatch({ type: 'FAIL', reason: e instanceof Error ? e.message : 'Could not start the rear camera' });
    });
    const analysis = setInterval(() => {
      const l = ppg.live();
      coherence.setBeats(l.beats);
      const est = coherence.estimate();
      const st = stateRef.current;
      dispatch({ type: 'SETTLE_PROGRESS', beats: l.beats.length });
      if (!est) {
        setLive((prev) => ({ ...prev, bpm: l.bpm, covered: l.coverage.covered }));
        return;
      }
      const pacerHz = st.breathsPerMinute / 60;
      const sync = CoherenceAnalyzer.breathingSync(est, pacerHz);
      dispatch({ type: 'COHERENCE', score: est.score });
      setLive({ bpm: est.bpm, coherence: est.score, level: est.level, breathingSync: sync, rsaMs: est.rsaMs, covered: l.coverage.covered });
      const target = auraFromWindow({ bpm: est.bpm, hrv: est.rmssd, coherence: est.score }, voice.inputs, voice.available);
      const blended = blendAuraParams(auraRef.current, target, 0.25);
      auraRef.current = blended;
      setAura(blended);
      if (st.phase === 'settle' || (st.phase === 'breathe' && st.elapsed < 5)) {
        beforeRef.current = { bpm: est.bpm, rmssd: est.rmssd, coherence: est.score, rsaMs: est.rsaMs };
        beforeAuraRef.current = target;
      }
      if (st.phase === 'breathe' && st.covered) {
        samples.current.push({ t: st.elapsed, coherence: est.score, sync, bpm: est.bpm, rmssd: est.rmssd, rsa: est.rsaMs, rate: st.breathsPerMinute });
      }
    }, ANALYSIS_MS);
    return () => {
      cancelled = true;
      clearInterval(analysis);
      sub.remove();
      statusSub.remove();
      AffelionPpg.stop().catch(() => {});
    };
  }, [state.phase, ppg, coherence, voice]);

  // Haptic cue at each breath turn.
  const lastBreathing = React.useRef(state.breathing);
  React.useEffect(() => {
    if (state.phase === 'breathe' && state.breathing !== lastBreathing.current) {
      lastBreathing.current = state.breathing;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [state.phase, state.breathing]);

  // Done → build the record.
  React.useEffect(() => {
    if (state.phase !== 'done' || finished.current) return;
    const id = setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      const all = samples.current;
      const after = all.filter((s) => s.t >= state.durationSec - PRACTICE.afterWindowSec);
      const tail = after.length ? after : all.slice(-10);
      const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
      const afterMetrics: WindowMetrics = {
        bpm: avg(tail.map((s) => s.bpm)),
        rmssd: avg(tail.map((s) => s.rmssd)),
        coherence: avg(tail.map((s) => s.coherence)),
        rsaMs: avg(tail.map((s) => s.rsa)),
      };
      const before = beforeRef.current ?? afterMetrics;
      const beforeAura = beforeAuraRef.current ?? auraFromWindow({ bpm: before.bpm, hrv: before.rmssd, coherence: before.coherence }, voice.inputs, voice.available);
      const afterAura = mapBiometricsToAura({
        heart: { bpm: afterMetrics.bpm, rmssd: afterMetrics.rmssd, sdnn: afterMetrics.rmssd, pnn50: 0, beatCount: 0, quality: 1, durationSec: PRACTICE.afterWindowSec },
        voice: scan?.voice ?? null,
      });
      let resonanceRate: number | null = null;
      if (state.mode === 'findRate') {
        const candidates: ResonanceCandidate[] = PRACTICE.resonanceRates.map((rate) => {
          const seg = all.filter((s) => s.rate === rate && s.t % PRACTICE.resonanceSegmentSec > 10); // skip the first 10 s of each segment
          return { breathsPerMinute: rate, rsaMs: avg(seg.map((s) => s.rsa)), coherence: avg(seg.map((s) => s.coherence)) };
        });
        const pick = pickResonanceRate(candidates);
        setResonance(pick);
        resonanceRate = pick?.breathsPerMinute ?? null;
      }
      const highSec = all.filter((s) => s.coherence >= 0.7).length * (ANALYSIS_MS / 1000);
      setResult({
        id: newPracticeId(),
        createdAt: Date.now(),
        scanId: scan?.id ?? null,
        durationSec: state.durationSec,
        breathsPerMinute: resonanceRate ?? state.breathsPerMinute,
        before,
        after: afterMetrics,
        beforeAura,
        afterAura,
        coherenceMean: avg(all.map((s) => s.coherence)),
        coherencePeak: all.length ? Math.max(...all.map((s) => s.coherence)) : 0,
        highCoherenceSec: highSec,
        breathingSync: avg(all.map((s) => s.sync)),
        beforePortraitUri: null,
        afterPortraitUri: null,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 0);
    return () => clearTimeout(id);
  }, [state.phase, state.durationSec, state.mode, state.breathsPerMinute, scan, voice]);

  React.useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      const phase = stateRef.current.phase;
      if (s !== 'active' && (phase === 'settle' || phase === 'breathe')) dispatch({ type: 'FAIL', reason: 'The session was interrupted.' });
    });
    return () => sub.remove();
  }, []);

  const start = React.useCallback(
    (mode: PracticeMode, durationSec: number, breathsPerMinute: number) => {
      finished.current = false;
      samples.current = [];
      beforeRef.current = null;
      beforeAuraRef.current = null;
      setResult(null);
      setResonance(null);
      ppg.reset();
      coherence.reset();
      dispatch({ type: 'START', mode, durationSec, breathsPerMinute });
    },
    [ppg, coherence],
  );
  const finishEarly = React.useCallback(() => dispatch({ type: 'FINISH_EARLY' }), []);
  const cancel = React.useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, live, aura, result, resonance, start, finishEarly, cancel };
}

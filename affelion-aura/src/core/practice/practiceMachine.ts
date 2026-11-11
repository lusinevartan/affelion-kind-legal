/**
 * Pure state machine for a guided breathing practice with live aura feedback.
 *
 * settle  → finger on the rear camera until a steady pulse is found (reads the "before" window)
 * breathe → paced breathing for the chosen duration; the pacer runs only while the finger covers
 *           the lens, so a dropped finger pauses rather than silently corrupting the session
 * done    → the "after" window is the last 45 s; the result compares before and after
 *
 * Nothing here claims to change anything but the measured heart rhythm.
 */

export const PRACTICE = {
  settleMinBeats: 10,
  settleMaxSec: 45,
  defaultDurationSec: 180,
  durations: [120, 180, 300] as const,
  defaultBreathsPerMinute: 6,
  /** Inhale share of a breath cycle (the rest is exhale). */
  inhaleFraction: 0.4,
  afterWindowSec: 45,
  coverageGraceSec: 2,
  /** Candidate rates for the resonance finder, breathed for `resonanceSegmentSec` each. */
  resonanceRates: [6.5, 6, 5.5, 5] as const,
  resonanceSegmentSec: 45,
} as const;

export type PracticePhase = 'idle' | 'settle' | 'breathe' | 'done' | 'failed';
export type PracticeMode = 'practice' | 'findRate';

export interface PracticeState {
  phase: PracticePhase;
  mode: PracticeMode;
  durationSec: number;
  breathsPerMinute: number;
  /** Seconds of paced breathing completed (only advances while covered). */
  elapsed: number;
  settleElapsed: number;
  settleBeats: number;
  covered: boolean;
  uncoveredFor: number;
  /** 0..1 position within the current breath cycle. */
  breathPhase: number;
  breathing: 'inhale' | 'exhale';
  /** Latest coherence score 0..1. */
  coherence: number;
  /** Resonance finder: index of the rate currently being breathed. */
  rateIndex: number;
  failure: string | null;
}

export type PracticeEvent =
  | { type: 'START'; mode?: PracticeMode; durationSec?: number; breathsPerMinute?: number }
  | { type: 'TICK'; dt: number }
  | { type: 'COVERAGE'; covered: boolean }
  | { type: 'SETTLE_PROGRESS'; beats: number }
  | { type: 'COHERENCE'; score: number }
  | { type: 'FINISH_EARLY' }
  | { type: 'FAIL'; reason: string }
  | { type: 'RESET' };

export const initialPracticeState: PracticeState = {
  phase: 'idle',
  mode: 'practice',
  durationSec: PRACTICE.defaultDurationSec,
  breathsPerMinute: PRACTICE.defaultBreathsPerMinute,
  elapsed: 0,
  settleElapsed: 0,
  settleBeats: 0,
  covered: false,
  uncoveredFor: 0,
  breathPhase: 0,
  breathing: 'inhale',
  coherence: 0,
  rateIndex: 0,
  failure: null,
};

export function cycleSeconds(breathsPerMinute: number): number {
  return 60 / breathsPerMinute;
}

export function practiceReducer(state: PracticeState, event: PracticeEvent): PracticeState {
  switch (event.type) {
    case 'RESET':
      return initialPracticeState;
    case 'START': {
      const mode = event.mode ?? 'practice';
      const durationSec =
        mode === 'findRate' ? PRACTICE.resonanceRates.length * PRACTICE.resonanceSegmentSec : (event.durationSec ?? PRACTICE.defaultDurationSec);
      return {
        ...initialPracticeState,
        phase: 'settle',
        mode,
        durationSec,
        breathsPerMinute: mode === 'findRate' ? PRACTICE.resonanceRates[0] : (event.breathsPerMinute ?? PRACTICE.defaultBreathsPerMinute),
      };
    }
    case 'COVERAGE':
      return { ...state, covered: event.covered, uncoveredFor: event.covered ? 0 : state.uncoveredFor };
    case 'SETTLE_PROGRESS':
      return state.phase === 'settle' ? { ...state, settleBeats: event.beats } : state;
    case 'COHERENCE':
      return { ...state, coherence: event.score };
    case 'FINISH_EARLY':
      if (state.phase !== 'breathe') return state;
      // Allow an early finish only once there is enough data for an "after" window.
      return state.elapsed >= PRACTICE.afterWindowSec ? { ...state, phase: 'done' } : state;
    case 'FAIL':
      return { ...state, phase: 'failed', failure: event.reason };
    case 'TICK':
      return tick(state, event.dt);
    default:
      return state;
  }
}

function tick(state: PracticeState, dt: number): PracticeState {
  switch (state.phase) {
    case 'settle': {
      const settleElapsed = state.settleElapsed + dt;
      if (state.covered && state.settleBeats >= PRACTICE.settleMinBeats) {
        return { ...state, settleElapsed, phase: 'breathe', elapsed: 0, breathPhase: 0, breathing: 'inhale' };
      }
      if (settleElapsed >= PRACTICE.settleMaxSec) {
        return { ...state, settleElapsed, phase: 'failed', failure: 'We could not find a steady pulse. Cover the rear camera and flash with your fingertip, press lightly, and keep still.' };
      }
      return { ...state, settleElapsed };
    }
    case 'breathe': {
      if (!state.covered) {
        return { ...state, uncoveredFor: state.uncoveredFor + dt };
      }
      const elapsed = state.elapsed + dt;
      let breathsPerMinute = state.breathsPerMinute;
      let rateIndex = state.rateIndex;
      if (state.mode === 'findRate') {
        rateIndex = Math.min(PRACTICE.resonanceRates.length - 1, Math.floor(elapsed / PRACTICE.resonanceSegmentSec));
        breathsPerMinute = PRACTICE.resonanceRates[rateIndex]!;
      }
      const cycle = cycleSeconds(breathsPerMinute);
      const breathPhase = (elapsed % cycle) / cycle;
      const breathing = breathPhase < PRACTICE.inhaleFraction ? 'inhale' : 'exhale';
      if (elapsed >= state.durationSec) {
        return { ...state, elapsed: state.durationSec, breathsPerMinute, rateIndex, breathPhase, breathing, phase: 'done' };
      }
      return { ...state, elapsed, breathsPerMinute, rateIndex, breathPhase, breathing };
    }
    default:
      return state;
  }
}

export const PRACTICE_COPY = {
  settle: { title: 'Find your pulse', body: 'Rest your fingertip on the rear camera and flash. We need a few steady beats before the breathing starts.' },
  breathe: { title: 'Breathe with the light', body: 'In as it grows, out as it fades. Keep your finger still. The portrait follows your heart rhythm in real time.' },
  uncovered: { title: 'Finger lifted', body: 'The practice is paused. Rest your fingertip back on the camera to continue.' },
  findRate: { title: 'Finding your rate', body: 'Four short rounds at slightly different paces. The one that makes the largest, smoothest heart wave is yours.' },
  done: { title: 'Session complete', body: 'Here is what your heart rhythm did while you breathed.' },
} as const;

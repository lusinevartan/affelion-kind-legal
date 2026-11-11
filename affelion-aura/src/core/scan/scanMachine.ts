import type { ScanPhase } from '../types';

/**
 * Pure state machine for the 60–90 second scan. The UI dispatches events; the machine
 * decides phase, timing and guidance. Keeping it pure makes the flow unit-testable and
 * keeps error prevention logic (NN/g) in one place: the finger timer only advances while a
 * fingertip is actually covering the lens, and the voice phase only completes once enough
 * voiced audio exists.
 */

export const SCAN_TIMING = {
  faceSec: 8,
  /** Minimum covered seconds before PPG can finish. */
  fingerMinSec: 30,
  /** Target covered seconds. */
  fingerTargetSec: 40,
  /** Hard cap on wall time spent in the finger phase before we fail with guidance. */
  fingerMaxWallSec: 90,
  voiceSec: 5,
  /** Minimum voiced seconds required to accept the voice sample. */
  voiceMinVoicedSec: 2.5,
  voiceMaxWallSec: 25,
} as const;

export type ScanGuidance =
  | 'faceFraming'
  | 'faceHold'
  | 'fingerPlace'
  | 'fingerHold'
  | 'fingerPressLighter'
  | 'fingerTooDark'
  | 'fingerSteady'
  | 'voiceSpeak'
  | 'voiceLouder'
  | 'voiceGood'
  | 'computing'
  | 'done'
  | 'failedFinger'
  | 'failedVoice'
  | 'failedCamera';

export interface ScanState {
  phase: ScanPhase;
  /** 0..1 progress within the current phase. */
  phaseProgress: number;
  /** 0..1 progress of the whole scan. */
  totalProgress: number;
  guidance: ScanGuidance;
  faceElapsed: number;
  faceDetected: boolean;
  fingerWall: number;
  fingerCovered: number;
  fingerCoverageReason: CoverageReason;
  fingerQuality: number;
  voiceWall: number;
  voicedSec: number;
  voiceLevel: number;
  voiceSkipped: boolean;
  failure: string | null;
}

export type CoverageReason = 'ok' | 'noFinger' | 'tooDark' | 'saturated' | 'notRed';

export type ScanEvent =
  | { type: 'START' }
  | { type: 'TICK'; dt: number }
  | { type: 'FACE_DETECTED'; detected: boolean }
  | { type: 'FINGER_COVERAGE'; covered: boolean; reason: CoverageReason }
  | { type: 'PPG_QUALITY'; quality: number }
  | { type: 'VOICE_PROGRESS'; voicedSec: number; level: number }
  | { type: 'SKIP_VOICE' }
  | { type: 'COMPUTED' }
  | { type: 'FAIL'; reason: string }
  | { type: 'RETRY_PHASE' }
  | { type: 'RESET' };

export const initialScanState: ScanState = {
  phase: 'idle',
  phaseProgress: 0,
  totalProgress: 0,
  guidance: 'faceFraming',
  faceElapsed: 0,
  faceDetected: false,
  fingerWall: 0,
  fingerCovered: 0,
  fingerCoverageReason: 'noFinger',
  fingerQuality: 0,
  voiceWall: 0,
  voicedSec: 0,
  voiceLevel: 0,
  voiceSkipped: false,
  failure: null,
};

const PHASE_WEIGHTS: Record<'face' | 'finger' | 'voice', number> = { face: 0.15, finger: 0.7, voice: 0.15 };

function withProgress(s: ScanState): ScanState {
  let phaseProgress = 0;
  let total = 0;
  switch (s.phase) {
    case 'face':
      phaseProgress = Math.min(1, s.faceElapsed / SCAN_TIMING.faceSec);
      total = PHASE_WEIGHTS.face * phaseProgress;
      break;
    case 'finger':
      phaseProgress = Math.min(1, s.fingerCovered / SCAN_TIMING.fingerTargetSec);
      total = PHASE_WEIGHTS.face + PHASE_WEIGHTS.finger * phaseProgress;
      break;
    case 'voice':
      phaseProgress = Math.min(1, s.voiceWall / SCAN_TIMING.voiceSec);
      total = PHASE_WEIGHTS.face + PHASE_WEIGHTS.finger + PHASE_WEIGHTS.voice * phaseProgress;
      break;
    case 'computing':
    case 'done':
      phaseProgress = 1;
      total = 1;
      break;
    default:
      break;
  }
  return { ...s, phaseProgress, totalProgress: total };
}

export function scanReducer(state: ScanState, event: ScanEvent): ScanState {
  switch (event.type) {
    case 'RESET':
      return initialScanState;
    case 'START':
      return withProgress({ ...initialScanState, phase: 'face', guidance: 'faceFraming' });
    case 'FAIL':
      if (state.phase === 'failed' || state.phase === 'done' || state.phase === 'idle') return state;
      return withProgress({
        ...state,
        phase: 'failed',
        failure: event.reason,
        // The only thing that can fail while composing is the pulse reading, so that is the
        // step to repeat; the outline and still from the face step are kept.
        guidance: state.phase === 'finger' || state.phase === 'computing' ? 'failedFinger' : state.phase === 'voice' ? 'failedVoice' : 'failedCamera',
      });
    case 'RETRY_PHASE': {
      if (state.phase !== 'failed') return state;
      // Retry the phase that failed, keeping earlier progress.
      if (state.guidance === 'failedFinger')
        return withProgress({
          ...state,
          phase: 'finger',
          failure: null,
          fingerWall: 0,
          fingerCovered: 0,
          fingerCoverageReason: 'noFinger',
          guidance: 'fingerPlace',
        });
      if (state.guidance === 'failedVoice')
        return withProgress({ ...state, phase: 'voice', failure: null, voiceWall: 0, voicedSec: 0, guidance: 'voiceSpeak' });
      return withProgress({ ...initialScanState, phase: 'face' });
    }
    case 'FACE_DETECTED':
      if (state.phase !== 'face') return state;
      return withProgress({ ...state, faceDetected: event.detected, guidance: event.detected ? 'faceHold' : 'faceFraming' });
    case 'FINGER_COVERAGE': {
      if (state.phase !== 'finger') return state;
      // This arrives once per camera frame; an unchanged reading must not cause a render.
      const reason: CoverageReason = event.covered ? 'ok' : event.reason;
      return reason === state.fingerCoverageReason ? state : { ...state, fingerCoverageReason: reason };
    }
    case 'PPG_QUALITY':
      if (state.phase !== 'finger' || state.fingerQuality === event.quality) return state;
      return { ...state, fingerQuality: event.quality };
    case 'VOICE_PROGRESS':
      if (state.phase !== 'voice') return state;
      return { ...state, voicedSec: event.voicedSec, voiceLevel: event.level };
    case 'SKIP_VOICE':
      // Skipping is offered during the voice step, or after the voice step failed; never as a
      // way past a failed pulse reading.
      if (state.phase !== 'voice' && !(state.phase === 'failed' && state.guidance === 'failedVoice')) return state;
      return withProgress({ ...state, phase: 'computing', voiceSkipped: true, guidance: 'computing', failure: null });
    case 'COMPUTED':
      if (state.phase !== 'computing') return state;
      return withProgress({ ...state, phase: 'done', guidance: 'done' });
    case 'TICK':
      return tick(state, event.dt);
    default:
      return state;
  }
}

function tick(state: ScanState, dt: number): ScanState {
  switch (state.phase) {
    case 'face': {
      // The face timer runs only while a face is framed so the reference still is usable.
      const faceElapsed = state.faceDetected ? state.faceElapsed + dt : state.faceElapsed;
      if (faceElapsed >= SCAN_TIMING.faceSec) {
        return withProgress({
          ...state,
          faceElapsed,
          phase: 'finger',
          guidance: 'fingerPlace',
          fingerWall: 0,
          fingerCovered: 0,
          fingerCoverageReason: 'noFinger',
        });
      }
      return withProgress({ ...state, faceElapsed });
    }
    case 'finger': {
      const fingerWall = state.fingerWall + dt;
      const reason = state.fingerCoverageReason;
      const covered = reason === 'ok';
      const fingerCovered = covered ? state.fingerCovered + dt : state.fingerCovered;
      let guidance: ScanGuidance = state.guidance;
      if (!covered) {
        guidance = reason === 'saturated' ? 'fingerPressLighter' : reason === 'tooDark' ? 'fingerTooDark' : 'fingerPlace';
      } else {
        guidance = state.fingerQuality < 0.35 && fingerCovered > 6 ? 'fingerSteady' : 'fingerHold';
      }
      const enough =
        fingerCovered >= SCAN_TIMING.fingerTargetSec ||
        (fingerCovered >= SCAN_TIMING.fingerMinSec && state.fingerQuality >= 0.6);
      if (enough) {
        return withProgress({ ...state, fingerWall, fingerCovered, phase: 'voice', guidance: 'voiceSpeak', voiceWall: 0, voicedSec: 0 });
      }
      if (fingerWall >= SCAN_TIMING.fingerMaxWallSec) {
        return withProgress({
          ...state,
          fingerWall,
          fingerCovered,
          phase: 'failed',
          guidance: 'failedFinger',
          failure: 'We could not get a steady pulse reading. Cover the rear camera and flash fully with your fingertip, press lightly, and keep your hand still.',
        });
      }
      return withProgress({ ...state, fingerWall, fingerCovered, guidance });
    }
    case 'voice': {
      const voiceWall = state.voiceWall + dt;
      let guidance: ScanGuidance = state.voicedSec > 1 ? 'voiceGood' : state.voiceLevel < 0.08 && voiceWall > 2 ? 'voiceLouder' : 'voiceSpeak';
      if (voiceWall >= SCAN_TIMING.voiceSec && state.voicedSec >= SCAN_TIMING.voiceMinVoicedSec) {
        return withProgress({ ...state, voiceWall, phase: 'computing', guidance: 'computing' });
      }
      if (voiceWall >= SCAN_TIMING.voiceMaxWallSec) {
        return withProgress({
          ...state,
          voiceWall,
          phase: 'failed',
          guidance: 'failedVoice',
          failure: 'We could not hear enough of your voice. Speak or hum at a normal volume for a few seconds, or skip the voice step.',
        });
      }
      return withProgress({ ...state, voiceWall, guidance });
    }
    default:
      return state;
  }
}

export const GUIDANCE_COPY: Record<ScanGuidance, { title: string; body: string }> = {
  faceFraming: { title: 'Frame your face', body: 'Centre yourself in the oval with your shoulders visible. Soft, even light works best.' },
  faceHold: { title: 'Hold still', body: 'Mapping your outline. The colours you see now are a neutral preview; your own arrive after the pulse reading.' },
  fingerPlace: { title: 'Cover the rear camera', body: 'Place your fingertip over the rear camera and flash together. The flash will turn on; it is safe and will feel slightly warm.' },
  fingerHold: { title: 'Reading your pulse', body: 'Keep your finger still and relaxed. Breathe normally.' },
  fingerPressLighter: { title: 'Press a little lighter', body: 'Too much pressure blocks blood flow. Rest your fingertip gently on the lens.' },
  fingerTooDark: { title: 'Cover the flash too', body: 'Your finger needs to sit over both the lens and the flash so light can pass through your fingertip.' },
  fingerSteady: { title: 'Hold steadier', body: 'Small movements add noise. Rest your elbow on something and keep your hand still.' },
  voiceSpeak: { title: 'Say a few words', body: 'Speak or hum at a normal volume for about five seconds. Nothing you say is recorded or kept.' },
  voiceLouder: { title: 'A little louder', body: 'We can only hear a faint signal. Move the phone closer or speak up slightly.' },
  voiceGood: { title: 'Listening', body: 'Keep going for a few more seconds.' },
  computing: { title: 'Composing your portrait', body: 'Translating your pulse, variability and voice into colour.' },
  done: { title: 'Ready', body: 'Your portrait is ready.' },
  failedFinger: { title: 'Pulse reading failed', body: 'Cover the rear camera and flash fully, press lightly, and keep still.' },
  failedVoice: { title: 'Voice sample too quiet', body: 'Try again at a normal volume, or skip the voice step.' },
  failedCamera: { title: 'Camera unavailable', body: 'Check camera permission in Settings and try again.' },
};

import { scanReducer, initialScanState, SCAN_TIMING, type ScanState } from '../src/core/scan';

function run(state: ScanState, events: Parameters<typeof scanReducer>[1][]) {
  return events.reduce(scanReducer, state);
}
const ticks = (n: number, dt = 0.5) => Array.from({ length: n }, () => ({ type: 'TICK' as const, dt }));

describe('scan state machine', () => {
  test('face phase waits for a face before advancing', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = run(s, ticks(40));
    expect(s.phase).toBe('face');
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    expect(s.phase).toBe('finger');
  });

  test('finger timer only advances while covered, and completes at the target', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = run(s, ticks(20));
    expect(s.fingerCovered).toBe(0);
    expect(s.guidance).toBe('fingerPlace');
    s = scanReducer(s, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' });
    s = scanReducer(s, { type: 'PPG_QUALITY', quality: 0.4 });
    s = run(s, ticks(SCAN_TIMING.fingerTargetSec * 2));
    expect(s.phase).toBe('voice');
    expect(s.totalProgress).toBeGreaterThan(0.84);
  });

  test('good quality lets the finger phase finish early', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = scanReducer(s, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' });
    s = scanReducer(s, { type: 'PPG_QUALITY', quality: 0.85 });
    s = run(s, ticks(SCAN_TIMING.fingerMinSec * 2 + 1));
    expect(s.phase).toBe('voice');
  });

  test('saturated coverage gives press-lighter guidance', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = scanReducer(s, { type: 'FINGER_COVERAGE', covered: false, reason: 'saturated' });
    s = scanReducer(s, { type: 'TICK', dt: 0.5 });
    expect(s.guidance).toBe('fingerPressLighter');
  });

  test('finger phase fails after the wall-clock cap and can be retried', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = run(s, ticks(SCAN_TIMING.fingerMaxWallSec * 2 + 2));
    expect(s.phase).toBe('failed');
    expect(s.guidance).toBe('failedFinger');
    s = scanReducer(s, { type: 'RETRY_PHASE' });
    expect(s.phase).toBe('finger');
    expect(s.fingerWall).toBe(0);
  });

  test('voice phase completes with enough voiced audio and can be skipped', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = scanReducer(s, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' });
    s = run(s, ticks(SCAN_TIMING.fingerTargetSec * 2));
    expect(s.phase).toBe('voice');
    s = scanReducer(s, { type: 'VOICE_PROGRESS', voicedSec: 3, level: 0.4 });
    s = run(s, ticks(SCAN_TIMING.voiceSec * 2));
    expect(s.phase).toBe('computing');
    s = scanReducer(s, { type: 'COMPUTED' });
    expect(s.phase).toBe('done');
    expect(s.totalProgress).toBe(1);

    let t = scanReducer(initialScanState, { type: 'START' });
    t = scanReducer(t, { type: 'FACE_DETECTED', detected: true });
    t = run(t, ticks(SCAN_TIMING.faceSec * 2));
    t = scanReducer(t, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' });
    t = run(t, ticks(SCAN_TIMING.fingerTargetSec * 2));
    t = scanReducer(t, { type: 'SKIP_VOICE' });
    expect(t.phase).toBe('computing');
    expect(t.voiceSkipped).toBe(true);
  });
});

describe('scan failures and repeated events', () => {
  const toComputing = () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = scanReducer(s, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' });
    s = run(s, ticks(SCAN_TIMING.fingerTargetSec * 2));
    s = scanReducer(s, { type: 'VOICE_PROGRESS', voicedSec: 3, level: 0.4 });
    return run(s, ticks(SCAN_TIMING.voiceSec * 2));
  };

  test('a noisy pulse found while composing sends the person back to the pulse step', () => {
    let s = toComputing();
    expect(s.phase).toBe('computing');
    s = scanReducer(s, { type: 'FAIL', reason: 'too noisy' });
    expect(s.guidance).toBe('failedFinger');
    s = scanReducer(s, { type: 'RETRY_PHASE' });
    expect(s.phase).toBe('finger');
    expect(s.faceElapsed).toBeGreaterThanOrEqual(SCAN_TIMING.faceSec);
  });

  test('skipping the voice is not a way past a failed pulse reading', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    s = scanReducer(s, { type: 'FAIL', reason: 'camera error' });
    expect(s.guidance).toBe('failedFinger');
    expect(scanReducer(s, { type: 'SKIP_VOICE' })).toBe(s);
  });

  test('an unchanged per-frame coverage reading returns the same state object', () => {
    let s = scanReducer(initialScanState, { type: 'START' });
    s = scanReducer(s, { type: 'FACE_DETECTED', detected: true });
    s = run(s, ticks(SCAN_TIMING.faceSec * 2));
    const a = scanReducer(s, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' });
    expect(scanReducer(a, { type: 'FINGER_COVERAGE', covered: true, reason: 'ok' })).toBe(a);
  });

  test('a failure after the scan is done is ignored', () => {
    const done = scanReducer(toComputing(), { type: 'COMPUTED' });
    expect(scanReducer(done, { type: 'FAIL', reason: 'backgrounded' })).toBe(done);
  });
});

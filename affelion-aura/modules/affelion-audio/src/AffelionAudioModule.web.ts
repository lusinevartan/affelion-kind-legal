import { NativeModule, registerWebModule } from 'expo';
import type { AudioModuleEvents, AudioPermissionStatus } from './AffelionAudio.types';

/**
 * Voice capture is device-only. The review build (localStorage `aura.demo` = `1`) plays a
 * speech-like tone instead: a pitch near 175 Hz that moves the way a speaking voice does, in
 * syllable-length bursts. It goes through the app's real voice analysis.
 */
function reviewBuild(): boolean {
  try {
    return globalThis.localStorage?.getItem('aura.demo') === '1';
  } catch {
    return false;
  }
}

const RATE = 16000;
const CHUNK = 1600;

class AffelionAudioModule extends NativeModule<AudioModuleEvents> {
  private timer: ReturnType<typeof setInterval> | null = null;

  async permissionStatus(): Promise<AudioPermissionStatus> {
    return reviewBuild() ? 'granted' : 'denied';
  }
  async requestPermission(): Promise<AudioPermissionStatus> {
    return reviewBuild() ? 'granted' : 'denied';
  }
  async start(): Promise<{ sampleRate: number }> {
    if (!reviewBuild()) throw new Error('Voice capture is only available on iOS and Android devices.');
    this.halt();
    let n = 0;
    let phase = 0;
    this.emit('onAudioStatus', { state: 'running' });
    this.timer = setInterval(() => {
      const out = new Float32Array(CHUNK);
      for (let i = 0; i < CHUNK; i++, n++) {
        const t = n / RATE;
        const f0 = 175 + 40 * Math.sin(2 * Math.PI * 0.6 * t) + 15 * Math.sin(2 * Math.PI * 2.1 * t);
        phase += (2 * Math.PI * f0) / RATE;
        const syllable = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3.2 * t);
        const env = 0.22 * Math.pow(syllable, 0.6) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 0.35 * t));
        out[i] = env * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase) + 0.12 * Math.sin(4 * phase));
      }
      this.emit('onPcm', { sampleRate: RATE, data: new Uint8Array(out.buffer) });
    }, (CHUNK / RATE) * 1000);
    return { sampleRate: RATE };
  }
  async stop(): Promise<void> {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.emit('onAudioStatus', { state: 'stopped' });
  }
  private halt() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export default registerWebModule(AffelionAudioModule, 'AffelionAudioModule');

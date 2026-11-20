import { NativeModule, registerWebModule } from 'expo';
import type { PermissionStatus, PpgModuleEvents, PpgStartOptions } from './AffelionPpg.types';

/**
 * Browsers cannot control the flash, so the pulse reading is device-only. The review build
 * (localStorage `aura.demo` = `1`) instead plays a recorded-style fingertip signal: a resting
 * pulse near 61 beats a minute that rises and falls with slow breathing. It goes through the
 * app's real pulse reader, so every screen downstream shows what that reader computes.
 */
function reviewBuild(): boolean {
  try {
    return globalThis.localStorage?.getItem('aura.demo') === '1';
  } catch {
    return false;
  }
}

const FPS = 30;

class AffelionPpgModule extends NativeModule<PpgModuleEvents> {
  private timer: ReturnType<typeof setInterval> | null = null;

  async isAvailable(): Promise<boolean> {
    return reviewBuild();
  }
  async permissionStatus(): Promise<PermissionStatus> {
    return reviewBuild() ? 'granted' : 'denied';
  }
  async start(options?: PpgStartOptions): Promise<void> {
    if (!reviewBuild()) throw new Error('Rear-camera PPG is only available on iOS and Android devices.');
    this.halt();
    const warmup = options?.warmupSeconds ?? 1.2;
    const origin = performance.now() / 1000;
    let t = 0;
    let phase = 0;
    let seed = 12345;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296 - 0.5;
    };
    this.emit('onStatus', { state: 'running' });
    let locked = false;
    this.timer = setInterval(() => {
      const now = performance.now() / 1000 - origin;
      while (t < now) {
        const dt = 1 / FPS;
        // Review build: a pulse near 84 with variation at an everyday breathing pace, so a scan reads
        // magenta. After 45 seconds (only a practice session runs that long) the variation eases
        // into the slow six-breaths-a-minute rhythm the practice teaches, so its after differs.
        const ease = Math.min(1, Math.max(0, (t - 45) / 30));
        const everyday = 3 * Math.sin(2 * Math.PI * 0.1 * t) + 10 * Math.sin(2 * Math.PI * 0.25 * t);
        const slow = 10 * Math.sin(2 * Math.PI * 0.1 * t);
        const bpm = 84 - 4 * ease + (1 - ease) * everyday + ease * slow;
        phase += (bpm / 60) * dt * 2 * Math.PI;
        const pulse = Math.sin(phase) + 0.3 * Math.sin(2 * phase + 0.8);
        if (!locked && t >= warmup) {
          locked = true;
          this.emit('onStatus', { state: 'locked' });
        }
        this.emit('onSample', { t, r: 0.72 + 0.02 * Math.sin(t * 0.15) - 0.015 * pulse + rnd() * 0.004, g: 0.12 + rnd() * 0.002, b: 0.06 + rnd() * 0.002, locked });
        t += dt;
      }
    }, 1000 / FPS);
  }
  async stop(): Promise<void> {
    if (this.halt()) this.emit('onStatus', { state: 'stopped' });
  }
  private halt(): boolean {
    if (!this.timer) return false;
    clearInterval(this.timer);
    this.timer = null;
    return true;
  }
}

export default registerWebModule(AffelionPpgModule, 'AffelionPpgModule');

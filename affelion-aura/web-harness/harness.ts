/**
 * Browser harness for the aura renderer. Bundled with esbuild and driven by Playwright to
 * produce reference renders for a set of biometric presets. Uses the exact same FluidSim and
 * mapping code as the app.
 */
import { mapBiometricsToAura } from '../src/core/color/mapping';
import type { BiometricInput } from '../src/core/types';
import { FluidSim, QUALITY_PRESETS, placeholderMask } from '../src/render/fluid/FluidSim';

const PRESETS: Record<string, BiometricInput> = {
  activated: {
    heart: { bpm: 104, rmssd: 18, sdnn: 22, pnn50: 4, beatCount: 60, quality: 0.9, durationSec: 40 },
    voice: { medianPitchHz: 210, pitchVarianceSemitones: 2.6, energyVariance: 0.5, spectralCentroidHz: 1800, voicedRatio: 0.6, quality: 0.8, durationSec: 6 },
  },
  coherent: {
    heart: { bpm: 63, rmssd: 82, sdnn: 90, pnn50: 48, beatCount: 42, quality: 0.9, durationSec: 40 },
    voice: { medianPitchHz: 160, pitchVarianceSemitones: 1.2, energyVariance: 0.25, spectralCentroidHz: 1100, voicedRatio: 0.6, quality: 0.8, durationSec: 6 },
  },
  rest: {
    heart: { bpm: 51, rmssd: 44, sdnn: 50, pnn50: 25, beatCount: 34, quality: 0.9, durationSec: 40 },
    voice: { medianPitchHz: 130, pitchVarianceSemitones: 0.5, energyVariance: 0.1, spectralCentroidHz: 700, voicedRatio: 0.5, quality: 0.8, durationSec: 6 },
  },
  clarity: {
    heart: { bpm: 86, rmssd: 52, sdnn: 58, pnn50: 30, beatCount: 56, quality: 0.9, durationSec: 40 },
    voice: { medianPitchHz: 190, pitchVarianceSemitones: 3.6, energyVariance: 0.8, spectralCentroidHz: 2300, voicedRatio: 0.7, quality: 0.9, durationSec: 6 },
  },
  depleted: {
    heart: { bpm: 54, rmssd: 13, sdnn: 15, pnn50: 2, beatCount: 36, quality: 0.8, durationSec: 40 },
    voice: { medianPitchHz: 120, pitchVarianceSemitones: 0.3, energyVariance: 0.05, spectralCentroidHz: 600, voicedRatio: 0.4, quality: 0.6, durationSec: 6 },
  },
};

declare global {
  interface Window {
    __aura: {
      setPreset(name: string): unknown;
      run(frames: number, dt?: number): void;
      presets(): string[];
      info(): unknown;
    };
  }
}

function main() {
  const canvas = document.getElementById('gl') as HTMLCanvasElement;
  const bg = document.getElementById('bg') as HTMLCanvasElement;
  const gl = (canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false }) ||
    canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })) as
    | WebGL2RenderingContext
    | WebGLRenderingContext
    | null;
  if (!gl) throw new Error('No WebGL');
  const sim = new FluidSim(gl, QUALITY_PRESETS.medium);
  const mask = placeholderMask(120, 160);
  sim.setMask(mask);

  // Stand-in for the camera feed: a dim figure on a dark ground so the wrap is legible.
  const ctx = bg.getContext('2d')!;
  const img = ctx.createImageData(mask.width, mask.height);
  for (let i = 0; i < mask.width * mask.height; i++) {
    const inside = mask.data[i]! > 127;
    img.data[i * 4] = inside ? 46 : 14;
    img.data[i * 4 + 1] = inside ? 40 : 15;
    img.data[i * 4 + 2] = inside ? 38 : 18;
    img.data[i * 4 + 3] = 255;
  }
  const tmp = document.createElement('canvas');
  tmp.width = mask.width;
  tmp.height = mask.height;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tmp, 0, 0, bg.width, bg.height);

  let current = 'coherent';
  const apply = (name: string) => {
    current = name;
    const params = mapBiometricsToAura(PRESETS[name]!);
    sim.setParams(params);
    return params;
  };
  apply(current);

  window.__aura = {
    setPreset: (name) => apply(name),
    run: (frames, dt = 1 / 60) => {
      for (let i = 0; i < frames; i++) sim.step(dt);
    },
    presets: () => Object.keys(PRESETS),
    info: () => ({ preset: current, webgl2: gl instanceof WebGL2RenderingContext }),
  };
  (document.getElementById('status') as HTMLElement).textContent = 'ready';
}

main();

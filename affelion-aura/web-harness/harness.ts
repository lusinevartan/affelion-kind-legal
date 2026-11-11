/**
 * Browser harness for the aura renderer. Bundled with esbuild and driven by Playwright to
 * produce reference renders for a set of biometric presets. Uses the exact same FluidSim and
 * mapping code as the app.
 */
import { mapBiometricsToAura } from '../src/core/color/mapping';
import { AURA_COLOR_IDS, SWATCH_HSL, type AuraColorId } from '../src/core/color/knowledgeBase';
import type { AuraParams, BiometricInput } from '../src/core/types';
import { FluidSim, QUALITY_PRESETS, placeholderMask } from '../src/render/fluid/FluidSim';

/**
 * Find real readings that the mapping turns into a given knowledge-base colour, so a swatch
 * sheet shows what the rules actually produce. Colours no reading reaches come back as
 * `reachable: false` with parameters taken straight from the swatch, for reference only.
 */
function paramsForColor(id: AuraColorId): { params: AuraParams; reachable: boolean; readings: string } {
  const variances = [0.3, 0.15, 0.45, 0.6, 0.05, 0.75, 0.9];
  const stabilities = [0.6, 0.8, 0.4, 0.95, 0.2];
  for (const recovery of [0, 0.6]) {
   for (const withVoice of [true, false]) {
    for (let bpm = 48; bpm <= 116; bpm += 2) {
      for (let rmssd = 8; rmssd <= 100; rmssd += 3) {
        for (const variance of withVoice ? variances : [0]) {
          for (const stability of withVoice ? stabilities : [0]) {
            const input: BiometricInput = {
              heart: { bpm, rmssd, sdnn: rmssd * 1.1, pnn50: rmssd > 40 ? 28 : 6, beatCount: 44, quality: 0.9, durationSec: 40, recovery },
              voice: withVoice
                ? { dominantPitchHz: 170, variance, stability, pitchVarianceSemitones: variance * 4, energyVariance: variance * 0.8, spectralCentroidHz: 1300, voicedRatio: 0.6, quality: 0.8, durationSec: 5 }
                : null,
            };
            const params = mapBiometricsToAura(input);
            if (params.primaryColorId === id) {
              const voice = withVoice ? ` · voice ${Math.round(variance * 100)}% var, ${Math.round(stability * 100)}% steady` : ' · no voice';
              const rec = recovery > 0 ? ' · settling during the scan' : '';
              return { params, reachable: true, readings: `${bpm} bpm · HRV ${rmssd} ms${voice}${rec}` };
            }
          }
        }
      }
    }
   }
  }
  const base = mapBiometricsToAura(PRESETS.coherent!);
  const sw = SWATCH_HSL[id];
  return {
    params: { ...base, hue: sw.h, saturation: sw.s, lightness: sw.l, primaryColorId: id, secondaryColorId: id, turbulence: 0.4, accentStrength: 0.3, seed: (base.seed ^ (sw.h * 2654435761)) >>> 0 },
    reachable: false,
    readings: 'not reachable under the current rules',
  };
}

const PRESETS: Record<string, BiometricInput> = {
  activated: {
    heart: { bpm: 104, rmssd: 18, sdnn: 22, pnn50: 4, beatCount: 60, quality: 0.9, durationSec: 40 },
    voice: { dominantPitchHz: 210, variance: 0.6, stability: 0.48, pitchVarianceSemitones: 2.6, energyVariance: 0.5, spectralCentroidHz: 1800, voicedRatio: 0.6, quality: 0.8, durationSec: 5 },
  },
  coherent: {
    heart: { bpm: 63, rmssd: 82, sdnn: 90, pnn50: 48, beatCount: 42, quality: 0.9, durationSec: 40 },
    voice: { dominantPitchHz: 160, variance: 0.28, stability: 0.76, pitchVarianceSemitones: 1.2, energyVariance: 0.25, spectralCentroidHz: 1100, voicedRatio: 0.6, quality: 0.8, durationSec: 5 },
  },
  rest: {
    heart: { bpm: 51, rmssd: 44, sdnn: 50, pnn50: 25, beatCount: 34, quality: 0.9, durationSec: 40 },
    voice: { dominantPitchHz: 130, variance: 0.12, stability: 0.9, pitchVarianceSemitones: 0.5, energyVariance: 0.1, spectralCentroidHz: 700, voicedRatio: 0.5, quality: 0.8, durationSec: 5 },
  },
  clarity: {
    heart: { bpm: 86, rmssd: 52, sdnn: 58, pnn50: 30, beatCount: 56, quality: 0.9, durationSec: 40 },
    voice: { dominantPitchHz: 190, variance: 0.87, stability: 0.28, pitchVarianceSemitones: 3.6, energyVariance: 0.8, spectralCentroidHz: 2300, voicedRatio: 0.7, quality: 0.9, durationSec: 5 },
  },
  depleted: {
    heart: { bpm: 54, rmssd: 13, sdnn: 15, pnn50: 2, beatCount: 36, quality: 0.8, durationSec: 40 },
    voice: { dominantPitchHz: 120, variance: 0.07, stability: 0.94, pitchVarianceSemitones: 0.3, energyVariance: 0.05, spectralCentroidHz: 600, voicedRatio: 0.4, quality: 0.6, durationSec: 5 },
  },
};

declare global {
  interface Window {
    __aura: {
      setPreset(name: string): unknown;
      setPaper(on: boolean): void;
      colorIds(): string[];
      setColor(id: string): { reachable: boolean; readings: string; hue: number; saturation: number; lightness: number };
      setMask(w: number, h: number, b64: string): void;
      setStill(url: string): Promise<void>;
      resize(w: number, h: number): void;
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
    setPaper: (on) => {
      sim.paper = on;
    },
    colorIds: () => [...AURA_COLOR_IDS],
    setColor: (id) => {
      const r = paramsForColor(id as AuraColorId);
      sim.setParams(r.params);
      return { reachable: r.reachable, readings: r.readings, hue: r.params.hue, saturation: r.params.saturation, lightness: r.params.lightness };
    },
    setMask: (w, h, b64) => {
      const bin = atob(b64);
      const data = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
      sim.setMask({ width: w, height: h, data, imageAspect: w / h });
    },
    setStill: (url) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          sim.setStill(img);
          resolve();
        };
        img.onerror = () => reject(new Error('still failed to load'));
        img.src = url;
      }),
    resize: (w, h) => {
      for (const el of [canvas, bg, document.getElementById('stage') as HTMLElement]) {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
      }
      canvas.width = bg.width = w;
      canvas.height = bg.height = h;
      sim.resize(w, h);
    },
    run: (frames, dt = 1 / 60) => {
      for (let i = 0; i < frames; i++) sim.step(dt);
    },
    presets: () => Object.keys(PRESETS),
    info: () => ({ preset: current, webgl2: gl instanceof WebGL2RenderingContext }),
  };
  (document.getElementById('status') as HTMLElement).textContent = 'ready';
}

main();

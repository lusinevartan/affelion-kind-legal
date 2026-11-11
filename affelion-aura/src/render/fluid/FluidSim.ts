import type { AuraParams, RGB } from '../../core/types';
import { AURA_COLORS, hslToRgb } from '../../core/color/palette';
import { clamp, clamp01, lerp, mulberry32 } from '../../core/math';
import {
  ADVECTION_FRAG,
  BASE_VERTEX,
  BLUR_FRAG,
  CLEAR_FRAG,
  COPY_FRAG,
  CURL_FRAG,
  DISPLAY_FRAG,
  DIVERGENCE_FRAG,
  GRADIENT_SUBTRACT_FRAG,
  PRESSURE_FRAG,
  SPLAT_FRAG,
  VORTICITY_FRAG,
} from './shaders';

/**
 * Real-time GPU fluid simulation (stable fluids, semi-Lagrangian advection with vorticity
 * confinement) that drives the aura. Framework-agnostic: hand it any WebGL1/WebGL2 context.
 * Used by `AuraView` on device (expo-gl) and by the web harness for screenshots.
 *
 * Determinism: all "random" splat positions and jitter come from a PRNG seeded with
 * `AuraParams.seed`, so the same scan always renders the same evolving portrait.
 */

export interface FluidQuality {
  /** Simulation grid long side. */
  simRes: number;
  /** Dye texture long side. */
  dyeRes: number;
  pressureIterations: number;
}

export const QUALITY_PRESETS: Record<'low' | 'medium' | 'high', FluidQuality> = {
  low: { simRes: 96, dyeRes: 384, pressureIterations: 12 },
  medium: { simRes: 128, dyeRes: 512, pressureIterations: 20 },
  high: { simRes: 192, dyeRes: 768, pressureIterations: 24 },
};

export interface SilhouetteMask {
  width: number;
  height: number;
  /** Row-major bytes, top-left origin, 255 = person. */
  data: Uint8Array;
  /** Aspect (w/h) of the full camera image the mask covers. */
  imageAspect: number;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  swap(): void;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Formats {
  rgba: { internalFormat: number; format: number };
  rg: { internalFormat: number; format: number };
  r: { internalFormat: number; format: number };
  type: number;
  linear: boolean;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;

interface EdgePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  /** 0 at the head, 1 at the bottom of the frame. */
  v: number;
}

export class FluidSim {
  private readonly gl: GL;
  private readonly isWebGL2: boolean;
  private formats!: Formats;
  private quality: FluidQuality;

  private programs!: {
    clear: Program;
    copy: Program;
    splat: Program;
    advection: Program;
    divergence: Program;
    curl: Program;
    vorticity: Program;
    pressure: Program;
    gradientSubtract: Program;
    blur: Program;
    display: Program;
  };
  private quad!: WebGLBuffer;

  private dye!: DoubleFBO;
  private velocity!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private pressure!: DoubleFBO;
  private field!: DoubleFBO;
  private glow!: DoubleFBO;
  private maskTexture: WebGLTexture | null = null;
  private maskAspect = 3 / 4;
  private hasMask = false;
  private fieldDirty = false;

  private viewWidth = 1;
  private viewHeight = 1;
  private params: AuraParams | null = null;
  private palette: { core: RGB; halo: RGB; accent: RGB | null } | null = null;
  private edges: EdgePoint[] = [];
  private rng: () => number = mulberry32(1);
  private time = 0;
  private lastBeatPhase = 0;
  private lastSplatAt = 0;
  private disposed = false;

  constructor(gl: GL, quality: FluidQuality = QUALITY_PRESETS.medium) {
    this.gl = gl;
    this.quality = quality;
    this.isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    this.detectFormats();
    this.createPrograms();
    this.createQuad();
    this.resize(gl.drawingBufferWidth || 1, gl.drawingBufferHeight || 1);
  }

  // MARK: setup

  private detectFormats() {
    const gl = this.gl;
    let type: number = gl.FLOAT;
    let linear = false;
    if (this.isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      gl2.getExtension('EXT_color_buffer_float');
      linear = !!gl2.getExtension('OES_texture_float_linear');
      type = gl2.HALF_FLOAT;
      const rgba = this.probe(gl2.RGBA16F, gl.RGBA, type) ? { internalFormat: gl2.RGBA16F, format: gl.RGBA } : null;
      if (rgba) {
        const rg = this.probe(gl2.RG16F, gl2.RG, type) ? { internalFormat: gl2.RG16F, format: gl2.RG } : rgba;
        const r = this.probe(gl2.R16F, gl2.RED, type) ? { internalFormat: gl2.R16F, format: gl2.RED } : rg;
        // Half float linear filtering is core in WebGL2.
        this.formats = { rgba, rg, r, type, linear: true };
        return;
      }
    }
    const halfExt = gl.getExtension('OES_texture_half_float');
    linear = !!gl.getExtension('OES_texture_half_float_linear');
    if (halfExt) {
      type = halfExt.HALF_FLOAT_OES;
      if (this.probe(gl.RGBA, gl.RGBA, type)) {
        const f = { internalFormat: gl.RGBA, format: gl.RGBA };
        this.formats = { rgba: f, rg: f, r: f, type, linear };
        return;
      }
    }
    // Last resort: 8-bit textures. Velocity precision suffers but the effect still runs.
    const f = { internalFormat: gl.RGBA, format: gl.RGBA };
    this.formats = { rgba: f, rg: f, r: f, type: gl.UNSIGNED_BYTE, linear: true };
  }

  private probe(internalFormat: number, format: number, type: number): boolean {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    return ok;
  }

  private compile(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Could not create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${log}\n${source}`);
    }
    return shader;
  }

  private link(fragSource: string): Program {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, BASE_VERTEX);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragSource);
    const program = gl.createProgram();
    if (!program) throw new Error('Could not create program');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  }

  private createPrograms() {
    this.programs = {
      clear: this.link(CLEAR_FRAG),
      copy: this.link(COPY_FRAG),
      splat: this.link(SPLAT_FRAG),
      advection: this.link(ADVECTION_FRAG),
      divergence: this.link(DIVERGENCE_FRAG),
      curl: this.link(CURL_FRAG),
      vorticity: this.link(VORTICITY_FRAG),
      pressure: this.link(PRESSURE_FRAG),
      gradientSubtract: this.link(GRADIENT_SUBTRACT_FRAG),
      blur: this.link(BLUR_FRAG),
      display: this.link(DISPLAY_FRAG),
    };
  }

  private createQuad() {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Could not create buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    this.quad = buffer;
  }

  private createFBO(w: number, h: number, fmt: { internalFormat: number; format: number }, filter: number): FBO {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    if (!texture) throw new Error('Could not create texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internalFormat, w, h, 0, fmt.format, this.formats.type, null);
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error('Could not create framebuffer');
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h };
  }

  private createDoubleFBO(w: number, h: number, fmt: { internalFormat: number; format: number }, filter: number): DoubleFBO {
    let a = this.createFBO(w, h, fmt, filter);
    let b = this.createFBO(w, h, fmt, filter);
    return {
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      swap() {
        const t = a;
        a = b;
        b = t;
      },
    };
  }

  private deleteFBO(f: FBO) {
    this.gl.deleteTexture(f.texture);
    this.gl.deleteFramebuffer(f.fbo);
  }

  private deleteDouble(d: DoubleFBO) {
    this.deleteFBO(d.read);
    this.deleteFBO(d.write);
  }

  /** Resize render targets to the view's drawing buffer. Dye content is preserved by copy. */
  resize(width: number, height: number) {
    const gl = this.gl;
    this.viewWidth = Math.max(1, width);
    this.viewHeight = Math.max(1, height);
    const aspect = this.viewWidth / this.viewHeight;
    const dims = (longSide: number) =>
      aspect >= 1
        ? { w: longSide, h: Math.max(2, Math.round(longSide / aspect)) }
        : { w: Math.max(2, Math.round(longSide * aspect)), h: longSide };
    const sim = dims(this.quality.simRes);
    const dyeDims = dims(this.quality.dyeRes);
    const filter = this.formats.linear ? gl.LINEAR : gl.NEAREST;
    const f = this.formats;

    const oldDye = this.dye;
    this.dye = this.createDoubleFBO(dyeDims.w, dyeDims.h, f.rgba, filter);
    if (oldDye) {
      this.blit(this.dye.write, () => {
        this.use(this.programs.copy);
        gl.uniform1i(this.programs.copy.uniforms.uTexture!, this.bindTex(oldDye.read.texture, 0));
      });
      this.dye.swap();
      this.deleteDouble(oldDye);
    }
    if (this.velocity) this.deleteDouble(this.velocity);
    if (this.divergence) this.deleteFBO(this.divergence);
    if (this.curl) this.deleteFBO(this.curl);
    if (this.pressure) this.deleteDouble(this.pressure);
    if (this.field) this.deleteDouble(this.field);
    if (this.glow) this.deleteDouble(this.glow);
    this.velocity = this.createDoubleFBO(sim.w, sim.h, f.rg, filter);
    this.divergence = this.createFBO(sim.w, sim.h, f.r, gl.NEAREST);
    this.curl = this.createFBO(sim.w, sim.h, f.r, gl.NEAREST);
    this.pressure = this.createDoubleFBO(sim.w, sim.h, f.r, gl.NEAREST);
    // Field is 8-bit: a blurred mask doesn't need precision, and 8-bit is always filterable.
    this.field = this.createDoubleFBO8(Math.max(2, Math.round(sim.w * 1.5)), Math.max(2, Math.round(sim.h * 1.5)));
    this.glow = this.createDoubleFBO(Math.max(2, Math.round(dyeDims.w / 4)), Math.max(2, Math.round(dyeDims.h / 4)), f.rgba, filter);
    this.fieldDirty = true;
  }

  private createDoubleFBO8(w: number, h: number): DoubleFBO {
    const gl = this.gl;
    const saved = this.formats.type;
    this.formats = { ...this.formats, type: gl.UNSIGNED_BYTE };
    const d = this.createDoubleFBO(w, h, { internalFormat: gl.RGBA, format: gl.RGBA }, gl.LINEAR);
    this.formats = { ...this.formats, type: saved };
    return d;
  }

  // MARK: inputs

  /** Set the aura parameters from the biometric engine. Re-seeds the PRNG. */
  setParams(params: AuraParams) {
    const reseed = !this.params || this.params.seed !== params.seed;
    this.params = params;
    if (reseed) this.rng = mulberry32(params.seed);
    const core = hslToRgb({ h: params.hue, s: params.saturation, l: params.lightness });
    const haloDef = AURA_COLORS[params.secondaryColorId].hsl;
    const halo = hslToRgb({
      h: haloDef.h,
      s: clamp01(Math.min(haloDef.s, params.saturation + 0.15) * lerp(0.45, 1.0, params.saturation)),
      l: clamp01(lerp(haloDef.l, params.lightness, 0.5)),
    });
    // The brighter accent is the primary colour lifted in lightness; it carries no new meaning.
    const accent =
      params.accentStrength > 0
        ? hslToRgb({ h: params.hue, s: clamp01(params.saturation + 0.1), l: clamp01(params.lightness + 0.25) })
        : null;
    this.palette = { core, halo, accent };
  }

  /** Upload a new silhouette mask (8-bit, top-left origin). */
  setMask(mask: SilhouetteMask | null) {
    const gl = this.gl;
    if (!mask) {
      this.hasMask = false;
      this.edges = [];
      return;
    }
    if (!this.maskTexture) {
      this.maskTexture = gl.createTexture();
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    // Flip vertically so row 0 (top) lands at v = 1.
    const flipped = new Uint8Array(mask.width * mask.height);
    for (let y = 0; y < mask.height; y++) {
      flipped.set(mask.data.subarray(y * mask.width, (y + 1) * mask.width), (mask.height - 1 - y) * mask.width);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, mask.width, mask.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, flipped);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    this.maskAspect = mask.imageAspect || mask.width / mask.height;
    this.hasMask = true;
    this.fieldDirty = true;
    this.edges = extractEdges(mask);
  }

  /** Aspect-fill transform mapping view uv → mask uv. */
  private maskTransform(): { scale: [number, number]; offset: [number, number] } {
    const viewAspect = this.viewWidth / this.viewHeight;
    const m = this.maskAspect;
    if (viewAspect > m) {
      // View is wider: mask fills width, crops top/bottom.
      const s = m / viewAspect;
      return { scale: [1, s], offset: [0, (1 - s) / 2] };
    }
    const s = viewAspect / m;
    return { scale: [s, 1], offset: [(1 - s) / 2, 0] };
  }

  /** View-space uv (origin bottom-left) of a mask-space point (origin top-left). */
  private maskToView(mx: number, my: number): { x: number; y: number } {
    const { scale, offset } = this.maskTransform();
    // mask uv with bottom-left origin
    const mu = mx;
    const mv = 1 - my;
    return { x: (mu - offset[0]) / scale[0], y: (mv - offset[1]) / scale[1] };
  }

  // MARK: frame

  /** Advance the simulation by dt seconds and draw to the default framebuffer. */
  step(dt: number) {
    if (this.disposed) return;
    const gl = this.gl;
    const clampedDt = Math.min(dt, 1 / 30);
    this.time += clampedDt;
    this.inject(clampedDt);
    this.simulate(clampedDt);
    if (this.fieldDirty) this.rebuildField();
    this.updateGlow();
    this.render(null);
    gl.flush();
  }

  /** Render the current state to a specific framebuffer (used for exports). */
  renderTo(target: WebGLFramebuffer | null, width: number, height: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, width, height);
    this.drawDisplay();
  }

  private simulate(dt: number) {
    const gl = this.gl;
    const p = this.params;
    const turbulence = p?.turbulence ?? 0.3;
    const coherence = p?.state.coherence ?? 0.5;
    const curlStrength = lerp(4, 38, turbulence);
    const velocityDissipation = lerp(0.9, 0.12, turbulence) * lerp(1.0, 0.6, coherence);
    const densityDissipation = lerp(1.1, 0.55, turbulence);
    gl.disable(gl.BLEND);

    this.blit(this.curl, () => {
      this.use(this.programs.curl);
      this.setTexel(this.programs.curl, this.velocity);
      gl.uniform1i(this.programs.curl.uniforms.uVelocity!, this.bindTex(this.velocity.read.texture, 0));
    });

    this.blit(this.velocity.write, () => {
      const pr = this.programs.vorticity;
      this.use(pr);
      this.setTexel(pr, this.velocity);
      gl.uniform1i(pr.uniforms.uVelocity!, this.bindTex(this.velocity.read.texture, 0));
      gl.uniform1i(pr.uniforms.uCurl!, this.bindTex(this.curl.texture, 1));
      gl.uniform1f(pr.uniforms.curl!, curlStrength);
      gl.uniform1f(pr.uniforms.dt!, dt);
    });
    this.velocity.swap();

    this.blit(this.divergence, () => {
      const pr = this.programs.divergence;
      this.use(pr);
      this.setTexel(pr, this.velocity);
      gl.uniform1i(pr.uniforms.uVelocity!, this.bindTex(this.velocity.read.texture, 0));
    });

    this.blit(this.pressure.write, () => {
      const pr = this.programs.clear;
      this.use(pr);
      gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.pressure.read.texture, 0));
      gl.uniform1f(pr.uniforms.value!, 0.8);
    });
    this.pressure.swap();

    for (let i = 0; i < this.quality.pressureIterations; i++) {
      this.blit(this.pressure.write, () => {
        const pr = this.programs.pressure;
        this.use(pr);
        this.setTexel(pr, this.velocity);
        gl.uniform1i(pr.uniforms.uDivergence!, this.bindTex(this.divergence.texture, 0));
        gl.uniform1i(pr.uniforms.uPressure!, this.bindTex(this.pressure.read.texture, 1));
      });
      this.pressure.swap();
    }

    this.blit(this.velocity.write, () => {
      const pr = this.programs.gradientSubtract;
      this.use(pr);
      this.setTexel(pr, this.velocity);
      gl.uniform1i(pr.uniforms.uPressure!, this.bindTex(this.pressure.read.texture, 0));
      gl.uniform1i(pr.uniforms.uVelocity!, this.bindTex(this.velocity.read.texture, 1));
    });
    this.velocity.swap();

    const manual = this.formats.linear ? 0 : 1;
    this.blit(this.velocity.write, () => {
      const pr = this.programs.advection;
      this.use(pr);
      this.setTexel(pr, this.velocity);
      gl.uniform2f(pr.uniforms.dyeTexelSize!, this.velocity.texelSizeX, this.velocity.texelSizeY);
      const id = this.bindTex(this.velocity.read.texture, 0);
      gl.uniform1i(pr.uniforms.uVelocity!, id);
      gl.uniform1i(pr.uniforms.uSource!, id);
      gl.uniform1f(pr.uniforms.dt!, dt);
      gl.uniform1f(pr.uniforms.dissipation!, velocityDissipation);
      gl.uniform1i(pr.uniforms.manualFilter!, manual);
    });
    this.velocity.swap();

    this.blit(this.dye.write, () => {
      const pr = this.programs.advection;
      this.use(pr);
      this.setTexel(pr, this.velocity);
      gl.uniform2f(pr.uniforms.dyeTexelSize!, this.dye.texelSizeX, this.dye.texelSizeY);
      gl.uniform1i(pr.uniforms.uVelocity!, this.bindTex(this.velocity.read.texture, 0));
      gl.uniform1i(pr.uniforms.uSource!, this.bindTex(this.dye.read.texture, 1));
      gl.uniform1f(pr.uniforms.dt!, dt);
      gl.uniform1f(pr.uniforms.dissipation!, densityDissipation);
      gl.uniform1i(pr.uniforms.manualFilter!, manual);
    });
    this.dye.swap();
  }

  /**
   * Dye and momentum injection. Splats are placed along the silhouette edge (or an oval when
   * no mask exists), pushed outward along the local normal, and pulsed at the measured heart rate.
   */
  private inject(dt: number) {
    const p = this.params;
    const pal = this.palette;
    if (!p || !pal) return;
    const beatHz = p.pulseSpeed;
    const phase = (this.time * beatHz) % 1;
    // Sharp systolic envelope followed by a soft tail.
    const beat = Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 3) * (phase < 0.5 ? 1 : 0.35);
    const turbulence = p.turbulence;
    const edges = this.edges.length ? this.edges : ovalEdges(28);

    // Base rate: a few splats per frame, more with turbulence. Deterministic count via accumulator.
    const rate = lerp(70, 140, turbulence) * (0.45 + 0.55 * beat);
    this.lastSplatAt += rate * dt;
    let count = Math.floor(this.lastSplatAt);
    this.lastSplatAt -= count;
    count = Math.min(count, 10);

    for (let i = 0; i < count; i++) {
      const e = edges[Math.floor(this.rng() * edges.length)]!;
      const view = this.maskToView(e.x, e.y);
      if (view.x < -0.1 || view.x > 1.1 || view.y < -0.1 || view.y > 1.1) continue;
      const jitter = lerp(0.004, 0.03, turbulence);
      const px = view.x + (this.rng() - 0.5) * jitter * 2 - e.nx * 0.01;
      const py = view.y + (this.rng() - 0.5) * jitter * 2 - e.ny * 0.01;
      // Outward push with a tangential swirl that grows with turbulence.
      const swirl = (this.rng() - 0.5) * lerp(0.2, 1.6, turbulence);
      // Top edges push less so the aura doesn't all stream off the head.
      const topDamp = e.ny < -0.7 ? 0.45 : 1;
      const speed = lerp(80, 320, turbulence) * (0.5 + beat) * topDamp;
      const vx = (e.nx + -e.ny * swirl) * speed;
      const vy = (e.ny + e.nx * swirl) * speed * -1; // mask y is top-down, view y is bottom-up
      const radius = lerp(0.3, 0.17, turbulence) * (1 + 0.5 * beat);

      // Colour: core near the body centre line, halo toward the shoulders/edges, accents rarely.
      const r = this.rng();
      let color: RGB;
      if (pal.accent && r < 0.14 * p.accentStrength) color = pal.accent;
      else if (r < 0.45 + 0.3 * (1 - p.regions[1]!.weight)) color = pal.core;
      else color = pal.halo;
      const intensity = lerp(0.22, 0.4, beat) * lerp(0.85, 1.25, p.saturation);
      this.splat(px, py, vx, vy, { r: color.r * intensity, g: color.g * intensity, b: color.b * intensity }, radius);
    }
    this.lastBeatPhase = phase;
  }

  private splat(x: number, y: number, dx: number, dy: number, color: RGB, radius: number) {
    const gl = this.gl;
    const aspect = this.viewWidth / this.viewHeight;
    this.blit(this.velocity.write, () => {
      const pr = this.programs.splat;
      this.use(pr);
      gl.uniform1i(pr.uniforms.uTarget!, this.bindTex(this.velocity.read.texture, 0));
      gl.uniform1f(pr.uniforms.aspectRatio!, aspect);
      gl.uniform2f(pr.uniforms.point!, x, y);
      gl.uniform3f(pr.uniforms.color!, dx, dy, 0);
      gl.uniform1f(pr.uniforms.radius!, radius / 100);
    });
    this.velocity.swap();
    this.blit(this.dye.write, () => {
      const pr = this.programs.splat;
      this.use(pr);
      gl.uniform1i(pr.uniforms.uTarget!, this.bindTex(this.dye.read.texture, 0));
      gl.uniform1f(pr.uniforms.aspectRatio!, aspect);
      gl.uniform2f(pr.uniforms.point!, x, y);
      gl.uniform3f(pr.uniforms.color!, color.r, color.g, color.b);
      gl.uniform1f(pr.uniforms.radius!, radius / 100);
    });
    this.dye.swap();
  }

  /** Blur the hard mask into the soft field texture (a few separable passes). */
  private rebuildField() {
    const gl = this.gl;
    this.fieldDirty = false;
    if (!this.hasMask || !this.maskTexture) return;
    // The field lives in mask uv space, like the mask itself; the display pass applies the
    // aspect-fill transform to both.
    this.blit(this.field.write, () => {
      const pr = this.programs.copy;
      this.use(pr);
      gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.maskTexture!, 0));
    });
    this.field.swap();
    const passes = 7;
    for (let i = 0; i < passes; i++) {
      const spread = 1 + i * 1.2;
      this.blit(this.field.write, () => {
        const pr = this.programs.blur;
        this.use(pr);
        gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.field.read.texture, 0));
        gl.uniform2f(pr.uniforms.direction!, (this.field.texelSizeX * spread), 0);
      });
      this.field.swap();
      this.blit(this.field.write, () => {
        const pr = this.programs.blur;
        this.use(pr);
        gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.field.read.texture, 0));
        gl.uniform2f(pr.uniforms.direction!, 0, (this.field.texelSizeY * spread));
      });
      this.field.swap();
    }
  }

  /** Quarter-resolution blurred dye used as a soft bloom in the display pass. */
  private updateGlow() {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    this.blit(this.glow.write, () => {
      const pr = this.programs.copy;
      this.use(pr);
      gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.dye.read.texture, 0));
    });
    this.glow.swap();
    for (let i = 0; i < 2; i++) {
      const spread = 1.5 + i * 1.5;
      this.blit(this.glow.write, () => {
        const pr = this.programs.blur;
        this.use(pr);
        gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.glow.read.texture, 0));
        gl.uniform2f(pr.uniforms.direction!, this.glow.texelSizeX * spread, 0);
      });
      this.glow.swap();
      this.blit(this.glow.write, () => {
        const pr = this.programs.blur;
        this.use(pr);
        gl.uniform1i(pr.uniforms.uTexture!, this.bindTex(this.glow.read.texture, 0));
        gl.uniform2f(pr.uniforms.direction!, 0, this.glow.texelSizeY * spread);
      });
      this.glow.swap();
    }
  }

  private render(target: FBO | null) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.width : this.viewWidth, target ? target.height : this.viewHeight);
    this.drawDisplay();
  }

  private drawDisplay() {
    const gl = this.gl;
    const pr = this.programs.display;
    const p = this.params;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.use(pr);
    const { scale, offset } = this.maskTransform();
    gl.uniform1i(pr.uniforms.uDye!, this.bindTex(this.dye.read.texture, 0));
    gl.uniform1i(pr.uniforms.uGlow!, this.bindTex(this.glow.read.texture, 3));
    if (this.hasMask && this.maskTexture) {
      gl.uniform1i(pr.uniforms.uMask!, this.bindTex(this.maskTexture, 1));
      gl.uniform1i(pr.uniforms.uField!, this.bindTex(this.field.read.texture, 2));
      gl.uniform1i(pr.uniforms.hasMask!, 1);
    } else {
      gl.uniform1i(pr.uniforms.uMask!, this.bindTex(this.dye.read.texture, 1));
      gl.uniform1i(pr.uniforms.uField!, this.bindTex(this.dye.read.texture, 2));
      gl.uniform1i(pr.uniforms.hasMask!, 0);
    }
    gl.uniform2f(pr.uniforms.maskScale!, scale[0], scale[1]);
    gl.uniform2f(pr.uniforms.maskOffset!, offset[0], offset[1]);
    gl.uniform1f(pr.uniforms.time!, this.time);
    const coherence = p?.state.coherence ?? 0.5;
    gl.uniform1f(pr.uniforms.insideTint!, lerp(0.2, 0.32, coherence));
    gl.uniform1f(pr.uniforms.edgeGlow!, lerp(0.8, 1.1, coherence));
    gl.uniform1f(pr.uniforms.grain!, 0.05);
    gl.uniform1f(pr.uniforms.exposure!, lerp(1.7, 2.3, p?.lightness ?? 0.5));
    gl.uniform1f(pr.uniforms.glowStrength!, 0.9);
    gl.uniform1f(pr.uniforms.vignette!, 0.25);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND);
  }

  // MARK: helpers

  private use(p: Program) {
    this.gl.useProgram(p.program);
  }

  private setTexel(p: Program, target: { texelSizeX: number; texelSizeY: number }) {
    const loc = p.uniforms.texelSize;
    if (loc) this.gl.uniform2f(loc, target.texelSizeX, target.texelSizeY);
  }

  private bindTex(texture: WebGLTexture, unit: number): number {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    return unit;
  }

  private blit(target: FBO, setup: () => void) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, target.width, target.height);
    setup();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    this.deleteDouble(this.dye);
    this.deleteDouble(this.velocity);
    this.deleteDouble(this.pressure);
    this.deleteDouble(this.field);
    this.deleteDouble(this.glow);
    this.deleteFBO(this.divergence);
    this.deleteFBO(this.curl);
    if (this.maskTexture) gl.deleteTexture(this.maskTexture);
    for (const p of Object.values(this.programs)) gl.deleteProgram(p.program);
    gl.deleteBuffer(this.quad);
  }
}

/**
 * Sample the silhouette boundary: for a set of rows find the leftmost/rightmost person pixel,
 * and for a set of columns the topmost one. Normals point away from the body.
 * Coordinates are normalised to the mask (origin top-left).
 */
export function extractEdges(mask: SilhouetteMask, rows = 28, cols = 14): EdgePoint[] {
  const { width: w, height: h, data } = mask;
  const pts: EdgePoint[] = [];
  const threshold = 128;
  let top = h;
  for (let y = 0; y < h; y++) {
    let found = false;
    for (let x = 0; x < w; x += 2) {
      if (data[y * w + x]! >= threshold) {
        found = true;
        break;
      }
    }
    if (found) {
      top = y;
      break;
    }
  }
  if (top >= h) return [];
  for (let r = 0; r < rows; r++) {
    const y = Math.min(h - 1, Math.round(top + ((h - 1 - top) * (r + 0.5)) / rows));
    let left = -1,
      right = -1;
    for (let x = 0; x < w; x++) {
      if (data[y * w + x]! >= threshold) {
        left = x;
        break;
      }
    }
    for (let x = w - 1; x >= 0; x--) {
      if (data[y * w + x]! >= threshold) {
        right = x;
        break;
      }
    }
    if (left < 0 || right < 0 || right - left < 2) continue;
    const v = (y - top) / Math.max(1, h - 1 - top);
    // Slight outward normal tilt upward near the head, horizontal lower down.
    const tilt = -(1 - v) * 0.35;
    if (left > 0) pts.push({ x: left / w, y: y / h, nx: -1, ny: tilt, v });
    if (right < w - 1) pts.push({ x: right / w, y: y / h, nx: 1, ny: tilt, v });
  }
  // Head/shoulder top edge.
  for (let c = 0; c < cols; c++) {
    const x = Math.min(w - 1, Math.round(((c + 0.5) * w) / cols));
    for (let y = 0; y < h; y++) {
      if (data[y * w + x]! >= threshold) {
        if (y > 0) pts.push({ x: x / w, y: y / h, nx: 0, ny: -1, v: (y - top) / Math.max(1, h - 1 - top) });
        break;
      }
    }
  }
  // Normalise normals.
  for (const p of pts) {
    const l = Math.hypot(p.nx, p.ny) || 1;
    p.nx /= l;
    p.ny /= l;
  }
  return pts;
}

/** Fallback oval (head + shoulders) in mask coordinates when no silhouette is available. */
export function ovalEdges(n: number): EdgePoint[] {
  const pts: EdgePoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = 0.5 + Math.cos(a) * 0.26;
    const y = 0.42 + Math.sin(a) * 0.33;
    pts.push({ x, y, nx: Math.cos(a), ny: Math.sin(a), v: clamp((y - 0.1) / 0.8, 0, 1) });
  }
  return pts;
}

/** Procedural placeholder mask (head and shoulders) for previews and web. */
export function placeholderMask(width = 120, height = 160): SilhouetteMask {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width - 0.5;
      const v = y / height;
      const head = Math.hypot(u / 0.16, (v - 0.3) / 0.19) < 1;
      const neck = Math.abs(u) < 0.06 && v > 0.42 && v < 0.55;
      const shoulders = v > 0.52 && Math.abs(u) < 0.2 + 0.26 * Math.min(1, (v - 0.52) / 0.18);
      data[y * width + x] = head || neck || shoulders ? 255 : 0;
    }
  }
  return { width, height, data, imageAspect: width / height };
}

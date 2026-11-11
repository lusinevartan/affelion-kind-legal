/**
 * GLSL ES 1.00 shaders for the aura fluid simulation. Written for WebGL1 so they compile on
 * every expo-gl context (which exposes WebGL2 on ES3 devices, and still accepts #version 100).
 *
 * Pipeline per frame:
 *   curl → vorticity → divergence → pressure (Jacobi × N) → gradient subtract → advect velocity
 *   → advect dye → splats → blur mask → display (dye × silhouette field, alpha-composited)
 */

export const BASE_VERTEX = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const CLEAR_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main () {
  gl_FragColor = value * texture2D(uTexture, vUv);
}
`;

export const COPY_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
void main () {
  gl_FragColor = texture2D(uTexture, vUv);
}
`;

export const SPLAT_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}
`;

/** Advection with optional manual bilinear filtering for contexts without linear half-float. */
export const ADVECTION_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;
uniform int manualFilter;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
  vec2 coord;
  vec4 result;
  if (manualFilter == 1) {
    coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    result = bilerp(uSource, coord, dyeTexelSize);
  } else {
    coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    result = texture2D(uSource, coord);
  }
  float decay = 1.0 + dissipation * dt;
  gl_FragColor = result / decay;
}
`;

export const DIVERGENCE_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

export const CURL_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

export const VORTICITY_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

export const PRESSURE_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

export const GRADIENT_SUBTRACT_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

/** Separable Gaussian blur used to turn the hard silhouette mask into a soft distance-like field. */
export const BLUR_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 direction;
void main () {
  vec4 sum = texture2D(uTexture, vUv) * 0.2270270270;
  sum += texture2D(uTexture, vUv + direction * 1.3846153846) * 0.3162162162;
  sum += texture2D(uTexture, vUv - direction * 1.3846153846) * 0.3162162162;
  sum += texture2D(uTexture, vUv + direction * 3.2307692308) * 0.0702702703;
  sum += texture2D(uTexture, vUv - direction * 3.2307692308) * 0.0702702703;
  gl_FragColor = sum;
}
`;

/**
 * Final composite. Dye is shaped by the silhouette field so the aura hugs the body:
 * brightest just outside the edge, fading outward, with a faint tint inside so the person
 * stays visible. Alpha is premultiplied for compositing over the camera feed.
 */
export const DISPLAY_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uGlow;      // blurred, low-res copy of the dye
uniform sampler2D uMask;      // hard silhouette, 1 inside
uniform sampler2D uField;     // blurred silhouette
uniform vec2 maskScale;       // aspect-fill transform from view uv to mask uv
uniform vec2 maskOffset;
uniform float time;
uniform float insideTint;     // 0..1 how much aura shows just inside the edge
uniform float edgeGlow;       // 0..1 strength of the rim light
uniform float grain;          // 0..1 film grain
uniform float exposure;
uniform float glowStrength;
uniform float vignette;
uniform int hasMask;
uniform float paper;          // 1 = composite as pigment on a light ground

float hash (vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main () {
  vec3 dye = texture2D(uDye, vUv).rgb;
  vec3 glow = texture2D(uGlow, vUv).rgb;
  vec2 muv = vUv * maskScale + maskOffset;
  float inside = 1.0;
  float field = 1.0;
  if (hasMask == 1) {
    vec2 cuv = clamp(muv, 0.0, 1.0);
    inside = texture2D(uMask, cuv).r;
    field = texture2D(uField, cuv).r;
    // Beyond the mask image (sides and above the head) there is no body; the glow field
    // continues and eases off without a visible seam. Below the frame the body continues.
    float outside = max(max(-muv.x, muv.x - 1.0), muv.y - 1.0);
    inside *= 1.0 - step(0.0, outside);
    field *= 1.0 - 0.4 * smoothstep(0.0, 0.25, outside);
  }
  // Rim: the band where the blurred field is between 0 and 1.
  float rim = field * (1.0 - field) * 4.0;
  // Exterior glow: the blurred field outside the body, remapped so it fades to black.
  float exterior = (1.0 - inside) * smoothstep(0.03, 0.75, field);
  // Interior: a thin tint just inside the edge so the aura reads as wrapping the body,
  // fading to nothing over the face and chest.
  float interior = inside * insideTint * (1.0 - smoothstep(0.5, 0.9, field));
  float shape = clamp(exterior + rim * edgeGlow * 0.6 + interior, 0.0, 1.0);
  if (hasMask == 0) {
    vec2 d = (vUv - vec2(0.5, 0.45)) * vec2(1.0, 0.8);
    shape = smoothstep(0.78, 0.12, length(d));
  }

  vec3 color = (dye + glow * glowStrength) * exposure;
  // Tone-map luminance only so overlapping dye never desaturates toward white/brown.
  float lumIn = dot(color, vec3(0.299, 0.587, 0.114));
  float lum = lumIn / (0.7 + lumIn);
  color *= lum / max(lumIn, 0.0001);
  color = min(color, vec3(1.0));
  float alpha = clamp(lum * 1.6, 0.0, 1.0) * shape;
  if (paper > 0.5) {
    // Pigment on paper: deepen and saturate so the colour holds against a light ground.
    float l2 = dot(color, vec3(0.299, 0.587, 0.114));
    color = clamp(mix(vec3(l2), color, 1.35) * 0.74, 0.0, 1.0);
    alpha = clamp(lum * 2.0, 0.0, 1.0) * shape;
  }

  float n = (hash(vUv * 1024.0 + fract(time)) - 0.5) * grain;
  color += n * alpha;

  vec2 vd = vUv - 0.5;
  float v = 1.0 - vignette * dot(vd, vd) * 1.6;
  color *= v;
  alpha *= v;

  gl_FragColor = vec4(color * alpha, alpha);
}
`;

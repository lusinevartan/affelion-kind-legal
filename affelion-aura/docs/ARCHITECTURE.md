# Architecture

## Flow

1. Onboarding (3 screens: what it is, what it measures, what it is not). Permissions are explained here and requested when the scan starts.
2. Scan (60–90 s, `src/core/scan/scanMachine.ts` + `src/features/scan/useScanSession.ts`):
   - Face (8 s of framed face): `AffelionSilhouetteView` runs the front camera, emits masks at 15 fps and face metrics; a still is captured after 2.5 s of steady framing.
   - Finger (30–40 s covered, max 90 s wall): `AffelionPpg` runs the rear camera with torch. Samples before exposure lock are discarded. The timer advances only while a fingertip actually covers the lens (`estimateCoverage`). Guidance reacts to saturation (press lighter), darkness (cover the flash too) and low quality (hold steadier).
   - Voice (6 s, min 2.5 s voiced, skippable): `AffelionAudio` streams PCM to `VoiceAnalyzer`.
   - Computing: `PpgProcessor.finish()` + `VoiceAnalyzer.finish()` → `mapBiometricsToAura()` → `ScanRecord` saved to SQLite.
3. Portrait teaser (free): Polaroid with the live aura, one grounded sentence, two tappable regions.
4. Soft paywall, only after a portrait exists. Plans: $8.99 monthly, $54 annual (recommended), $89 lifetime. Restore and manage/cancel are on the paywall and in Settings.
5. Pro: full breakdown (every colour tied to a measurement), history and trends, the guide, clean hi-res export.

## Biometric → colour engine (`src/core/color`)

`palette.ts` is the single source of truth: ten colours, each with hex/HSL, a meaning and the
physiological description used everywhere (UI, explanations, AI system prompt).

`mapping.ts` normalises BPM (45–110 linear) and RMSSD (12–100 ms, log scale) to activation and
coherence, vocal features to a 0..1 vocal variance, and derives:

| Output | Driver |
| --- | --- |
| hue | activation path indigo → sky blue → teal → lime → gold → orange → red, bent toward teal/green by high coherence or toward red by low coherence |
| saturation | baseline 0.52, +0.28 × vocal variance, muted toward earth at low energy + low coherence |
| lightness | lifted by coherence, soft white above ~0.96 coherence, darkened toward earth |
| turbulence | rises with activation and with low coherence, damped by coherence |
| pulseSpeed | BPM / 60 Hz, clamped 0.6–2.2 |

Inputs are quantised (1 bpm, 1 ms, 0.1 semitone) before mapping and the seed for the fluid's PRNG
is a hash of the quantised inputs, so identical measurements produce identical portraits.
`explain.ts` generates every sentence from the actual numbers and asserts against a banned-phrase
list; the same list guards AI replies.

## PPG (`src/core/signal/ppg.ts`, `modules/affelion-ppg`)

Native: back wide camera, 640×480 (iOS) / smallest ≥320×240 YUV (Android), 30 fps, torch on,
nearest focus, auto exposure for 1.2 s then AE/AWB locked. Mean R, G, B of the centre 50 % region per
frame, with the camera timestamp. Android converts the YUV means with BT.601 (linear, so the mean
is exact).

JS: coverage detection (red dominance), uniform resampling to 30 Hz, linear detrend, zero-phase
Butterworth band-pass 0.7–3.5 Hz, filter transients trimmed, adaptive peak detection, beat timing
from the upstroke zero-crossing (sub-sample, noise-robust), interval rejection (>20 % from local
median), then BPM, RMSSD, SDNN, pNN50 and a quality score (accept ratio + autocorrelation SNR +
duration). Synthetic tests hold BPM within 1.5 bpm and distinguish RSA from a metronomic rhythm.

## Voice (`src/core/signal/voice.ts`, `modules/affelion-audio`)

1024-sample frames at 16 kHz, hop 512. Frames above a silence floor get a YIN pitch estimate
(65–500 Hz, threshold 0.15) and, when confident, a Hann-windowed FFT for the spectral centroid.
Aggregates: median pitch, pitch standard deviation in semitones, energy coefficient of variation,
mean centroid, voiced ratio, quality. Nothing is transcribed or stored.

## Silhouette (`modules/affelion-silhouette`)

iOS uses `ARFaceTrackingConfiguration` on TrueDepth devices (face anchor → centre/size/pose) with
`VNGeneratePersonSegmentationRequest` on each captured frame, and falls back to AVFoundation +
`VNDetectFaceRectanglesRequest` elsewhere. Android uses CameraX with ML Kit Selfie Segmentation
(stream mode, raw 256×256 mask) and ML Kit Face Detection. ARCore Augmented Faces was deliberately
not used: it offers no person segmentation, restricts device coverage, and ML Kit gives the
same face metrics we need.

Mask contract on both platforms: 8-bit, row-major, top-left origin, portrait display orientation,
mirrored like the preview, covering the full camera image (which the preview shows aspect-filled).
It is sent base64-encoded through the view event system; `FluidSim.setMask` flips it for GL and
`maskTransform()` applies the same aspect-fill crop the preview uses.

## Fluid aura (`src/render/fluid`)

Stable-fluids solver on the GPU: curl → vorticity confinement → divergence → Jacobi pressure (20
iterations at medium quality) → gradient subtraction → semi-Lagrangian advection of velocity and
dye. Half-float render targets when available (WebGL2 RGBA16F or OES_texture_half_float), 8-bit
fallback. Dye is injected each frame at points sampled along the silhouette edge, pushed along the
outward normal with a tangential swirl scaled by turbulence, in a rhythm set by `pulseSpeed`.

Compositing: the hard mask is blurred into a soft field; the display pass shapes the dye with an
exterior glow (outside the body), a rim band at the edge, and a thin interior tint that fades to
zero over the face. A quarter-resolution blurred dye provides bloom. Tone mapping is applied to
luminance only so overlapping dye never desaturates. Output is premultiplied alpha for layering
over the camera still. `docs/renders/*.png` are produced by `web-harness/` with the exact same code.

Performance: medium preset is a 128-cell sim grid and 512-px dye on the long side. Quality presets
are in `QUALITY_PRESETS`; lower them on devices that miss 60 fps.

## Export

The Polaroid card (still + aura GL view + paper frame + caption) is captured with
`react-native-view-shot`, copied to the document directory, and saved with `expo-media-library` or
shared with `expo-sharing`. Free exports carry the wordmark; Pro exports are clean.

## Monetisation

`PurchaseProvider` interface in `src/services/entitlements.ts`. The shipped `DevPurchaseProvider`
simulates purchases locally and says so on the paywall. For production, implement the interface with
RevenueCat (`react-native-purchases`) or `expo-iap`, map store products to `PLANS[].productId`, and
return the entitlement from the store. Keep the "Manage or cancel" links; they open the platform
subscription pages.

## Privacy

All processing is on-device. Stored: derived metrics, aura parameters, the still photo, exported
portraits. Never stored: raw camera frames, audio. The guide endpoint receives numbers and the
question only.

## To verify on first device run

- iOS Vision orientation for the front camera: `.leftMirrored` is used for segmentation, face
  detection and the still. If the mask appears rotated or mirrored relative to the preview, change
  this constant in `AffelionSilhouetteView.swift` (one place for each path).
- ARSCNView mirroring (`transform scaleX: -1`) and the projected face centre mirroring.
- Torch level 0.6 on iOS: raise if the PPG signal amplitude is low on a given device, lower if the lens heats.
- Android Camera2 devices that refuse `FLASH_MODE_TORCH` with `CONTROL_AE_MODE_ON`: fall back to `CONTROL_AE_MODE_OFF` with manual exposure.
- Segmentation throughput: `maskFps` 15 and `maskSize` 160 are starting points.
- expo-gl transparency on Android: if the GL surface renders an opaque black background in the
  live preview, enable the TextureView path or composite the camera preview inside GL via
  `createCameraTextureAsync`. The Polaroid export path does not depend on this (it composites images).
- Hermes `requestAnimationFrame` pacing with `enableExperimentalWorkletSupport` off: expect 60 fps on
  recent devices at the medium preset; drop to `low` on older ones.

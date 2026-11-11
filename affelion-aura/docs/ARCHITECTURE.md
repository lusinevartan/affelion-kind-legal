# Architecture

## Flow

1. Onboarding (3 screens: what it is, what it measures, what it is not). Permissions are explained here and requested when the scan starts.
2. Scan (60–90 s, `src/core/scan/scanMachine.ts` + `src/features/scan/useScanSession.ts`):
   - Face (8 s of framed face): `AffelionSilhouetteView` runs the front camera, emits masks at 15 fps and face metrics; a still is captured after 2.5 s of steady framing. A neutral preview aura (derived through the same mapping from a resting input) is layered over the live feed so the user sees the fluid wrap their silhouette; the guidance says plainly that real colours arrive after the pulse reading.
   - Finger (30–40 s covered, max 90 s wall): `AffelionPpg` runs the rear camera with torch. Samples before exposure lock are discarded. The timer advances only while a fingertip actually covers the lens (`estimateCoverage`). Guidance reacts to saturation (press lighter), darkness (cover the flash too) and low quality (hold steadier).
   - Voice (5 s, min 2.5 s voiced, skippable): `AffelionAudio` streams PCM to `VoiceAnalyzer`.
   - Computing: `PpgProcessor.finish()` + `VoiceAnalyzer.finish()` → `mapBiometricsToAura()` → `ScanRecord` saved to SQLite.
3. Portrait teaser (free): Polaroid with the live aura, one grounded sentence, two tappable regions.
4. Soft paywall, only after a portrait exists. Plans: $8.99 monthly, $54 annual (recommended), $89 lifetime. Restore and manage/cancel are on the paywall and in Settings.
5. Pro: full breakdown (every colour tied to a measurement), history and trends, the guide, clean hi-res export, unlimited practice sessions with before/after portraits and the personal baseline. The first practice session is free so the live feedback is experienced before the paywall.

## Design system: Stage (`src/ui/theme.ts`)

The app is greyscale and the person's colour is the only colour. There are two fields. The
canvas is pale grey (#F0F0F0) with charcoal type (#2A2A2A), grey captions and one-pixel rules;
it holds words, numbers and actions. The stage is black; it holds the camera and every
portrait. One typeface, Inter Tight, mostly at weight 300, set large with tight tracking;
hierarchy comes from scale, never from a second family, a fill or a shadow. Actions are
capsules: solid charcoal on the canvas, solid white on the stage, a one-pixel outline for
secondary. Media is square-edged. There is no brand colour and no destructive red; a
destructive action is an outlined capsule with a confirmation.

A portrait is developed inside the fluid display pass (`AuraView` `stillUri`): the still is
converted to black and white, the room is dropped to the black stage using the silhouette, and
the aura is added as light with a screen blend, so it also spills onto the edge of the body.
The outline that belongs to a still is persisted with the scan (`scan_masks`) and restored at
launch, so a saved portrait always redraws around the same person. References: Josephmark and
Dash Digital, as catalogued on Refero. Screen captures from the web review build are in
`docs/screens/`; the person in them is a stock photograph (Unsplash licence) standing in for
the user's own still and must not be used in store listings or marketing.

## Biometric → colour engine (`src/core/color`)

`knowledgeBase.ts` is the single source of truth: the twenty specified entries verbatim.
`mapping.ts` implements the specified rules in order (greens/teals, reds/oranges, blues/indigos,
sky blue), refines the shade from secondary signals, applies the achromatic tones by their stated
biometric descriptions, and always returns `hue, saturation, lightness, turbulence, pulseSpeed,
primaryColorId` (plus `secondaryColorId`, `family`, `accentStrength`). Inputs are quantised (1 bpm,
1 ms, 1 Hz, 0.02 on the vocal scales) and the fluid seed is a hash of the quantised inputs, so
identical measurements produce identical portraits. Full rule tables: `docs/COLOR_SYSTEM.md`.

`explain.ts` builds every sentence from the knowledge base's own explanation text plus the user's
measured numbers, and asserts against a banned-phrase list; the same list guards AI replies.

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

Each stretch of continuous coverage is a segment, filtered and searched for beats on its own. A
break longer than 0.5 s starts a new segment; shorter flickers are bridged. So lifting the finger
never becomes a ramp in the signal or a beat that did not happen, and RMSSD and pNN50 only
difference intervals that were true neighbours. `recovery` (0..1) compares the first half of the
reading with the second; it is what lets lime green appear (see `docs/COLOR_SYSTEM.md`).

## Voice (`src/core/signal/voice.ts`, `modules/affelion-audio`)

1024-sample frames at 16 kHz, hop 512. Frames above a silence floor get a YIN pitch estimate
(65–500 Hz, threshold 0.15) and, when confident, a Hann-windowed FFT for the spectral centroid.
Aggregates: dominant (median) pitch in Hz, variance 0–1 (pitch spread in semitones and level
variation), stability 0–1 (frame-to-frame pitch jitter, level shimmer and voicing continuity),
plus the raw statistics, voiced ratio and quality. Nothing is transcribed or stored.

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

## Practice: live coherence feedback (`src/core/signal/coherence.ts`, `src/core/practice`, `src/features/practice`)

The one feature that turns the portrait from a snapshot into a mirror the user can act on.
After a scan, the user keeps a fingertip on the rear camera and breathes with a pacer at about
six breaths per minute (or their own rate, found by the resonance finder). Every 500 ms the PPG
beats feed `CoherenceAnalyzer`, which resamples the last 32 s of beat intervals at 4 Hz, detrends,
windows and FFTs them, and reports how much slow-band (0.04–0.26 Hz) power sits at one rhythm
(peak ÷ remainder, scored 0–1), the peak frequency, the respiratory sinus arrhythmia amplitude,
and a breathing-sync value against the pacer frequency. The same deterministic colour mapping is
applied to the sliding bpm/HRV window (`auraFromWindow`), coherence halves turbulence on top of
the family rule, and `blendAuraParams` eases the shader parameters so the portrait settles
visibly as the rhythm settles. `practiceMachine.ts` is a pure reducer: settle (needs 10 steady
beats) → breathe (timer advances only while the lens is covered) → done; the record keeps a
before window (first 5 s) and an after window (last 45 s), both rendered as Polaroids.

The resonance finder breathes four 45 s rounds at 6.5, 6, 5.5 and 5 breaths per minute and
keeps the rate with the largest heart wave; it becomes the user's default.

Honesty: the screen states that what is being trained is heart-rate variability and coherence,
measured from the fingertip. No other effect is claimed.

## Personal baseline (`src/core/insight/baseline.ts`)

Each scan is read against the median of the user's last seven scans (minimum three): HRV and
pulse deltas as percentages, and a Theil–Sen trend of HRV across the window. The trend is
presented with knowledge-base colours (lime for improving, emerald for steady, earth brown for
declining) as a display colour only; it never changes the portrait.

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

`usePolaroidExport` first snapshots the live aura GL view to a PNG with alpha
(`GLView.takeSnapshotAsync`), then renders an off-screen Polaroid at export width (480 free, 720
Pro, captured at device scale) with that PNG layered over the still, captures it with
`react-native-view-shot`, copies it to the document directory, and saves it with
`expo-media-library` or shares it with `expo-sharing`. The live GL surface is never captured
directly, which avoids SurfaceView capture failures on Android. Free exports carry the wordmark;
Pro exports are clean.

## Monetisation

`PurchaseProvider` interface in `src/services/entitlements.ts`. With `EXPO_PUBLIC_RC_IOS_KEY` /
`EXPO_PUBLIC_RC_ANDROID_KEY` set in the build, `RevenueCatPurchaseProvider`
(`src/services/purchases/revenueCat.ts`) reads the "pro" entitlement from the store, purchases the
package whose product id matches `PLANS[].productId`, restores, and opens the platform's
subscription management page. Without keys the `DevPurchaseProvider` simulates purchases locally
and the paywall says so, but only in development, in the web review build, or in a build that
sets `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES=1` (an internal test build). A release build that is
missing its keys grants nothing and the paywall button says purchases are unavailable. "Delete
all data" removes scans, photos, portraits, practice sessions and settings, and keeps the plan
and the free allowance already used. Store setup: three products (`com.affelion.aura.pro.monthly`, `.annual`,
`.lifetime`) in App Store Connect and Google Play, attached to a RevenueCat entitlement named `pro`
and a current offering.

## Sasha server (`server/sasha`)

A small Node service that holds the Anthropic API key, validates and rate-limits requests, sends
the app's knowledge-base system prompt (cached) plus the scan's numbers to Claude Opus 5.5 at low
effort with server-side refusal fallbacks, and filters the reply through the honesty rules. The
app points at it with `EXPO_PUBLIC_GUIDE_ENDPOINT` and, optionally, `EXPO_PUBLIC_GUIDE_TOKEN`.
It stores nothing; the app never sends images or audio.

The server owns the system prompt (`server/sasha/src/systemPrompt.ts`), generated from this
app's knowledge base by `npm run sync:guide-prompt`; a test fails if they drift. The app sends
only the scan's numbers and the conversation. A prompt sent by a client is ignored, because the
app's token ships inside the app and is public.

## Premium frames (`src/render/polaroid/styles.ts`)

Classic (free), Noir, Clean and Film. Styles change paper, margins and caption colour only; the
aura is never altered by a style, so every export remains a faithful translation of the numbers.

## Privacy

All processing is on-device. Stored: derived metrics, aura parameters, the still photo and its
outline, exported portraits. Never stored: raw camera frames, audio. The guide endpoint receives numbers and the
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
- Developed still in GL (`FluidSim.setStill`): on device the still is passed to `texImage2D` as
  `{ localUri }` with `UNPACK_FLIP_Y_WEBGL`. This path has only been exercised in the web review
  build. Check that the photograph is upright, that it lines up with the outline, and that the
  file URI scheme the scan saves is one expo-gl accepts. If the picture is inverted, drop the
  flip; if it does not load, the portrait falls back to the aura on an empty stage.
- Hermes `requestAnimationFrame` pacing with `enableExperimentalWorkletSupport` off: expect 60 fps on
  recent devices at the medium preset; drop to `low` on older ones.

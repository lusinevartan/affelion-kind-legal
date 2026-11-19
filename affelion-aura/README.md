# Affelion Aura

A premium biometric visualizer for iOS and Android. It measures heart rate and heart-rate
variability from a fingertip on the rear camera (torch on), analyses a few seconds of voice for
pitch and variation, and translates those numbers into a living fluid-dynamics color field that
wraps the user's silhouette. The result is a soft, glowing Polaroid-style portrait.

After a scan, a guided breathing practice keeps the finger on the camera and lets the portrait
respond live to heart-rhythm coherence, with before-and-after portraits from the same session and
a personal baseline across scans. It does not claim to capture anything invisible. Every color maps to a measured number, the same
numbers always produce the same portrait, and all copy (including AI responses) is checked against
an honesty rule set. It is not a medical device.

## Reviewing it

- **Screens:** `docs/screens/` holds a capture of every screen from the web review build, plus
  the twenty-color sheet. The person in them is a stock photograph standing in for your own.
- **Click through it in a browser:** `npx expo export --platform web --output-dir /tmp/aura-web`,
  then `npx serve -s /tmp/aura-web` and open it at phone width. In the browser console run
  `localStorage.setItem('aura.demo','1')` (add `aura.pro` = `1` for the Pro screens) and reload.
  The camera, flash and microphone steps need a phone, so the scan itself cannot run there.
- **On your phone:** `npx eas-cli@latest build --profile development --platform ios` (or
  `android`), install the build, then `npx expo start --dev-client`. This is the only way to
  check the scan, the practice and the real portrait. `docs/ARCHITECTURE.md` lists what to look
  at on the first run.
- **What is not verified:** nothing has run on a physical device. The native camera, flash,
  microphone and segmentation modules, purchases against the stores, and the Sasha server
  against a live key are untested outside this repository's unit tests and bundles.

## Shipping it

- `docs/HANDOFF.md`: where everything is, what is finished, what is not, and the open decisions.
- `docs/LAUNCH.md`: the ordered steps from this repository to a live, paid app.
- `docs/STORE_LISTING.md`: listing text, privacy answers and review notes, ready to paste.

## Stack

- Expo SDK 58 / React Native 0.88 / React 19, TypeScript strict, Expo Router.
- Design system "Stage": a grayscale app (pale gray canvas, charcoal type, one typeface) around a black stage where each portrait is developed in black and white with the aura as the only color (`src/ui/theme.ts`, `src/render/fluid`).
- Three local Expo modules (Swift + Kotlin) in `modules/`:
  - `affelion-ppg`: rear camera + torch photoplethysmography (AVFoundation / Camera2), locked exposure, per-frame mean RGB.
  - `affelion-silhouette`: front-camera preview with person segmentation and face metrics (ARKit + Vision on iOS, CameraX + ML Kit on Android). Emits 8-bit masks in display orientation.
  - `affelion-audio`: 16 kHz mono float PCM stream (AVAudioEngine / AudioRecord). Nothing is written to disk.
- `expo-gl` running a WebGL fluid simulation (`src/render/fluid`) composited over the camera still and masked to the silhouette. The same code renders in a browser harness for verification.
- Signal processing, mapping and copy are pure TypeScript with unit tests (`npm test`).

## Layout

```
src/
  core/        color knowledge base, deterministic mapping, explanations, signal processing (PPG, voice, coherence),
               scan and practice state machines, personal baseline
  render/      fluid simulation (GLSL + engine), AuraView (expo-gl), Polaroid card
  features/    scan orchestration (native modules → processors → record), app store, history widgets
  services/    SQLite storage, entitlements/purchases, grounded AI guide (Sasha), export
  ui/          design tokens and components
  app/         Expo Router screens (onboarding → home → scan → portrait → paywall → report/history/guide/practice/how/settings)
modules/       local Expo native modules (ios/, android/, src/)
web-harness/   browser harness that renders the shader with esbuild + Playwright
docs/          architecture, color system, reference renders
```

## Commands

```bash
npm install
npm test                 # unit tests: mapping rules, PPG, voice, coherence, scan and practice machines, baseline, guide guardrails
npm run typecheck        # tsc --noEmit
npm run harness:build && npm run harness:shot   # reference renders → docs/renders
npx expo export --platform web --output-dir /tmp/aura-web   # design review build; serve it and set
                          # localStorage aura.demo=1 (and aura.pro=1) for seeded screens
npx expo prebuild --clean
npx expo run:ios         # development build (native modules require a dev build, not Expo Go)
npx expo run:android
```

Build-time environment (EAS secrets or `.env`):

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES` | Set to `1` only for an internal test build without store keys; release builds must not set it |
| `EXPO_PUBLIC_GUIDE_ENDPOINT` | URL of the Sasha server (`server/sasha`); without it the guide answers from grounded local templates |
| `EXPO_PUBLIC_GUIDE_TOKEN` | Optional shared secret the Sasha server expects as a Bearer header |
| `EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY` | RevenueCat public SDK keys; without them purchases are simulated and the paywall says so |
| `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_SUPPORT_URL`, `EXPO_PUBLIC_TERMS_URL` | Optional. Addresses of the privacy, support and terms pages linked from the paywall and Settings (`src/services/links.ts` holds the defaults) |

`eas.json` has development, preview and production profiles.

## Status

What is verified in this repository: the engine and signal processing (95 unit tests), the
shader and fluid simulation (rendered in headless Chromium; see `docs/renders`), and the TypeScript
build of the whole app including native module bindings.

What needs a device: the Swift and Kotlin modules compile only inside an iOS/Android build and
have not been run on hardware yet. `docs/ARCHITECTURE.md` lists the specific items to confirm on
first device run (camera orientation constants, torch level, segmentation throughput, GL
transparency on Android).

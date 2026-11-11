# Affelion Aura

A premium biometric visualiser for iOS and Android. It measures heart rate and heart-rate
variability from a fingertip on the rear camera (torch on), analyses a few seconds of voice for
pitch and variation, and translates those numbers into a living fluid-dynamics colour field that
wraps the user's silhouette. The result is a soft, glowing Polaroid-style portrait.

After a scan, a guided breathing practice keeps the finger on the camera and lets the portrait
respond live to heart-rhythm coherence, with before-and-after portraits from the same session and
a personal baseline across scans. It does not claim to capture anything invisible. Every colour maps to a measured number, the same
numbers always produce the same portrait, and all copy (including AI responses) is checked against
an honesty rule set. It is not a medical device.

## Stack

- Expo SDK 58 / React Native 0.88 / React 19, TypeScript strict, Expo Router.
- Three local Expo modules (Swift + Kotlin) in `modules/`:
  - `affelion-ppg`: rear camera + torch photoplethysmography (AVFoundation / Camera2), locked exposure, per-frame mean RGB.
  - `affelion-silhouette`: front-camera preview with person segmentation and face metrics (ARKit + Vision on iOS, CameraX + ML Kit on Android). Emits 8-bit masks in display orientation.
  - `affelion-audio`: 16 kHz mono float PCM stream (AVAudioEngine / AudioRecord). Nothing is written to disk.
- `expo-gl` running a WebGL fluid simulation (`src/render/fluid`) composited over the camera still and masked to the silhouette. The same code renders in a browser harness for verification.
- Signal processing, mapping and copy are pure TypeScript with unit tests (`npm test`).

## Layout

```
src/
  core/        colour knowledge base, deterministic mapping, explanations, signal processing (PPG, voice, coherence),
               scan and practice state machines, personal baseline
  render/      fluid simulation (GLSL + engine), AuraView (expo-gl), Polaroid card
  features/    scan orchestration (native modules → processors → record), app store, history widgets
  services/    SQLite storage, entitlements/purchases, grounded AI guide, export
  ui/          design tokens and components
  app/         Expo Router screens (onboarding → home → scan → portrait → paywall → report/history/guide/settings)
modules/       local Expo native modules (ios/, android/, src/)
web-harness/   browser harness that renders the shader with esbuild + Playwright
docs/          architecture, colour system, reference renders
```

## Commands

```bash
npm install
npm test                 # unit tests: mapping rules, PPG, voice, coherence, scan and practice machines, baseline, guide guardrails
npm run typecheck        # tsc --noEmit
npm run harness:build && npm run harness:shot   # reference renders → docs/renders
npx expo prebuild --clean
npx expo run:ios         # development build (native modules require a dev build, not Expo Go)
npx expo run:android
```

The AI guide calls `EXPO_PUBLIC_GUIDE_ENDPOINT` (a server you own that holds the model key and
applies the system prompt in `src/services/ai/guide.ts`). Without it, the guide answers from grounded
local templates.

## Status

What is verified in this repository: the engine and signal processing (71 unit tests), the
shader and fluid simulation (rendered in headless Chromium; see `docs/renders`), and the TypeScript
build of the whole app including native module bindings.

What needs a device: the Swift and Kotlin modules compile only inside an iOS/Android build and
have not been run on hardware yet. `docs/ARCHITECTURE.md` lists the specific items to confirm on
first device run (camera orientation constants, torch level, segmentation throughput, GL
transparency on Android).

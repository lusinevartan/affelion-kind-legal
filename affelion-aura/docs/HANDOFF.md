# Handoff

For whoever picks this up next. Read this, then `docs/LAUNCH.md`.

## What this is

Affelion Halo is an iPhone and Android app (Expo SDK 58, React Native 0.88, TypeScript). In one
minute it reads pulse from a fingertip on the rear camera, analyzes a few seconds of voice,
takes a portrait, and turns the measurements into one of twenty colors moving around the person.
A breathing practice then shows the color changing live. It is honest about what it is: a
visual translation of measured numbers, not a camera for invisible things and not a medical
device.

## State in one paragraph

The app is feature complete in code and has never run on a physical phone. Type check, lint and
98 unit tests pass; iOS, Android and web bundles build. The three native modules (pulse, outline,
microphone), store purchases and the Sasha server have not been exercised on real hardware or
against live accounts. First device run is the gate to everything else.

## Where things are

| What | Where |
| --- | --- |
| The app | `affelion-aura/` |
| Screens (Expo Router) | `affelion-aura/src/app/` |
| Color rules and the 20-color knowledge base (single source of truth, do not reword) | `affelion-aura/src/core/color/` |
| Pulse, voice and coherence processing | `affelion-aura/src/core/signal/` |
| The moving color field (WebGL) | `affelion-aura/src/render/fluid/` |
| Native modules (Swift and Kotlin) | `affelion-aura/modules/` |
| Prices, plans, purchases | `affelion-aura/src/services/entitlements.ts`, `src/services/purchases/` |
| Sasha, the guide (app side) | `affelion-aura/src/services/ai/guide.ts`, `src/features/guide/` |
| Sasha server (optional, not deployed) | `server/sasha/` |
| Design system "Stage" | `affelion-aura/src/ui/theme.ts`, `src/ui/components/` |
| Tests | `affelion-aura/__tests__/` |
| Architecture, color system, first-device checklist | `affelion-aura/docs/ARCHITECTURE.md`, `docs/COLOR_SYSTEM.md` |
| Launch steps, store text | `affelion-aura/docs/LAUNCH.md`, `docs/STORE_LISTING.md` |
| Every screen as an image, and all twenty colors | `affelion-aura/docs/screens/` |
| Privacy and support pages | `aura-privacy.html`, `aura-support.html` at the repository root |

## Run it

```bash
cd affelion-aura
npm install
npm run typecheck && npm run lint && npm test
npx expo export --platform web --output-dir /tmp/aura-web   # click-through review build
npx eas-cli@latest build --profile development --platform ios   # the real thing, on a phone
```

The scan needs a phone: camera, flash and microphone do not exist in the browser build.

## Rules that must survive any change

1. **Honesty.** The app never claims to see energy, predict, diagnose or treat. All copy,
   including Sasha's replies, passes the honesty checks in `src/services/ai/` and
   `server/sasha/src/honesty.ts`. Tests enforce this.
2. **Deterministic color.** The same measurements always give the same color. All twenty colors
   must stay reachable; a test fails otherwise.
3. **Grayscale app, color only from the aura.** One typeface (Inter Tight), no brand color.
4. **On-device by default.** Frames and audio are processed on the phone and discarded.
5. **Plain American English at a high school reading level** in everything the user reads.
   The app's word list: "main color" and "outer color", "heartbeat variation" (not HRV),
   "steady rhythm" (not coherence), "your usual" (not baseline), "how much your voice moved"
   (not vocal variance). The original color descriptions stay in the code as the specification;
   people read the plain versions beside them (`PLAIN_WORDS` in `knowledgeBase.ts`). A test
   (`__tests__/plainWords.test.ts`) fails if technical terms or long sentences come back.
6. **Sasha says she is an AI** in her first message and in Settings. Removing that needs legal
   advice first (EU transparency rules).

## Business model as built

First scan free, then one free scan a week, plus one free practice. Halo Pro: $12.99 a month, $69.99 a year (shown as
$5.83 a month, marked best value), $199 lifetime (hidden behind "Prefer to pay once?"). The paywall,
titled "Keep your Halo", opens once by itself two seconds after a free person's first portrait.
A reading with a shaky signal or a pulse outside 40 to 140 is not saved and does not use the free
scan (`src/core/scan/readingGate.ts`). "Share my color" makes a 9:16 story card
(`src/render/polaroid/StoryCard.tsx`), with the app name on it for free users. Product IDs are in `entitlements.ts`. A free
trial is supported but off until one is added to a product in the store (`src/services/trial.ts`;
the app shows a trial only when the store offers one to that person). The
RevenueCat entitlement must be named `pro`. Free-use counters and the entitlement survive
"Delete all data" on purpose, so deleting data does not reset the free week.

Rough math for the owner's target: the stores keep 15 to 30 percent, so an annual subscriber
brings in about $4 to $5 a month. $15,000 a month therefore needs roughly 3,000 to 3,700 active
annual subscribers, and $50,000 a month roughly 10,000 to 12,000.

## Open decisions (owner)

1. The app's final name.
2. Approve or remove the three added color rules (lime, magenta, golden yellow). See
   `docs/COLOR_SYSTEM.md`.
3. Whether to credit the friend who inspired Sasha, with her consent.
4. The app icon (the original dark corona is in `assets/`; direction on hold).
5. When the paywall appears (now: once by itself, two seconds after the first portrait).
6. A gentler line for a dim first portrait.
7. Move the app source out of this repository, which also hosts public legal pages.
8. Read the plain versions of the twenty color descriptions (`PLAIN_WORDS`) and adjust any
   wording you would say differently. They restate the original brief; they do not add to it.

## Known gaps

- No device testing of any kind.
- No store products, no RevenueCat project, no keys.
- Sasha server not deployed. Without it Sasha answers from built-in text, which is the
  recommended setup for 1.0. Turning the server on later needs an in-app consent step.
- Store screenshots, the feature graphic and store icons exist as a separate kit (not in this
  public repository). They show the real app with a generated, fictional model.
- The privacy and support pages still say "Draft, not yet published".
- No analytics or crash reporting. Add crash reporting before a wide release.

## Marketing material

Instagram teaser reels are delivered separately from this repository, because they contain the
owner's photographs and this repository is public. They are renderings: the colors and names
come from the app's real rules, the moments are staged and labeled "Reenactment".

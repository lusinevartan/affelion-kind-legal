# Launch runbook

The shortest path from this repository to a live app that takes payment. Steps are in order.
Each one says who can do it and what it needs. Nothing here has been run yet: the app has never
been installed on a physical phone, and that first install is the real gate.

**Recommended scope for version 1.0:** iPhone only, Sasha answering from the app's built-in
answers (no server). Both choices remove setup and review risk without removing anything a
buyer sees on day one. Android and the Sasha server follow in 1.1.

## 0. Decisions the owner makes first

| Decision | Why it blocks | Default if nothing is decided |
| --- | --- | --- |
| App name | The store name and bundle name are set at first submission | "Affelion Halo" (what `app.json` says now) |
| The three color rules added for lime, magenta and golden yellow | They are not in the original knowledge base rules (`docs/COLOR_SYSTEM.md`) | Ship as built |
| Sasha's likeness and name | A friend named Sascha inspired her; the portrait is a generated image | Ship as built, no credit |
| Prices | Set once in the stores | $12.99 a month, $69.99 a year, $199 lifetime |

## 1. Accounts (owner, about an hour, plus Apple's approval wait)

1. Apple Developer Program, $99 a year. Enrollment approval can take a day or two.
2. An Expo account (free) for EAS builds.
3. A RevenueCat account (free until revenue passes their threshold).
4. In App Store Connect: accept the Paid Apps agreement and fill in banking and tax. Purchases
   do not work, even in testing, until this is complete.

## 2. First build on a real iPhone (developer, the main risk)

```bash
cd affelion-aura
npm install
npx eas-cli@latest login
npx eas-cli@latest init          # links this code to the owner's Expo account, once
npx eas-cli@latest build --profile development --platform ios
# install the build on the phone, then:
npx expo start --dev-client
```

Work through "To verify on first device run" in `docs/ARCHITECTURE.md`. Expect fixes here: the
three native modules in `modules/` (pulse reading, outline, microphone) compile only inside a
device build and have never run on hardware. Budget days, not hours. Do not go on until one full
scan, one practice session, one saved portrait and one export work on at least two iPhone models.

## 3. Purchases (developer with the owner's accounts, half a day)

1. App Store Connect, the app, Subscriptions: create a group "Affelion Halo Pro" with
   `com.affelion.aura.pro.monthly` ($12.99) and `com.affelion.aura.pro.annual` ($69.99).
2. In-App Purchases: create a non-consumable `com.affelion.aura.pro.lifetime` ($199).
3. RevenueCat: add the app, import the three products, create an entitlement named exactly
   `halo_pro`, attach all three products, and put them in the offering `halo_default` as `$rc_annual`, `$rc_monthly`, `$rc_lifetime` (the project is shared with other Affelion apps, so Halo never uses the project's current offering).
4. Put the RevenueCat iOS public key in the build: `npx eas-cli@latest env:create` for
   `EXPO_PUBLIC_RC_IOS_KEY` (production and preview).
5. **Free trial (recommended).** On the annual subscription in App Store Connect, add an
   introductory offer of type "Free" for one week. Nothing else is needed: the paywall then shows
   "7 days free, then $69.99 per year" and the button reads "Start 7-day free trial", only for
   people the store says are eligible. Remove the offer in the store and the app goes back to
   the plain price. A trial is the usual way subscription apps lift the share of people who
   start paying, at the cost of some who cancel inside the week.
6. Test with a sandbox Apple account on a preview build: buy each plan, start and cancel the
   trial, restore, cancel.

Never set `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES` on a production build. Without store keys a
release build shows "Purchases are not available in this build" and takes no money.

## 4. Pages the store requires (owner, minutes)

- `aura-privacy.html` and `aura-support.html` sit at the root of this repository. They are
  served only from the default branch, so they go live when this work is merged. Remove the
  words "Draft, not yet published" from both before submitting.
- The paywall and Settings link to them and to Apple's standard terms (`src/services/links.ts`).
  If the pages move, set `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_SUPPORT_URL`.

## 5. Store listing (owner and developer, half a day)

Everything to paste is in `docs/STORE_LISTING.md`. The screenshots, feature graphic and icons
are in the separate store kit: App Store 6.9-inch at 1320 × 2868, Google Play phone at
1080 × 1920, the 1024 × 500 feature graphic, and 1024 and 512 icons. They show the real app
with a generated, fictional model; nothing in them is a real customer.

## 6. Submit

```bash
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --profile production --platform ios
```

Attach the subscriptions and the lifetime purchase to the version in App Store Connect, paste the
review notes, and submit. First reviews commonly come back with questions; answer them the same
day.

## 7. After 1.0

- **Android:** Google Play account ($25 once), the same three products in Play Console,
  `EXPO_PUBLIC_RC_ANDROID_KEY`, device testing on two or three Android phones. New personal
  Play accounts must run a closed test with testers before going public, so start that early.
- **Sasha server:** deploy `server/sasha` (see its README), set `EXPO_PUBLIC_GUIDE_ENDPOINT`.
  Before turning it on, add an in-app consent step: Apple requires clear permission before
  personal data is sent to a third-party AI service, and scan numbers count. Update the
  privacy page and the App Privacy answers at the same time.
- **Revenue levers not built yet:** sharing the first portrait before the paywall, and a
  one-time single-report purchase. (The free trial is built; see step 3.)

## Honest timeline

With one developer who has shipped an Expo app before, and the owner answering account prompts
quickly: about one to two weeks to a build in App Review, mostly spent on step 2. Review itself
usually takes one to three days. None of this can be compressed by skipping device testing.

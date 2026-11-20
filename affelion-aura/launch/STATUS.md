# Affelion Halo — Launch Status

**Goal:** submit iPhone 1.0 as soon as the 11 must-haves pass.
> **Renamed Nov 20: the app is now Affelion Halo** (Lusine's decision). Changed in every screen, the paywall ("Keep your Halo", "Halo Pro"), permission text, listing, Review Notes, policies, docs, Sasha, store art and deck. Kept on purpose, because nobody sees them and changing them costs setup: bundle ID `com.affelion.aura`, product IDs `com.affelion.aura.pro.*`, the `affelion-aura/` folder and internal code names. **Before the listing goes live:** check the name. Amazon filed "HALO" for health services and devices (USPTO serial 90480178), and other companies hold health-related HALO marks. See Needs Lusine.

**Current phase:** Must-have before submit (code side done for M2–M8; waiting on builds, device test and pages)
**Last updated by:** Claude, Nov 20, 2026 (branch `claude/affelion-aura-app-idarxq`, PR #5)

> Claude ticks an item only when every acceptance criterion in `CLAUDE-HALO-LAUNCH.md` section 2 is met, and adds evidence below it.

---

## Needs Lusine (only you can do these)

Claude will add exact step-by-step instructions next to each item.

- [x] ~~Agreements, tax, banking, Small Business Program~~ Already active on the Affelion LLC Apple and Google accounts (confirmed by Lusine, Nov 20). Nothing new for Halo.
- [ ] **App record (Halo only).** The iOS record exists (App Store Connect app ID 6817953783). Check it has bundle ID `com.affelion.aura`, primary language English (U.S.), SKU of your choice. For Google, Play Console → **Create app** → name Affelion Halo, default language English (United States), App, Free (it has in-app purchases), accept the declarations for this app only.
- [ ] **Approve pricing and create/approve live products:** annual $69.99 with 7-day free trial, monthly $12.99, lifetime $199 (M2)
  The IDs below are the ones in the app's code. Type them exactly; a single wrong character means the button can't buy.
  1. App Store Connect → Apps → Affelion Halo → **Monetization → Subscriptions** → create group **Halo Pro**.
  2. In that group, create **`com.affelion.aura.pro.annual`**. Reference name: Halo Pro Annual. Duration: 1 year. Price: **$69.99** (USD base; let Apple fill other countries). Localization (English US): display name **Halo Pro – Yearly**, description **Unlimited check-ins, breakdown, history and Sasha**.
  3. On that annual product: **Subscription Prices → Introductory Offers → +** → all countries, type **Free**, duration **1 week**, no end date.
  4. In the same group, create **`com.affelion.aura.pro.monthly`**. Reference name: Halo Pro Monthly. Duration: 1 month. Price: **$12.99**. No introductory offer. Display name **Halo Pro – Monthly**, description **Unlimited check-ins, breakdown, history and Sasha**.
  5. Put annual at level 1 and monthly at level 2 in the group (higher level = more value), so switching between them is handled as an upgrade or downgrade.
  6. **Monetization → In-App Purchases → +** → type **Non-Consumable**, product ID **`com.affelion.aura.pro.lifetime`**, reference name Halo Pro Lifetime, price **$199**, display name **Halo Pro – Lifetime**, description **Every Pro feature, one payment, no renewal**.
  7. Each product needs a **Review screenshot**: use `launch/review/paywall-review.png` (Claude adds it under M11) and the review note "Shown on the paywall after the first portrait."
  8. RevenueCat (free tier, no card needed): create project Affelion Halo → add the iOS app (bundle ID from `app.json`) → upload the App Store Connect in-app purchase key it asks for → **Products**: import the three IDs → **Entitlements**: create **`pro`** and attach all three → **Offerings**: the offering **`default`** with packages **Annual**, **Monthly**, **Lifetime**, each pointing at its product → mark it **Current**.
  9. Copy the RevenueCat **Apple public SDK key** (starts with `appl_`) and send it to Claude, or add it yourself: `npx eas-cli@latest env:create --name EXPO_PUBLIC_RC_IOS_KEY --value appl_... --environment production --environment preview`. The public key is safe in the app; it is not a secret.
  10. When you upload the 1.0 build, open the version page → **In-App Purchases and Subscriptions** → **+** → select all three, so they are reviewed with the app.
- [ ] **Fill in the App Store listing and upload screenshots (M11).** App Store Connect → Affelion Halo → version 1.0:
  1. **Previews and Screenshots** → iPhone 6.9" → drag in the 7 files from `store/screenshots/app-store-6.9/` in order 1 to 7. Then 6.5" → the 7 files from `app-store-6.5/`. No iPad.
  2. **Promotional Text, Description, Keywords, Support URL, Marketing URL**: paste from `launch/APP-STORE-LISTING.md` §1 and §2. "Aura" appears only once, in the description, as the trend; never in the name, subtitle, promotional text or keywords.
  3. **App Information**: Name **Affelion Halo – Color Check-In**, Subtitle **Your heartbeat, in color**, Primary category **Lifestyle**, Secondary **Health & Fitness**, Privacy Policy URL https://www.affelion.com/halo/privacy.
  4. **App Review Information**: Sign-in required **off**; paste `docs/store/review-notes.md`; add your contact details.
  5. **Version Release**: choose **Manually release this version**.
  6. Google Play later: upload `google-play/phone/` (7), `feature-graphic-1024x500.png` and `icon-512.png`; text from `docs/store/play-listing.md`.
- [ ] **Pick the app icon.** Options are in "Affelion Halo - icon options.png" (sent in chat). Claude recommends **C, Two lights**: two crisp overlapping rings in magenta and violet with a gold beat, flat like the rest of the family and a cousin of Kind's overlap. The app still ships the original dark corona until you choose. Variant (variant.com) needs your sign-in, so Claude couldn't use it; a ready prompt is in "Affelion Halo - Variant prompt.txt" if you want to generate more there. Tell Claude the pick (or send a Variant export as a 1024 PNG) and Claude will make the iOS, Android adaptive and store icons from it.
- [ ] **Protect the name (see `launch/NAME-CHECK.md`).** "Affelion Halo – Color Check-In" is free as an App Store name; "Halo" alone is crowded (Microsoft; Amazon's pending wellness application; Solera and Centene in wellness). Steps: (1) reserve the name now: App Store Connect → Affelion Halo → App Information → Name → **Affelion Halo – Color Check-In** → Save; Play Console → Create app with the same name. (2) Optional, about $350 per class in USPTO fees, so it needs your OK: a trademark attorney's knock-out search, or file **AFFELION HALO** in class 9 (and maybe 44). Rule for all art and posts: always "Affelion Halo", never "Halo" alone; the store art already pairs the two.
- [ ] **First builds (item 11, about 30 minutes of your time, then EAS works for 20–40 minutes).** This session isn't logged in to Expo and the project isn't linked yet, so Claude can't start a build. On your computer, in the `affelion-aura` folder of this repo (branch `claude/affelion-aura-app-idarxq`):
  1. `npx eas-cli@latest login` (your Expo account; free plan is fine, and the free plan includes a monthly allowance of builds; if EAS ever asks for payment, stop and tell Claude).
  2. `npx eas-cli@latest init` → choose your Expo account → it writes `extra.eas.projectId` into `app.json`. Commit that change (or send it to Claude).
  3. Add the RevenueCat public keys (M2 step 9): `npx eas-cli@latest env:create --name EXPO_PUBLIC_RC_IOS_KEY --value appl_XXXX --environment production --environment preview --visibility plaintext`, and the same with `EXPO_PUBLIC_RC_ANDROID_KEY` and the `goog_` key once Android is set up.
  4. `npx eas-cli@latest build --platform ios --profile production`. When asked, sign in with the Apple ID of the Affelion LLC developer account and let EAS create the distribution certificate and provisioning profile (free, part of your developer membership). Version is 1.0.0; the build number is counted up by EAS automatically.
  5. When it finishes: `npx eas-cli@latest submit --platform ios --profile production --latest`. This only **uploads to TestFlight**; it does not send anything to App Review. In App Store Connect → TestFlight, add yourself as an internal tester and install it on your iPhone.
  6. Android: `npx eas-cli@latest build --platform android --profile production` gives an `.aab`. Google requires the very first upload by hand: Play Console → Affelion Halo → Testing → **Internal testing** → Create release → upload the `.aab` → add yourself as a tester. Later uploads can use `eas submit`.
  7. Tell Claude the build numbers. Claude can then take over builds if you add an `EXPO_TOKEN` (Expo → Account settings → Access tokens) to this environment's secrets.
- [ ] **Real-iPhone test, about 15 minutes per phone (M9).** Needs the TestFlight build. Use at least 3 iPhones: one older (iPhone 11 to 13 or SE 2nd/3rd gen), one recent (15 or newer), one in between. Borrow from friends; don't buy any. For each phone, fresh install, then:
  1. **Good scan:** sitting, warm hands, elbow on the table. Time it from Begin scan to the portrait. Expect about a minute and a portrait.
  2. **Finger lifted:** at the fingertip step, lift your finger halfway through. Expect guidance ("Cover the rear camera") and, if it can't recover, "Let's try that again" with one tip. No portrait from the bad part.
  3. **Moving:** keep the finger on but wiggle the phone the whole time. Expect "Hold steadier" after about 15 seconds, then either a portrait from the steady part or "We couldn't get a clear reading."
  4. **Flash half uncovered:** cover only the lens. Expect "Cover the flash too."
  5. **Dark room / cold fingers:** lights off, or hands cooled under cold water. Expect a slower lock or the retry line, never a crash.
  6. **Silent voice:** say nothing at the voice step. Expect "Voice sample too quiet" with **Try again** and **Skip voice**; skipping still gives a portrait.
  7. **Free check-in not used by a failure:** on a fresh install, cause a failure first (step 2), then do a good scan. Expect the good scan to be your free one (Home shows the next free scan a week later, not "used" twice).
  8. **Permissions:** in iPhone Settings → Affelion Halo, turn the camera off, open Begin scan. Expect "Camera access is needed" with **Open Settings**.
  9. Fill one row per phone in the **Real-device test log** below (device, iOS version, pass/fail per column), or send Claude a note and Claude fills it in. Screen-record anything that fails.
- [ ] **Sandbox purchase test, about 15 minutes, on a TestFlight build (M3).** Needs M2 done and the RevenueCat key in the build.
  1. iPhone Settings → App Store → scroll to **Sandbox Account** → sign in with a sandbox tester (create one in App Store Connect → Users and Access → Sandbox → Testers; any new email works).
  2. Install the TestFlight build. Do one scan. The paywall opens two seconds after the portrait. Tap **Start 7-day free trial**, confirm. Expect: Pro unlocks (the breakdown opens). Sandbox trials last minutes, not days.
  3. Delete the app, reinstall from TestFlight, open Settings in the app → **Restore**. Expect "Restored, Pro is active".
  4. In iPhone Settings → App Store → Sandbox Account → Manage → cancel the subscription. Wait for it to end (a sandbox year is about an hour; a sandbox month is about five minutes). Leave the app and come back. Expect: Pro is locked again (Home shows the free-scan line).
  5. With a second sandbox tester, buy **Monthly**. Expect: Pro unlocks.
  6. Turn on Airplane Mode, delete and reinstall, open the paywall. Expect: "We could not load prices" with **Try again**, no crash, no blank screen. Turn Airplane Mode off, tap Try again, prices appear.
  7. Write pass or fail for each step in the M3 row, or tell Claude.
- [ ] **Publish three pages on affelion.com (M10).** Today all three return 404.
  1. Read and edit `docs/store/privacy-policy.md`, `docs/store/terms.md` (fill in [STATE] and the date; a lawyer's read is worth it) and `docs/store/support.md`.
  2. In your website builder, create three normal pages (not PDFs) at exactly **affelion.com/halo/privacy**, **affelion.com/halo/terms** and **affelion.com/halo/support**, and paste each one in.
  3. Publish, then open each address in a private browser window to check it loads. Tell Claude, who will re-check them (must return 200) and tick M10.
- [ ] **Enter the App Privacy and age rating answers (M10).** App Store Connect → Affelion Halo → **App Privacy** → Get Started → use `docs/store/app-privacy.md` (one data type: Purchase History, not linked, not tracking, for App Functionality and Analytics) → Publish. Then **App Information → Age Rating → Edit** → use `docs/store/age-rating.md` (only "Health or wellness topics" is Yes; expected 9+). Set the **Privacy Policy URL** in App Information to https://www.affelion.com/halo/privacy.
- [ ] **Enter or approve** App Privacy and age rating answers in App Store Connect (M10)
- [ ] **Record or approve** the 60-second scan video for Review Notes (M11)
- [ ] **Hold the test phones** for the real-device test script, if Claude can't run on devices (M9)
- [ ] **Submit** iPhone 1.0 for review and **press Release** after approval
- [ ] **Reply to App Review** if rejected (Claude drafts the reply)
- [ ] **Approve any spending:** ads (cap $300), paid tools, creators, devices
- [ ] **Approve any live pricing change:** hiding lifetime, free-tier change, Keepsake price, offer codes, win-back offers, price tests
- [ ] **Approve or post** any social post, creator or press message (Claude drafts)

---

## Must-have before submit (iPhone 1.0)

| # | Item | Blocks | Status | Evidence / notes |
|---|---|---|---|---|
| M1 | Apple agreements + Small Business Program | Revenue | Done | Already active on the Affelion LLC accounts (Lusine, Nov 20). |
| M2 | Subscription products + 7-day trial in App Store Connect, attached to build | Revenue + Review | Needs Lusine | Spec written under Needs Lusine. Code IDs `com.affelion.aura.pro.annual / .monthly / .lifetime`, entitlement `pro`; locked by `__tests__/products.test.ts` so code can't drift from the store. Done when the three products show Ready to Submit and are attached to 1.0. |
| M3 | RevenueCat wired; buy / restore / cancel tested in Sandbox/TestFlight | Revenue | Code done, sandbox test Needs Lusine | Purchases go through RevenueCat when `EXPO_PUBLIC_RC_IOS_KEY` is in the build (M2 step 9); entitlement `pro`; offering `default`, falling back to any offering that lists the product. Restore needs no account. Added: Pro is re-checked with the store whenever the app comes back to the front, so an expired subscription locks without a restart (d). In a store build the paywall never shows built-in prices: offline it says "We could not load prices" with Try again, and the buy button is disabled (e). Gating tests in `__tests__/gating.test.ts` (access rules, store answer to Pro, price status). 120 tests pass. Simulated purchases are off in Release unless `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES=1`, which is not set in `eas.json`. Not yet run on a device: (a)–(e) in sandbox. |
| M4 | Paywall shows price, period, trial terms, Restore, Terms, Privacy, close button | Review | Done in code, confirm on device | Headline "Keep your Halo" and the four benefit lines from APP-STORE-LISTING.md §5. Each plan shows the store's price and period ("$69.99 · $5.83 / month", "$12.99 · per month"); store builds list only what the store returns. Trial line "7 days free, then $69.99 per year. Cancel anytime in Settings." Button "Start my free week" (or "Continue" without a trial). Renewal terms at body size, not caption: charged to Apple ID when the trial ends unless canceled 24 hours before, renews automatically, cancel anytime in Settings. **Restore Purchases**, Manage or cancel, **Terms of Use**, **Privacy Policy**. Close: "Not now ✕" top right, 44 pt target. Tests: `__tests__/paywall.test.tsx` (9), `__tests__/restore.test.ts` (3). |
| M5 | Paywall appears in the first session | Revenue | Done in code, confirm on device | Opens once by itself two seconds after a free person's first portrait; "Not now" goes back to that portrait (falls back to opening it if there is no back). Never opened by the scan screen. Tests: `__tests__/paywallTiming.test.tsx` (3). 135 tests pass. |
| M6 | Test/placeholder text removed from Release build | Review | Done | Searched `src/` and `modules/` for test build, purchases simulated, no payment taken, lorem, TODO, placeholder, debug, FIXME. The only user-facing hit is the paywall line "Test build · purchases simulated · no payment taken", which appears only when purchases are simulated: never in Release (simulation needs a dev build or `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES=1`, which no EAS profile sets), and now never in the web review build used for screenshots. Demo signals (`aura.demo`) exist only in the web stand-in modules; the story preview route sends a phone straight home. Locked by `__tests__/release.test.ts` (4). "placeholder" hits are the guide's input hint and code comments, not shown text. |
| M7 | Wording pass + disclaimer (`wording-audit.md`) | Review | Done | `launch/wording-audit.md` lists every change (20 strings across app, Sasha, listing, support page, old listing doc, deck). The exact disclaimer (`src/core/disclaimer.ts`) is on the portrait, the full breakdown, How it works and Settings → About, and matches the listing; pulse is labeled "Pulse, approx." with "Your pulse is approximate, read through your phone camera." Bad readings use one neutral line with no health words. Listing subtitle changed to "Your heartbeat, in color" and "hrv"/"reading" dropped from keywords (approve or revert). Locked by `__tests__/disclaimer.test.ts`. |
| M8 | Camera and microphone permission text; denial handled | Review | Done in code, confirm on device | Camera, microphone and add-to-Photos text now match APP-STORE-LISTING.md §7 word for word, on iOS and in the camera plugin for Android. Removed two permissions the photo library was adding by default: iOS "read your photos" (`NSPhotoLibraryUsageDescription`) and Android photo/video/audio read permissions; saving only needs add-to-Photos. Resolved config checked with `expo config --type introspect`. No location, contacts or tracking. A refused camera shows "Camera access is needed" with **Open Settings** and Back; a refused microphone skips the voice step with an Open Settings option; practice does the same. Locked by `__tests__/permissions.test.ts`. Note: `expo-dev-client` adds a local-network usage string that only development builds use; harmless in Release. |
| M9 | Bad readings fail gracefully on 3+ real iPhones; all tests pass | Review | Code done, device test Needs Lusine | Any reading with signal quality under 0.5 or a pulse outside 40–140 is not saved, does not use the free check-in, and shows one neutral line: "We couldn't get a clear reading. Try again sitting still, with your fingertip covering the camera and flash." (`src/core/scan/readingGate.ts`, tested). Title "Let's try that again". 152 automated tests pass. **Risk to know:** the three native modules (pulse, outline, microphone) have never run on a real phone; expect some fixes after the first device run. Test script under Needs Lusine. |
| M10 | Privacy policy, terms, privacy label, age rating | Review | Drafts done, Needs Lusine | Drafts in `docs/store/`: `privacy-policy.md`, `terms.md`, `support.md`, `app-privacy.md`, `age-rating.md`, `play-data-safety.md`. Built from the code: no analytics, crash or ad SDKs; every bundled privacy manifest declares no collected data or tracking; only RevenueCat sends data (purchase records, anonymous ID); Sasha server off. In-app Terms, Privacy and Support links now point to affelion.com/halo/terms, /privacy, /support (`src/services/links.ts`, tested). Those addresses return 404 today, so M10 stays open until they are published. |
| M11 | Screenshots, listing, Review Notes, category, manual release | Review | Assets done; entry Needs Lusine | Screenshots re-captured with the magenta demo reading, the new paywall and the Affelion Halo name, no test text: App Store 6.9" (7 × 1320×2868) and 6.5" (7 × 1284×2778), Google Play phone (7 × 1080×1920), feature graphic 1024×500, Play icon 512, Apple header/search/universal art, raw screens for all three sizes, and the paywall for in-app purchase review. iPad not needed: the app is iPhone-only (`supportsTablet: false`). Captions are APP-STORE-LISTING.md §3, plus a 7th frame "First scan free, then one a week." Files are in `affelion-aura/store/screenshots/` (kept out of this public repo; delivered as a zip). Review Notes final in `docs/store/review-notes.md`; demo video script in `docs/store/demo-video-script.md`. Category, listing fields and manual release are entered in App Store Connect by Lusine (steps under Needs Lusine). |

### Real-device test log (M9)

| Device | iOS | Good scan | Finger lifted | Movement | Dark room | Silent voice | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

### Ready to submit

_(Claude writes the build number, what was tested and any known issues here when M2–M11 pass and M1 is confirmed.)_

---

## Post-launch phases

### Phase A — While in review
- [ ] First update on a branch: story card, heartbeat haptic, today's color + streak, trial reminder, retry tips, failed scans don't count
- [ ] Pop and Bible "Try Halo" cards drafted
- [ ] 12 reel scripts drafted

### Phase B — Launch week
- [ ] Release (Lusine)
- [ ] Pop and Bible cross-promo updates shipped
- [ ] Rating prompt after the 2nd good portrait

### Phase C — Days 1–30
- [ ] First update shipped
- [ ] Paywall right after the first portrait reveal
- [x] Hide lifetime behind "Prefer to pay once?" and first scan free, then one free scan a week: decided by Lusine Nov 20 and built for 1.0.
- [ ] Creator offer-code plan drafted (Needs Lusine)
- [ ] Ad test only if approved and a reel is winning (cap $300)

### Phase D — Days 31–60
- [ ] Android: Health apps declaration, device compatibility text, listing, closed test if needed
- [ ] Halo Keepsake $4.99 (pricing Needs Lusine)
- [ ] Color Pair, seasonal styles
- [ ] Win-back offer, In-App Events, Product Hunt drafts (Needs Lusine)

### Phase E — Days 61–90
- [ ] Video export, monthly recap, widget
- [ ] Sasha server with consent screen and cost limits
- [ ] Price test proposal if trial starts < 5% (Needs Lusine)
- [ ] Investor deck traction update

### Parked ideas
_(Anything new goes here until 1.0 is submitted.)_

---

## Weekly metrics (after launch)

| Week | Downloads | Trial start % | Trial→paid % | D1 / D7 | Readings succeeded % | Shares | Net revenue | Notes |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

# Affelion Halo — Launch Master Brief for Claude

You are working on **Affelion Halo**, a built but unreleased iPhone/Android app by **Lusine Vartan, founder of Affelion LLC** (affelion.com). Your job is to get **iPhone 1.0 submitted to the App Store as fast as possible**, then work through the post-launch phases.

**Top priority: the 11-item "Must-have before submit" list below. Do nothing else until those 11 items pass, or are blocked waiting on Lusine.**

Keep `STATUS.md` up to date after every work session. It is how Lusine knows what's done and what she has to do.

---

## 0. Guardrails (non-negotiable)

You must **NOT** do any of the following yourself. Prepare everything up to that point, then add the item to **"Needs Lusine"** in `STATUS.md` and stop on that item:

1. **Submit** any build to App Review or Google Play review, or press Release.
2. **Spend money**, including ads, paid tools, paid creators, device purchases or paid API plans.
3. **Accept agreements**: Apple Paid Apps agreement, Small Business Program enrollment, Google Play terms, RevenueCat or Stripe terms, or any license or contract.
4. **Change live pricing**: creating or changing the price of live products, trials, offers, offer codes, win-back offers, or RevenueCat offerings that real users see.
5. **Post or message publicly**: social posts, emails to press or creators, replies to App Review on Lusine's behalf (draft them instead).
6. Enter or store **passwords, banking, tax or card details**.

You may freely: edit code, run tests, make builds, write copy, draft listing text, draft Review Notes, prepare screenshots, and set up **sandbox/test** products and configs that real users don't see.

If you are unsure whether something crosses a guardrail, treat it as if it does.

---

## 1. Product context (short)

- One-minute check-in. **Front camera** captures the person's outline and one photo. **Fingertip on the rear camera plus flash** reads pulse and beat-to-beat variation (RMSSD, SDNN, pNN50). **Five seconds of voice** gives pitch and steadiness.
- A **deterministic rulebook** maps the numbers to one of **20 colors**, drawn as a **WebGL fluid aura** around a black-and-white photo. The same numbers always give the same color.
- Features: full breakdown, breathing practice with before/after color, **Sasha** AI guide (1.0 = built-in answers only, no server), history, Pro.
- Stack: **Expo / React Native**, native modules in Swift and Kotlin, **99 automated tests**, **RevenueCat** for purchases.
- Pricing as built: Free (first scan free, then one free scan a week, plus 1 practice), **$12.99/month**, **$69.99/year** (7-day free trial ready), **$199 lifetime**.
- Honest by design: no diagnosis, not a medical device, processing stays on the phone, no account.
- Sister apps: Affelion Pop, Affelion Bible (also on Google Play) and Affelion Kind are live on the App Store; Lock and Grow are in development.
- Lusine is paying down credit card debt. **Keep it cheap and low-risk.** No paid services without her approval.

---

## 2. MUST-HAVE BEFORE SUBMIT (iPhone 1.0)

Only items that would block **App Review** or **revenue** belong here. Work top to bottom. Mark each one in `STATUS.md` as `[x]` only when every acceptance criterion is met.

### M1. Apple agreements and Small Business Program — *Revenue* — **Needs Lusine**
- **You do:** write step-by-step instructions in STATUS.md (App Store Connect → Business → Paid Apps agreement, tax forms, bank account; then apply at developer.apple.com/app-store/small-business-program).
- **Acceptance:** Lusine confirms that the Paid Apps agreement status is Active, banking and tax are complete, and the Small Business Program application is submitted.

### M2. Subscription products and trial in App Store Connect — *Revenue + Review*
- **You do:** write the exact product spec in STATUS.md: one subscription group "Halo Pro" with `aura_pro_annual` ($69.99/yr, 7-day free trial as the introductory offer) and `aura_pro_monthly` ($12.99/mo, no trial), plus a non-consumable `aura_lifetime` ($199). Use the IDs already in the code if they differ, and keep code and store in sync. Write display names and descriptions (name ≤35 chars, description ≤55 chars).
- **Lusine does:** creates or approves the products and prices (pricing guardrail).
- **Acceptance:** all products are in "Ready to Submit" and attached to the 1.0 version, and the product IDs in the app match App Store Connect exactly.

### M3. RevenueCat wired and purchase flow tested — *Revenue*
- **You do:** confirm the RevenueCat iOS API key is the production key in release config; the offering "default" contains annual + monthly (lifetime optional); the entitlement `pro` unlocks every Pro feature; restore works with no account.
- **Acceptance:** in **Sandbox / TestFlight**: (a) buying annual starts a trial and unlocks Pro; (b) buying monthly unlocks Pro; (c) Restore on a fresh install brings Pro back; (d) after a sandbox cancellation and expiry, Pro locks again; (e) no crash or blank paywall offline (show a friendly "can't load prices, try again"). Add an automated test for the entitlement gating logic if one doesn't exist.

### M4. Paywall shows everything Apple requires — *Review (3.1.2)*
- **Acceptance:** the paywall visibly shows: each plan's price and billing period, pulled live from the store (never hardcoded); trial wording such as "7 days free, then $69.99/year. Cancel anytime in Settings."; a **Restore Purchases** button; tappable **Terms of Use** and **Privacy Policy** links; a clear close (X) button; a plain list of what Pro includes. Text is readable (no tiny grey legal text).

### M5. Paywall appears in the first session — *Revenue*
- Best placement: right after the first portrait is revealed.
- **Rule:** if the paywall already appears at some point in the first session, **don't change the flow before submit** (note the ideal placement as a post-launch item). Only change code if a new user could finish the first session without ever seeing it.
- **Acceptance:** on a fresh install, the paywall shows at least once before the user leaves the first portrait screen or uses up the free scans, and closing it returns the user to the portrait.

### M6. Remove test and placeholder text — *Review (2.1)*
- **Acceptance:** search the codebase and UI for "Test build", "purchase simulated", "no payment taken", "lorem", "TODO", "placeholder", "debug", and demo-only flags. No such text appears in a **Release** build. Any simulated-purchase path is compiled out or disabled in Release.

### M7. Wording pass and disclaimer — *Review (1.4.1, 4.3)*
- **Acceptance:** every string in the app (including Sasha's built-in answers, notifications, paywall and onboarding) follows the wording table in section 4. Produce `wording-audit.md` in the repo listing each changed string (before → after). The disclaimer below appears on the result/breakdown screen and in Settings/About:
  > "Affelion Halo is for wellness and self-reflection. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a doctor about any health concern."
- BPM, if shown, is labeled "approximate".

### M8. Camera and microphone permission text — *Review (5.1.1)*
- **Acceptance:** `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` (set through the Expo config plugin / app.json) use the text in `APP-STORE-LISTING.md` section 7. No unused permissions are declared (no location, contacts, photos-write unless export saves to Photos, in which case `NSPhotoLibraryAddUsageDescription` gets a clear string). Denying a permission shows a helpful screen with a "Open Settings" button, not a crash.

### M9. Bad readings fail gracefully, on real iPhones — *Review (2.1)*
- **Acceptance:** on at least **3 real iPhones** (one older model, one recent), with deliberate bad inputs (finger lifted, moving, flash partly uncovered, dark room, cold fingers, silence during voice step):
  - no crash, no freeze, no color drawn from a noisy signal;
  - the user sees "Let's try that again" with one tip;
  - a failed scan does not use up a free scan (if this needs more than a small change, log it as post-launch and note it);
  - a good scan still completes in about a minute.
- Record results in STATUS.md (device, iOS version, pass/fail). If Lusine has to hold the phones, write her a 10-minute test script and put it under "Needs Lusine".
- All 99+ automated tests pass.

### M10. Privacy policy, terms, privacy label, age rating — *Review*
- **You do:** draft `privacy-policy.md` and `terms.md` in plain English matching what the app really does (camera frames and audio processed on device and discarded; no account; RevenueCat processes purchase data; any crash or analytics SDK disclosed). Draft the App Privacy questionnaire answers and the age rating answers (health or wellness topics; expect 9+ or 13+).
- **Lusine does:** publishes the pages on affelion.com (e.g. affelion.com/halo/privacy and /aura/terms) and enters the answers in App Store Connect, or approves you doing the data entry if you have access.
- **Acceptance:** both URLs load publicly (HTTP 200, not a PDF), the in-app links point to them, and the App Privacy answers match every SDK in the build (check each SDK's privacy manifest).

### M11. Screenshots, listing and Review Notes — *Review*
- **Acceptance:**
  - 6.9" iPhone screenshots (and any other size App Store Connect requires) re-captured from a Release build, with **no test text**, showing a **magenta or violet** demo reading (not teal), captions from `APP-STORE-LISTING.md`.
  - Listing fields filled from `APP-STORE-LISTING.md` (name, subtitle, keywords, promotional text, description, support URL, marketing URL).
  - Review Notes from `APP-STORE-LISTING.md` section 6, plus a link to a 60-second screen recording of a complete scan (Lusine records or approves it).
  - Primary category Lifestyle, secondary Health & Fitness (a judgment call to reduce medical framing).
  - Version set to **manual release**.

### Hand-off to submit — **Needs Lusine**
When M1–M11 pass, write a "Ready to submit" summary at the top of STATUS.md: build number, what was tested, any known issues. **Lusine submits.** If App Review rejects, draft a reply and the smallest fix for the guideline cited; Lusine sends the reply and resubmits.

---

## 3. Why these choices (sources)

- 82.1% of Health & Fitness trials start on install day; hard paywalls convert 10.7% download-to-paid vs 2.1% freemium, with similar 1-year retention (27% vs 28%); 5–9 day trials convert 37.4% vs 25.5% for ≤4 days. RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps
- Apple App Review Guidelines (1.4.1 medical, 2.1 completeness, 2.3.7 metadata, 3.1.2 subscriptions, 4.3(b) fortune telling, 5.1.1–5.1.3 privacy and health): https://developer.apple.com/app-store/review/guidelines/
- Small Business Program (15%): https://developer.apple.com/app-store/small-business-program/
- Product page limits (name 30, subtitle 30, keywords 100, promo text 170): https://developer.apple.com/app-store/product-page/
- Google Play health policy and Health apps declaration: https://support.google.com/googleplay/android-developer/answer/16679511 and https://support.google.com/googleplay/android-developer/answer/14738291
- Affelion LLC uses business developer accounts on both App Store and Google Play, so Google's 12-tester / 14-day closed-test rule for new personal accounts does NOT apply.
- Web checkout skipped for now: on the Small Business Program, adding a web button left about 86¢ per in-app dollar in RevenueCat's test: https://www.revenuecat.com/blog/growth/iap-vs-web-purchases-conversion-test
- Camera pulse limits: https://pubmed.ncbi.nlm.nih.gov/30269602/ and https://www.nature.com/articles/s41586-026-10507-6
- Full plan Page (Lusine's copy): https://cursor.com/canvas/store-e6b620c0-c707-490e-b471-71b7a64124f3/e59e50d9-6492-4132-b889-f767159112e9

---

## 4. Wording rules (apply everywhere: app, listing, screenshots, Sasha, social drafts)

| Say this | Never say this |
|---|---|
| A one-minute check-in | Stress test, health check, heart check |
| Your pulse and voice, turned into color | Reads your energy field, scans your spirit |
| For reflection and self-expression | Diagnoses, detects, monitors, treats |
| Approximate pulse from your phone camera | Medical-grade, clinically accurate, as accurate as ECG |
| A calm color often follows a slower pulse | Reveals anxiety, depression, heart problems |
| Every color traces to a number | Predicts your future, psychic, chakra, manifest |
| Breathing practice | Lowers blood pressure, heals, cures |

Also: no other app names, trademarks or prices in metadata; no "TikTok" in the listing; no HealthKit in 1.0.

---

## 5. Post-launch phases (only after 1.0 is submitted)

Do these in order. Anything involving money, pricing, publishing or posting is drafted by you and goes under "Needs Lusine".

### Phase A — While in review
- Build the **first update** on a branch: 9:16 story card (color name, one-line meaning, date, small "Affelion Halo" mark; watermark for free, clean for Pro), heartbeat haptic synced to the user's BPM on reveal, "Today's color" with a gentle streak, local trial-ending reminder (2 days before), friendlier retry tips, failed scans never count.
- Draft "Try Halo" cross-promo cards for Pop and Bible (Bible wording: "a calm heartbeat check-in and breathing practice", avoid "aura"-as-spiritual framing).
- Draft 12 reel scripts (before/after coffee, after workout vs after breathing, compare with a friend, "aura points but with real data", founder behind-the-scenes).
- No 12-tester closed test needed (business Play account); go straight to Play production setup when Android is ready.

### Phase B — Launch week
- Lusine releases. Ship the Pop and Bible updates with the cross-promo card.
- Add the rating prompt (SKStoreReviewController) after a user's second successful portrait.

### Phase C — Days 1–30 after launch
- Ship the first update.
- Move the paywall to directly after the first portrait reveal, with annual + trial pre-selected (if not already).
- Propose (Needs Lusine): hide lifetime from the main paywall; free tier = 1 scan per week instead of 3 total.
- Draft creator outreach and offer-code plan (Needs Lusine).
- Ads only with Lusine's approval, only once an organic reel clearly drives trials: cap $300 total; stop an ad if cost per trial start > $15 after $150 spent; keep going if < $8.
- Weekly metrics note in STATUS.md.

### Phase D — Days 31–60
- Android: Health apps declaration answers, device compatibility statement in the description, Play listing, closed test if required. Lusine submits.
- "Halo Keepsake" one-time purchase ($4.99) offered when someone closes the paywall: full breakdown of that reading + clean high-res poster. Check Google Play fees for one-time items before pricing there.
- Color Pair (compare with a friend), seasonal portrait styles (same rulebook), Apple win-back offer draft, In-App Event drafts, Product Hunt draft.

### Phase E — Days 61–90
- 5-second moving video export, monthly color recap, home screen widget (native target), Sasha on a server (needs an explicit consent screen naming the AI provider per guideline 5.1.2(i), plus cost limits).
- Price test proposal if trial starts are under 5% (e.g. $49.99/yr), Needs Lusine.
- Update the investor deck with real traction.

---

## 6. Metrics to report weekly (in STATUS.md)

| Metric | Health & Fitness median | Great |
|---|---|---|
| Download → trial start | 6.9% | 23%+ |
| Trial → paid | 37.7% | 51.4%+ |
| Download → paid (35 days) | 2.9% | 6.2%+ |
| Monthly first renewal | 57% | — |
| Annual first renewal | 25% | — |
| Day 1 / 7 / 30 return | ~35–45% / 18–28% / 10–18% (approximate, CohortCalc) | — |
| Successful readings per scan started | own target 80%+ (assumption) | — |
| Portraits shared | own target 1 in 5 (assumption) | — |

Sources: RevenueCat SOSA 2026; https://www.revenuecat.com/blog/growth/average-subscription-renewal-rates-by-app-category ; https://cohortcalc.com/blog/retention-benchmarks-ios/index.html

---

## 7. How to work

1. Read this file, `STATUS.md` and `APP-STORE-LISTING.md` at the start of every session.
2. Pick the first unchecked must-have item that isn't waiting on Lusine.
3. Make the smallest change that meets the acceptance criteria. Run the tests. Commit with a clear message.
4. Update `STATUS.md`: tick what's done, add evidence (test output, device results), and add anything you need from Lusine under "Needs Lusine" with exact steps.
5. Never invent numbers or claims. Label assumptions.
6. Don't add new features before submit. Park ideas under "Post-launch" in STATUS.md.

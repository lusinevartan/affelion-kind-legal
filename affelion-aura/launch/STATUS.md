# Affelion Aura — Launch Status

**Goal:** submit iPhone 1.0 as soon as the 11 must-haves pass.
**Current phase:** Must-have before submit
**Last updated by:** Claude, Nov 20, 2026 (branch `claude/affelion-aura-app-idarxq`, PR #5)

> Claude ticks an item only when every acceptance criterion in `CLAUDE-AURA-LAUNCH.md` section 2 is met, and adds evidence below it.

---

## Needs Lusine (only you can do these)

Claude will add exact step-by-step instructions next to each item.

- [x] ~~Agreements, tax, banking, Small Business Program~~ Already active on the Affelion LLC Apple and Google accounts (confirmed by Lusine, Nov 20). Nothing new for Aura.
- [ ] **App record (Aura only).** The iOS record exists (App Store Connect app ID 6817953783). Check it has bundle ID `com.affelion.aura`, primary language English (U.S.), SKU of your choice. For Google, Play Console → **Create app** → name Affelion Aura, default language English (United States), App, Free (it has in-app purchases), accept the declarations for this app only.
- [ ] **Approve pricing and create/approve live products:** annual $69.99 with 7-day free trial, monthly $12.99, lifetime $199 (M2)
  The IDs below are the ones in the app's code. Type them exactly; a single wrong character means the button can't buy.
  1. App Store Connect → Apps → Affelion Aura → **Monetization → Subscriptions** → create group **Aura Pro**.
  2. In that group, create **`com.affelion.aura.pro.annual`**. Reference name: Aura Pro Annual. Duration: 1 year. Price: **$69.99** (USD base; let Apple fill other countries). Localization (English US): display name **Aura Pro – Yearly**, description **Unlimited check-ins, breakdown, history and Sasha**.
  3. On that annual product: **Subscription Prices → Introductory Offers → +** → all countries, type **Free**, duration **1 week**, no end date.
  4. In the same group, create **`com.affelion.aura.pro.monthly`**. Reference name: Aura Pro Monthly. Duration: 1 month. Price: **$12.99**. No introductory offer. Display name **Aura Pro – Monthly**, description **Unlimited check-ins, breakdown, history and Sasha**.
  5. Put annual at level 1 and monthly at level 2 in the group (higher level = more value), so switching between them is handled as an upgrade or downgrade.
  6. **Monetization → In-App Purchases → +** → type **Non-Consumable**, product ID **`com.affelion.aura.pro.lifetime`**, reference name Aura Pro Lifetime, price **$199**, display name **Aura Pro – Lifetime**, description **Every Pro feature, one payment, no renewal**.
  7. Each product needs a **Review screenshot**: use `launch/review/paywall-review.png` (Claude adds it under M11) and the review note "Shown on the paywall after the first portrait."
  8. RevenueCat (free tier, no card needed): create project Affelion Aura → add the iOS app (bundle ID from `app.json`) → upload the App Store Connect in-app purchase key it asks for → **Products**: import the three IDs → **Entitlements**: create **`pro`** and attach all three → **Offerings**: the offering **`default`** with packages **Annual**, **Monthly**, **Lifetime**, each pointing at its product → mark it **Current**.
  9. Copy the RevenueCat **Apple public SDK key** (starts with `appl_`) and send it to Claude, or add it yourself: `npx eas-cli@latest env:create --name EXPO_PUBLIC_RC_IOS_KEY --value appl_... --environment production --environment preview`. The public key is safe in the app; it is not a secret.
  10. When you upload the 1.0 build, open the version page → **In-App Purchases and Subscriptions** → **+** → select all three, so they are reviewed with the app.
- [ ] **Sandbox purchase test, about 15 minutes, on a TestFlight build (M3).** Needs M2 done and the RevenueCat key in the build.
  1. iPhone Settings → App Store → scroll to **Sandbox Account** → sign in with a sandbox tester (create one in App Store Connect → Users and Access → Sandbox → Testers; any new email works).
  2. Install the TestFlight build. Do one scan. The paywall opens two seconds after the portrait. Tap **Start 7-day free trial**, confirm. Expect: Pro unlocks (the breakdown opens). Sandbox trials last minutes, not days.
  3. Delete the app, reinstall from TestFlight, open Settings in the app → **Restore**. Expect "Restored, Pro is active".
  4. In iPhone Settings → App Store → Sandbox Account → Manage → cancel the subscription. Wait for it to end (a sandbox year is about an hour; a sandbox month is about five minutes). Leave the app and come back. Expect: Pro is locked again (Home shows the free-scan line).
  5. With a second sandbox tester, buy **Monthly**. Expect: Pro unlocks.
  6. Turn on Airplane Mode, delete and reinstall, open the paywall. Expect: "We could not load prices" with **Try again**, no crash, no blank screen. Turn Airplane Mode off, tap Try again, prices appear.
  7. Write pass or fail for each step in the M3 row, or tell Claude.
- [ ] **Publish** privacy policy and terms on affelion.com (Claude drafts them) (M10)
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
| M4 | Paywall shows price, period, trial terms, Restore, Terms, Privacy, close button | Review | Done in code, confirm on device | Headline "Keep your Aura" and the four benefit lines from APP-STORE-LISTING.md §5. Each plan shows the store's price and period ("$69.99 · $5.83 / month", "$12.99 · per month"); store builds list only what the store returns. Trial line "7 days free, then $69.99 per year. Cancel anytime in Settings." Button "Start my free week" (or "Continue" without a trial). Renewal terms at body size, not caption: charged to Apple ID when the trial ends unless canceled 24 hours before, renews automatically, cancel anytime in Settings. **Restore Purchases**, Manage or cancel, **Terms of Use**, **Privacy Policy**. Close: "Not now ✕" top right, 44 pt target. Tests: `__tests__/paywall.test.tsx` (9), `__tests__/restore.test.ts` (3). |
| M5 | Paywall appears in the first session | Revenue | Done in code, confirm on device | Opens once by itself two seconds after a free person's first portrait; "Not now" goes back to that portrait (falls back to opening it if there is no back). Never opened by the scan screen. Tests: `__tests__/paywallTiming.test.tsx` (3). 135 tests pass. |
| M6 | Test/placeholder text removed from Release build | Review | Done | Searched `src/` and `modules/` for test build, purchases simulated, no payment taken, lorem, TODO, placeholder, debug, FIXME. The only user-facing hit is the paywall line "Test build · purchases simulated · no payment taken", which appears only when purchases are simulated: never in Release (simulation needs a dev build or `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES=1`, which no EAS profile sets), and now never in the web review build used for screenshots. Demo signals (`aura.demo`) exist only in the web stand-in modules; the story preview route sends a phone straight home. Locked by `__tests__/release.test.ts` (4). "placeholder" hits are the guide's input hint and code comments, not shown text. |
| M7 | Wording pass + disclaimer (`wording-audit.md`) | Review | Not started | |
| M8 | Camera and microphone permission text; denial handled | Review | Not started | |
| M9 | Bad readings fail gracefully on 3+ real iPhones; all tests pass | Review | Not started | |
| M10 | Privacy policy, terms, privacy label, age rating | Review | Not started | |
| M11 | Screenshots, listing, Review Notes, category, manual release | Review | Not started | |

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
- [ ] Pop and Bible "Try Aura" cards drafted
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
- [ ] Aura Keepsake $4.99 (pricing Needs Lusine)
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

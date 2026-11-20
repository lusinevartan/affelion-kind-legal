# Affelion Aura — Launch Status

**Goal:** submit iPhone 1.0 as soon as the 11 must-haves pass.
**Current phase:** Must-have before submit
**Last updated by:** Claude, Nov 20, 2026 (branch `claude/affelion-aura-app-idarxq`, PR #5)

> Claude ticks an item only when every acceptance criterion in `CLAUDE-AURA-LAUNCH.md` section 2 is met, and adds evidence below it.

---

## Needs Lusine (only you can do these)

Claude will add exact step-by-step instructions next to each item.

- [ ] **Accept agreements:** Apple Paid Apps agreement, tax forms and banking in App Store Connect (M1)
  1. Go to appstoreconnect.apple.com and sign in as the Account Holder for Affelion LLC.
  2. Open **Business** (top menu). Under **Agreements**, find **Paid Apps**. If it says "New" or "Pending", click **View and Agree to Terms**, read, and accept.
  3. On the same page, under **Tax Forms**, click **Set Up Tax Forms** and complete the U.S. Form W-9 for Affelion LLC (use the LLC's EIN, not your SSN, unless the LLC is a single-member disregarded entity and your accountant says otherwise).
  4. Under **Bank Accounts**, click **Add Bank Account** and enter the LLC's business checking account.
  5. Wait until Paid Apps shows **Active** (usually minutes to a day). Tell Claude "M1 agreements active".
- [ ] **Enroll** in the App Store Small Business Program (M1)
  1. Do this after Paid Apps is Active. Go to developer.apple.com/app-store/small-business-program and click **Enroll**.
  2. Sign in as the Account Holder. List any associated developer accounts (you have none besides Affelion LLC unless you own another).
  3. Submit. Apple emails a confirmation; the 15% rate starts at the beginning of the next fiscal month after approval.
  4. Tell Claude "M1 SBP submitted". Then M1 is done.
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
| M1 | Apple agreements + Small Business Program | Revenue | Needs Lusine | Steps written under Needs Lusine. Nothing for Claude to build. |
| M2 | Subscription products + 7-day trial in App Store Connect, attached to build | Revenue + Review | Needs Lusine | Spec written under Needs Lusine. Code IDs `com.affelion.aura.pro.annual / .monthly / .lifetime`, entitlement `pro`; locked by `__tests__/products.test.ts` so code can't drift from the store. Done when the three products show Ready to Submit and are attached to 1.0. |
| M3 | RevenueCat wired; buy / restore / cancel tested in Sandbox/TestFlight | Revenue | Code done, sandbox test Needs Lusine | Purchases go through RevenueCat when `EXPO_PUBLIC_RC_IOS_KEY` is in the build (M2 step 9); entitlement `pro`; offering `default`, falling back to any offering that lists the product. Restore needs no account. Added: Pro is re-checked with the store whenever the app comes back to the front, so an expired subscription locks without a restart (d). In a store build the paywall never shows built-in prices: offline it says "We could not load prices" with Try again, and the buy button is disabled (e). Gating tests in `__tests__/gating.test.ts` (access rules, store answer to Pro, price status). 120 tests pass. Simulated purchases are off in Release unless `EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES=1`, which is not set in `eas.json`. Not yet run on a device: (a)–(e) in sandbox. |
| M4 | Paywall shows price, period, trial terms, Restore, Terms, Privacy, close button | Review | Not started | |
| M5 | Paywall appears in the first session | Revenue | Not started | |
| M6 | Test/placeholder text removed from Release build | Review | Not started | |
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
- [ ] Proposal: hide lifetime, 1 free scan a week (Needs Lusine)
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

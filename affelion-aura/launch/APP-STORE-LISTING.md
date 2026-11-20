# Affelion Halo — Store Listing Copy (draft for Lusine's approval)

All copy follows the wording rules in `CLAUDE-AURA-LAUNCH.md` section 4. Character counts were checked against Apple's limits (name 30, subtitle 30, keywords 100, promotional text 170; source: https://developer.apple.com/app-store/product-page/). No prices appear in the description (Apple advises against it).

---

## 1. App Store basics

| Field | Copy | Count / limit |
|---|---|---|
| App name | Affelion Halo – Color Check-In | 30 / 30 |
| Subtitle | Your heartbeat, in color | 24 / 30 (changed Nov 20 by Claude: "Aura reading" sits close to the fortune-telling category in guideline 4.3(b); the description already opens with this line) |
| Keywords | aura,color,check in,heartbeat,pulse,vibe,mood,portrait,selfie,calm,breathing,daily,glow,art,reflect | 99 / 100 (changed Nov 20: dropped "reading" and "hrv", a health metric, added "art" and "reflect"; added "aura" back after the rename to Halo, since people search for it and it is no longer in the name) |
| Promotional text | Your real heartbeat and voice, turned into one of twenty colors. A one-minute check-in that's beautiful, honest, and all yours. | under 170 |
| Primary category | Lifestyle | judgment call |
| Secondary category | Health & Fitness | |
| Support URL | https://www.affelion.com (or a /aura/support page) | |
| Marketing URL | https://www.affelion.com | |
| Privacy policy URL | https://www.affelion.com/halo/privacy (to be published) | |

Notes: words in the app name ("Halo", "Affelion") don't need repeating in keywords. No competitor names or trademarks.

---

## 2. Description (App Store)

Your heartbeat, in color.

Affelion Halo turns one minute of you into a living portrait. Look at the camera, rest a fingertip on the back camera, and say a few words. Halo reads your approximate pulse and the steadiness of your voice, then paints one of twenty colors moving around a black-and-white photo of you, at the pace of your own heartbeat.

HONEST BY DESIGN
• Every color traces back to a number you can tap and see.
• The same numbers always give the same color. No randomness, no flattery.
• No sign-up. Camera frames and audio are processed on your phone and thrown away.

WHAT YOU GET
• Your portrait: your color, named, with what it means in plain words.
• Full breakdown: each measurement and why it led to your color.
• Breathing practice: watch your color shift with a before and after.
• Sasha: a friendly guide who explains your portrait using only what was measured.
• History: see how your colors move over time.

FREE AND PRO
First scan free, then one free scan a week. Halo Pro unlocks unlimited check-ins and practice, the full breakdown, history, Sasha, and clean exports. Pro is an auto-renewing subscription with a free trial on the annual plan; prices are shown in the app before you subscribe. Cancel anytime in your Apple ID settings at least 24 hours before renewal.

WORKS BEST
Hold still with your fingertip fully covering the back camera and flash, in a comfortably lit room, with warm hands.

Affelion Halo is for wellness and self-reflection. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a doctor about any health concern.

Terms of Use: https://www.affelion.com/halo/terms
Privacy Policy: https://www.affelion.com/halo/privacy

From Affelion, the makers of Affelion Pop and Affelion Bible.

---

## 3. Screenshot captions (first three show in search)

Use a **magenta or violet** demo reading, captured from a Release build with no test text.

1. Your real heartbeat, in color
2. One minute: face, fingertip, voice
3. Every color traces to a number
4. Watch your color settle as you breathe
5. Meet Sasha, your gentle guide
6. See how your colors move over time

App preview (optional, up to 30 seconds, autoplays muted): first 3 seconds = the aura blooming around a face.

---

## 4. In-app purchase display text

| Product | Display name (≤35) | Description (≤55) |
|---|---|---|
| Annual | Halo Pro – Yearly | Unlimited check-ins, breakdown, history and Sasha |
| Monthly | Halo Pro – Monthly | Unlimited check-ins, breakdown, history and Sasha |
| Lifetime | Halo Pro – Lifetime | Every Pro feature, one payment, no renewal |

Prices are set by Lusine in App Store Connect (guardrail): annual $69.99 with 7-day free trial, monthly $12.99, lifetime $199.

---

## 5. Paywall copy

**Headline:** Keep your Halo
**Benefits:**
- A new color every day, unlimited
- The full breakdown behind your color
- Your history, and how it moves
- Sasha and clean, watermark-free exports

**Annual (pre-selected):** 7 days free, then {annual_price}/year
**Monthly:** {monthly_price}/month
**Button:** Start my free week (annual) / Continue (monthly)
**Small print (readable size):** Payment is charged to your Apple ID when the trial ends unless you cancel at least 24 hours before. Renews automatically. Cancel anytime in Settings.
**Links:** Restore Purchases · Terms of Use · Privacy Policy

Prices must come live from the store, never hardcoded.

---

## 6. Notes for App Review (paste into App Store Connect)

**Superseded Nov 20 by the final version in `docs/store/review-notes.md`** (adds how to reach the paywall, the free plan, restore, and the on-device Sasha note). Use that one.

Affelion Halo is a wellness and self-reflection app. It turns a one-minute check-in into a color portrait. It does not diagnose, treat or monitor any condition and makes no medical claims; the app and listing say it is not a medical device and remind users to see a doctor about health concerns.

How to test a check-in:
1. Open the app and tap Begin. No account is needed.
2. Face step: look at the front camera; the app captures your outline and one photo.
3. Fingertip step: cover the BACK camera and flash completely with a fingertip and hold still for about 30 seconds. The flash turns on to read an approximate pulse from the light through the fingertip.
4. Voice step: say a few words for 5 seconds. Audio is analyzed in memory for pitch and steadiness and is never recorded or stored.
5. Your portrait appears with one of 20 colors.

What's different from other aura apps: colors come from real measurements (approximate pulse, beat-to-beat variation and voice steadiness) through a fixed, published rulebook. The same numbers always produce the same color. It makes no claims about energy fields, the future or the supernatural.

Privacy: camera frames and audio are processed on the device and discarded. No account. Purchases are handled by Apple through RevenueCat.

Subscriptions: Halo Pro (yearly with a 7-day free trial, monthly) and a lifetime purchase. First scan free, then one free scan a week. The paywall appears after the first portrait; Restore Purchases is on the paywall and in Settings.

Demo video of a complete check-in: {link to 60-second screen recording}

---

## 7. Permission text (Info.plist via Expo config)

- **NSCameraUsageDescription:** Halo uses your front camera for your outline and one photo, and your back camera and flash to read your pulse from your fingertip. Camera frames stay on your phone.
- **NSMicrophoneUsageDescription:** Halo listens for 5 seconds to measure the pitch and steadiness of your voice. Audio stays on your phone and is never recorded.
- **NSPhotoLibraryAddUsageDescription** (only if export saves to Photos): Halo saves your portrait to your photos when you ask it to.

---

## 8. Google Play (for the Android phase)

- **Title (≤30):** Affelion Halo – Color Check-In
- **Short description (≤80):** Your real pulse and voice, turned into a color portrait. One minute.
- **Full description:** use section 2, and add the device compatibility paragraph below (required by Google Play for camera-based health features), and keep the disclaimer and see-a-doctor line.

  **Device compatibility:** The fingertip pulse reading needs a phone with a back camera and a flash (torch). It works best on recent phones; results may vary by device model. {Claude: list tested models here after testing.}

- **Health apps declaration (Play Console → App content):** declare the heart-rate / activity-and-fitness-related functionality honestly; not a medical device.
- **Privacy policy:** same public URL as iOS, linked in Play Console and inside the app.

Source: https://support.google.com/googleplay/android-developer/answer/16679511

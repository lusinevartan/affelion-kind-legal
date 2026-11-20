# Google Play listing (draft)

For Play Console → Affelion Halo → **Grow → Store presence → Main store listing**. Same words as the
App Store listing (`launch/APP-STORE-LISTING.md`), with the Android changes Google needs. The Play
account is a business account, so no closed test with testers is required before production.

| Field | Copy | Count / limit |
|---|---|---|
| App name | Affelion Halo – Color Check-In | 30 / 30 |
| Short description | Your real pulse and voice, turned into a color portrait. One minute. | 68 / 80 |
| Category | Lifestyle | |
| Tags | Wellness, Lifestyle, Art & design (pick the closest Google offers) | |
| Email | hello@affelion.com | |
| Website | https://www.affelion.com | |
| Privacy policy | https://www.affelion.com/halo/privacy | |

## Full description (4000 max)

Your heartbeat, in color.

Affelion Halo turns one minute of you into a living portrait. Look at the camera, rest a fingertip on the back camera, and say a few words. It reads your approximate pulse and the steadiness of your voice, then paints one of twenty colors moving around a black-and-white photo of you, at the pace of your own heartbeat.

It's the aura trend, with a real heartbeat behind it.

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
First scan free, then one free scan a week. Halo Pro unlocks unlimited check-ins and practice, the full breakdown, history, Sasha, and clean exports. Pro is an auto-renewing subscription with a free trial on the annual plan; prices are shown in the app before you subscribe. Cancel anytime in Google Play → Payments & subscriptions at least 24 hours before renewal.

WORKS BEST
Hold still with your fingertip fully covering the back camera and flash, in a comfortably lit room, with warm hands.

Affelion Halo is for wellness and self-reflection. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a doctor about any health concern.

Terms of Use: https://www.affelion.com/halo/terms
Privacy Policy: https://www.affelion.com/halo/privacy

DEVICE COMPATIBILITY
The fingertip pulse reading needs a phone with a back camera and a flash (torch). It works best on recent phones; results may vary by device model. [Tested models go here after the device test.]

From Affelion, the makers of Affelion Pop, Affelion Bible and Affelion Kind.

## Graphics

| Asset | Size | File |
|---|---|---|
| App icon | 512 × 512 PNG | `store/screenshots/play/icon-512.png` |
| Feature graphic | 1024 × 500 | `store/screenshots/play/feature-graphic.png` |
| Phone screenshots | 1080 × 1920 or larger, 2 to 8 | `store/screenshots/play/phone/` |

## App content (Policy → App content)

- **Privacy policy:** URL above.
- **Ads:** No ads.
- **App access:** All functions available without login. Add the note: "No account needed. A check-in uses the back camera and flash; on an emulator, use the 'Skip voice' button and expect the pulse step to ask for a real fingertip."
- **Content rating:** see `docs/store/age-rating.md` (Google section). Expected Everyone / PEGI 3.
- **Target audience:** 13 and over (13–15, 16–17, 18+). Not designed for children.
- **Data safety:** `docs/store/play-data-safety.md`.
- **Health apps:** declare Fitness and wellness only; not a medical device.
- **Government app / Financial features / News:** No.

## In-app products (Monetize → Products)

Same IDs as iOS so one RevenueCat setup covers both:
- Subscription **`com.affelion.aura.pro.annual`** with base plan `yearly` (auto-renewing, 1 year, $69.99) and an offer `free-week` (free trial, 7 days, new customers).
- Subscription **`com.affelion.aura.pro.monthly`** with base plan `monthly` (auto-renewing, 1 month, $12.99), no offer.
- One-time product **`com.affelion.aura.pro.lifetime`**, $199.
Google takes 15% on subscriptions from day one and 15% on the first $1M a year for enrolled developers; check the Play Console's service fee page for the current numbers before relying on them.

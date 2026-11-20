# Affelion Halo 1.0: App Store submission checklist

Copy each value exactly. Character counts are checked. Everything here matches the code on branch
`claude/affelion-aura-app-idarxq` (Nov 20, 2026). Nothing in this file changes a price.

## 1. App Information (App Store Connect → Affelion Halo → General → App Information)

| Field | Value |
|---|---|
| Name | `Affelion Halo – Color Check-In` (30 / 30) |
| Subtitle | `Your heartbeat, in color` (24 / 30) |
| Bundle ID | `com.affelion.aura` (already set; do not change) |
| Primary language | English (U.S.) |
| Primary category | Lifestyle |
| Secondary category | Health & Fitness |
| Content Rights | "No, it does not contain, show, or access third-party content" |
| Age Rating | See section 4 |
| Privacy Policy URL | `https://www.affelion.com/halo/privacy` |
| License Agreement | Leave Apple's standard EULA. Our own terms are linked in the app and in the description. |

## 2. Version 1.0 page (App Store Connect → Affelion Halo → iOS App 1.0)

| Field | Value |
|---|---|
| Promotional Text | `Your real heartbeat and voice, turned into one of twenty colors. A one-minute check-in that's beautiful, honest, and all yours.` (127 / 170) |
| Keywords | `color,check in,heartbeat,pulse,vibe,mood,portrait,selfie,calm,breathing,daily,glow,art,reflect` (94 / 100) |
| Support URL | `https://www.affelion.com/halo/support` |
| Marketing URL | `https://www.affelion.com` |
| Version | `1.0.0` (from the build) |
| Copyright | `2026 Affelion LLC` |
| Routing App Coverage File | none |
| Sign-in required | No (uncheck "Sign-in required") |
| Contact information | your name, phone, `hello@affelion.com` |
| Notes | the App Review notes in section 6 |
| Attachment | optional: the 60-second demo video link (`docs/store/demo-video-script.md`) |
| In-App Purchases and Subscriptions | click **+** and add all three: `com.affelion.aura.pro.annual`, `com.affelion.aura.pro.monthly`, `com.affelion.aura.pro.lifetime` |
| Build | the TestFlight build that passed the device test |
| Version Release | **Manually release this version** |
| Screenshots | 6.9": the 7 files in `app-store-6.9/`; 6.5": the 7 files in `app-store-6.5/` (selling-assets zip). No iPad. |
| App Preview | `app-preview/app-preview-iphone-886x1920.mp4` in the first slot of 6.9" and 6.5"; poster frame on the portrait |

### Description (1854 / 4,000)

```
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
First scan free, then one free scan a week. Halo Pro unlocks unlimited check-ins and practice, the full breakdown, history, Sasha, and clean exports. Pro is an auto-renewing subscription with a free trial on the annual plan; prices are shown in the app before you subscribe. Cancel anytime in your Apple ID settings at least 24 hours before renewal.

WORKS BEST
Hold still with your fingertip fully covering the back camera and flash, in a comfortably lit room, with warm hands.

Affelion Halo is for wellness and self-reflection. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a doctor about any health concern.

Terms of Use: https://www.affelion.com/halo/terms
Privacy Policy: https://www.affelion.com/halo/privacy

From Affelion, the makers of Affelion Pop, Affelion Bible and Affelion Kind.
```

## 3. Pricing and Availability (Monetization → Pricing and Availability)

Leave as already set: Free, with in-app purchases. Availability: all countries and regions unless
you choose otherwise. (Prices of the three products were set in item 2 of the account steps and are
not touched here.)

## 4. Age Rating (App Information → Age Rating → Edit)

Answer **None** or **No** to everything except:

| Question | Answer |
|---|---|
| Health or wellness topics | **Yes** |
| Medical or treatment information | **None** |
| Unrestricted web access | No (the app only opens its own Terms, Privacy and Support pages) |
| User-generated content, messaging, advertising, contests, gambling, loot boxes, parental controls, age assurance | No |

Expected result: **9+**. If App Store Connect computes a different rating, keep these honest answers.

## 5. App Privacy (General → App Privacy → Get Started)

The build contains no analytics, crash reporting, ads or tracking SDKs, and every bundled privacy
manifest declares no collected data. The only data that leaves the phone is purchase records sent to
RevenueCat. Check-in measurements, voice and photos never leave the device.

1. "Do you or your third-party partners collect data from this app?" → **Yes**
2. Select one type: **Purchases → Purchase History**. Leave every other type unselected.
3. Purchase History: used for **App Functionality** and **Analytics**; **not linked** to the user's
   identity (RevenueCat uses an anonymous ID; there are no accounts); **not used for tracking**.
4. **Publish**.

## 6. App Review notes (3220 / 4,000 characters)

```
Affelion Halo is a one-minute wellness and self-reflection check-in. It turns an approximate pulse and a few seconds of voice into a color portrait around a black-and-white photo of the user.

NOT MEDICAL, NOT FORTUNE-TELLING
The app does not diagnose, treat, cure, prevent or monitor any condition and makes no medical claims. The portrait, the full breakdown, How it works and Settings all say: "Affelion Halo is for wellness and self-reflection. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a doctor about any health concern." The pulse is labeled approximate. The app does not use HealthKit.
It is not an astrology, psychic or fortune-telling app. Every color comes from a measured number through a fixed, published rulebook; the same numbers always give the same color. Tapping a number on the portrait, or opening the full breakdown, shows which reading made which color. The app never claims to read energy fields or predict anything.

HOW TO DO A CHECK-IN (no account needed)
1. Open the app, swipe through three short intro pages, tap Begin scan. Allow the camera and the microphone.
2. Face: look at the front camera. The app finds your outline and takes one photo.
3. Fingertip: cover the BACK camera and the flash together with one fingertip and hold still for about 30 to 40 seconds. The flash turns on so light passes through the fingertip; that is how the pulse is read.
4. Voice: say a few words for about five seconds. "Skip the voice step" is available.
5. The portrait appears with one of 20 colors. If the reading is not clear, the app says "We couldn't get a clear reading..." and that try does not use the free check-in.
A simulator cannot read a pulse, so please test on an iPhone.

CAMERA AND MICROPHONE
Both are used only during the check-in, on the device. Camera frames and audio are processed in memory and discarded; audio is never recorded. The one photo, the outline and the numbers are stored only on the device, and Settings > Delete all data removes them. No account, no analytics, no ads, no tracking. Purchases go through Apple, with RevenueCat checking subscription status. Sasha, the in-app guide, is labeled as an AI; in this version her answers are built on the device from the user's own numbers and nothing is sent to a server.

SUBSCRIPTIONS AND THE PAYWALL
Free: the first check-in is free, then one free check-in a week, plus one breathing practice.
Affelion Halo Pro: yearly (with a 7-day free trial for eligible users) and monthly auto-renewing subscriptions, and a one-time lifetime purchase (behind "Prefer to pay once?").
To reach the paywall: it opens by itself two seconds after the first portrait. It can also be opened any time from the portrait ("See the full breakdown"), from Home once the free check-in is used ("Unlock scans"), or from Settings ("See plans").
The paywall shows each price and billing period from the store, the trial terms, the renewal terms, Restore Purchases, Terms of Use and Privacy Policy. "Not now" with the close mark returns to the portrait.

RESTORING PURCHASES
Restore Purchases is on the paywall and in Settings. It needs no account or sign-in.

Contact: hello@affelion.com
```

## 7. Last checks before you press Submit

- [ ] affelion.com/halo/privacy, /halo/terms and /halo/support load in a private browser window (today they return 404)
- [ ] The build attached is the **production** build (`--profile production`), not the testflight one (the testflight build has the Debug screen)
- [ ] All three in-app purchases attached and showing **Ready to Submit**
- [ ] Screenshots, app preview, description, keywords, URLs, copyright, age rating and App Privacy saved
- [ ] Manual release selected
- [ ] Then: **Add for Review → Submit**. After approval: **Release This Version**.

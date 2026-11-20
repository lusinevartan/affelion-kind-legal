# Affelion Halo: quick iPhone test (about 20 minutes, then 5 minutes a day for two days)

Use the TestFlight build made with `--profile testflight`. Purchases in TestFlight are free (Apple's
test environment, your own Apple ID). The full version of this test is `DEVICE-TEST-DETAILED.md`.

**Before you start:** note the build number (TestFlight, under the app name), your iPhone model and
iOS version. Turn on Screen Recording in Control Center. Delete any older copy of the app.

## A. First check-in and the free plan

| # | Do this | You should see | Pass |
|---|---|---|---|
| 1 | Open the app, swipe the 3 intro pages, tap **Begin scan**, allow **camera** and **microphone** | The oval and "Frame your face" | [ ] |
| 2 | Face the camera until the bar moves on, then cover the **back camera and flash** with one fingertip, and **lift it off halfway** | Guidance to cover the camera, then "Let's try that again" with **Try again**. No portrait | [ ] |
| 3 | Tap **Try again**, keep the fingertip still about 40 seconds, then say a few words | A BPM number and waveform, then "Listening", then a portrait in about a minute. Four soft taps on reveal | [ ] |
| 4 | Wait 2 seconds on the portrait | The paywall opens by itself: $69.99 a year with "7 days free, then…", $12.99 per month, **Restore Purchases**, **Terms of Use**, **Privacy Policy** | [ ] |
| 5 | Tap **Not now ✕** | Back on the portrait | [ ] |
| 6 | Tap a number on the portrait, then **Share my color** | An explanation of that color; then a 9:16 card with "Affelion Halo" in the share sheet | [ ] |
| 7 | Go **Home** | Bottom line says **Next free scan** with a day a week away (the failed try in step 2 did not use it) | [ ] |
| 8 | Tap the main button | It says **Unlock scans** and opens the paywall | [ ] |

## B. Purchases, restore and cancel

While Pro is active the buy button reads "You already have Pro", so each purchase waits for the
one before it to end. TestFlight runs subscriptions on a fast clock (renewals come about once a
day instead of once a year), so section B is spread over two or three days, about 5 minutes each.

| # | Do this | You should see | Pass |
|---|---|---|---|
| 9 | Paywall → keep **Annual** selected → **Start my free week** → confirm with your Apple ID | Pro unlocks and the full breakdown opens. Settings shows **Pro · Annual**. You are not charged in TestFlight | [ ] |
| 10 | Delete the app, reinstall from TestFlight, open the app's **Settings → Restore Purchases** | "Restored" and "Pro is active." | [ ] |
| 11 | Settings → **Manage or cancel** → **Cancel Free Trial** | The app still shows Pro until the trial ends | [ ] |
| 12 | Next day, open the app | Home shows the free plan line again (no "Pro · unlimited") | [ ] |
| 13 | Paywall → **Monthly** → **Continue** → confirm | Pro unlocks. Settings shows **Pro · Monthly** | [ ] |
| 14 | Settings → **Manage or cancel** → **Cancel Subscription**. Next day, open the app | Free plan again | [ ] |
| 15 | Paywall → **Prefer to pay once?** → **Lifetime** → **Continue** → confirm | Pro unlocks. Settings shows **Lifetime access. Nothing renews.** | [ ] |
| 16 | Delete, reinstall, **Restore Purchases** | "Restored" and "Pro is active." Lifetime is back | [ ] |
| 17 | Turn on Airplane Mode, open the paywall | "We could not load prices" with **Try again**, no crash. Turn it off, tap Try again, prices appear | [ ] |

## C. Permissions

| # | Do this | You should see | Pass |
|---|---|---|---|
| 18 | iPhone Settings → Affelion Halo → turn **Camera** off, open the app, tap the scan button | "Camera access is needed" with **Open Settings**, which opens the right page | [ ] |

## If something fails

1. Stop the screen recording.
2. In the app: **Settings → Debug → Share report** (or the **Debug** link on the scan screen), and share it to Notes or Messages.
3. Send Claude: the step number, what you saw, the debug report, the recording, and your iPhone model, iOS version and build number.

## Results

| Device | iOS | Build | Failed steps | Notes |
|---|---|---|---|---|
| | | | | |

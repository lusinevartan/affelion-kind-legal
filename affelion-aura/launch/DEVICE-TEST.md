# Affelion Halo: first iPhone test

Use the **TestFlight** build made with `--profile testflight`. It has a **Debug** link on the scan
screen (top right, next to Stop) and in Settings. The App Store build never shows it.

About 45 minutes for the whole list on one phone. You can stop after any section.

## Before you start

- [ ] Install the TestFlight build. Note the **build number** (TestFlight shows it under the app name).
- [ ] Note your **iPhone model** and **iOS version** (Settings → General → About).
- [ ] Settings → App Store → **Sandbox Account**: sign in with a sandbox tester (App Store Connect →
      Users and Access → Sandbox → Testers; any new email works). This makes purchases free.
- [ ] Turn on **Screen Recording** in Control Center (Settings → Control Center → add Screen
      Recording). Long-press it once and turn the **Microphone** on.
- [ ] Charge above 50%. Do Not Disturb on.
- [ ] For a clean first-run test, delete any older copy of the app first.

How to mark each test: put an **x** in Pass or Fail. If it fails, follow "When something fails" at
the end before you move on.

---

## 1. First run and permissions

**1a. Allow both permissions**
1. Open the app. Read the three intro pages, tap **Continue** each time.
2. Tap **Begin scan**. Allow the **camera**, then the **microphone**.

Expected: the camera opens with an oval and "Frame your face". The permission text says the frames
and audio stay on your phone.
Pass [ ] Fail [ ]

**1b. Camera refused, then Open Settings**
1. Delete and reinstall. Tap **Begin scan**, tap **Don't Allow** for the camera.

Expected: a screen says "Camera access is needed" with **Open Settings** and **Back**. Tapping
Open Settings opens the app's page in iPhone Settings. Turning the camera on there and coming back
lets you scan. No crash, no blank screen.
Pass [ ] Fail [ ]

**1c. Microphone refused**
1. In iPhone Settings → Affelion Halo, turn the **Microphone** off. Start a scan.

Expected: a note says the voice step will be skipped, with **Open Settings**. The scan still gives a
portrait. Turn the microphone back on after.
Pass [ ] Fail [ ]

---

## 2. Outline (front camera)

Do each one, then tap **Stop** to restart.

| Test | How | Expected | Pass | Fail |
|---|---|---|---|---|
| 2a. Normal | Face centered, shoulders in frame, even light | "Hold still" within a few seconds, then it moves to the pulse step | [ ] | [ ] |
| 2b. Off center | Start with your face at the edge of the frame | It says "Frame your face" until you move into the oval | [ ] | [ ] |
| 2c. Hair | Long or loose hair over your shoulders | The outline includes your hair (check on the portrait later) | [ ] | [ ] |
| 2d. Glasses | Wear glasses | It still finds your face | [ ] | [ ] |
| 2e. Dark background | Sit against a dark wall or in a dim room | It still finds you, or keeps asking you to frame your face. No crash | [ ] | [ ] |

---

## 3. Pulse (back camera and flash)

For each one: when it says "Cover the rear camera", turn the phone over and rest your fingertip
lightly over the **camera and the flash together**. Elbow on the table. Before you start each
test, note the time so you can find it in the recording.

| Test | How | Expected | Pass | Fail |
|---|---|---|---|---|
| 3a. Normal light | Normal room, warm hands, still | A pulse number shows within about 10 seconds. "Signal" climbs above 70%. The step finishes in about 40 seconds | [ ] | [ ] |
| 3b. Dim room | Lights off or low | Still works, or asks you to cover the flash. No crash | [ ] | [ ] |
| 3c. Bright light | Near a window or under a bright lamp | Still works. If it struggles, note what it says | [ ] | [ ] |
| 3d. Finger lifted | Lift your finger off for 3 seconds halfway through, then put it back | It says "Cover the rear camera", pauses the timer, and continues when you cover it again | [ ] | [ ] |
| 3e. Finger moving | Keep your finger on but wiggle the phone the whole time | After about 15 seconds it says "Hold steadier". Then either a portrait from the steady part or "Let's try that again" | [ ] | [ ] |
| 3f. Flash half covered | Cover only the lens, not the flash | It says "Cover the flash too" | [ ] | [ ] |
| 3g. Cold fingers | Hold your hand under cold water for 30 seconds, dry it, then scan | Slower to find a pulse, or "Let's try that again". Never a color from a bad signal | [ ] | [ ] |
| 3h. Pressing hard | Press firmly on the lens | It says "Press a little lighter", or the signal drops. No crash | [ ] | [ ] |

On any test above, after the scan, tap **Debug** and check "Reading gate". A good scan says
**PASS**. A bad one says **RETRY** and why.

---

## 4. Voice (microphone)

| Test | How | Expected | Pass | Fail |
|---|---|---|---|---|
| 4a. Quiet room | Say "Hi, this is my one-minute check-in" at a normal volume | "Listening", then the portrait. The voice number on the portrait is not "—" | [ ] | [ ] |
| 4b. Noisy room | TV or music on in the room, then speak | It still finishes. Note if it says "A little louder" | [ ] | [ ] |
| 4c. Silent | Say nothing at the voice step | "Voice sample too quiet" with **Try again** and **Skip voice**. Skip voice still gives a portrait | [ ] | [ ] |

---

## 5. The portrait

**5a. Reveal and heartbeat taps**
1. Finish a good scan.

Expected: the portrait appears with your color, and you feel **four soft taps** at about your own
pulse. The pulse is labeled "Pulse, approx." and the disclaimer is under the buttons.
Pass [ ] Fail [ ]

**5b. Tap the numbers**
1. Tap the **1** and **2** circles on the portrait.

Expected: each explains which reading made that color, in plain words.
Pass [ ] Fail [ ]

**5c. Share my color**
1. Tap **Share my color**. Pick Instagram Stories, or Save Image.

Expected: a tall 9:16 card with your portrait, the color name, its meaning, the date, and (on the
free plan) **Affelion Halo** at the bottom right. Nothing cut off.
Pass [ ] Fail [ ]

**5d. Save**
1. Tap **Save**. Allow adding to Photos.

Expected: a Polaroid-style picture appears in your Photos.
Pass [ ] Fail [ ]

---

## 6. Free plan and paywall

Start from a **fresh install** (delete and reinstall) for this section.

**6a. A failed scan does not use the free scan**
1. Start a scan and lift your finger off for the whole pulse step until it says "Let's try that
   again". Tap **Stop**.
2. Go Home.

Expected: Home still says "Your free scan is ready".
Pass [ ] Fail [ ]

**6b. Paywall after the first portrait**
1. Do a good scan.

Expected: the portrait shows first. About **2 seconds later** the paywall opens on its own: "Keep
your Halo", Annual with "7 days free, then $69.99 per year", Monthly, Restore Purchases, Terms of
Use, Privacy Policy, "Not now ✕". Prices are the store's (not a guess). The paywall never appears
while the scan is still running.
Pass [ ] Fail [ ]

**6c. Not now**
1. Tap **Not now ✕**.

Expected: you are back on the same portrait.
Pass [ ] Fail [ ]

**6d. Next free scan**
1. Go Home.

Expected: the line under the button says "Next free scan" with a day about a week away. The main
button says **Unlock scans** and opens the paywall instead of the camera.
Pass [ ] Fail [ ]

---

## 7. Purchases (sandbox, no real money)

**7a. Annual with the free week**
1. Open the paywall (Home → **Unlock scans**). Annual is selected. Tap **Start my free week**.
   Confirm with the sandbox account.

Expected: Pro unlocks. The full breakdown opens. Home says "Pro · unlimited".
Pass [ ] Fail [ ]

**7b. Restore after reinstall**
1. Delete the app. Reinstall from TestFlight. Settings in the app → **Restore Purchases**.

Expected: a message says "Restored" and "Pro is active." Settings shows "Pro · Annual". No sign-in asked.
Pass [ ] Fail [ ]

**7c. Cancel and expiry**
1. iPhone Settings → App Store → Sandbox Account → **Manage** → cancel the subscription.
2. Wait for it to end (a sandbox year lasts about an hour; a sandbox month about five minutes).
3. Leave the app and come back.

Expected: Pro locks again. Home shows the free-scan line.
Pass [ ] Fail [ ]

**7d. Monthly**
1. Use a second sandbox tester (or wait for 7c to expire). Paywall → **Monthly** → **Continue**.

Expected: Pro unlocks. The monthly line says "Billed every month. Cancel anytime." with no trial.
Pass [ ] Fail [ ]

**7e. Offline paywall**
1. Turn on Airplane Mode. Delete and reinstall. Open the paywall.

Expected: "We could not load prices" with **Try again**. No crash, no blank screen, the buy button
is off. Airplane Mode off, **Try again**: prices appear.
Pass [ ] Fail [ ]

---

## 8. Breathing practice (optional, 3 minutes)

1. From Home, tap **First practice, free**, then **Begin**. Follow the breathing.

Expected: the portrait moves with your breathing. At the end, a Before and After with real
numbers. No crash if you lift your finger briefly.
Pass [ ] Fail [ ]

---

## When something fails

Do these four things, then move on to the next test.

1. **Stop the screen recording** right after it fails, so the clip includes the failure.
2. **Tap Debug** (scan screen top right, or Settings → Debug) and tap **Share report**. Send it to
   yourself (Notes or Messages). The numbers Claude needs most:
   - **Signal quality** and **BPM** (live)
   - **beats accepted** and **finger covered** seconds
   - **Coverage** (ok, noFinger, tooDark, saturated or notRed)
   - **Reading gate**: PASS or RETRY, and the reason
   - **Voice** level, voiced seconds, pitch and final quality
   - **Last failure**
3. Take a **screenshot** of the screen where it went wrong.
4. Send Claude this message (copy and fill in):

```
Halo device test: FAIL
Test: [number and name, for example 3d Finger lifted]
iPhone: [model], iOS [version], build [number]
What I did: [one or two sentences]
What I expected: [from the checklist]
What happened: [what you saw, including any words on screen]
Debug report:
[paste the Share report text]
Screen recording: [attached / link]
```

If the app crashes: reopen it, note the time, and say "crashed" in the message. TestFlight also
asks to send a crash report; tap **Share**. That reaches App Store Connect, where Claude can read it
once you paste the report text.

## Results

Copy your Pass/Fail marks into the **Real-device test log** in `launch/STATUS.md` (one row per
phone), or send them to Claude and Claude fills it in.

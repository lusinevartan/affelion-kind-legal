# Wording audit (M7 and item 8)

Nov 20, 2026. Searched the app source (`src/`, including Sasha's built-in answers, onboarding,
scan guidance, paywall, notifications), the listing (`launch/APP-STORE-LISTING.md`), the public
pages (`aura-support.html`, `aura-privacy.html`), the docs and the investor deck for: stress,
anxiety, depression, diagnose, medical, health, heal, cure, treat, monitor, detect, energy field,
spirit, chakra, psychic, predict, future, manifest, fortune, clinical, ECG, accurate, nervous
system, blood pressure, disease, symptom, doctor. Rules: `launch/CLAUDE-HALO-LAUNCH.md` section 4.

The app sends no notifications in 1.0, so there were none to check.

## Changed

**Name:** "Affelion Aura" became "Affelion Halo" everywhere a person can read it (Nov 20, Lusine's decision): screens, paywall, story card, permission text, listing, Review Notes, policies, docs, Sasha, deck and store art. Quotes of the old listing text below keep the old name.

| Where | Before | After |
|---|---|---|
| Bad reading (scan) | "That reading came out at about N beats a minute, outside the range this app reads well. Sit still for a minute and try again. If you feel unwell, talk to a doctor. This app is not a medical device." | "We couldn't get a clear reading. Try again sitting still, with your fingertip covering the camera and flash." (same line for any noisy or out-of-range reading) |
| Bad reading (scan) | "We could not get a clear pulse that time. Rest your fingertip lightly… This try did not use your free scan." | Same neutral line as above |
| Scan retry title | "Pulse reading failed" | "Let's try that again" |
| Portrait | "For reflection and wellness, not a medical reading. The pulse is an estimate from your phone camera." | Standard disclaimer + "Your pulse is approximate, read through your phone camera." |
| Full breakdown | "Not a medical device. For health concerns, speak with a clinician." (light gray, tiny) | Standard disclaimer + approximate-pulse line, in readable gray |
| How it works, intro | "Affelion Halo makes a picture of how your body is doing right now. It reads your heartbeat and your voice… It is not magic… It is not a medical device." | "Affelion Halo is a one-minute check-in. It takes your approximate pulse and your voice and turns those numbers into color around your photo. Every color traces to a number. It does not see invisible light or read energy." |
| How it works, footer | "Not a medical device. For health concerns, speak with a clinician." | Standard disclaimer |
| Settings, About | "…It does not detect energy fields, make predictions or diagnose anything. It is not a medical device…" | "…It does not read energy fields or make predictions…" + standard disclaimer as its own paragraph |
| Onboarding, page 1 | "Affelion Halo turns your real heart rate, how much it varies, and your voice into a living color portrait. It does not capture invisible light." | "A one-minute check-in. Affelion Halo turns your approximate pulse, how much it varies, and your voice into a living color portrait. Every color traces to a number." |
| Portrait figures | "Pulse" | "Pulse, approx." |
| Sasha, health question | "Affelion Halo is not a medical device and cannot assess health conditions. It visualizes a short pulse and voice sample. If you have a health concern, please talk to a doctor." | "Affelion Halo is for wellness and self-reflection. It is not a medical device and cannot tell you anything about a health condition. It turns a short pulse and voice sample into color. Talk to a doctor about any health concern." |
| Sasha, pulse question | "Your pulse averaged N beats a minute." | "Your pulse was about N beats a minute, read through your phone camera." |
| Deep red, meaning | "Strong stress or intensity" | "Keyed up and intense" |
| Deep red, why | "…Your body was working hard or under strain." | "…Your body was working hard during the scan, which can come from exercise, coffee, excitement or a busy day." |
| Story card footer | "For reflection, not a medical reading" | "Made from my pulse and voice" |
| Listing subtitle | "Aura reading from your pulse" | Kept as is (Lusine's choice in the Nov 20 package, for search). Flagged: "aura reading" is close to the fortune-telling wording Apple screens under 4.3(b); fallback "Your heartbeat, in color". |
| Listing keywords | …reading…hrv | dropped "reading" and "hrv" (a health metric), added "art", "reflect" |
| Support page, practice | "What it trains is heart-rate variability and coherence… for health concerns, speak with a clinician." | "You can watch how your heart rhythm follows slow breathing, with a before and after color…" + standard disclaimer |
| Old listing draft (`docs/STORE_LISTING.md`) | Keywords "…stress…hrv…coherence…", category Health & Fitness first, age 4+ | Retired; points to the launch listing |
| Investor deck, slide 4 | "…agree closely with ECG for resting heart rate…" | "…gives a usable resting pulse in healthy adults. The app still calls it approximate." |

## Checked and kept

- "Not a medical device" on Home's footer line: short form; the full disclaimer is on the portrait, breakdown, How it works and Settings.
- Practice: "Stop if you feel light-headed and breathe normally." A safety line for paced breathing, not a health claim.
- "Low energy", "tiredness", "need for rest", "low tension" in the plain color meanings: everyday mood words, no condition named.
- The original color knowledge base (`COLOR_KNOWLEDGE_BASE`, e.g. "Intense activation or stress", "Healing and heart-centered balance") is not shown anywhere in the 1.0 app. It is only in the Sasha server prompt, which is off in 1.0. Flag for the Sasha server phase (E): replace those two phrases before the server goes live.
- The banned-phrase filter (`src/core/color/explain.ts`) checks every generated sentence and every AI reply; its word list is a rule, not copy.
- Android Health apps declaration notes in the listing: Play policy terms, required as written.

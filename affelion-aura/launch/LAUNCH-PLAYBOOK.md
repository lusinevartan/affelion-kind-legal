# Affelion Halo: Launch Playbook (Day 0 to Day 30)

**For:** Claude Code, working for Lusine Vartan (Affelion LLC, affelion.com)
**Starts:** the moment Apple approves iPhone 1.0 ("Day 0"). No calendar dates are used anywhere; count days from approval.
**Companion files:** `CLAUDE.md` (wording rules, section 4), `STATUS.md`, `APP-STORE-LISTING.md`, `creators-research.md` (sources for every creator), `launch-tracker.csv`.
**Research date:** creators, follower counts, links and rules were checked on 2026-11-19. Recheck each creator's profile before contacting them.

---

## 0. The product in one paragraph (use this, don't improvise)

Affelion Halo is a one-minute check-in. You rest a fingertip on the phone camera and say a few words; Halo turns your approximate pulse and the steadiness of your voice into one of 20 colors, shown as a fluid portrait moving at the pace of your own heartbeat. Tagline: **"Your heartbeat, in color."** Every color traces back to a number you can tap and see. Processing stays on the phone. Free: the first scan, then one free scan a week. Pro: annual $69.99 with a 7-day free trial (default), monthly $12.99, lifetime $199 behind a "Prefer to pay once?" link. Every portrait can be shared as a 9:16 "Share my color" story card. Hero color: **magenta**. Sister apps Pop and Bible are live. Instagram: **@affelion.app**.

---

## 1. Rules for Claude (read before every session)

### 1a. What you do vs. what Lusine does

| Claude prepares (always) | Only Lusine does (never Claude) |
|---|---|
| Reel scripts, captions, hashtags, on-screen text | Filming herself, posting anything on any account |
| DM and email drafts, saved as files | Sending any DM, email, comment or reply |
| Product Hunt copy, gallery list, maker comment | Creating and launching the Product Hunt post |
| Reddit post drafts with each sub's rules checked | Posting on Reddit, messaging moderators |
| Press pitches and a press kit folder | Sending pitches, filling in tip forms |
| The offer-code plan (names, counts, who gets what) | Creating offer codes in App Store Connect / Play Console |
| Boost recommendations with numbers | Spending any money (boosts, creator fees) |
| Pop/Bible cross-promo card code on a branch | Approving, submitting and releasing app updates |
| Updating `launch-tracker.csv` and `STATUS.md` from numbers Lusine pastes in | Reading App Store Connect / RevenueCat dashboards and pasting the numbers |

When something needs Lusine, add it to **"Lusine does"** in `STATUS.md` with exact click-by-click steps, then keep working on the next Claude item. Never wait idle.

### 1b. Safe wording (applies to every reel, caption, DM, email, pitch and post)

Follow `CLAUDE.md` section 4. The short version:

| Say | Never say |
|---|---|
| a one-minute check-in | stress test, health check, heart check |
| your pulse and voice, turned into color | reads your energy, aura field, scans your spirit |
| for reflection and self-expression | diagnoses, detects, monitors, treats, heals |
| approximate pulse from your phone camera | medical-grade, accurate as an ECG/wearable |
| a calm color often follows a slower pulse | reveals anxiety, depression, heart problems |
| every color traces to a number | psychic, predicts, chakra, manifest, vibration, energy field |

Extra rules for social:
1. **No health or diagnosis claims.** Don't say coffee "spikes your stress", a workout "fixes your mood", or breathing "lowers blood pressure". Say what changed: "my pulse was faster, so my color shifted".
2. **No energy-field claims.** Halo is not an aura camera and doesn't read energy. When a creator's own content talks about energy, our script still doesn't.
3. **Only real scans.** Every color shown in a reel must come from a real scan filmed that day. Never fake or stage a result. If the "after" color doesn't change, post that honestly ("Still Muted Gray. Coffee didn't do it today.") because that's on-brand too.
4. **Color names come from the app.** Use only names from the app's 20-color table in the repo. Names used in this playbook (Magenta, Golden Yellow, Muted Gray, Sky Blue, Deep Red) must be checked against that table before filming; swap in the real name if one differs.
5. **No other app names or prices in the App Store listing.** Prices may appear in social captions only when they match the live paywall.
6. **Disclosure.** Any creator who gets free Pro, a code, or money must label the post (#ad, #gifted, or the platform's paid-partnership tag). Say so in every outreach message.
7. **Don't use minors.** The original "aura farming" clip features a child. Never use, remix or tag it.
8. Say **"Affelion Halo"** (not just "Halo") in pitches, posts and the store name. "Halo" alone is crowded: Microsoft owns HALO for its game franchise, Amazon Halo was a wellness band and app (discontinued in 2023, and Amazon still has a pending HALO application covering wellness services), and the App Store already has many Halo apps in Health & Fitness (dog collars, brain stimulation, mental wellness, habit trackers). Use "aura" only for the trend and the color idea (#aura, "aura colors"), never as the app's name. See `NAME-CHECK.md`.

### 1c. Budget

Lusine is paying down debt. The default spend is **$0**. The only money in this plan:
- **Boost pool: $300 maximum, total**, used only under the rules in Day 10 and section 2f.
- **Optional mid-tier creator fees: $0 by default.** Only if the tracker shows ≥3% install→paid by Day 14 may Claude *recommend* up to **$150 total** (for example, one $75–$150 flat fee). Lusine decides and pays.

---

## 2. Day 0 to Day 30 checklist

Format: **[Owner] Action** → *Done when*. Tick items in `STATUS.md`. "L" = Lusine, "C" = Claude.

### 2a. While Halo is still in review (do before Day 0 if there's time)

- [ ] **[C]** Build the Pop and Bible "Try Halo" cross-promo cards on a branch in each repo. Pop: "Your heartbeat, in color. Try Affelion Halo, free." Bible wording (per CLAUDE.md): "A calm one-minute heartbeat check-in and breathing practice." Card links to the App Store page with campaign tokens (`ct=pop_card`, `ct=bible_card`). Shown once, dismissible, never above core content. → *Done when* builds pass, screenshots are saved in `/docs/crosspromo/`, and an item is under "Lusine does" to submit both updates.
- [ ] **[C]** Write the press kit in `/press/`: one-paragraph description (section 0), founder bio (from deck slide 14), 6 screenshots, 3 portrait PNGs (magenta, golden yellow, sky blue), app icon, a 20-second screen recording, a fact sheet (price, platforms, privacy). → *Done when* the folder exists and every claim passes the wording table.
- [ ] **[C]** Draft all 14 reels (section 2c) into `/social/reels/day-XX.md`. → *Done when* 14 files exist.
- [ ] **[C]** Draft creator DMs and emails for Waves 1–3 (section 3) into `/outreach/wave-N/handle.md`, one file per creator, filled in. → *Done when* every row in the creator table has a draft.
- [ ] **[C]** Write the offer-code plan (section 3d) to `/outreach/offer-codes.md`. → *Done when* it lists every code name, type, count and recipient.
- [ ] **[L]** Nominate Halo's **first update** for featuring: App Store Connect → Featuring → Nominations → Create, pick "App Update", attach the press kit description. Apple asks for at least 3 weeks' notice. → *Done when* the nomination shows "Submitted".
- [ ] **[L]** Submit Halo to Fresh Install's early issue: https://freshinstall.app/submit (email + App Store link once live). → *Done when* the form confirms.

### 2b. Day 0 to Day 30

**Day 0: Approved**
- [ ] **[L]** Release the app (manual release) on iPhone. → *Done when* the App Store page loads for a logged-out user.
- [ ] **[C]** Listing live check: open the public App Store URL and check the name, subtitle, screenshots (magenta, no "test build" text), price list under In-App Purchases ($69.99/yr, $12.99/mo, $199 lifetime), privacy label, age rating, support and privacy URLs (they must load). → *Done when* a checklist with ✅/❌ is in `STATUS.md`; any ❌ goes to "Lusine does".
- [ ] **[L]** On your own phone, install from the store and do one full real purchase flow: first scan → portrait → paywall appears → "Not now" returns to portrait → start the trial → cancel in Settings → Restore. → *Done when* each step works; screenshot anything broken and give it to Claude.
- [ ] **[L]** Submit the Pop and Bible updates with the cross-promo card. → *Done when* both say "Waiting for Review".

**Day 1: Launch posts**
- [ ] **[C]** Launch post pack in `/social/launch/`: an IG carousel (5 slides: hook "Your heartbeat, in color." → how it works in 3 steps → 3 portraits → "every color traces to a number" → "Free to try. Link in bio."), an IG Story sequence (4 frames with link sticker), a founder post for LinkedIn and X, and a short note to Pop and Bible users if Lusine has a mailing list. → *Done when* copy and image specs are ready.
- [ ] **[L]** Post the carousel and Stories on @affelion.app, put the App Store link in bio, and post the founder note on LinkedIn/X. → *Done when* they're live; paste the links to Claude.
- [ ] **[L]** Film and post Reel 1 (section 2c).
- [ ] **[C]** Add the Day 1 row to `launch-tracker.csv` from the numbers Lusine pastes in.

**Days 1–14: Daily reel** (section 2c has every script)
- [ ] **[L]** Film and post that day's reel on IG Reels and TikTok (same file). Takes about 15 minutes. → *Done when* posted; paste both links to Claude.
- [ ] **[C]** Next morning: log views, saves, shares and profile taps (Lusine pastes them in) in the tracker; flag the top reel of the week.

**Day 2: Creator Wave 1 (10 micro creators)**
- [ ] **[C]** Recheck each Wave 1 profile: still active (a post in the last 30 days), follower count roughly matches, and no new content that clashes with the wording rules. Drop anyone who fails and promote the next name in the same niche. → *Done when* the final Wave 1 list is in `/outreach/wave-1/README.md`.
- [ ] **[L]** Create a one-time-use offer code (1 year of Pro) for each Wave 1 creator plus a custom follower code (section 3d). → *Done when* codes are pasted into `/outreach/offer-codes.md` (keep this file out of public repos).
- [ ] **[L]** Send the Wave 1 DMs/emails from Affelion's accounts, copying from the draft files. → *Done when* each row in the tracker says "sent".

**Day 3: Reddit, round 1**
- [ ] **[C]** Draft r/SideProject and r/iosapps posts (section 4c) and check each sub's current rules again. → *Done when* drafts are in `/community/reddit/`.
- [ ] **[L]** Post on r/SideProject. For r/iosapps, use the App Shelf megathread unless you meet the Transparency rule (real name + affelion.com with privacy policy and terms), then the main feed with the ABC format. Reply to every comment for 24 hours. → *Done when* posted; links pasted to Claude.

**Day 4: Newsletters and directories**
- [ ] **[C]** Draft a 50-word blurb and a 150-word blurb for directory forms. → *Done when* saved in `/press/blurbs.md`.
- [ ] **[L]** Submit to: Stamped (stampedios.com), Indie Dev Monday "Look at me", Swipe indie showcase, Indie App Catalog, indiecatalog.app news, Hacking with Swift App Announcements, MacRumors iOS Apps forum, r/IndieAppNews. → *Done when* each one is ticked in the tracker.

**Day 5: Press pitches, round 1**
- [ ] **[C]** Personalize pitches (section 3f) for 9to5Mac (tip form), The Sweet Setup (contact form), MacStories, and mindbodygreen (submit@mindbodygreen.com). → *Done when* four drafts are saved.
- [ ] **[L]** Send them. → *Done when* sent.

**Day 6: Wave 1 follow-up**
- [ ] **[L]** Send the one-line follow-up (section 3c) to Wave 1 creators who haven't replied. Never follow up more than once.

**Day 7: Week 1 review**
- [ ] **[C]** Write the week 1 review in `STATUS.md`: installs, first scans, successful readings ÷ scans started, paywall views, trial starts, install→trial %, shares, top 2 reels, creator replies. Apply the decision rules in `launch-tracker.csv`. → *Done when* the review lists one decision ("fix paywall/first scan", "keep going", or "double down on reel X").
- [ ] **[L]** Ask Pop/Bible users for nothing; just confirm the cross-promo cards are live and log card taps.

**Day 8: Creator Wave 2 (10 more micro and mid)**
- [ ] **[C]** Recheck profiles (same as Day 2). Use the week 1 top reel as the example video link in the DM.
- [ ] **[L]** Create codes, then send Wave 2. → *Done when* sent.

**Day 9: Product Hunt prep**
- [ ] **[C]** Product Hunt kit in `/community/producthunt/`: name "Affelion Halo", tagline (60 characters max, e.g. "Your heartbeat, in color: a one-minute check-in"), description, 5 gallery images (1270×760), a 30-second video, the first maker comment (the "why I built it" story, honest about it being for reflection, not health), and topics (iPhone, Design Tools or Lifestyle, Health & Fitness only if PH requires a category; keep the copy non-medical). → *Done when* the kit is complete.
- [ ] **[L]** Schedule the post on Product Hunt for a weekday 1–30 days out (we target Day 14). Post it yourself and check "I made this". It goes live at 12:01 AM Pacific. → *Done when* scheduled.

**Day 10: Boost decision (only if earned)**
- [ ] **[C]** Check the boost rules (section 2f). If a reel qualifies, recommend which one and the first $50. If none qualifies, write "No boost" and stop. → *Done when* the recommendation is in `STATUS.md`.
- [ ] **[L]** If recommended and you agree: boost that reel on Instagram for $50 over 3 days, audience 18–34, interests astrology, self-care, color, photography; goal "profile visits" or "website" to the App Store link. → *Done when* the boost is live, or you've decided not to.

**Day 11: Reddit, round 2 (communities, not promo)**
- [ ] **[C]** Find 3 existing threads asking for "aura app", "mood color app", "unique iPhone apps" or "daily check-in app" where a reply is genuinely useful. Draft replies that disclose "I made this". → *Done when* drafts are saved.
- [ ] **[L]** Post the replies that still fit. For r/iphone, message the moderators first if you want to post a top-level thread.

**Day 12: Press pitches, round 2 (lifestyle angle)**
- [ ] **[C]** Pitch angle: "A designer built an app that paints your heartbeat. It refuses to tell you your future." Targets: mindbodygreen (if no reply), Well+Good, Refinery29, The Cut. Find each outlet's current published tip or pitch route; do not guess emails. → *Done when* drafts and routes are saved.
- [ ] **[L]** Send.

**Day 13: Wave 2 follow-up + Product Hunt warm-up**
- [ ] **[L]** One follow-up to Wave 2 non-replies.
- [ ] **[C]** Draft a short note to friends, Pop/Bible users and early testers: "We're on Product Hunt tomorrow, we'd love honest feedback." No "please upvote" wording (Product Hunt discourages vote requests).

**Day 14: Product Hunt launch day + two-week review**
- [ ] **[L]** Be online from 12:01 AM PT for the first hours. Post the maker comment, reply to every comment all day, share the PH link on @affelion.app Stories, X and LinkedIn. → *Done when* the day ends; paste the final rank and comment count to Claude.
- [ ] **[C]** Two-week review in `STATUS.md` with the decision rules. Decide: keep daily reels, or switch to 3 a week, repeating the format of the top 2 reels.
- [ ] **[C]** If install→paid is ≥3%, write the optional mid-tier paid proposal (max $150 total) with the creator, fee and deliverable. Otherwise write "No paid creators."

**Days 15–21: Repeat what works**
- [ ] **[C]** Write 6 new reel scripts that remix the top 2 formats (same hook structure, new situations). → *Done when* saved in `/social/reels/week-3/`.
- [ ] **[L]** Post at least 3 of them.
- [ ] **[L]** (Day 15) Send creator Wave 3 (mid and stretch names) only if at least 2 Wave 1–2 creators posted or the top reel beat 10K views. Otherwise skip Wave 3.
- [ ] **[C]** (Day 17) Thank-you notes to every creator who posted; ask if they'd like to do a second "compare with a friend" video.
- [ ] **[C]** (Day 18) Prepare the first In-App Event idea for App Store Connect (e.g. "Color of the Week") and a short "what's new" for the first update. → *Done when* drafted under "Lusine does".
- [ ] **[C]** (Day 21) Week 3 review + decision rules.

**Days 22–30: Lock in and plan month 2**
- [ ] **[C]** (Day 22) Ratings check: count reviews and stars; if the in-app rating prompt isn't live yet (after the 2nd successful portrait), put it at the top of the next update.
- [ ] **[L]** (Day 22–28) Post 3 reels a week minimum; reply to every comment on the top reel.
- [ ] **[C]** (Day 25) Android readiness note: what's left for Play (business account, so no tester wait).
- [ ] **[C]** (Day 28) Recheck every boost against the stop rules; recommend ending all boosts by Day 30.
- [ ] **[C]** (Day 30) **30-day report** in `STATUS.md` and a one-page summary for the investor deck: installs, install→trial %, trial→paid %, install→paid %, Day 7 return rate, share rate, revenue, best reel, best creator, money spent vs $300 cap, and the month-2 plan. → *Done when* the report exists and every number names its source (App Store Connect, RevenueCat, Instagram Insights).

### 2c. The 14-day reel calendar (full scripts)

**How to film every reel:** iPhone, vertical 9:16, natural light, phone on a stack of books for the scan shot. Show the real scan screen and the real portrait. Use a trending sound that's allowed for business accounts (on TikTok use the Commercial Music Library; on IG use the Reels audio browser). Keep reels 7–15 seconds. On-screen text stays in the top two-thirds so captions don't cover it. End frame: the "Share my color" story card for 1 second.

**Hashtag sets** (pick one set per reel, 3–5 tags; never use health tags like #anxiety or #hearthealth):
- A: #aura #auracolors #whatsmyaura #aurachallenge #affelionhalo
- B: #beforeandafter #coffeetok #morningroutine #affelionhalo
- C: #iphoneapps #appsyouneed #appoftheday #affelionhalo
- D: #selfcare #checkin #slowliving #affelionhalo
- E: #colortok #coloranalysis #whatsmycolor #affelionhalo

---

**Reel 1 (Day 1): "Before coffee / after coffee"** (the flagship trend)
- Hook (text, first second): "Before coffee vs. after coffee, measured."
- Shots: (1) 0–2s bed-hair, phone in hand, fingertip on camera. (2) 2–4s portrait reveal: Muted Gray. (3) 4–6s coffee being poured, sip. (4) 6–9s same scan 20 minutes later. (5) 9–12s reveal: Golden Yellow. (6) 12–13s share card.
- On-screen text: "Before coffee: Muted Gray." → "After coffee: Golden Yellow." → "It's my real pulse + voice. Every color traces to a number."
- Caption: "Before coffee, Muted Gray. After coffee, Golden Yellow. Same girl, faster pulse, different color. What's yours before coffee? ☕ Affelion Halo, free on iPhone (link in bio)."
- Hashtags: set B.
- If the color doesn't change: post it anyway with "Coffee didn't touch me today. Still Muted Gray."

**Reel 2 (Day 2): "What color am I right now?"** (pure reveal)
- Hook: "My phone just told me what color I am."
- Shots: close-up fingertip on camera (3s), say one sentence into the mic (2s), slow reveal of the magenta portrait (4s), tap a number to show where it came from (3s).
- On-screen text: "One minute. My pulse + my voice." → "Today I'm Magenta." → "Tap any color and it shows you the number behind it."
- Caption: "Today I'm Magenta. Not a filter, not a quiz: my actual pulse and voice turned into one of 20 colors. Comment your guess for tomorrow."
- Hashtags: set A.

**Reel 3 (Day 3): "After a workout vs. after breathing"**
- Hook: "Post-workout me vs. 3-minutes-of-breathing me."
- Shots: sweaty after a walk or workout, scan (3s) → reveal (2s, warm color) → sit, do the in-app breathing practice (3s, show screen) → scan again (2s) → reveal (2s).
- On-screen text: "Just finished a run: [color]." → "3 minutes of breathing later: [color]." → "A calm color often follows a slower pulse."
- Caption: "Same afternoon, two colors. Breathing practice is built in. Which one are you right now?"
- Hashtags: set D.

**Reel 4 (Day 4): "Guess my color"** (engagement bait that stays honest)
- Hook: "Guess my color before I scan. Wrong answers only."
- Shots: talk to camera for 3s ("Long day, guess"), scan (3s), freeze frame before the reveal with text "Comment your guess" (2s), reveal (3s).
- On-screen text: "Guess first 👇" → "[real color]."
- Caption: "Did anyone get it? Next one: I'll scan whoever's guess was closest... with their color in the comments."
- Hashtags: set A.

**Reel 5 (Day 5): "The app that won't tell you your future"** (positioning)
- Hook: "I made an aura app that refuses to read your future."
- Shots: Lusine at her desk, face to camera (3s), screen recording of a scan and the full breakdown screen (6s), share card (2s).
- On-screen text: "No psychics. No horoscopes." → "Just your pulse + voice → one of 20 colors." → "Every color shows its numbers."
- Caption: "I'm a designer, and I wanted the aura trend with receipts. Affelion Halo turns your real pulse and voice into color, and shows you exactly why. Free to try."
- Hashtags: set C.

**Reel 6 (Day 6): "Monday vs. Friday"** (can be filmed as two scans on the same day if needed; say so)
- Hook: "Monday me vs. Friday me."
- Shots: split screen, left Monday scan + color, right Friday scan + color.
- On-screen text: "Monday: [color]." → "Friday: [color]." (If filmed the same day, add "filmed back to back, honest.")
- Caption: "Is your Friday color different from your Monday color? Your first scan's free, then one free scan a week."
- Hashtags: set D.

**Reel 7 (Day 7): "Couples compare"** (or best friend)
- Hook: "We scanned at the same time. Guess who's who."
- Shots: two people side by side (3s), both scanning (3s), two reveals (4s), reactions (2s).
- On-screen text: "Me: [color]. Him/her: [color]." → "Same couch, different heartbeat."
- Caption: "Tag the person whose color you want to see next to yours."
- Hashtags: set A.

**Reel 8 (Day 8): "What the 20 colors mean"** (save-bait carousel or fast reel)
- Hook: "All 20 Affelion Halo colors in 10 seconds."
- Shots: quick cuts of each color's card from the app (0.5s each).
- On-screen text: each color name + its plain-words meaning from the app (copy exactly from the app's color table, no new meanings).
- Caption: "Save this and tell me which one you got. Meanings are written to describe the moment, not predict anything."
- Hashtags: set E.

**Reel 9 (Day 9): "Aura points, but with real data"** (aura-farming/aura-points trend)
- Hook: "-1000 aura points? Let's check with actual data."
- Shots: a small fail (coffee spill, door fail; Lusine herself, no other people's clips) (2s), scan (3s), reveal (2s), "Still Magenta. Aura intact." (2s).
- On-screen text: "Dropped my coffee. -1000 aura." → "Scanned anyway: [real color]." → "Aura status: intact."
- Caption: "The aura-points police can't touch me. Real pulse, real color. Free on iPhone."
- Hashtags: #aurapoints #aura #affelionhalo #relatable

**Reel 10 (Day 10): "Before a date / before a call"**
- Hook: "Pre-first-date scan."
- Shots: getting ready (3s), scan (3s), reveal (2s), "after" scan on the way home (3s, optional), reveal (2s).
- On-screen text: "Before: [color]." → "After: [color]." (Never say "anxious" or "nervous"; say "keyed up" only if the app's color meaning uses those words.)
- Caption: "Before vs. after. What would your pre-date color be?"
- Hashtags: set A.

**Reel 11 (Day 11): "How it works in 10 seconds"** (explainer for skeptics)
- Hook: "No, it's not a filter. Here's how it works."
- Shots: fingertip over camera with flash (2s), voice sentence (2s), "measuring" screen (2s), full breakdown screen with numbers (3s), portrait (2s).
- On-screen text: "Fingertip on camera → approximate pulse." → "Say a sentence → voice steadiness." → "Numbers → one of 20 colors." → "Processed on your phone."
- Caption: "Halo is for reflection, not a medical reading. It just paints what it measures, and shows you the math."
- Hashtags: set C.

**Reel 12 (Day 12): "Sunday reset"**
- Hook: "Sunday reset, in color."
- Shots: candle, tea, journal (3s), scan (3s), reveal (2s), share card added to IG Story (3s).
- On-screen text: "My weekly free scan." → "This week: [color]." → "Saving these every Sunday."
- Caption: "Your free scan resets every week. This is my new Sunday ritual."
- Hashtags: set D.

**Reel 13 (Day 13): "Founder story"**
- Hook: "I'm a designer, and this is my 5th app."
- Shots: Lusine to camera (4s), quick cuts of Pop, Bible, then Halo (4s), Halo portrait (2s).
- On-screen text: "Solo founder. 5th app." → "This one paints your heartbeat." → "Built to be honest: every color shows its numbers."
- Caption: "Affelion Pop and Bible are already out there. Halo is the one I'm proudest of. Tell me what to build next. (We're on Product Hunt tomorrow.)"
- Hashtags: set C.

**Reel 14 (Day 14): "Comment and I'll scan" / Product Hunt day**
- Hook: "You picked it. I scanned it."
- Shots: screenshot of the top comment from Reel 4 or 7 (2s), Lusine does the situation it asked for (e.g. "scan after 10 jumping jacks") (4s), reveal (2s), "We're live on Product Hunt today" (2s).
- On-screen text: "Your challenge: [comment]." → "Result: [color]."
- Caption: "Keep the challenges coming. Affelion Halo is on Product Hunt today, and honest feedback is welcome."
- Hashtags: set A.

### 2d. Pop and Bible cross-promo cards (spec)
- Pop card: title "Your heartbeat, in color."; body "Try Affelion Halo, a one-minute check-in that turns your pulse and voice into color. Free to try."; button "See Halo". Show after a user's 3rd session, once, dismissible.
- Bible card: title "A calm one-minute check-in"; body "From the makers of this app: a heartbeat check-in with a breathing practice."; button "Learn more". Don't use the word "aura" in a spiritual sense in Bible.
- Both link to the App Store product page with a campaign token. Done when App Store Connect → App Analytics → Sources shows the campaign.

### 2e. Product Hunt (summary)
Self-post, "I made this", scheduled 1–30 days ahead; live 12:01 AM PT; featuring is editorial (https://help.producthunt.com/en/articles/479557-how-to-post-a-product). Don't ask for upvotes; ask for feedback. Lusine replies to every comment on the day.

### 2f. The $300 boost: rules
- **Eligible reel:** organic for at least 48 hours, and in the top 10% of our reels by views **and** at least one of: profile taps ≥ 2% of views, or a visible jump in App Store installs that day.
- **Start:** $50 over 3 days on one reel. Only after Day 7, and only once the week 1 review shows install→trial ≥ 5% (otherwise the paywall/first scan gets fixed first).
- **Measure:** cost per trial start = boost spend ÷ extra trial starts on boost days vs. the 3-day average before.
- **Keep going** if cost per trial start is **under $8**: add $50 at a time.
- **Stop** a boost if cost per trial start is **over $15 after $150** spent on it, or if after the first $50 there's no change in installs.
- **Hard cap:** $300 total across all boosts. Claude tracks spend in the tracker; at $250, Claude warns; at $300, everything stops.
- Never boost a reel whose comments contain health claims we'd be amplifying; hide or answer them first.

---

## 3. Creators

### 3a. How to use the table
- Tiers by followers on the main platform: **Micro** 10K–100K, **Mid** 100K–500K, **Stretch** 500K+.
- Follower counts are as shown on 2026-11-19 (source in the "Checked" column; full notes in `creators-research.md`). TikTok counts were read from the public profile page; YouTube from the channel page; X from the X API; Instagram counts came from Instagram page text in web search results (approximate).
- **Before any outreach, Claude rechecks the profile.** Skip anyone with no post in the last 30 days, whose recent content makes health or healing claims they'd attach to Halo, or who now promotes a competing aura app.
- Contact info is listed only where it is public in the creator's bio or site. Otherwise, use the platform DM.

### 3b. Creator table

**Wave 1 (Day 2): 10 micro creators, aura and self-care first**

| # | Creator | Platform & URL | Followers (checked 2026-11-19) | Niche | Why they fit | Public contact |
|---|---|---|---|---|---|---|
| 1 | Jacque (@etherealjac) | TikTok https://www.tiktok.com/@etherealjac | 28,800 (TikTok profile) | Professional aura reader, Chicago | High engagement (11% per tokranks); her audience already asks "what's my aura color" | https://bio.site/etherealjac |
| 2 | AurasWithCasey (@auraswithcasey) | TikTok https://www.tiktok.com/@auraswithcasey | 34,700 (TikTok profile) | Aura colors | Daily aura-color content (2,441 videos); a free tool her viewers can try | https://stan.store/auraswithcasey |
| 3 | HALO Auragraphic (@haloauragraphic) | Instagram https://www.instagram.com/haloauragraphic/ | ~34K (IG via search) | LA aura photography studio | Makes aura portraits for a living; Affelion Halo is the "everyday, phone" version (and "HALO" is already in their name) to show followers | https://haloauragraphic.com/pages/studio |
| 4 | Charlie Watts (@theauraweaver) | Instagram https://www.instagram.com/theauraweaver/ | ~15.5K (IG via search), verified badge | Aura photography, events | Same audience as aura photo pop-ups | https://www.auraweaver.com/contact-1 |
| 5 | Mae (@truly2mae) | TikTok https://www.tiktok.com/@truly2mae | 97,900 (TikTok profile) | Self-care, Dallas | Self-care routines → "Sunday reset" scan | mae@fromatoztalent.com (in bio) |
| 6 | Jennifer (@jenniferco.co) | TikTok https://www.tiktok.com/@jenniferco.co | 76,900 (TikTok profile) | Wellness + "things that make life better" | Recommends small daily rituals | via ShopMy link in bio / DM |
| 7 | Simone Sharice (@simonesharice) | TikTok https://www.tiktok.com/@simonesharice | 94,200 (TikTok profile) | Wellness, beauty, Atlanta; Pilates studio founder | "Becoming your best self" audience; before/after-workout reel | simonesharice@neonroseagency.com (in bio) |
| 8 | wrenjubilee (@wrenjubilee) | TikTok https://www.tiktok.com/@wrenjubilee | 98,900 (TikTok profile) | Wellness, fitness, lifestyle, Nashville | Workout-vs-breathing reel is native to her feed | wren@clementinegroup.co (in bio) |
| 9 | Jammie (@techinherstep) | TikTok https://www.tiktok.com/@techinherstep | 91,800 (TikTok profile) | Easy tech fixes + privacy | On-device processing, no sign-up = her privacy angle | TechInHerStep@mightyjoy.com (in bio) |
| 10 | Justin Peters (@justinpeterrss) | TikTok https://www.tiktok.com/@justinpeterrss | 23,500 (TikTok profile) | Tests fitness trackers (WHOOP, Garmin, Apple) | Honest gadget tester; frame as "fun color check-in, not a tracker" | DM |

**Wave 2 (Day 8): 10 more micro + first mid names**

| # | Creator | Platform & URL | Followers (checked 2026-11-19) | Niche | Why they fit | Public contact |
|---|---|---|---|---|---|---|
| 11 | Spirit Sis (@spiritsis) | TikTok https://www.tiktok.com/@spiritsis | 89,400 (TikTok profile) | Psychic medium; Psychic Scoop Podcast; HGTV host | Big aura-curious audience; podcast mention possible | https://linktr.ee/spirit_sis |
| 12 | Spiritual Goon (@spiritualgoon) | TikTok https://www.tiktok.com/@spiritualgoon | 81,700 (TikTok profile) | Tarot + mindset | Playful tone suits "guess my color" | DM |
| 13 | Polina (@444polina) | TikTok https://www.tiktok.com/@444polina | 45,100 (TikTok profile) | "Grounded and honest inner work" coach | Matches Halo's honest, number-backed stance | https://stan.store/444polina |
| 14 | Natasha Weber (@astrotash) | Instagram https://www.instagram.com/astrotash/ | ~84.6K (IG via search) | Certified astrologer, author, Melbourne | Astrology audience that loves "what's your color" | via site in bio / DM |
| 15 | Heidi Rose Robbins (@heidiroserobbins) | Instagram https://www.instagram.com/heidiroserobbins/ | ~83.8K (IG via search) | Astrologer, poet; Substack | Reflective, gentle tone = Halo's | https://www.heidirose.com/ |
| 16 | SAINT (@thankyousaint) | TikTok https://www.tiktok.com/@thankyousaint | 50,400 (TikTok profile) | SF multimedia artist ("Auric Shields" artworks) | Artist audience; portraits as art | hello.saint.claire@gmail.com (in bio) |
| 17 | Jess Miller Draws (@jessmillerdraws) | TikTok https://www.tiktok.com/@jessmillerdraws | 11,400 (TikTok profile) | LA illustrator, portraits, "Art of the Zodiac" | Could draw her Halo color; designer-to-designer pitch | https://jessmillerdraws.com |
| 18 | xy (@xyklan) | TikTok https://www.tiktok.com/@xyklan | 75,700 (TikTok profile) | Tech + lifestyle, NY | "Unique iPhone app" format | xyklannn@gmail.com (in bio) |
| 19 | Michael Ashmead (@michael_ashmead) | TikTok https://www.tiktok.com/@michael_ashmead | 75,000 (TikTok profile) | Tech videos | Tech explainer of "camera reads pulse" | DM |
| 20 | Faren (@spiritontap) | TikTok https://www.tiktok.com/@spiritontap | 127,800 (TikTok profile) | "Aura Color Reader", celebrity aura readings | The biggest pure aura-color audience we found. Caution: she sells "aura surgery"; our brief must not tie Halo to healing | https://www.spiritontap.love/workwithme |

**Wave 3 (Day 15, only if earned): mid and stretch**

| # | Creator | Platform & URL | Followers (checked 2026-11-19) | Niche | Why they fit | Public contact |
|---|---|---|---|---|---|---|
| 21 | Astrology with Taryn (@tarynleighbond) | TikTok https://www.tiktok.com/@tarynleighbond | 121,800 (TikTok profile) | Evolutionary astrologer | Astrology audience; reflection angle | https://go.tarynleighbond.com |
| 22 | Camila Regina (@spiritualbossy) | TikTok https://www.tiktok.com/@spiritualbossy | 167,800 (TikTok profile) | Astrologer; bio says psychotherapist | Credible, reflective voice | camila@camilaregina.com (in bio) |
| 23 | Danny (@moonydan) | TikTok https://www.tiktok.com/@moonydan | 359,500 (TikTok profile) | Astrology, tarot | Large astrology audience | via Etsy link in bio / DM |
| 24 | AURA VIBIN (@auravibin) | TikTok https://www.tiktok.com/@auravibin | 486,000 (TikTok profile) | Astrologer ("Aura" is her brand name) | Her "aura" branding fits the aura-color trend Halo rides; posts ~6×/week | https://stan.store/AuraVibin |
| 25 | Tatum Mae (@thecoloranalysisqueen) | TikTok https://www.tiktok.com/@thecoloranalysisqueen | 289,000 (TikTok profile) | Seasonal color analysis, Dallas | "Find your color" audience with no health angle at all | via shop link in bio / DM |
| 26 | Stephen Robles | YouTube https://www.youtube.com/@BeardFM · TikTok @beardedteacher · X @stephenrobles | YouTube 242K; TikTok 74,400; X 16,288 | iPhone tips, Primary Tech podcast | Covers useful/novel iPhone apps; podcast mention | via https://beard.fm/bio |
| 27 | Tailosive Tech | YouTube https://www.youtube.com/@TailosiveTech · X @TailosiveTech | YouTube 267K; X 44,834 | Apple tech, apps | "Apps worth trying" segments | DM / channel About |
| 28 | MuseumofTarot (@museumoftarot) | TikTok https://www.tiktok.com/@museumoftarot · X @MuseumofTarot | TikTok 649,600; X 2,370 | Skeptical spirituality: "cure for spiritual propaganda" | Perfect for "the aura app with receipts". Stretch | DM |
| 29 | Brandon Butch | YouTube https://www.youtube.com/@BrandonButch · X @BrandonButch | YouTube 1.44M; X 106,029 | iPhone news, tips | Stretch: one mention = huge | DM / channel About |
| 30 | Sara Dietschy | YouTube https://www.youtube.com/@SaraDietschy · X @saradietschy | YouTube 933K; X 239,427 | Tech, creativity, "the art of living" | Stretch; design + wellbeing crossover | channel About |
| 31 | Lavendaire | YouTube https://www.youtube.com/@Lavendaire | 2.69M | Personal growth, life design | Stretch; reflective audience | channel About |

**Hold list (pitch only when the condition is met)**

| Creator | Platform & URL | Followers | Condition |
|---|---|---|---|
| The Quantified Scientist (Rob ter Horst) | YouTube https://www.youtube.com/@TheQuantifiedScientist | 422K | Tests accuracy against reference devices. Pitch only after Lusine has compared Halo's pulse with a reference device and is happy with the result. |
| HRVHackers | YouTube https://www.youtube.com/@HRVHackers | 9.95K | Channel frames HRV around stress and anxiety. Pitch only as "a fun color check-in", and decline any review framed as health. |

**Not contacting (and why):** @lottyluxe (founder of the competing Auramour aura app), @chaninicholas (runs the CHANI astrology app), @ijazahmedofficial_uk and @iris_and_aura (healing and iridology claims), @aurafarmedvibes (anonymous meme page, 455,700 followers, no contact), the "aura farming" boat-race child (minor).

**Counts (33 creators):** Micro 20 (rows 1–19, plus HRVHackers on hold at 9.95K) · Mid 9 (rows 20–27, plus The Quantified Scientist on hold) · Stretch 4 (rows 28–31). Main platform: TikTok 22, Instagram 4, YouTube 7 (2 on hold). X is a secondary channel for 5 of them (Stephen Robles, Tailosive Tech, MuseumofTarot, Brandon Butch, Sara Dietschy); no aura, astrology or self-care creator with a real X audience turned up.

### 3c. Outreach templates

Fill `[brackets]` per creator. Keep every message under 120 words. Always mention one specific video of theirs (Claude finds it during the recheck).

**Micro (free Pro + code), DM**
> Hi [first name]! I'm Lusine, a designer and the solo founder of Affelion. Your [specific video] is why I'm writing. I just launched **Affelion Halo** on iPhone: you rest a fingertip on the camera, say a sentence, and it turns your real pulse and voice into one of 20 colors as a moving portrait. Every color shows the numbers behind it, no fortune-telling.
> I'd love to give you a free year of Pro, plus a code for your followers ([CODE] = [offer]). No obligation to post. If you do, a "before coffee / after coffee" or "guess my color" scan would be fun, and please tag it #gifted or #ad.
> Want the code? 💗

**Micro, email (where a public email exists)**
Subject: A free year of Affelion Halo for you (your heartbeat, in color)
> Hi [first name],
> I'm Lusine Vartan, founder of Affelion LLC (affelion.com). I loved [specific video].
> I just launched Affelion Halo on iPhone. It's a one-minute check-in: fingertip on the camera, one sentence into the mic, and it paints your real pulse and voice as one of 20 colors in a moving portrait. Every color traces back to a number, and it's for reflection, not a medical or psychic reading.
> I'd love to send you a free year of Pro and a follower code ([CODE]: [offer]). No obligation. If you'd like to post, ideas that work well: before vs. after coffee, a scan with a friend, or "guess my color". Please label any post #gifted/#ad.
> App Store: [link] · Press kit: [link]
> Thank you!
> Lusine

**Mid (free Pro + code, optional small flat fee only if the budget rule allows), email**
Subject: Paid collab idea: Affelion Halo × [creator]
> Hi [first name / manager name],
> I'm Lusine, solo founder of Affelion (Affelion Pop and Bible are live; Halo is new). [One line about their specific video.]
> Affelion Halo turns your real pulse and voice into one of 20 colors as a fluid portrait. It's honest by design: every color shows its numbers, and it never predicts anything.
> I'm offering a free year of Pro, a custom follower code ([CODE]), and [only if approved: a flat $[amount] for one Reel/TikTok]. Brief: one real scan in your own style, labeled as a paid partnership. I'd ask that the video doesn't describe Halo as reading energy or health; I'm happy to share wording.
> Would that work for you? If you have a rate card, I'm happy to look at it, though I'm a solo founder with a small budget.
> Lusine · affelion.com

**Stretch (no fee; pure gift + story), DM or email**
> Hi [name], longtime fan of [specific video]. I'm a designer who built an aura app with receipts: Affelion Halo turns your real pulse and voice into a color, then shows the math. No psychics, no predictions. I'd love for you to have a free year of Pro, no strings. If it ever fits a video, amazing; if not, I hope you enjoy it. Code: [CODE].

**Follow-up (once only, 4 days later)**
> Hi [first name], just floating this up in case it got buried. Happy to send the Pro code whenever. No worries at all if it's not a fit! 🌈

**After they post**
> Thank you so much, [name]! [One specific thing you loved about the video.] If you'd ever like to do a "scan with a friend" follow-up, I'd love that. Your code [CODE] is active until [end of offer].

**Creator brief (send with the code)**
- Show a real scan: fingertip on the back camera with the flash, one sentence into the mic.
- Say: "turns my pulse and voice into color", "every color shows its numbers", "a one-minute check-in".
- Please don't say: reads your energy/aura field, psychic, predicts, detects stress/anxiety, health/medical.
- Label: #ad, #gifted, or the platform's paid-partnership tag.
- Link: App Store link or "Affelion Halo" search.

### 3d. Offer-code plan (Lusine creates the codes, Claude only plans)

Where: App Store Connect → Halo → Monetization → Subscriptions → [Pro group] → [Annual] → Offer Codes → Create. (Play Console: Monetize → Products → Subscriptions → Promo codes.)

| Code type | Who | Offer | How many | Name pattern |
|---|---|---|---|---|
| One-time-use codes | Each creator personally | 1 year of Pro free (annual plan) | 1 per creator; 35 total + 15 spare | generated by Apple |
| Custom code (one per creator) | That creator's followers | 1 month free, then $69.99/yr | cap 200 redemptions each | `HALO` + short creator name, e.g. `HALOTARYN`, `HALOJAC` (letters and numbers only; check App Store Connect's length limit) |
| Custom code | Product Hunt visitors | 1 month free on annual | cap 300 | `HALOPH` |
| Custom code | Pop/Bible users (in-app card on day 15+) | 1 month free on annual | cap 500 | `HALOFAM` |

- Redemption link format: `https://apps.apple.com/redeem?ctx=offercodes&id=[APP_ID]&code=[CODE]`.
- Track redemptions per code in the tracker (App Store Connect shows redemptions per offer code). A creator code with zero redemptions after 7 days means that creator isn't converting; don't send them more.
- Claude keeps codes only in `/outreach/offer-codes.md`, which must be in `.gitignore`.

### 3e. Paid creator rule
Default is no fees. Only if install→paid ≥ 3% at Day 14, Claude may propose one flat fee of $75–$150 to a single mid-tier creator from Wave 3 whose content has the best fit and whose recent videos average ≥ 10K views. Lusine decides and pays. The total fee budget is $150.

### 3f. Press pitch template
Subject: A designer's app that paints your heartbeat (and won't read your future)
> Hi [name],
> I'm Lusine Vartan, a designer (Creative Director at EY, formerly Head of Design at Dignari) and solo founder of Affelion. My fifth app, **Affelion Halo**, just launched on iPhone.
> It takes the aura trend and adds receipts: rest a fingertip on the camera, say a sentence, and Halo turns your approximate pulse and voice into one of 20 colors, shown as a moving portrait at your own heart rate. Tap any color and it shows the numbers behind it. Everything is processed on the phone, with no sign-up.
> Free to try (first scan, then one a week); Pro is $69.99/yr with a 7-day trial.
> Press kit, screenshots and promo codes: [link]. Happy to answer anything.
> Lusine · affelion.com · @affelion.app

---

## 4. Press, newsletters and communities (all checked 2026-11-19)

### 4a. Apple tech press and app newsletters
| Outlet | Route | Notes |
|---|---|---|
| Fresh Install (weekly, ten new indie iPhone apps) | https://freshinstall.app/submit | Says "Early issues are free to launch in." Submit before or on Day 0 |
| Stamped Weekly | https://stampedios.com/newsletter | Thursday newsletter with a free "Submit Your App" route |
| Indie Dev Monday | https://indiedevmonday.com/look-at-me | "Look at me" app spotlight form |
| Swipe (indie apps showcase) | https://swipemag.app/indie-apps-showcase-oct-2026/ | Monthly showcase; find the submit link on the page |
| Indie App Catalog | https://indieappcatalog.com/app/submit | Reviewed indie submissions |
| Indie Catalog news | https://indiecatalog.app/news/submit | Free news submission |
| 9to5Mac | "Submit a Tip" on https://9to5mac.com/about/ | Use the tip form (only an ads@ email is public) |
| The Sweet Setup | https://thesweetsetup.com/contact/ | Contact form; X @thesweetsetup (10,537) |
| MacStories (Federico Viticci, X @viticci, 87,356) | Find the current contact route (the /contact/ URL returned 404) | Design-forward apps |
| Apple App Store editorial | App Store Connect → Featuring → Nominations | Submit ≥3 weeks before a launch or update (https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/) |
| Product Hunt | https://www.producthunt.com (self-post) | Rules: https://help.producthunt.com/en/articles/479557-how-to-post-a-product |

### 4b. Lifestyle and wellness press
| Outlet | Route | Notes |
|---|---|---|
| mindbodygreen | submit@mindbodygreen.com | Per their help center (via search); checked about weekly. Pitch the "aura trend with receipts" angle, never health |
| Well+Good | Find the current published pitch route | No pitch email found; don't guess |
| Refinery29 | Find the current published pitch route | Only third-party lists show an editor email; not verified, so don't use it |
| The Cut (astrology/wellness) | Find the current published pitch route | Not verified |

### 4c. Communities and their self-promo rules
| Community | Rule summary | Plan |
|---|---|---|
| r/SideProject | Your own project is on-topic. Show a demo, what/who/why, ask one feedback question; no link-drops or ad copy | Day 3: founder story + 20s video + "what would make you scan weekly?" |
| r/iosapps | 10 subreddit karma; 1 promo post per 30 days; main feed needs Trust (20+ App Store reviews or dev flair) or Transparency (real identity + site with privacy policy and terms); ABC format (Answer, Better, Cost); disclose you're the dev; otherwise the App Shelf megathread | Day 3: App Shelf, or main feed if Transparency is met |
| r/IndieAppNews | Listed as a free promo spot for indie apps | Day 4 |
| r/iphone | Developers must message the moderators before promoting their own app | Day 11: message mods first, only if worth it |
| r/AppHookup | Only genuine price drops on paid apps; freemium, trial and launch deals not allowed | Skip, Halo doesn't qualify |
| r/Auras, r/astrology | Rules not confirmed | Don't post promo; at most answer an existing question with disclosure, after reading the rules |
| Hacking with Swift forum, App Announcements | https://www.hackingwithswift.com/forums/app-announcements | Day 4 |
| MacRumors forums, iOS Apps | https://forums.macrumors.com/forums/ios-apps-and-apple-arcade.133/ | Day 4: one thread, reply to questions |

---

## 5. Tracker and decision rules
Use `launch-tracker.csv`. Rows starting with `RULE` are the decision rules; `DAY` rows are daily numbers; `CREATOR` rows track outreach; `REEL` rows track each reel. Claude fills them in from numbers Lusine pastes in, and applies the rules at every weekly review.

Core rules (copied into the CSV):
1. **Fewer than 3% of installs pay** (install→paid, 7-day rolling, at ≥200 installs): stop all growth spend and new outreach waves; fix the paywall and first scan first (check successful readings ÷ scans started ≥ 80%, paywall shown after first portrait, trial pre-selected, "Not now" returns to portrait).
2. **Install→trial under 5%** at Day 7: the paywall or first-scan experience is the problem, not traffic. Fix before any boost.
3. **Successful readings under 80% of scans started:** fix the scan guidance (lighting/finger tips) before anything else.
4. **Double down on a winning reel:** if a reel gets ≥ 3× the median views of our reels, or ≥ 2% profile taps, post 2 remixes of it within 3 days (same hook, new situation), pin it, and make it the Day-10 boost candidate.
5. **Drop a format:** if a format's 2 tries both fall below half the median views, retire it.
6. **Boost:** $50 steps; keep if cost per trial start < $8; stop if > $15 after $150 on that boost; hard cap $300 total.
7. **Creators:** a code with 0 redemptions after 7 days means no more product sent to that creator. A creator whose code tops redemptions gets a "second video" ask.
8. **Paid creators:** only if install→paid ≥ 3% at Day 14; max $150 total.
9. **When to stop daily reels:** after Day 14, if no reel has beaten 2× the median, switch to 3 a week and spend the time on paywall/first-scan improvements.
10. **When to stop everything paid:** at $300 total spend, or Day 30, whichever comes first.

# How to use this package with Claude

This package lets Claude work through Halo's launch on its own, as much as possible, while you keep control of anything involving money, agreements, pricing or publishing.

## What's inside

| File | What it's for |
|---|---|
| `CLAUDE-HALO-LAUNCH.md` | The master brief. Claude follows it: guardrails, the 11 must-haves before submit with acceptance criteria, then post-launch phases. |
| `STATUS.md` | The live tracker. Claude updates it every session. Check the **Needs Lusine** section; it's your to-do list. |
| `APP-STORE-LISTING.md` | Ready-to-use App Store and Google Play copy, paywall text, Review Notes and permission text. Approve or edit it. |
| `HOW-TO-USE.md` | This file. |

## Setup (about 5 minutes)

1. Unzip `halo-launch-package.zip`.
2. Copy the four files into the root of your Halo code folder (the one with `package.json` and `app.json`), for example into a `launch/` folder.
3. Open that folder in **Claude Code** (or Cursor with Claude).
4. Paste this as your first message:

```
Read launch/CLAUDE-HALO-LAUNCH.md, launch/STATUS.md and launch/APP-STORE-LISTING.md.
Follow CLAUDE-HALO-LAUNCH.md exactly. Work only on the "Must-have before submit" list (M1–M11), top to bottom.
Respect every guardrail in section 0: never submit, spend money, accept agreements, change live pricing, or post anything. Put those under "Needs Lusine" in STATUS.md with step-by-step instructions.
Don't add new features before submit. Update STATUS.md at the end of every session, then tell me what you finished and what you need from me.
```

5. For each new session, just say: **"Continue from STATUS.md."**

## About "24/7"

Claude works in sessions. It can keep going for a long time inside one session, and you can start a new one anytime with "Continue from STATUS.md". It will stop and wait whenever it reaches something only you can do. To keep things moving, check **Needs Lusine** once or twice a day and clear what you can.

## Your part, in order

1. Accept Apple's Paid Apps agreement, add tax and banking, and enroll in the Small Business Program (15% fee instead of 30%).
2. Approve the prices and products: $69.99/year with a 7-day free trial, $12.99/month, $199 lifetime.
3. Publish the privacy policy and terms Claude drafts on affelion.com.
4. Run the 10-minute phone test if Claude asks.
5. Record (or approve) a 60-second video of a check-in.
6. When STATUS.md says **Ready to submit**: submit in App Store Connect. After approval, press Release.

## Safety rules Claude follows

Claude will **never**, without your OK: submit to Apple or Google, spend money, accept agreements, change live prices or offers, post on social media, or message press or creators. It drafts these, and you decide.

## Where the reasoning lives

The full plan with sources, benchmarks and an interactive revenue calculator is on your Page: https://cursor.com/canvas/store-e6b620c0-c707-490e-b471-71b7a64124f3/e59e50d9-6492-4132-b889-f767159112e9

## After approval: the launch playbook
When Apple approves Halo, paste this into Claude Code:

```
Halo is approved. Today is Day 0. Read LAUNCH-PLAYBOOK.md, CLAUDE.md and launch-tracker.csv. Do every [C] item for Day 0 now, then work ahead on drafts. Never send, post, spend, or create offer codes: put those under "Lusine does" in STATUS.md with exact steps. Each day I'll tell you the day number and paste my numbers; update the tracker and apply the decision rules.
```

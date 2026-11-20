# Affelion Halo: selling assets

Everything made to sell the app, where each file goes, and the spec it meets. Files live in
`store/` (kept out of this public repository) and are delivered as zips. Specs are from Apple's
asset best practices, creative asset, screenshot and app preview pages (checked Nov 20, 2026)
and Google Play's listing requirements.

Rules every asset follows: always "Affelion Halo", never "Halo" alone; magenta demo reading; no
prices, URLs, other platforms' names or awards in the artwork; works with the sound off; real app
UI in screenshots and previews.

## App Store (App Store Connect → Affelion Halo → version 1.0)

| Asset | File | Spec | Where it goes |
|---|---|---|---|
| App icon | `app-icon/app-store-icon-1024.png` | 1024 × 1024 PNG, no transparency (iOS rounds the corners) | Built into the app from `assets/icon.png`; App Store Connect takes it from the build |
| Screenshots, 6.9" | `app-store-6.9/1…7.png` | 7 × 1320 × 2868 PNG, no alpha (up to 10 allowed) | Previews and Screenshots → iPhone 6.9" |
| Screenshots, 6.5" | `app-store-6.5/1…7.png` | 7 × 1284 × 2778 PNG | Previews and Screenshots → iPhone 6.5" |
| App preview (video) | `app-preview/app-preview-iphone-886x1920.mp4` | 886 × 1920, 15–30 s, 30 fps, H.264, stereo AAC; up to 3 per size | Previews and Screenshots → iPhone 6.9" and 6.5" (same file), first slot. Set the poster frame to the portrait |
| Product page header, still | `apple-creative/header-3840x1646.png` | 3840 × 1646 PNG, art in the 1646 × 661 safe area | App Information → Creative assets (iOS 27 and later) |
| Product page header, motion | `motion/header-3840x1646.mp4` | 3840 × 1646, 12 s seamless loop, 30 fps, H.264, no audio | Same place, as the video version |
| Search results, still | `apple-creative/search-3840x2560.png` | 3:2, 3840 × 2560 PNG, art in the 2168 × 1030 safe area | Creative assets → Search results |
| Search results, motion | `motion/search-3840x2560.mp4` | 3840 × 2560, 12 s loop, 30 fps, H.264, muted | Same place, as the video version |
| Universal asset | `apple-creative/universal-5244x2950.png` | 16:9, 5244 × 2950 PNG (PNG only), art in the 1402 × 962 safe area | Creative assets → Universal (hero placements) |
| In-App Event card | `motion/event-card-1920x1080.mp4` and `.png` | 16:9, 1920 × 1080, 30 fps | In-App Events → Event card (when you create a launch event) |
| In-App Event details | `motion/event-details-1080x1920.mp4` and `.png` | 9:16, 1080 × 1920, 30 fps | In-App Events → Event details |
| In-app purchase review screenshot | `iap-review/paywall-6.9.png` | 1320 × 2868 | Each of the three products → Review Information |

## Google Play (Play Console → Affelion Halo → Main store listing)

| Asset | File | Spec |
|---|---|---|
| App icon | `google-play/icon-512.png` | 512 × 512 PNG |
| Feature graphic | `google-play/feature-graphic-1024x500.png` | 1024 × 500 |
| Phone screenshots | `google-play/phone/1…7.png` | 7 × 1080 × 1920 |
| Promo video | `app-preview/app-preview-iphone-1080x1920.mp4` | Upload to YouTube (unlisted or public), paste the link in "Video" |
| Adaptive icon layers | `app-icon/android-icon-foreground.png`, `-background.png`, `-monochrome.png` | Built into the app from `assets/` |

## Social and web

| Asset | File | Use |
|---|---|---|
| Icon animation | `motion/halo-icon-animation-1080.mp4`, `.webm`, `.gif` | Reels, stories, affelion.com, email; 7 s loop |
| 15-second reel | `app-preview/reel-15s-1080x1920.mp4` | Instagram, TikTok, YouTube Shorts (Lusine posts) |
| 9:16 preview cut | `app-preview/app-preview-iphone-1080x1920.mp4` | Stories and the Play promo video |
| Story cards | `docs/previews/story-*.png` (in the repo) | What a user's shared card looks like; good for posts |
| Family sheet | `app-icon/family-sheet.png` | Pop, Bible, Kind, Halo, Lock, Grow in release order |

## Not made, on purpose

- **Promotional artwork for Apple editorial**: Apple asks for it only when it features an app.
- **iPad screenshots**: the app is iPhone-only.
- **Paid ads creative**: nothing is spent without Lusine's approval; the reel and icon animation
  are ready to use if an ad test is approved later.

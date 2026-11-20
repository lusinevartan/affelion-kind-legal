# App Store: App Privacy answers (version 1.0)

Draft for Lusine to enter in App Store Connect → Affelion Aura → **App Privacy**. Based on what
the 1.0 code does, checked Nov 20, 2026.

## What the build contains

| SDK | Sends data off the phone? | Notes |
|---|---|---|
| RevenueCat (`react-native-purchases` 11.0.2) | Yes: purchase records, an anonymous app user ID | Handles subscriptions and restore. No account, no custom user ID, no advertising ID. |
| Expo and React Native modules (camera, file system, media library, SQLite, haptics, sharing, view shot, image, fonts) | No | Their privacy manifests declare no collected data and no tracking (checked every `PrivacyInfo.xcprivacy` in `node_modules`). |
| Analytics, crash reporting, ads, attribution | None in the build | Nothing to declare. |
| Sasha server | Off in 1.0 (`EXPO_PUBLIC_GUIDE_ENDPOINT` is empty in every EAS profile) | Sasha answers on the phone. If the server is ever turned on, revisit this page. |

Camera frames, the photo, the outline, audio and every measurement stay on the phone. They are
saved in the app's own storage (or thrown away, for frames and audio) and leave the phone only
when the person saves or shares a picture themselves. Apple does not count data that never leaves
the device as "collected".

## Answers

**Do you or your third-party partners collect data from this app?** Yes.

Select one data type:

| Data type | Collected | Linked to the user's identity | Used for tracking | Purposes |
|---|---|---|---|---|
| **Purchases → Purchase History** | Yes | **No** (RevenueCat uses an anonymous ID; the app has no accounts) | **No** | **App Functionality**, **Analytics** |

Leave every other type unselected: Contact Info, Health & Fitness, Financial Info, Location,
Sensitive Info, Contacts, User Content, Browsing History, Search History, Identifiers (no user ID,
no device ID), Usage Data, Diagnostics, Other Data.

Why "Health & Fitness" is not selected: pulse and voice numbers are processed and stored only on
the phone. They are never sent to Affelion or any third party.

Why "Analytics" is a purpose: RevenueCat uses purchase records for its subscription charts, and
its documentation asks apps to select both App Functionality and Analytics.
Source: https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy

## Privacy policy URL

https://www.affelion.com/aura/privacy (Lusine publishes `privacy-policy.md` there).

## Before you submit

Open the archived build in Xcode → **Generate Privacy Report** (or download the privacy report
from the TestFlight build page) and confirm it lists only Purchase History from RevenueCat. If it
lists anything else, tell Claude before submitting.

# Google Play: Data safety answers (version 1.0)

Draft for Play Console → Affelion Halo → **App content → Data safety**. Same facts as the App Store
answers (`app-privacy.md`). Source for the RevenueCat part:
https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes (RevenueCat uses HTTPS).
**Do you provide a way for users to request that their data is deleted?** Yes: in-app "Delete all
data" for everything on the phone, and email (hello@affelion.com) for purchase records.

| Data type | Collected | Shared | Processed ephemerally | Required or optional | Purposes |
|---|---|---|---|---|---|
| **Financial info → Purchase history** | Yes | No (RevenueCat is a service provider acting for us, which Google does not count as sharing) | No | Required for buying Pro | App functionality, Analytics |

Everything else: not collected. In particular, **Health and fitness**, **Photos and videos** and
**Audio** are not collected, because they never leave the phone (Google counts only data sent off
the device). **App activity, App info and performance, Device or other IDs**: not collected (no
analytics, no crash reporting, no advertising ID).

**Health apps declaration** (App content → Health apps): select **Fitness and wellness** features
(heart-rate based check-in and breathing practice). It is not a medical device, does not connect to
Health Connect, and does not offer medical, disease-management or emergency features.

**Privacy policy URL:** https://www.affelion.com/halo/privacy

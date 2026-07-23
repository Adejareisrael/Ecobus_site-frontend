# Ecobus Mobile Store Release

Ecobus now has Capacitor native shells for Android and iOS. The native apps load the deployed Ecobus web app, so publish a stable production deployment before submitting store builds.

## Current App IDs

- Android package: `com.ecobustransport.app`
- iOS bundle id: `com.ecobustransport.app`
- App name: `Ecobus`
- Default mobile server: `https://booking.ecobustransport.com`

To point a build at another production URL:

```bash
CAPACITOR_SERVER_URL=https://your-production-domain.com npm run mobile:sync
```

## Useful Commands

```bash
npm run mobile:sync
npm run mobile:android
npm run mobile:ios
```

## Android release signing

The release upload keystore is **not** in this repo (see `android/.gitignore`
— `*.jks`, `*.keystore`, and `keystore.properties` are all excluded on
purpose). It lives at `~/ecobus-android-signing/ecobus-upload-key.jks` on the
machine it was generated on, with its passwords in `android/keystore.properties`
(local-only, gitignored).

**Back up both files somewhere durable (password manager + offline copy) right
away.** If this keystore is ever lost, there is no recovery — you cannot
publish an update to the existing `com.ecobustransport.app` Play Store listing
ever again; Google would require a brand new app listing instead.

To build a signed release bundle for Play Store submission:

```bash
npm run mobile:sync        # requires Node >=22, e.g. `nvm use 24` first
cd android
JAVA_HOME=/usr/local/opt/openjdk@21 ANDROID_HOME=/usr/local/share/android-commandlinetools \
  ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` — this is
the file to upload to Play Console. If `keystore.properties` is missing, the
release build type falls back to being unsigned (won't be accepted by Play
Console, but debug builds/CI still work without it).

Before increasing `versionCode`/`versionName` in `android/app/build.gradle`
for a new release, confirm you're signing with the same keystore as the
previous upload — Play Console rejects a bundle signed with a different key
once the app has been published once.

## Store Accounts Needed

- Google Play Console account for Android publishing.
- Apple Developer Program account for App Store publishing.
- A production privacy policy URL, terms URL, and refund policy URL.
- App screenshots for phone sizes required by each store.
- Final app icon and store listing graphics.

## Before Submission

- Confirm production email, SMS, and WhatsApp APIs are configured (no online payment gateway is used — fares are paid in cash at the terminal).
- Confirm production database backups and monitoring are active.
- Confirm all test bookings and demo data are removed from production.
- Run `npm run lint`, `npm run build`, `npm run test:coverage`, and `npm run mobile:sync`.
- Build Android from Android Studio or Gradle as an AAB for Play Store.
- Archive iOS from Xcode and upload through App Store Connect.

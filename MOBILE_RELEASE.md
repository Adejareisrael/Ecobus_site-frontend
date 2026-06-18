# Ecobus Mobile Store Release

Ecobus now has Capacitor native shells for Android and iOS. The native apps load the deployed Ecobus web app, so publish a stable production deployment before submitting store builds.

## Current App IDs

- Android package: `com.ecobustransport.app`
- iOS bundle id: `com.ecobustransport.app`
- App name: `Ecobus`
- Default mobile server: `https://ecobus-site-frontend.vercel.app`

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

## Store Accounts Needed

- Google Play Console account for Android publishing.
- Apple Developer Program account for App Store publishing.
- A production privacy policy URL, terms URL, and refund policy URL.
- App screenshots for phone sizes required by each store.
- Final app icon and store listing graphics.

## Before Submission

- Confirm production payment, email, SMS, and WhatsApp APIs are configured.
- Confirm production database backups and monitoring are active.
- Confirm all test bookings and demo data are removed from production.
- Run `npm run lint`, `npm run build`, `npm run test:coverage`, and `npm run mobile:sync`.
- Build Android from Android Studio or Gradle as an AAB for Play Store.
- Archive iOS from Xcode and upload through App Store Connect.

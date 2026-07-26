import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://bookings.ecobustransport.com";

// server.url loads the production site directly as the app's own origin, so
// Capacitor's native bridge (Filesystem, Share, App back-button handling,
// Firebase Auth, etc.) is actually wired up on the page the user sees.
//
// We previously routed through a bundled local "mobile-shell" page that
// health-checked serverUrl and then redirected to it — that gave a nicer
// "can't connect" screen, but since the redirect was a genuine external
// network navigation, the loaded page never got the native bridge and every
// plugin call failed with "X plugin is not implemented on android". webDir
// is still required by the Capacitor CLI; its content is not served at
// runtime since server.url takes priority.
const config: CapacitorConfig = {
  appId: "com.ecobustransport.app",
  appName: "Ecobus",
  webDir: "mobile-shell",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;

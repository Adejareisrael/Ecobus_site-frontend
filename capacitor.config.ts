import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://booking.ecobustransport.com";

// The app launches into the bundled mobile-shell (webDir below), which
// health-checks serverUrl with its own timeout/retry before redirecting —
// see scripts/generate-mobile-shell-config.js. Capacitor's own server.url +
// server.errorPath mechanism is unreliable for this (misses DNS/TLS failures,
// ~2 minute uncontrollable timeout), so we deliberately don't use it here.
const config: CapacitorConfig = {
  appId: "com.ecobustransport.app",
  appName: "Ecobus",
  webDir: "mobile-shell",
  server: {
    cleartext: serverUrl.startsWith("http://"),
    allowNavigation: [new URL(serverUrl).hostname],
  },
};

export default config;

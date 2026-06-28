import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://booking.ecobustransport.com";

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

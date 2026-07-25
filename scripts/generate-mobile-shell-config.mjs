import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://bookings.ecobustransport.com";

const outPath = path.join(__dirname, "..", "mobile-shell", "config.js");
fs.writeFileSync(
  outPath,
  `window.ECOBUS_TARGET_URL = ${JSON.stringify(serverUrl)};\n`
);

console.log(`mobile-shell/config.js -> ${serverUrl}`);

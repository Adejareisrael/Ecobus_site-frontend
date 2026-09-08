import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/__tests__/lib/mobile-features.test.ts",
      "src/__tests__/lib/supabase-auth-admin.test.ts",
      "src/__tests__/api/supabase-auth-route.test.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

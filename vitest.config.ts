import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    pool: "forks",
    forks: { singleFork: true },
    fileParallelism: false,
    env: {
      JWT_SECRET: "test-jwt-secret-for-vitest-min-32-characters!!",
      PAYSTACK_SECRET_KEY: "sk_test_fake_key_for_vitest",
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/app/api/**/*.ts", "src/lib/auth.ts"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

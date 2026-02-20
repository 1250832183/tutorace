import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    env: {
      LIVEKIT_URL: "wss://test.livekit.cloud",
      LIVEKIT_API_KEY: "test-api-key",
      LIVEKIT_API_SECRET: "test-api-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});

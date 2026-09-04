import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

/**
 * Separate from vite.config.ts on purpose: that config loads the prerenderer,
 * which launches a browser. Tests here are plain functions over Requests and
 * strings and need none of it.
 */
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})

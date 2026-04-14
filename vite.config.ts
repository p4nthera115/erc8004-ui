import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { resolve } from "path"
import prerenderer from "@prerenderer/rollup-plugin"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    prerenderer({
      routes: [
        "/",
        "/docs/introduction",
        "/docs/installation",
        "/docs/concepts",
        "/docs/api-keys",
        "/docs/components",
        "/docs/recipes",
        "/docs/theming",
        "/docs/components/erc8004-provider",
        "/docs/components/agent-provider",
        "/docs/components/agent-name",
        "/docs/components/agent-image",
        "/docs/components/agent-description",
        "/docs/components/agent-card",
        "/docs/components/endpoint-status",
        "/docs/components/reputation-score",
        "/docs/components/reputation-timeline",
        "/docs/components/reputation-distribution",
        "/docs/components/verification-badge",
        "/docs/components/validation-score",
        "/docs/components/validation-list",
        "/docs/components/validation-display",
        "/docs/components/last-activity",
        "/docs/components/activity-log",
        "/docs/components/feedback-list",
        "/docs/components/tag-cloud",
      ],
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        renderAfterDocumentEvent: "app-rendered",
      },
    }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})

import { defineConfig } from "tsup"

/**
 * Every export in this package is a client component — they all use hooks,
 * context or both. Without a "use client" directive at the top of the bundle,
 * importing the package from a Next.js App Router server component is a hard
 * error.
 *
 * tsup's `banner` option doesn't work here: it feeds the text through esbuild,
 * which treats a leading string literal as a module-level directive and strips
 * it while bundling ("Module level directives cause errors when bundled").
 * Prepending it in `renderChunk` — after esbuild has finished — is what
 * actually survives into dist/.
 */
const useClientBanner = {
  name: "use-client-banner",
  renderChunk(code: string, chunk: { path: string }) {
    if (!/\.(js|cjs|mjs)$/.test(chunk.path)) return
    return { code: `"use client";\n${code}`, map: undefined }
  },
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // Rollup's post-esbuild treeshake pass also strips the "use client"
  // directive, and it runs after the plugin below. esbuild's own tree-shaking
  // is enough for a single-entry bundle, so the extra pass is not worth losing
  // the directive over.
  treeshake: false,
  target: "es2020",
  outExtension: ({ format }) => ({ js: format === "esm" ? ".js" : ".cjs" }),
  external: ["react", "react-dom", "@tanstack/react-query"],
  plugins: [useClientBanner],
})

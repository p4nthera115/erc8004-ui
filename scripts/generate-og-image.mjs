/**
 * Renders public/og.png — the Open Graph card.
 *
 * Not part of the build. The PNG is committed, and this script exists to
 * regenerate it when the wordmark or tagline changes:
 *
 *   node scripts/generate-og-image.mjs
 *
 * It shells out to a local headless Chrome (the same dependency the
 * prerenderer already needs) rather than adding an image library for one
 * static asset. Set CHROME_PATH if Chrome lives somewhere unusual.
 */

import { execFileSync } from "node:child_process"
import { mkdtempSync, writeFileSync, copyFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean)

const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
if (!chrome) {
  console.error(
    "[og] No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary."
  )
  process.exit(1)
}

// The logo, at the same proportions as the nav mark.
const LOGO = `<svg viewBox="0 0 460 460" width="132" height="132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M460 442c0 9.94-8.06 18-18 18H258c-9.94 0-18-8.06-18-18v-64c0-9.94 8.06-18 18-18h184c9.94 0 18 8.06 18 18v64Z"/>
  <path d="M460 322c0 9.94-8.06 18-18 18h-64c-9.94 0-18-8.06-18-18v-64c0-9.94 8.06-18 18-18h64c9.94 0 18 8.06 18 18v64Z"/>
  <path d="M100 202c0 9.94-8.06 18-18 18H18c-9.94 0-18-8.06-18-18v-64c0-9.94 8.06-18 18-18h64c9.94 0 18 8.06 18 18v64Z"/>
  <path d="M460 82c0 9.94-8.06 18-18 18h-64c-9.94 0-18-8.06-18-18V18c0-9.94 8.06-18 18-18h64c9.94 0 18 8.06 18 18v64Z"/>
  <path d="M340 82c0 9.94-8.06 18-18 18h-64c-9.94 0-18-8.06-18-18V18c0-9.94 8.06-18 18-18h64c9.94 0 18 8.06 18 18v64Z"/>
  <path d="M220 82c0 9.94-8.06 18-18 18H18C8.06 100 0 91.94 0 82V18C0 8.06 8.06 0 18 0h184c9.94 0 18 8.06 18 18v64Z"/>
  <path d="M340 322c0 9.94-8.06 18-18 18H138c-9.94 0-18-8.06-18-18V138c0-9.94 8.06-18 18-18h184c9.94 0 18 8.06 18 18v184Z"/>
  <path d="M100 442c0 9.94-8.06 18-18 18H18c-9.94 0-18-8.06-18-18V258c0-9.94 8.06-18 18-18h64c9.94 0 18 8.06 18 18v184Z"/>
</svg>`

const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #0a0a0a;
    color: #fff;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px;
    /* Hairline grid, the same device the landing page uses to divide sections. */
    background-image:
      linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .top { display: flex; align-items: flex-start; gap: 40px; }
  svg { fill: #fff; flex: none; }
  h1 { font-size: 76px; font-weight: 700; letter-spacing: -.02em; line-height: 1.05; }
  .kicker {
    font-size: 20px; letter-spacing: .2em; text-transform: uppercase;
    color: rgba(255,255,255,.55); margin-bottom: 18px;
  }
  p { font-size: 32px; line-height: 1.4; color: rgba(255,255,255,.72); max-width: 46ch; }
  .rule { height: 1px; background: rgba(255,255,255,.25); margin: 44px 0 28px; }
  .foot {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 22px; color: rgba(255,255,255,.55);
  }
  .foot strong { color: rgba(255,255,255,.9); font-weight: 400; }
</style>
</head>
<body>
  <div>
    <div class="top">
      ${LOGO}
      <div>
        <div class="kicker">ERC-8004 · React components</div>
        <h1>@erc8004/ui</h1>
      </div>
    </div>
    <div class="rule"></div>
    <p>Verified agent identity, reputation and validation — straight from the chain.</p>
  </div>
  <div class="foot">
    <span><strong>erc8004-ui.vercel.app</strong></span>
    <span>/llms.txt · /openapi.json · /api/mcp</span>
  </div>
</body>
</html>`

const workDir = mkdtempSync(join(tmpdir(), "erc8004-og-"))
const htmlPath = join(workDir, "og.html")
writeFileSync(htmlPath, html, "utf8")

execFileSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    `--screenshot=${join(workDir, "og.png")}`,
    `file://${htmlPath}`,
  ],
  { stdio: "inherit" }
)

const target = join(REPO_ROOT, "public", "og.png")
copyFileSync(join(workDir, "og.png"), target)
console.log(`[og] wrote ${target}`)

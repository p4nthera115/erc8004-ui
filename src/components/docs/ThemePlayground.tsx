/**
 * ThemePlayground — interactive theme preset switcher for the theming docs page.
 *
 * Lets users click preset buttons and watch real mock components retheme live.
 * All styling flows through CSS custom properties, so overriding variables in
 * the preview surface's inline style is enough to retheme everything inside it.
 */

import { useState } from "react"
import { FingerprintBadge } from "@/components/identity/FingerprintBadge"
import { cn } from "@/lib/cn"
import { CodeBlock } from "./CodeBlock"

// ─────────────────────────────────────────────────────────────────────────────
// Preset definitions
// ─────────────────────────────────────────────────────────────────────────────

type PresetVars = Record<string, string>

interface Preset {
  name: string
  vars: PresetVars
}

/** Dark theme base values (matches the .dark .erc8004 block in tokens.css). */
const DARK_BASE: PresetVars = {
  "--erc8004-bg": "0.145 0 0",
  "--erc8004-fg": "0.985 0 0",
  "--erc8004-card": "0.205 0 0",
  "--erc8004-card-fg": "0.985 0 0",
  "--erc8004-muted": "0.269 0 0",
  "--erc8004-muted-fg": "0.708 0 0",
  "--erc8004-positive": "0.6 0.17 145",
  "--erc8004-positive-fg": "0.985 0 0",
  "--erc8004-negative": "0.6 0.2 25",
  "--erc8004-negative-fg": "0.985 0 0",
  "--erc8004-border": "0.3 0 0",
}

const PRESETS: Preset[] = [
  {
    name: "Default",
    vars: {},
  },
  {
    name: "Purple",
    vars: {
      "--erc8004-accent": "0.55 0.25 300",
      "--erc8004-ring": "0.55 0.25 300",
    },
  },
  {
    name: "Teal",
    vars: {
      "--erc8004-accent": "0.55 0.18 175",
      "--erc8004-ring": "0.55 0.18 175",
      "--erc8004-positive": "0.55 0.18 175",
    },
  },
  {
    name: "Warm",
    vars: {
      "--erc8004-bg": "0.98 0.008 80",
      "--erc8004-card": "0.96 0.012 80",
      "--erc8004-muted": "0.93 0.015 80",
      "--erc8004-border": "0.89 0.015 80",
      "--erc8004-accent": "0.6 0.18 45",
      "--erc8004-ring": "0.6 0.18 45",
    },
  },
  {
    name: "Dark",
    vars: {
      ...DARK_BASE,
      "--erc8004-accent": "0.65 0.22 260",
      "--erc8004-ring": "0.65 0.22 260",
    },
  },
  {
    name: "Dark teal",
    vars: {
      ...DARK_BASE,
      "--erc8004-accent": "0.65 0.18 175",
      "--erc8004-ring": "0.65 0.18 175",
      "--erc8004-positive": "0.6 0.18 175",
    },
  },
  {
    name: "Sharp",
    vars: {
      "--erc8004-radius": "0",
    },
  },
  {
    name: "Rounded",
    vars: {
      "--erc8004-radius": "1rem",
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CSS code generation
// ─────────────────────────────────────────────────────────────────────────────

function getPresetCss(preset: Preset): string {
  if (Object.keys(preset.vars).length === 0) {
    return (
      `// Default — no overrides needed.\n` +
      `// Import the stylesheet and you're done:\n\n` +
      `import "@erc8004/ui/styles.css"`
    )
  }
  const lines = Object.entries(preset.vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")
  return `.erc8004 {\n${lines}\n}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock components — use the exact same erc8004 token classes as real components
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_AGENT_REGISTRY =
  "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
const MOCK_AGENT_ID = 2290

// Approximates ReputationDistribution's 5-bucket histogram
function MockMiniChart() {
  const bars = [
    { label: "81–100", pct: 82, cls: "bg-erc8004-positive" },
    { label: "61–80", pct: 55, cls: "bg-erc8004-chart-2" },
    { label: "41–60", pct: 28, cls: "bg-erc8004-chart-5" },
    { label: "21–40", pct: 14, cls: "bg-erc8004-chart-3" },
    { label: "0–20", pct: 9, cls: "bg-erc8004-negative" },
  ]
  return (
    <div className="flex items-end gap-1 h-10 mt-2">
      {bars.map(({ label, pct, cls }) => (
        <div
          key={label}
          className="flex-1 flex flex-col justify-end h-full"
          title={label}
        >
          <div
            className={cn(
              "rounded-t-erc8004-sm transition-all duration-200",
              cls
            )}
            style={{ height: `${pct}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function MockReputationBlock() {
  const tags = ["reliability", "speed", "code quality", "api design", "docs"]
  return (
    <div className="rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5 transition-colors duration-200">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-erc8004-positive" />
          <span className="font-mono text-2xl font-semibold text-erc8004-card-fg">
            4.7
          </span>
        </div>
        <span className="text-xs text-erc8004-muted-fg">128 reviews</span>
      </div>
      <MockMiniChart />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-erc8004-muted px-2.5 py-0.5 text-xs text-erc8004-muted-fg transition-colors duration-200"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function MockAgentCard() {
  return (
    <div className="rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5 transition-colors duration-200">
      <div className="flex gap-4">
        {/* FingerprintBadge — actual library component */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
          <FingerprintBadge
            agentRegistry={MOCK_AGENT_REGISTRY}
            agentId={MOCK_AGENT_ID}
            size={64}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-erc8004-card-fg">
            DataSift Agent
          </h3>
          <p className="mt-1 text-sm text-erc8004-muted-fg line-clamp-2">
            Real-time data pipelines and stream processing. Supports MCP for
            tool orchestration.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-erc8004-muted-fg">
              0x742d…dE23
            </span>
            <span className="text-erc8004-border">·</span>
            {["MCP", "A2A", "Web"].map((p) => (
              <span
                key={p}
                className="rounded-full bg-erc8004-muted px-2 py-0.5 text-xs font-medium text-erc8004-muted-fg transition-colors duration-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* VerificationBadge row */}
      <div className="mt-4 pt-4 border-t border-erc8004-border flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-erc8004-positive" />
        <span className="text-xs font-medium text-erc8004-positive">
          Highly Verified
        </span>
        <span className="ml-auto font-mono text-xs text-erc8004-muted-fg">
          12 validations
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Color swatch row
// ─────────────────────────────────────────────────────────────────────────────

const SWATCHES: { label: string; varName: string }[] = [
  { label: "bg", varName: "--erc8004-bg" },
  { label: "card", varName: "--erc8004-card" },
  { label: "muted", varName: "--erc8004-muted" },
  { label: "accent", varName: "--erc8004-accent" },
  { label: "positive", varName: "--erc8004-positive" },
  { label: "negative", varName: "--erc8004-negative" },
  { label: "border", varName: "--erc8004-border" },
]

function SwatchRow() {
  return (
    <div className="mt-6 pt-5 border-t border-erc8004-border flex flex-wrap gap-4">
      {SWATCHES.map(({ label, varName }) => (
        <div
          key={varName}
          className="flex flex-col items-center gap-1.5 cursor-default"
          title={varName}
        >
          <div
            className="h-8 w-8 rounded-erc8004-md border border-erc8004-border shadow-sm"
            style={{ backgroundColor: `oklch(var(${varName}))` }}
          />
          <span className="font-mono text-[10px] text-erc8004-muted-fg">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemePlayground — exported component
// ─────────────────────────────────────────────────────────────────────────────

export function ThemePlayground() {
  const [activeIdx, setActiveIdx] = useState(0)
  const activePreset = PRESETS[activeIdx]

  return (
    <div data-toc-exclude className="flex flex-col gap-4 not-prose">
      {/* Preset selector */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset, i) => (
          <button
            key={preset.name}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "px-3 py-1.5 font-mono text-xs border transition-all duration-200",
              i === activeIdx
                ? "border-black/60 dark:border-white/50 bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white"
                : "border-black/60 dark:border-white/10 bg-transparent text-neutral-400 dark:text-white/40 hover:text-neutral-600 dark:hover:text-white/60 hover:border-black/60 dark:hover:border-white/20"
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Preview surface — the .erc8004 class provides default variable values,
          inline styles override specific variables for the active preset. */}
      <div
        className="erc8004 bg-erc8004-bg rounded-lg border border-black/60 dark:border-white/10 p-6"
        style={activePreset.vars as React.CSSProperties}
      >
        <div className="flex flex-col">
          <div className="flex flex-row gap-4">
            <MockReputationBlock />
            <MockAgentCard />
          </div>
        </div>

        {/* Swatch row */}
        <SwatchRow />
      </div>

      {/* CSS code for the active preset */}
      <CodeBlock
        language={activePreset.name !== "Default" ? "css" : "tsx"}
        code={getPresetCss(activePreset)}
      />
    </div>
  )
}

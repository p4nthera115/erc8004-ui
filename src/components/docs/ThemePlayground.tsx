/**
 * ThemePlayground — interactive theme preset switcher for the theming docs page.
 *
 * Lets users click preset buttons and watch real mock components retheme live.
 * All styling flows through CSS custom properties, so overriding variables in
 * the preview surface's inline style is enough to retheme everything inside it.
 */

import { useState } from "react"
import {
  AgentProvider,
  AgentCard,
  ReputationScore,
  ReputationDistribution,
  TagCloud,
  LastActivity,
} from "@erc8004/ui"
import { cn } from "@/lib/cn"
import { CodeBlock } from "./CodeBlock"

// ─────────────────────────────────────────────────────────────────────────────
// Preset definitions
// ─────────────────────────────────────────────────────────────────────────────

type PresetVars = Record<string, string>

interface Preset {
  name: string
  vars: PresetVars
  /**
   * Pins the preset to a full light or dark token set via the `.light` / `.dark`
   * class on the `.erc8004` element.
   *
   * A preset that only overrides *surface* colours (bg, card, muted, border)
   * inherits its *text* colours from the surrounding page theme. Inside this
   * dark-mode docs site that means light surfaces with near-white text —
   * unreadable. Pinning the theme establishes a consistent base first; the
   * preset's own vars then layer on top via inline style, which outranks any
   * class.
   *
   * Presets that only tweak accent or radius leave this unset on purpose, so
   * they follow whatever theme the reader is using.
   */
  theme?: "light" | "dark"
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
    theme: "light",
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
    theme: "dark",
    vars: {
      "--erc8004-accent": "0.65 0.22 260",
      "--erc8004-ring": "0.65 0.22 260",
    },
  },
  {
    name: "Dark teal",
    theme: "dark",
    vars: {
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
  if (Object.keys(preset.vars).length === 0 && !preset.theme) {
    return (
      `// Default — no overrides needed.\n` +
      `// Import the stylesheet and you're done:\n\n` +
      `import "@erc8004/ui/styles.css"`
    )
  }

  const lines = Object.entries(preset.vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")

  // A themed preset needs the matching class on the wrapper, otherwise the
  // surrounding page theme still supplies the text colours.
  if (preset.theme) {
    const note =
      `/* Add the .${preset.theme} class so the full ${preset.theme} token set applies,\n` +
      `   regardless of the surrounding page theme. */\n` +
      `<div className="erc8004 ${preset.theme}"> … </div>\n\n`
    return lines
      ? `${note}.erc8004.${preset.theme} {\n${lines}\n}`
      : `${note}/* No other overrides needed. */`
  }

  return `.erc8004 {\n${lines}\n}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview content — the real library components, not mocks.
//
// These fetch live on-chain data through the ERC8004Provider mounted in
// main.tsx, so what you retheme here is exactly what ships. Mock markup could
// drift from the components it imitated; this cannot.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_AGENT_REGISTRY =
  "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
const DEMO_AGENT_ID = 888

function PreviewContent() {
  return (
    <AgentProvider agentRegistry={DEMO_AGENT_REGISTRY} agentId={DEMO_AGENT_ID}>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AgentCard />
          <TagCloud maxTags={6} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-erc8004-xl border border-erc8004-border bg-erc8004-card px-5 py-4">
            <ReputationScore />
            <LastActivity />
          </div>
          <ReputationDistribution />
        </div>
      </div>
    </AgentProvider>
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
    // data-markdown-ignore: interactive playground showing live previews and
    // demo agent data. The text content (preset names, demo prose) isn't
    // documentation, so include it neither in the markdown twin nor in
    // parity comparison.
    <div
      data-toc-exclude
      data-markdown-ignore
      className="flex flex-col gap-4 not-prose"
    >
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
        className={cn(
          "erc8004 bg-erc8004-bg rounded-lg border border-black/60 dark:border-white/10 p-6",
          activePreset.theme
        )}
        style={activePreset.vars as React.CSSProperties}
      >
        <PreviewContent />

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

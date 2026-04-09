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
      `/* Default — no overrides needed.\n` +
      `   Import the stylesheet and you're done: */\n\n` +
      `import "@erc8004/ui/styles.css"`
    )
  }
  const lines = Object.entries(preset.vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")
  return `.erc8004 {\n${lines}\n}`
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS syntax highlighter (targeted at our preset output format)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  comment: "#60666b",
  selector: "#79B8FF",
  brace: "#facc15",
  prop: "#b392f0",
  value: "#9ECBFF",
  plain: "#e1e4e8",
  keyword: "#F97583",
  string: "#9ECBFF",
}

function CssCodeLine({ line }: { line: string }) {
  // import statement
  if (line.trimStart().startsWith("import")) {
    const quoteStart = line.indexOf('"')
    if (quoteStart !== -1) {
      return (
        <>
          <span style={{ color: C.keyword }}>{line.slice(0, quoteStart)}</span>
          <span style={{ color: C.string }}>{line.slice(quoteStart)}</span>
        </>
      )
    }
    return <span style={{ color: C.plain }}>{line}</span>
  }

  // comment line
  if (
    line.trim().startsWith("/*") ||
    line.trim().startsWith("*") ||
    line.trim().startsWith("//")
  ) {
    return <span style={{ color: C.comment }}>{line}</span>
  }

  // selector: .erc8004 {
  const selectorMatch = line.match(/^(\s*)([^\s{]+\s*)\{(\s*)$/)
  if (selectorMatch) {
    return (
      <>
        <span style={{ color: C.plain }}>{selectorMatch[1]}</span>
        <span style={{ color: C.selector }}>{selectorMatch[2]}</span>
        <span style={{ color: C.brace }}>{"{"}</span>
        <span style={{ color: C.plain }}>{selectorMatch[3]}</span>
      </>
    )
  }

  // closing brace }
  if (line.trim() === "}") {
    return (
      <>
        <span style={{ color: C.plain }}>
          {line.slice(0, line.indexOf("}"))}
        </span>
        <span style={{ color: C.brace }}>{"}"}</span>
      </>
    )
  }

  // CSS property: --erc8004-xxx: value;
  const propMatch = line.match(
    /^(\s*)(--erc8004-[a-z0-9-]+)(\s*:\s*)([^;]+)(;?)$/
  )
  if (propMatch) {
    return (
      <>
        <span style={{ color: C.plain }}>{propMatch[1]}</span>
        <span style={{ color: C.prop }}>{propMatch[2]}</span>
        <span style={{ color: C.plain }}>{propMatch[3]}</span>
        <span style={{ color: C.value }}>{propMatch[4]}</span>
        <span style={{ color: C.plain }}>{propMatch[5]}</span>
      </>
    )
  }

  // blank line or fallback
  return <span style={{ color: C.plain }}>{line}</span>
}

function CssCodeBlock({ code }: { code: string }) {
  return (
    <>
      <style>{`.pg-code::-webkit-scrollbar{display:none}.pg-code{scrollbar-width:none}`}</style>
      <pre className="pg-code overflow-x-auto bg-neutral-950 border border-white/10 px-5 py-4 font-mono text-sm leading-relaxed whitespace-pre">
        <code>
          {code.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && "\n"}
              <CssCodeLine line={line} />
            </span>
          ))}
        </code>
      </pre>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock components — use the exact same erc8004 token classes as real components
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_AGENT_REGISTRY =
  "eip155:1:0x742d35Cc6634C0532925a3b8D4C9b05B0A98dE23"
const MOCK_AGENT_ID = 374

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

interface MockFeedbackItem {
  id: string
  address: string
  value: number
  tags: string[]
  text: string
  time: string
}

const MOCK_FEEDBACKS: MockFeedbackItem[] = [
  {
    id: "1",
    address: "0x742d…beb7",
    value: 87.5,
    tags: ["reliability", "speed"],
    text: "Outstanding performance on the data pipeline task. Completed in half the estimated time with zero errors.",
    time: "2 days ago",
  },
  {
    id: "2",
    address: "0xAbC3…cDe4",
    value: 23.0,
    tags: ["accuracy"],
    text: "Struggled with domain-specific terminology. Needed multiple correction rounds before reaching acceptable output.",
    time: "5 days ago",
  },
  {
    id: "3",
    address: "0x1234…5678",
    value: 91.0,
    tags: ["code quality", "documentation"],
    text: "Exceptional code review with actionable suggestions. Will definitely use again.",
    time: "1 week ago",
  },
]

function feedbackScoreColor(value: number) {
  if (value >= 81) return "text-erc8004-positive"
  if (value >= 61) return "text-erc8004-chart-2"
  if (value >= 41) return "text-erc8004-chart-5"
  if (value >= 21) return "text-erc8004-chart-3"
  return "text-erc8004-negative"
}

function MockFeedbackCard({ item }: { item: MockFeedbackItem }) {
  return (
    <div className="rounded-erc8004-lg border border-erc8004-border bg-erc8004-card p-4 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span
            className={cn(
              "font-mono text-lg font-semibold tabular-nums",
              feedbackScoreColor(item.value)
            )}
          >
            {item.value.toFixed(1)}
          </span>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-erc8004-muted px-2 py-0.5 text-xs text-erc8004-muted-fg"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-erc8004-muted-fg">
            {item.address}
          </div>
          <div className="text-xs text-erc8004-muted-fg">{item.time}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-erc8004-card-fg line-clamp-2">
        {item.text}
      </p>
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
    <div className="flex flex-col gap-4 not-prose">
      {/* Preset selector */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset, i) => (
          <button
            key={preset.name}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "px-3 py-1.5 font-mono text-xs border transition-all duration-200",
              i === activeIdx
                ? "border-white/50 bg-white/10 text-white"
                : "border-white/10 bg-transparent text-white/40 hover:text-white/60 hover:border-white/20"
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Preview surface — the .erc8004 class provides default variable values,
          inline styles override specific variables for the active preset. */}
      <div
        className="erc8004 bg-erc8004-bg rounded-lg border border-white/10 p-6"
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
      <CssCodeBlock code={getPresetCss(activePreset)} />
    </div>
  )
}

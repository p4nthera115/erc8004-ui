import { Link } from "@tanstack/react-router"
import { useMinWidth } from "@/lib/use-min-width"
import { cn } from "@/lib/cn"
import type { CSSProperties, ReactNode } from "react"
import {
  AgentProvider,
  AgentCard,
  EndpointStatus,
  ReputationDistribution,
  ReputationTimeline,
  FeedbackList,
  TagCloud,
  ActivityLog,
} from "@p4n/erc8004-ui"

const BASE_REGISTRY = "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"

/**
 * Complete theme presets. Every component in the library styles itself from
 * `--erc8004-*` custom properties, so setting the full token set on a tile
 * rethemes everything inside it — surfaces, text, borders, charts, radii —
 * with no prop drilling and no variant API.
 *
 * These are deliberately fixed palettes rather than light/dark pairs: a themed
 * tile keeps its own look whichever mode the site is in, which is the point —
 * the library adopts your design system, not the other way round.
 */
type Theme = {
  name: string
  /** Header swatch — a plain colour, so it reads before the tile is themed. */
  swatch: string
  vars: Record<string, string>
  font?: string
}

const THEMES: Record<string, Theme> = {
  violet: {
    name: "Violet — rounded, sans",
    swatch: "oklch(0.55 0.25 300)",
    font: "Inter, system-ui, -apple-system, sans-serif",
    vars: {
      "--erc8004-bg": "0.99 0.006 300",
      "--erc8004-fg": "0.25 0.04 300",
      "--erc8004-card": "0.975 0.012 300",
      "--erc8004-card-fg": "0.25 0.05 300",
      "--erc8004-muted": "0.945 0.022 300",
      "--erc8004-muted-fg": "0.52 0.06 300",
      "--erc8004-border": "0.9 0.025 300",
      "--erc8004-accent": "0.55 0.25 300",
      "--erc8004-accent-fg": "0.99 0 0",
      "--erc8004-positive": "0.58 0.16 300",
      "--erc8004-ring": "0.55 0.25 300",
      "--erc8004-chart-1": "0.55 0.25 300",
      "--erc8004-chart-2": "0.68 0.18 320",
      "--erc8004-chart-3": "0.72 0.14 280",
      "--erc8004-chart-4": "0.62 0.2 340",
      "--erc8004-chart-5": "0.78 0.1 300",
      "--erc8004-radius": "1rem",
    },
  },
  terminal: {
    name: "Terminal — green on black, sharp",
    swatch: "oklch(0.78 0.2 145)",
    vars: {
      "--erc8004-bg": "0.16 0.012 150",
      "--erc8004-fg": "0.93 0.06 150",
      "--erc8004-card": "0.21 0.018 150",
      "--erc8004-card-fg": "0.93 0.06 150",
      "--erc8004-muted": "0.27 0.025 150",
      "--erc8004-muted-fg": "0.72 0.06 150",
      "--erc8004-border": "0.34 0.04 150",
      "--erc8004-accent": "0.78 0.2 145",
      "--erc8004-accent-fg": "0.16 0.02 150",
      "--erc8004-positive": "0.78 0.2 145",
      "--erc8004-positive-fg": "0.16 0.02 150",
      "--erc8004-negative": "0.65 0.2 30",
      "--erc8004-ring": "0.78 0.2 145",
      "--erc8004-chart-1": "0.78 0.2 145",
      "--erc8004-chart-2": "0.68 0.15 160",
      "--erc8004-chart-3": "0.6 0.12 170",
      "--erc8004-chart-4": "0.85 0.15 135",
      "--erc8004-chart-5": "0.55 0.1 155",
      "--erc8004-radius": "0",
    },
  },
  paper: {
    name: "Paper — warm, serif",
    swatch: "oklch(0.55 0.15 55)",
    font: 'Georgia, "Times New Roman", serif',
    vars: {
      "--erc8004-bg": "0.97 0.016 80",
      "--erc8004-fg": "0.26 0.03 60",
      "--erc8004-card": "0.955 0.022 80",
      "--erc8004-card-fg": "0.26 0.035 60",
      "--erc8004-muted": "0.92 0.03 80",
      "--erc8004-muted-fg": "0.5 0.04 70",
      "--erc8004-border": "0.87 0.035 80",
      "--erc8004-accent": "0.55 0.15 55",
      "--erc8004-accent-fg": "0.98 0.01 80",
      "--erc8004-positive": "0.55 0.13 130",
      "--erc8004-negative": "0.52 0.18 30",
      "--erc8004-ring": "0.55 0.15 55",
      "--erc8004-chart-1": "0.62 0.15 65",
      "--erc8004-chart-2": "0.68 0.12 95",
      "--erc8004-chart-3": "0.55 0.14 40",
      "--erc8004-chart-4": "0.72 0.1 80",
      "--erc8004-chart-5": "0.48 0.1 60",
      "--erc8004-radius": "0.75rem",
    },
  },
  midnight: {
    name: "Midnight — indigo, sans",
    swatch: "oklch(0.66 0.2 265)",
    font: "Inter, system-ui, -apple-system, sans-serif",
    vars: {
      "--erc8004-bg": "0.19 0.03 265",
      "--erc8004-fg": "0.96 0.012 265",
      "--erc8004-card": "0.24 0.04 265",
      "--erc8004-card-fg": "0.96 0.012 265",
      "--erc8004-muted": "0.3 0.045 265",
      "--erc8004-muted-fg": "0.74 0.035 265",
      "--erc8004-border": "0.35 0.05 265",
      "--erc8004-accent": "0.66 0.2 265",
      "--erc8004-accent-fg": "0.17 0.03 265",
      "--erc8004-positive": "0.72 0.15 165",
      "--erc8004-positive-fg": "0.17 0.03 265",
      "--erc8004-negative": "0.68 0.19 20",
      "--erc8004-ring": "0.66 0.2 265",
      "--erc8004-chart-1": "0.66 0.2 265",
      "--erc8004-chart-2": "0.72 0.15 200",
      "--erc8004-chart-3": "0.7 0.18 300",
      "--erc8004-chart-4": "0.78 0.13 230",
      "--erc8004-chart-5": "0.6 0.14 280",
      "--erc8004-radius": "0.5rem",
    },
  },
}

type TileDef = {
  /** Component name shown in the tile header — links to its docs page. */
  name: string
  slug: string
  agentId: number
  /** Optional theme override, to show the token system at work. */
  theme?: Theme
  render: () => ReactNode
}

/**
 * Real agents on Base, each with a registration file and feedback history.
 * Every tile below is a live subgraph query — the wall is the pitch.
 */
const COLUMN_A: TileDef[] = [
  {
    name: "AgentCard",
    slug: "agent-card",
    agentId: 2290,
    render: () => <AgentCard />,
  },
  {
    name: "TagCloud",
    slug: "tag-cloud",
    agentId: 1380,
    theme: THEMES.violet,
    render: () => <TagCloud maxTags={6} />,
  },
  {
    name: "ReputationTimeline",
    slug: "reputation-timeline",
    agentId: 888,
    render: () => <ReputationTimeline />,
  },
  {
    name: "EndpointStatus",
    slug: "endpoint-status",
    agentId: 1372,
    theme: THEMES.terminal,
    render: () => <EndpointStatus />,
  },
]

const COLUMN_B: TileDef[] = [
  {
    name: "FeedbackList",
    slug: "feedback-list",
    agentId: 2290,
    theme: THEMES.paper,
    render: () => (
      <FeedbackList
        pageSize={2}
        showResponses={false}
        showReviewerAddress={false}
        showTimestamp={false}
      />
    ),
  },
  {
    name: "AgentCard",
    slug: "agent-card",
    agentId: 888,
    render: () => <AgentCard />,
  },
  {
    name: "ReputationDistribution",
    slug: "reputation-distribution",
    agentId: 1380,
    theme: THEMES.midnight,
    render: () => <ReputationDistribution />,
  },
  {
    name: "TagCloud",
    slug: "tag-cloud",
    agentId: 1421,
    render: () => <TagCloud maxTags={6} />,
  },
]

const COLUMN_C: TileDef[] = [
  {
    name: "ActivityLog",
    slug: "activity-log",
    agentId: 1434,
    render: () => <ActivityLog pageSize={3} />,
  },
  {
    name: "AgentCard",
    slug: "agent-card",
    agentId: 1156,
    theme: THEMES.violet,
    render: () => <AgentCard />,
  },
  {
    name: "ReputationDistribution",
    slug: "reputation-distribution",
    agentId: 1,
    theme: THEMES.terminal,
    render: () => <ReputationDistribution />,
  },
  {
    name: "EndpointStatus",
    slug: "endpoint-status",
    agentId: 1421,
    render: () => <EndpointStatus />,
  },
]

function Tile({ tile, axis = "y" }: { tile: TileDef; axis?: "x" | "y" }) {
  const theme = tile.theme

  /*
    A themed tile paints its own chrome from the same tokens the components
    inside it read, so the frame, the header rule and the card all belong to
    one palette rather than the tile being a site-coloured window onto a
    themed component.
  */
  const style = theme
    ? ({
        ...theme.vars,
        fontFamily: theme.font,
        background: "oklch(var(--erc8004-bg))",
        color: "oklch(var(--erc8004-fg))",
        borderColor: "oklch(var(--erc8004-border))",
      } as CSSProperties)
    : undefined

  return (
    <div
      className={
        // Spacing lives on the tile rather than as flex `gap` so the track's
        // 50% translate lands exactly on the start of the second copy.
        (axis === "x" ? "mr-4 w-[17rem] shrink-0" : "mb-4") +
        " border shadow-lg shadow-black/10 dark:shadow-black/50" +
        (theme ? "" : " border-black/60 bg-surface dark:border-white/25")
      }
      style={style}
    >
      <div
        className={
          "flex items-center justify-between gap-3 border-b px-3 py-1.5" +
          (theme ? "" : " border-black/60 dark:border-white/25")
        }
        style={
          theme ? { borderColor: "oklch(var(--erc8004-border))" } : undefined
        }
      >
        <Link
          to="/docs/components/$slug"
          params={{ slug: tile.slug }}
          className="truncate text-[11px] hover:underline"
        >
          {tile.name}
        </Link>
        <span
          className={
            "flex shrink-0 items-center gap-1.5 text-[11px]" +
            (theme ? "" : " text-text-secondary")
          }
          style={
            theme ? { color: "oklch(var(--erc8004-muted-fg))" } : undefined
          }
        >
          {theme && (
            <span
              title={`Custom theme — ${theme.name}`}
              className="h-2 w-2 rounded-[2px]"
              style={{ background: theme.swatch }}
            />
          )}
          #{tile.agentId}
        </span>
      </div>
      <div className="overflow-hidden p-3">
        <AgentProvider agentRegistry={BASE_REGISTRY} agentId={tile.agentId}>
          {tile.render()}
        </AgentProvider>
      </div>
    </div>
  )
}

/**
 * One column of the wall. The tile list is rendered twice and the track is
 * translated by exactly half its height, so the loop is seamless. Tiles carry
 * their spacing as `mb-4` (not flex `gap`) to keep that half exact.
 */
function MarqueeColumn({
  tiles,
  duration,
  reverse,
}: {
  tiles: TileDef[]
  duration: number
  reverse?: boolean
}) {
  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      <div
        className="marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1 || undefined}>
            {tiles.map((tile, i) => (
              <Tile key={`${tile.slug}-${tile.agentId}-${i}`} tile={tile} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The mobile counterpart to the wall. The three-column wall needs height the
 * hero doesn't have on a phone, so below `md` the same tiles run past in a
 * single horizontal band instead.
 *
 * Deliberately a shorter list than the wall's twelve: every tile is a live
 * subgraph query, and this one loads on phones. The picks are the components
 * whose natural height is close, so the band reads as one strip rather than a
 * ragged skyline, and they carry a mix of themes to make the point that the
 * tokens travel with the component.
 */
const CAROUSEL_TILES: TileDef[] = [
  { name: "AgentCard", slug: "agent-card", agentId: 2290, render: () => <AgentCard /> },
  {
    name: "TagCloud",
    slug: "tag-cloud",
    agentId: 1380,
    theme: THEMES.violet,
    render: () => <TagCloud maxTags={6} />,
  },
  {
    name: "ReputationTimeline",
    slug: "reputation-timeline",
    agentId: 888,
    render: () => <ReputationTimeline />,
  },
  {
    name: "EndpointStatus",
    slug: "endpoint-status",
    agentId: 1372,
    theme: THEMES.terminal,
    render: () => <EndpointStatus />,
  },
  {
    name: "ReputationDistribution",
    slug: "reputation-distribution",
    agentId: 1380,
    theme: THEMES.midnight,
    render: () => <ReputationDistribution />,
  },
  {
    name: "AgentCard",
    slug: "agent-card",
    agentId: 1156,
    theme: THEMES.paper,
    render: () => <AgentCard />,
  },
]

/**
 * The line that tells you the tiles aren't a mockup. Shared by the hero (where
 * it captions the wall beside it, hence the arrow) and the mobile carousel
 * (where it sits on the band itself, so the arrow would point at nothing).
 */
export function LiveIndicator({
  arrow,
  className,
}: {
  arrow?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-[11px] text-text-secondary",
        className
      )}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
      </span>
      Live agent data from Base
      {arrow && (
        <span aria-hidden className="mb-0.5 text-xl">
          {arrow}
        </span>
      )}
    </div>
  )
}

export function ComponentCarousel() {
  const isDesktop = useMinWidth(768)
  if (isDesktop) return null

  return (
    <div className="diagonal-lines relative overflow-hidden border-b border-black/60 md:hidden dark:border-white/25">
      {/*
        `w-max` keeps the two copies on one line; the track then translates by
        exactly half its width, which is one full copy, so the loop is seamless.
        No horizontal padding here — it would count toward that width and put
        the halfway point half a pad short, which shows up as a jump each loop.
        Tiles keep their natural height against the diagonal ground, as they do
        in the wall, and are centred on the band's midline so the strip reads
        as one row rather than a set of things hanging off the top edge.
      */}
      <div
        className="marquee-track-x flex w-max items-center py-4"
        style={{ animationDuration: "55s" }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1 || undefined} className="flex items-center">
            {CAROUSEL_TILES.map((tile, i) => (
              <Tile key={`${tile.slug}-${tile.agentId}-${i}`} tile={tile} axis="x" />
            ))}
          </div>
        ))}
      </div>

      {/* Fade into the page colour at both edges, as the wall does. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent" />

      <LiveIndicator className="pointer-events-none absolute bottom-3 right-3 z-10 border border-black/60 bg-surface px-2.5 py-1 dark:border-white/25" />
    </div>
  )
}

/**
 * The hero visual: two columns of live components scrolling past each other.
 * Hovering a column pauses it so the tile can be read (and its docs link
 * clicked); `prefers-reduced-motion` stops both (see src/index.css).
 */
export function ComponentWall() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/*
        The track is laid out 25% larger than the panel and scaled back down,
        so three columns render at a comfortable component width (~270px of
        layout) while reading as a dense wall at ~215px on screen.
      */}
      <div className="flex h-[125%] w-[125%] origin-top-left scale-80 gap-4 p-4">
        <MarqueeColumn tiles={COLUMN_A} duration={75} />
        <MarqueeColumn tiles={COLUMN_B} duration={95} reverse />
        <MarqueeColumn tiles={COLUMN_C} duration={85} />
      </div>

      {/*
        Gradients rather than a mask, so the tiles fade into the page colour at
        both edges instead of dissolving into the diagonal pattern behind them.
        pointer-events-none keeps hover-to-pause working underneath.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-surface to-transparent" />
    </div>
  )
}

import { useState, useMemo, useRef, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import type { Feedback } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { cn } from "@/lib/cn"
import { Card, Skeleton, EmptyState, ErrorState } from "@/components/_internal"
import * as v from "valibot"

type TimelineResponse = {
  feedbacks: Array<Pick<Feedback, "id" | "value" | "createdAt">>
}

const timelineSchema = v.object({
  feedbacks: v.pipe(
    v.array(
      v.object({
        id: v.string(),
        value: v.string(),
        createdAt: v.string(),
      })
    ),
    v.transform((raw) =>
      raw.map((item) => ({
        id: item.id,
        value: parseFloat(item.value),
        createdAt: parseInt(item.createdAt, 10),
      }))
    )
  ),
})

const TIMELINE_QUERY = `#graphql
  query ($id: ID!, $first: Int!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first
    ) {
      id
      value
      createdAt
    }
  }
`

function useFeedbackTimeline(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["reputation-timeline", agentRegistry, agentId],
    queryFn: async (): Promise<TimelineResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}`, first: 100 }

      const data = await subgraphFetch<TimelineResponse>(
        url,
        TIMELINE_QUERY,
        variables
      )

      try {
        return v.parse(timelineSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(
            `Invalid subgraph response: ${error.issues[0].message}`
          )
        }
        throw error
      }
    },
  })
}

// ============================================================================
// TIMELINE LAYOUT — SVG scatter plot with X=time, Y=score (0–100)
// ============================================================================

const LAYOUT = {
  width: 560,
  height: 200,
  paddingLeft: 36,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 28,
} as const

function getPlotArea() {
  return {
    x: LAYOUT.paddingLeft,
    y: LAYOUT.paddingTop,
    width: LAYOUT.width - LAYOUT.paddingLeft - LAYOUT.paddingRight,
    height: LAYOUT.height - LAYOUT.paddingTop - LAYOUT.paddingBottom,
  }
}

type PlotArea = ReturnType<typeof getPlotArea>

function scaleX(timestamp: number, minTime: number, maxTime: number, plot: PlotArea): number {
  if (maxTime === minTime) return plot.x + plot.width / 2
  const ratio = (timestamp - minTime) / (maxTime - minTime)
  return plot.x + ratio * plot.width
}

function scaleY(score: number, plot: PlotArea): number {
  const ratio = Math.max(0, Math.min(100, score)) / 100
  return plot.y + plot.height - ratio * plot.height
}

function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const month = date.toLocaleString("en", { month: "short" })
  const year = date.getFullYear().toString().slice(2)
  return `${month} '${year}`
}

function formatFullDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Evenly thins a series down to `max` entries, always keeping the first and
 * last so the trend still spans the full time range.
 *
 * An agent with 1200 reviews puts ~0.4 units between adjacent points on a
 * 508-unit plot, which renders as an unreadable solid band and makes hover
 * targeting meaningless. Every retained dot is still a real review — this
 * thins the series, it does not average it.
 */
function thin<T>(items: T[], max: number): T[] {
  if (items.length <= max || max < 2) return items
  const step = (items.length - 1) / (max - 1)
  const out: T[] = []
  for (let i = 0; i < max; i++) out.push(items[Math.round(i * step)])
  return out
}

type Pt = { x: number; y: number }

/** Straight segments between points. */
function linearPath(pts: Pt[]): string {
  if (pts.length < 2) return ""
  return `M${pts[0].x},${pts[0].y}` + pts.slice(1).map((p) => `L${p.x},${p.y}`).join("")
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson), the same curve shadcn/Recharts
 * use for `type="monotone"`.
 *
 * Deliberately not Catmull-Rom: that overshoots around sharp changes, which on a
 * 0–100 score axis would draw the line above 100 or below 0 and imply readings
 * that never happened. Monotone keeps every segment within its endpoints.
 */
function monotonePath(pts: Pt[]): string {
  const n = pts.length
  if (n < 2) return ""
  if (n === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`

  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x
    slope[i] = dx[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx[i]
  }

  // Tangents, flattened to 0 at local extrema so the curve can't overshoot.
  const m: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])
    }
  }
  m[n - 1] = slope[n - 2]

  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const t = dx[i] / 3
    d +=
      `C${pts[i].x + t},${pts[i].y + m[i] * t} ` +
      `${pts[i + 1].x - t},${pts[i + 1].y - m[i + 1] * t} ` +
      `${pts[i + 1].x},${pts[i + 1].y}`
  }
  return d
}

/** Tooltip card geometry. Width is driven by the widest row — the date. */
const TOOLTIP = { height: 38, padX: 9, gap: 6 } as const

function tooltipWidthFor(dateLabel: string): number {
  const dateRow = dateLabel.length * 5.4
  const valueRow = 3 * 2 + 6 + 30 + 24 // dot + gap + "Score" + value
  return Math.min(
    LAYOUT.width - 8,
    Math.max(112, Math.max(dateRow, valueRow) + TOOLTIP.padX * 2)
  )
}

/** Colour for a data point based on its score band. */
function dotFillVar(score: number): string {
  if (score >= 81) return "oklch(var(--erc8004-positive))"
  if (score >= 61) return "oklch(var(--erc8004-chart-2))"
  if (score >= 41) return "oklch(var(--erc8004-chart-5))"
  if (score >= 21) return "oklch(var(--erc8004-chart-3))"
  return "oklch(var(--erc8004-negative))"
}

// ============================================================================
// COMPONENT
// ============================================================================

export type ReputationTimelineRange = "7d" | "30d" | "90d" | "all"
export type ReputationTimelineCurve = "linear" | "monotone"

export interface ReputationTimelineProps extends AgentIdentityProps {
  /** Time range filter. Default `"all"`. */
  range?: ReputationTimelineRange
  /** Show connecting trend line between data points. Default `true`. */
  showTrendLine?: boolean
  /**
   * Trend line shape. `"linear"` draws straight segments between points;
   * `"monotone"` draws a smooth curve that never overshoots its data points.
   * Default `"linear"`.
   */
  curve?: ReputationTimelineCurve
  /** Show individual data point dots. Default `true`. */
  showDataPoints?: boolean
  /**
   * Maximum dots to plot. Longer series are evenly thinned to this many so the
   * points stay distinguishable and hoverable. Default `40`.
   */
  maxPoints?: number
  className?: string
}

export function ReputationTimeline({
  range = "all",
  showTrendLine = true,
  curve = "linear",
  showDataPoints = true,
  maxPoints = 40,
  className,
  ...props
}: ReputationTimelineProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { data, isLoading, error } = useFeedbackTimeline(agentRegistry, agentId)

  // "Now" is external, mutable state, so reading it during render is impure —
  // and reading it *inside* the memo was also a bug: the cutoff was frozen
  // until `data` or `range` changed, so the window silently failed to move
  // with the clock. Capturing it once per mount makes the window an explicit,
  // stable input instead.
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000))

  const feedbacks = data?.feedbacks

  // Sort ascending (oldest first) so the line flows left-to-right, then filter
  // by time range. Subgraph returns newest-first so we reverse via sort.
  const sorted = useMemo(() => {
    if (!feedbacks) return []
    const all = [...feedbacks].sort((a, b) => a.createdAt - b.createdAt)
    if (range === "all") return all
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const cutoff = nowSeconds - days * 86400
    return all.filter((fb) => fb.createdAt >= cutoff)
  }, [feedbacks, range, nowSeconds])

  const plot = getPlotArea()
  const minTime = sorted[0]?.createdAt ?? 0
  const maxTime = sorted[sorted.length - 1]?.createdAt ?? 0

  // Thin for rendering only — `sorted.length` still reports the true count.
  const plotted = useMemo(() => thin(sorted, maxPoints), [sorted, maxPoints])

  const points = useMemo(
    () =>
      plotted.map((fb) => ({
        x: scaleX(fb.createdAt, minTime, maxTime, plot),
        y: scaleY(fb.value, plot),
        value: fb.value,
        createdAt: fb.createdAt,
      })),
    [plotted, minTime, maxTime, plot]
  )

  const linePath = useMemo(
    () => (curve === "monotone" ? monotonePath(points) : linearPath(points)),
    [points, curve]
  )
  const yTicks = [0, 25, 50, 75, 100]

  const xLabels = useMemo(() => {
    if (sorted.length === 0) return []
    if (sorted.length === 1) {
      return [
        {
          timestamp: sorted[0].createdAt,
          x: scaleX(sorted[0].createdAt, minTime, maxTime, plot),
        },
      ]
    }

    // Candidates are evenly spaced by INDEX, but reviews cluster in time — so
    // several can land within a few units of each other and render as an
    // unreadable smear. Pick by index, then keep only those that clear a
    // minimum horizontal gap.
    const count = Math.min(5, sorted.length)
    const step = (sorted.length - 1) / (count - 1)
    const candidates: { timestamp: number; x: number }[] = []
    for (let i = 0; i < count; i++) {
      const fb = sorted[Math.round(i * step)]
      candidates.push({
        timestamp: fb.createdAt,
        x: scaleX(fb.createdAt, minTime, maxTime, plot),
      })
    }

    const MIN_GAP = 58
    const kept: typeof candidates = []
    for (const c of candidates) {
      if (kept.length === 0 || c.x - kept[kept.length - 1].x >= MIN_GAP) {
        kept.push(c)
      }
    }

    // Always end on the true final timestamp: either append it if it clears the
    // gap, or swap it for the crowded one before it.
    const last = candidates[candidates.length - 1]
    if (kept[kept.length - 1] !== last) {
      if (last.x - kept[kept.length - 1].x >= MIN_GAP) kept.push(last)
      else if (kept.length > 1) kept[kept.length - 1] = last
    }
    return kept
  }, [sorted, minTime, maxTime, plot])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return
      const rect = svgRef.current.getBoundingClientRect()
      const mouseX = ((e.clientX - rect.left) / rect.width) * LAYOUT.width
      let closestIdx = 0
      let closestDist = Infinity
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      }
      // No distance threshold: snapping to the nearest point for as long as the
      // pointer is over the chart keeps the tooltip mounted, so moving between
      // points animates its position instead of unmounting and remounting it.
      void closestDist
      setHoveredIndex(closestIdx)
    },
    [points]
  )

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), [])

  if (isLoading) {
    return (
      <Card className={cn("w-full p-5", className)}>
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="h-[200px] w-full" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <ErrorState message="Couldn't load reputation data" />
      </Card>
    )
  }

  if (sorted.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <h3 className="px-4 pt-4 text-sm font-medium text-erc8004-card-fg">
          Score Timeline
        </h3>
        <EmptyState message="No feedback yet" />
      </Card>
    )
  }

  return (
    <Card className={cn("w-full p-5", className)}>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-erc8004-card-fg">
          Score Timeline
        </h3>
        <span className="text-xs text-erc8004-muted-fg">
          {sorted.length} review{sorted.length === 1 ? "" : "s"}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Horizontal grid lines + Y-axis labels */}
        {yTicks.map((tick) => {
          const y = scaleY(tick, plot)
          return (
            <g key={tick}>
              <line
                x1={plot.x}
                y1={y}
                x2={plot.x + plot.width}
                y2={y}
                stroke="currentColor"
                className="text-erc8004-border"
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
              <text
                x={plot.x - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-erc8004-muted-fg text-[10px]"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* X-axis date labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={Math.max(24, Math.min(label.x, LAYOUT.width - 24))}
            y={LAYOUT.height - 4}
            textAnchor="middle"
            className="fill-erc8004-muted-fg text-[10px]"
          >
            {formatShortDate(label.timestamp)}
          </text>
        ))}

        {/* Connecting trend line */}
        {showTrendLine && points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            className="text-erc8004-border"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data points */}
        {showDataPoints &&
          points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === i ? 5 : 3.5}
              style={{
                fill: dotFillVar(pt.value),
                stroke: "oklch(var(--erc8004-card))",
                transition: "r 150ms ease-out",
              }}
              strokeWidth={1.5}
            />
          ))}

        {/* Hover overlay — crosshair, halo and tooltip card.
            Rendered as one group that stays mounted for the whole hover, so
            moving between points animates its transform rather than tearing
            the tooltip down and rebuilding it. `pointer-events: none` keeps it
            from stealing the mouse from the SVG's own move handler. */}
        {(() => {
          const pt = hoveredIndex !== null ? points[hoveredIndex] : null
          if (!pt) return null

          const dateLabel = formatFullDate(pt.createdAt)
          const boxW = tooltipWidthFor(dateLabel)
          const half = boxW / 2
          const { height: boxH, padX } = TOOLTIP

          // Prefer above the point, flip below when there's no room, then clamp
          // so the card can never leave the chart on any edge.
          const wantAbove = pt.y - boxH - 14 >= 0
          const rawY = wantAbove ? pt.y - boxH / 2 - 14 : pt.y + boxH / 2 + 14
          const boxY = Math.max(
            boxH / 2 + 2,
            Math.min(rawY, LAYOUT.height - boxH / 2 - 2)
          )
          const boxX = Math.max(
            half + 2,
            Math.min(pt.x, LAYOUT.width - half - 2)
          )

          const glide = "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)"

          return (
            <g style={{ pointerEvents: "none" }}>
              {/* Crosshair — full plot height, so only X animates */}
              <g style={{ transform: `translateX(${pt.x}px)`, transition: glide }}>
                <line
                  x1={0}
                  y1={plot.y}
                  x2={0}
                  y2={plot.y + plot.height}
                  stroke="currentColor"
                  className="text-erc8004-border"
                  strokeWidth={0.75}
                  strokeDasharray="2 2"
                />
              </g>

              {/* Halo on the active point */}
              <g
                style={{
                  transform: `translate(${pt.x}px, ${pt.y}px)`,
                  transition: glide,
                }}
              >
                <circle r={8} style={{ fill: dotFillVar(pt.value) }} opacity={0.18} />
              </g>

              {/* Tooltip card. Uses the card surface + border rather than the
                  inverted foreground colour, so it reads as a raised panel in
                  both themes instead of a white block on a dark chart. */}
              <g
                style={{
                  transform: `translate(${boxX}px, ${boxY}px)`,
                  transition: glide,
                }}
              >
                <rect
                  x={-half}
                  y={-boxH / 2}
                  width={boxW}
                  height={boxH}
                  rx={6}
                  className="fill-erc8004-card stroke-erc8004-border"
                  strokeWidth={1}
                />
                {/* Row 1 — date */}
                <text
                  x={-half + padX}
                  y={-boxH / 2 + 14}
                  textAnchor="start"
                  className="fill-erc8004-muted-fg text-[9px]"
                >
                  {dateLabel}
                </text>
                {/* Row 2 — swatch, label, value */}
                <circle
                  cx={-half + padX + 3}
                  cy={boxH / 2 - 10}
                  r={3}
                  style={{ fill: dotFillVar(pt.value) }}
                />
                <text
                  x={-half + padX + 12}
                  y={boxH / 2 - 7}
                  textAnchor="start"
                  className="fill-erc8004-muted-fg text-[10px]"
                >
                  Score
                </text>
                <text
                  x={half - padX}
                  y={boxH / 2 - 7}
                  textAnchor="end"
                  className="fill-erc8004-card-fg text-[10px] font-semibold tabular-nums"
                >
                  {Math.round(pt.value)}
                </text>
              </g>
            </g>
          )
        })()}
      </svg>
    </Card>
  )
}

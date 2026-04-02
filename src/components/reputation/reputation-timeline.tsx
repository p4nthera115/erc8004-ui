import { useState, useMemo, useRef, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import type { Feedback } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
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
// TIMELINE LAYOUT
// ============================================================================
// The timeline is a pure SVG scatter plot:
//   - X-axis = time (createdAt timestamps, oldest on the left)
//   - Y-axis = score (0 at the bottom, 100 at the top)
//   - Each feedback entry is a colored dot
//   - A faint line connects the dots chronologically to show trends
//
// We use SVG instead of an external charting library (like recharts)
// because the project spec says "no external UI libraries" — Tailwind only.
// SVG is native to React and gives us full control over rendering.
// ============================================================================

/** Layout constants for the SVG viewBox */
const LAYOUT = {
  /** Total width of the SVG coordinate system */
  width: 560,
  /** Total height of the SVG coordinate system */
  height: 200,
  /** Space on the left for Y-axis labels (score numbers like "0", "50", "100") */
  paddingLeft: 36,
  /** Space on the right so the rightmost dot isn't clipped by the SVG edge */
  paddingRight: 16,
  /** Space at the top so the topmost dot isn't clipped */
  paddingTop: 12,
  /** Space at the bottom for X-axis date labels */
  paddingBottom: 28,
} as const

/**
 * Returns the usable "plot area" — the inner rectangle where data dots go.
 * This is the total SVG size minus the padding reserved for labels.
 *
 * Think of it like a picture frame: the frame (padding) holds axis labels,
 * and the picture inside (plot area) holds the actual data visualisation.
 */
function getPlotArea() {
  return {
    x: LAYOUT.paddingLeft,
    y: LAYOUT.paddingTop,
    width: LAYOUT.width - LAYOUT.paddingLeft - LAYOUT.paddingRight,
    height: LAYOUT.height - LAYOUT.paddingTop - LAYOUT.paddingBottom,
  }
}

// ============================================================================
// SCALING FUNCTIONS
// ============================================================================
// These convert data values (timestamps, scores) into pixel positions.
//
// "Scaling" means mapping a value from one range to another:
//   - A timestamp between [earliest, latest] maps to [left edge, right edge]
//   - A score between [0, 100] maps to [bottom edge, top edge]
//
// One gotcha: SVG's Y-axis is inverted compared to math convention.
// In SVG, Y=0 is the TOP of the image, and Y increases DOWNWARD.
// So a score of 100 (highest) needs a small Y value (near the top),
// and a score of 0 (lowest) needs a large Y value (near the bottom).
// ============================================================================

type PlotArea = ReturnType<typeof getPlotArea>

function scaleX(
  timestamp: number,
  minTime: number,
  maxTime: number,
  plot: PlotArea
): number {
  // Edge case: if all reviews happened at the exact same time,
  // there's no time range to spread across, so center everything.
  if (maxTime === minTime) return plot.x + plot.width / 2
  const ratio = (timestamp - minTime) / (maxTime - minTime)
  return plot.x + ratio * plot.width
}

function scaleY(score: number, plot: PlotArea): number {
  // ratio=1 for score 100 → should be at the TOP (small Y in SVG)
  // ratio=0 for score 0 → should be at the BOTTOM (large Y in SVG)
  const ratio = score / 100
  return plot.y + plot.height - ratio * plot.height
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Formats a Unix timestamp (in seconds) to a short X-axis label.
 * Uses "MMM 'YY" format (e.g., "Jan '25") because full dates would
 * overlap when there are many labels. The apostrophe before the year
 * is a common shorthand that saves horizontal space.
 */
function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const month = date.toLocaleString("en", { month: "short" })
  const year = date.getFullYear().toString().slice(2)
  return `${month} '${year}`
}

/**
 * Formats a Unix timestamp to a full date for the hover tooltip.
 * Uses "MMM D, YYYY" format (e.g., "Jan 15, 2025") since tooltips
 * have more space and the user is actively looking for detail.
 */
function formatFullDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Returns a hex color for a dot based on its score value.
 * These match the bucket colors used in ReputationDistribution
 * so both components feel visually connected:
 *   - 81–100: emerald (green — excellent)
 *   - 61–80:  lighter emerald (good)
 *   - 41–60:  amber (average)
 *   - 21–40:  orange (poor)
 *   - 0–20:   red (very poor)
 */
function dotColor(score: number): string {
  if (score >= 81) return "#10b981"
  if (score >= 61) return "#34d399"
  if (score >= 41) return "#fbbf24"
  if (score >= 21) return "#fb923c"
  return "#f87171"
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReputationTimeline(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { data, isLoading, error } = useFeedbackTimeline(agentRegistry, agentId)

  // Sort feedback by time ascending (oldest first) so the line goes
  // left to right. The subgraph returns newest-first, so we reverse.
  const sorted = useMemo(() => {
    if (!data?.feedbacks) return []
    return [...data.feedbacks].sort((a, b) => a.createdAt - b.createdAt)
  }, [data?.feedbacks])

  const plot = getPlotArea()

  // Time boundaries for the X-axis
  const minTime = sorted[0]?.createdAt ?? 0
  const maxTime = sorted[sorted.length - 1]?.createdAt ?? 0

  // Pre-compute pixel positions for every data point.
  // This runs once when data changes, not on every render or hover.
  const points = useMemo(
    () =>
      sorted.map((fb) => ({
        x: scaleX(fb.createdAt, minTime, maxTime, plot),
        y: scaleY(fb.value, plot),
        value: fb.value,
        createdAt: fb.createdAt,
      })),
    [sorted, minTime, maxTime, plot]
  )

  // Build the SVG polyline "points" attribute: "x1,y1 x2,y2 x3,y3 ..."
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ")

  // Y-axis gridlines at these score values — enough to judge position
  // without cluttering the chart
  const yTicks = [0, 25, 50, 75, 100]

  // X-axis: pick up to 5 evenly-spaced dates from the data.
  // We don't label every data point (they'd overlap). Instead we
  // sample a few spread across the time range.
  const xLabels = useMemo(() => {
    if (sorted.length <= 1) {
      return sorted.map((fb) => ({
        timestamp: fb.createdAt,
        x: scaleX(fb.createdAt, minTime, maxTime, plot),
      }))
    }
    const count = Math.min(5, sorted.length)
    const step = (sorted.length - 1) / (count - 1)
    const labels: { timestamp: number; x: number }[] = []
    for (let i = 0; i < count; i++) {
      const idx = Math.round(i * step)
      const fb = sorted[idx]
      labels.push({
        timestamp: fb.createdAt,
        x: scaleX(fb.createdAt, minTime, maxTime, plot),
      })
    }
    return labels
  }, [sorted, minTime, maxTime, plot])

  // ---- Hover logic ----
  // When the user moves their mouse over the SVG, we find the data point
  // whose X position is closest to the mouse cursor. If it's close enough
  // (within 30 SVG units), we show a tooltip for that point.
  //
  // Why "nearest X" instead of "nearest to mouse in both X and Y"?
  // Because this is a time-series chart. The user is scanning horizontally
  // through time, and they expect the tooltip to snap to the nearest point
  // in time, not the nearest point diagonally.
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return

      const rect = svgRef.current.getBoundingClientRect()
      // Convert the mouse's pixel position on screen to SVG coordinate space.
      // The SVG viewBox (560 units wide) may be rendered at any pixel width
      // on screen, so we scale proportionally.
      const mouseX = ((e.clientX - rect.left) / rect.width) * LAYOUT.width

      // Linear search through all points to find the closest one.
      // With max 100 feedback entries, this is instant.
      let closestIdx = 0
      let closestDist = Infinity
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      }

      // Only show tooltip if the mouse is reasonably close to a dot.
      // 30 SVG units ≈ about 5% of the chart width. If the mouse is
      // in empty space far from any dot, hide the tooltip.
      setHoveredIndex(closestDist < 30 ? closestIdx : null)
    },
    [points]
  )

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), [])

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-[200px] animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    )
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load reputation data.
        </p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  // --- Empty state ---
  if (sorted.length === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Score Timeline
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No feedback yet.
        </p>
      </div>
    )
  }

  // --- Timeline chart ---
  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Score Timeline
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {sorted.length} review{sorted.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* SVG chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ---- Horizontal grid lines ---- */}
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
                className="text-zinc-200 dark:text-zinc-800"
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
              {/* Y-axis label */}
              <text
                x={plot.x - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* ---- X-axis date labels ---- */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={LAYOUT.height - 4}
            textAnchor="middle"
            className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
          >
            {formatShortDate(label.timestamp)}
          </text>
        ))}

        {/* ---- Connecting line between dots ---- */}
        {points.length > 1 && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="currentColor"
            className="text-zinc-300 dark:text-zinc-700"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* ---- Data points (colored circles) ---- */}
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={hoveredIndex === i ? 5 : 3.5}
            fill={dotColor(pt.value)}
            stroke="white"
            strokeWidth={1.5}
            style={{
              transition: "r 150ms ease-out",
              filter:
                hoveredIndex === i
                  ? "drop-shadow(0 0 3px rgba(0,0,0,0.15))"
                  : "none",
            }}
            className="dark:stroke-zinc-950"
          />
        ))}

        {/* ---- Tooltip on hover ---- */}
        {hoveredIndex !== null &&
          points[hoveredIndex] &&
          (() => {
            const pt = points[hoveredIndex]
            const label = `Score: ${Math.round(pt.value)}  ·  ${formatFullDate(
              pt.createdAt
            )}`

            // Position tooltip above the dot. If the dot is near the
            // top edge, flip the tooltip below so it doesn't overflow.
            const tooltipY = pt.y < 40 ? pt.y + 20 : pt.y - 14

            // Clamp X so the tooltip doesn't overflow the left/right edges.
            const tooltipX = Math.max(
              plot.x + 40,
              Math.min(pt.x, plot.x + plot.width - 40)
            )

            return (
              <g>
                {/* Vertical crosshair from dot down to X-axis */}
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2={plot.y + plot.height}
                  stroke="currentColor"
                  className="text-zinc-300 dark:text-zinc-600"
                  strokeWidth={0.75}
                  strokeDasharray="2 2"
                />
                {/* Tooltip background pill */}
                <rect
                  x={tooltipX - 68}
                  y={tooltipY - 11}
                  width={136}
                  height={18}
                  rx={4}
                  className="fill-zinc-800 dark:fill-zinc-200"
                  opacity={0.9}
                />
                {/* Tooltip text */}
                <text
                  x={tooltipX}
                  y={tooltipY + 2}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-medium dark:fill-zinc-900"
                >
                  {label}
                </text>
              </g>
            )
          })()}
      </svg>
    </div>
  )
}

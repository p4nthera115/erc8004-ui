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

export interface ReputationTimelineProps extends AgentIdentityProps {
  /** Time range filter. Default `"all"`. */
  range?: ReputationTimelineRange
  /** Show connecting trend line between data points. Default `true`. */
  showTrendLine?: boolean
  /** Show individual data point dots. Default `true`. */
  showDataPoints?: boolean
  className?: string
}

export function ReputationTimeline({
  range = "all",
  showTrendLine = true,
  showDataPoints = true,
  className,
  ...props
}: ReputationTimelineProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { data, isLoading, error } = useFeedbackTimeline(agentRegistry, agentId)

  // Sort ascending (oldest first) so the line flows left-to-right, then filter
  // by time range. Subgraph returns newest-first so we reverse via sort.
  const sorted = useMemo(() => {
    if (!data?.feedbacks) return []
    const all = [...data.feedbacks].sort((a, b) => a.createdAt - b.createdAt)
    if (range === "all") return all
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const cutoff = Math.floor(Date.now() / 1000) - days * 86400
    return all.filter((fb) => fb.createdAt >= cutoff)
  }, [data?.feedbacks, range])

  const plot = getPlotArea()
  const minTime = sorted[0]?.createdAt ?? 0
  const maxTime = sorted[sorted.length - 1]?.createdAt ?? 0

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

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ")
  const yTicks = [0, 25, 50, 75, 100]

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
      setHoveredIndex(closestDist < 30 ? closestIdx : null)
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
            x={label.x}
            y={LAYOUT.height - 4}
            textAnchor="middle"
            className="fill-erc8004-muted-fg text-[10px]"
          >
            {formatShortDate(label.timestamp)}
          </text>
        ))}

        {/* Connecting trend line */}
        {showTrendLine && points.length > 1 && (
          <polyline
            points={polylinePoints}
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
                filter:
                  hoveredIndex === i
                    ? "drop-shadow(0 0 3px rgba(0,0,0,0.15))"
                    : "none",
              }}
              strokeWidth={1.5}
            />
          ))}

        {/* Hover tooltip */}
        {hoveredIndex !== null &&
          points[hoveredIndex] &&
          (() => {
            const pt = points[hoveredIndex]
            const label = `Score: ${Math.round(pt.value)}  ·  ${formatFullDate(
              pt.createdAt
            )}`
            const tooltipY = pt.y < 40 ? pt.y + 20 : pt.y - 14
            const tooltipX = Math.max(
              plot.x + 40,
              Math.min(pt.x, plot.x + plot.width - 40)
            )
            return (
              <g>
                <line
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2={plot.y + plot.height}
                  stroke="currentColor"
                  className="text-erc8004-border"
                  strokeWidth={0.75}
                  strokeDasharray="2 2"
                />
                <rect
                  x={tooltipX - 68}
                  y={tooltipY - 11}
                  width={136}
                  height={18}
                  rx={4}
                  className="fill-erc8004-fg"
                  opacity={0.9}
                />
                <text
                  x={tooltipX}
                  y={tooltipY + 2}
                  textAnchor="middle"
                  className="fill-erc8004-bg text-[10px] font-medium"
                >
                  {label}
                </text>
              </g>
            )
          })()}
      </svg>
    </Card>
  )
}

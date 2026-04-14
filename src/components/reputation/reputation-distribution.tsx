import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import type { Feedback } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { cn } from "@/lib/cn"
import * as v from "valibot"

type DistributionResponse = {
  feedbacks: Array<Pick<Feedback, "value">>
}

const distributionSchema = v.object({
  feedbacks: v.pipe(
    v.array(v.object({ value: v.string() })),
    v.transform((raw) => raw.map((item) => ({ value: parseFloat(item.value) })))
  ),
})

const DISTRIBUTION_QUERY = `#graphql
  query ($id: ID!, $first: Int!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first
    ) {
      value
    }
  }
`

function useFeedbackDistribution(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["reputation-distribution", agentRegistry, agentId],
    queryFn: async (): Promise<DistributionResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}`, first: 1000 }

      const data = await subgraphFetch<DistributionResponse>(
        url,
        DISTRIBUTION_QUERY,
        variables
      )

      try {
        return v.parse(distributionSchema, data)
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
// BUCKET DEFINITIONS
// ============================================================================
// We split the 0–100 score range into 5 equal-width ranges.
//
// Why 5 buckets?
//   - Enough granularity to spot patterns (skewed high? skewed low?)
//   - Few enough that each bucket accumulates meaningful counts,
//     even for agents with only a handful of reviews.
//
// Ordered highest-first to match the convention from Amazon/Google Play
// where 5-star ratings appear at the top of the chart.
// ============================================================================

interface Bucket {
  /** Inclusive lower bound of the score range */
  min: number
  /** Inclusive upper bound of the score range */
  max: number
  /** Human-readable label shown on the Y-axis (e.g. "81–100") */
  label: string
  /** Tailwind background-color class for the filled bar */
  barClass: string
}

const DEFAULT_BUCKETS: Bucket[] = [
  { min: 81, max: 100, label: "81–100", barClass: "bg-erc8004-positive" },
  { min: 61, max: 80,  label: "61–80",  barClass: "bg-erc8004-positive/70" },
  { min: 41, max: 60,  label: "41–60",  barClass: "bg-erc8004-chart-5" },
  { min: 21, max: 40,  label: "21–40",  barClass: "bg-erc8004-chart-3" },
  { min: 0,  max: 20,  label: "0–20",   barClass: "bg-erc8004-negative" },
]

/** Color classes mapped by position (top = positive, bottom = negative). */
const BAR_COLORS = [
  "bg-erc8004-positive",
  "bg-erc8004-positive/70",
  "bg-erc8004-chart-5",
  "bg-erc8004-chart-3",
  "bg-erc8004-negative",
]

function generateBuckets(count: number): Bucket[] {
  if (count === 5) return DEFAULT_BUCKETS
  const step = 100 / count
  const buckets: Bucket[] = []
  for (let i = count - 1; i >= 0; i--) {
    const min = Math.round(i * step)
    const max = i === count - 1 ? 100 : Math.round((i + 1) * step) - 1
    const colorIdx = Math.round((count - 1 - i) / (count - 1) * (BAR_COLORS.length - 1))
    buckets.push({
      min,
      max,
      label: `${min}–${max}`,
      barClass: BAR_COLORS[colorIdx],
    })
  }
  return buckets
}

export type ReputationDistributionOrientation = "vertical" | "horizontal"

// ============================================================================
// BUCKETING LOGIC
// ============================================================================
// Takes an array of score values and counts how many fall into each bucket.
//
// Example: scores [95, 82, 73, 50, 30] would produce:
//   81–100: 2  (95, 82)
//   61–80:  1  (73)
//   41–60:  1  (50)
//   21–40:  1  (30)
//   0–20:   0
// ============================================================================

interface BucketCount {
  bucket: Bucket
  count: number
}

function bucketFeedback(values: number[], activeBuckets: Bucket[]): BucketCount[] {
  // Start every bucket's count at 0
  const counts: BucketCount[] = activeBuckets.map((bucket) => ({
    bucket,
    count: 0,
  }))

  for (const val of values) {
    // Clamp to 0–100 as a safety net against unexpected subgraph data.
    // Math.round handles decimals like 72.5.
    const clamped = Math.max(0, Math.min(100, Math.round(val)))

    // Walk through the buckets and find which one this value belongs to.
    for (const entry of counts) {
      if (clamped >= entry.bucket.min && clamped <= entry.bucket.max) {
        entry.count++
        break // a value only belongs to one bucket
      }
    }
  }

  return counts
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface ReputationDistributionProps extends AgentIdentityProps {
  /** Number of histogram buckets. Default `5`. */
  bucketCount?: number
  /** Chart orientation. Default `"vertical"` (vertical stack of horizontal bars). */
  orientation?: ReputationDistributionOrientation
  /** Show axis labels. Default `true`. */
  showAxisLabels?: boolean
  className?: string
}

export function ReputationDistribution({
  bucketCount = 5,
  orientation = "vertical",
  showAxisLabels = true,
  className,
  ...props
}: ReputationDistributionProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  // Fetch reputation data. If another reputation component on the page
  // already requested data for the same agent, TanStack Query reuses the
  // cached result — no duplicate network requests.
  const { data, isLoading, error } = useFeedbackDistribution(agentRegistry, agentId)

  const buckets = useMemo(() => generateBuckets(bucketCount), [bucketCount])

  // useMemo ensures we only re-compute buckets when the underlying
  // feedback array actually changes — not on every render.
  const bucketCounts = useMemo(() => {
    if (!data?.feedbacks) return null
    return bucketFeedback(data.feedbacks.map((f) => f.value), buckets)
  }, [data?.feedbacks, buckets])

  // The "max count" is the highest number of reviews in any single bucket.
  // We use it to calculate each bar's width as a percentage:
  //   barWidth = (thisBucket.count / maxCount) * 100%
  // This means the tallest bar always fills 100% of the available width,
  // and every other bar is proportional to it.
  const maxCount = useMemo(() => {
    if (!bucketCounts) return 0
    return Math.max(...bucketCounts.map((b) => b.count), 1)
  }, [bucketCounts])

  // Total number of reviews — shown in the header.
  const totalReviews = useMemo(() => {
    if (!bucketCounts) return 0
    return bucketCounts.reduce((sum, b) => sum + b.count, 0)
  }, [bucketCounts])

  // --- Loading state ---
  // Shows placeholder "skeleton" bars while data is being fetched.
  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5 animate-pulse", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="mb-4 h-4 w-36 rounded-erc8004-sm bg-erc8004-muted" />
        <div className={orientation === "vertical" ? "flex flex-col gap-2.5" : "flex items-end gap-2"}>
          {buckets.map((b) => (
            orientation === "vertical" ? (
              <div key={b.label} className="flex items-center gap-3">
                <div className="h-3 w-12 rounded-erc8004-sm bg-erc8004-muted" />
                <div className="h-5 flex-1 rounded-erc8004-sm bg-erc8004-muted/50" />
              </div>
            ) : (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="h-24 w-full rounded-erc8004-sm bg-erc8004-muted/50" />
                <div className="h-3 w-8 rounded-erc8004-sm bg-erc8004-muted" />
              </div>
            )
          ))}
        </div>
      </div>
    )
  }

  // --- Error state ---
  if (error) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">
          Failed to load reputation data.{" "}
        </p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  // --- Empty state ---
  if (!bucketCounts || totalReviews === 0) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <h3 className="mb-3 text-sm font-semibold text-erc8004-card-fg">
          Score Distribution
        </h3>
        <p className="text-sm text-erc8004-muted-fg">
          No feedback yet.
        </p>
      </div>
    )
  }

  // --- Histogram ---
  return (
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
      {/* Header: title + total review count */}
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-erc8004-card-fg">
          Score Distribution
        </h3>
        <span className="text-xs text-erc8004-muted-fg">
          {totalReviews} review{totalReviews === 1 ? "" : "s"}
        </span>
      </div>

      {/* Histogram bars */}
      {orientation === "vertical" ? (
        <div className="flex flex-col gap-2">
          {bucketCounts.map(({ bucket, count }) => {
            const widthPercent = (count / maxCount) * 100
            return (
              <div key={bucket.label} className="flex items-center gap-3">
                {showAxisLabels && (
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-erc8004-muted-fg">
                    {bucket.label}
                  </span>
                )}
                <div className="relative h-5 flex-1 overflow-hidden rounded-erc8004-sm bg-erc8004-muted">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-erc8004-sm ${bucket.barClass}`}
                    style={{
                      width: `${widthPercent}%`,
                      transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-erc8004-muted-fg">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {[...bucketCounts].reverse().map(({ bucket, count }) => {
            const heightPercent = (count / maxCount) * 100
            return (
              <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                <span className="text-xs tabular-nums text-erc8004-muted-fg">{count}</span>
                <div className="w-full relative overflow-hidden rounded-erc8004-sm bg-erc8004-muted" style={{ height: `${heightPercent}%`, minHeight: count > 0 ? 4 : 0, transition: "height 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                  <div className={`absolute inset-0 rounded-erc8004-sm ${bucket.barClass}`} />
                </div>
                {showAxisLabels && (
                  <span className="text-[10px] tabular-nums text-erc8004-muted-fg whitespace-nowrap">
                    {bucket.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

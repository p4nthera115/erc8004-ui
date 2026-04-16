import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import type { Feedback } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { cn } from "@/lib/cn"
import { Card, Skeleton, EmptyState, ErrorState } from "@/components/_internal"
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
  min: number
  max: number
  label: string
}

const DEFAULT_BUCKETS: Bucket[] = [
  { min: 81, max: 100, label: "81–100" },
  { min: 61, max: 80, label: "61–80" },
  { min: 41, max: 60, label: "41–60" },
  { min: 21, max: 40, label: "21–40" },
  { min: 0, max: 20, label: "0–20" },
]

function generateBuckets(count: number): Bucket[] {
  if (count === 5) return DEFAULT_BUCKETS
  const step = 100 / count
  const buckets: Bucket[] = []
  for (let i = count - 1; i >= 0; i--) {
    const min = Math.round(i * step)
    const max = i === count - 1 ? 100 : Math.round((i + 1) * step) - 1
    buckets.push({ min, max, label: `${min}–${max}` })
  }
  return buckets
}

/**
 * Maps a bucket's midpoint score (0–100) to a CSS var colour so the
 * gradient reads green → gold → red regardless of how many buckets
 * the developer asks for.
 */
function bucketColorVar(bucket: Bucket): string {
  const mid = (bucket.min + bucket.max) / 2
  if (mid >= 81) return "oklch(var(--erc8004-positive))"
  if (mid >= 61) return "oklch(var(--erc8004-chart-2))"
  if (mid >= 41) return "oklch(var(--erc8004-chart-5))"
  if (mid >= 21) return "oklch(var(--erc8004-chart-3))"
  return "oklch(var(--erc8004-negative))"
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

function bucketFeedback(
  values: number[],
  activeBuckets: Bucket[]
): BucketCount[] {
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
  /**
   * Colour bars by score band (green/gold/red) rather than a single accent
   * colour. Default `true`.
   */
  colored?: boolean
  className?: string
}

export function ReputationDistribution({
  bucketCount = 5,
  orientation = "vertical",
  showAxisLabels = true,
  colored = true,
  className,
  ...props
}: ReputationDistributionProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  // Fetch reputation data. If another reputation component on the page
  // already requested data for the same agent, TanStack Query reuses the
  // cached result — no duplicate network requests.
  const { data, isLoading, error } = useFeedbackDistribution(
    agentRegistry,
    agentId
  )

  const buckets = useMemo(() => generateBuckets(bucketCount), [bucketCount])

  // useMemo ensures we only re-compute buckets when the underlying
  // feedback array actually changes — not on every render.
  const bucketCounts = useMemo(() => {
    if (!data?.feedbacks) return null
    return bucketFeedback(
      data.feedbacks.map((f) => f.value),
      buckets
    )
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

  if (isLoading) {
    return (
      <Card className={cn("w-full p-4", className)}>
        <Skeleton className="mb-4 h-4 w-36" />
        <div
          className={
            orientation === "vertical"
              ? "flex flex-col gap-2.5"
              : "flex items-end gap-2"
          }
        >
          {buckets.map((b) =>
            orientation === "vertical" ? (
              <div key={b.label} className="flex items-center gap-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ) : (
              <div
                key={b.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            )
          )}
        </div>
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

  if (!bucketCounts || totalReviews === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <h3 className="px-4 pt-4 text-sm font-medium text-erc8004-card-fg">
          Score Distribution
        </h3>
        <EmptyState message="No feedback yet" />
      </Card>
    )
  }

  return (
    <Card className={cn("w-full p-4", className)}>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-erc8004-card-fg">
          Score Distribution
        </h3>
        <span className="text-xs text-erc8004-muted-fg">
          {totalReviews} review{totalReviews === 1 ? "" : "s"}
        </span>
      </div>

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
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-erc8004-sm",
                      !colored && "bg-erc8004-accent"
                    )}
                    style={{
                      width: count > 0 ? `${widthPercent}%` : "0%",
                      transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                      background: colored ? bucketColorVar(bucket) : undefined,
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
              <div
                key={bucket.label}
                className="flex flex-1 flex-col items-center gap-1 h-full justify-end"
              >
                <span className="text-xs tabular-nums text-erc8004-muted-fg">
                  {count}
                </span>
                <div
                  className="w-full overflow-hidden rounded-t-erc8004-sm bg-erc8004-muted"
                  style={{
                    height: count > 0 ? `${heightPercent}%` : "4px",
                    transition: "height 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {count > 0 && (
                    <div
                      className={cn(
                        "h-full w-full",
                        !colored && "bg-erc8004-accent"
                      )}
                      style={{
                        background: colored
                          ? bucketColorVar(bucket)
                          : undefined,
                      }}
                    />
                  )}
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
    </Card>
  )
}

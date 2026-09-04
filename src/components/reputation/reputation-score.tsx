import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { Skeleton } from "@/components/_internal"
import * as v from "valibot"

type ReputationStatsResponse = {
  stats: {
    feedbackCreated: number
    feedbackRevoked: number
    valueDeltaSum: number
  }[]
}

const reputationStatsSchema = v.object({
  stats: v.array(
    v.pipe(
      v.object({
        feedbackCreated: v.string(),
        feedbackRevoked: v.string(),
        valueDeltaSum: v.string(),
      }),
      v.transform((raw) => ({
        feedbackCreated: parseInt(raw.feedbackCreated, 10),
        feedbackRevoked: parseInt(raw.feedbackRevoked, 10),
        valueDeltaSum: parseFloat(raw.valueDeltaSum),
      }))
    )
  ),
})

// The `agentStats` entity this used to read no longer exists on any deployed
// subgraph. Aggregates now live in a timeseries collection whose rows are
// CUMULATIVE, so the newest row already holds the all-time totals — take one
// row, newest first, rather than summing.
//
// Use `valueDeltaSum`, NOT `valueSum`: `valueSum` includes revoked feedback
// while the denominator excludes it, so mixing them inflates the score for any
// agent with revocations (agent 8453:2205 reads 72.13 instead of 71.44).
// `valueDeltaSum` is the sum over non-revoked feedback only.
//
// `interval` is required and accepts only `hour` or `day`.
const REPUTATION_STATS_QUERY = `#graphql
  query ($agent: String!) {
    stats: agentFeedbackStats_collection(
      interval: day
      where: { agent: $agent }
      orderBy: timestamp
      orderDirection: desc
      first: 1
    ) {
      feedbackCreated
      feedbackRevoked
      valueDeltaSum
    }
  }
`

function useReputationStats(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["reputation-score", agentRegistry, agentId],
    queryFn: async (): Promise<ReputationStatsResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { agent: `${chainId}:${agentId}` }

      const data = await subgraphFetch<ReputationStatsResponse>(
        url,
        REPUTATION_STATS_QUERY,
        variables
      )

      try {
        return v.parse(reputationStatsSchema, data)
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

export interface ReputationScoreProps extends AgentIdentityProps {
  /** Show/hide the review count. Default `true`. */
  showCount?: boolean
  /** Decimal places for the score. Default `1`. */
  precision?: number
  className?: string
}

export function ReputationScore({
  showCount = true,
  precision = 1,
  className,
  ...props
}: ReputationScoreProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useReputationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-3", className)}>
        <Skeleton className="h-8 w-16" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    )
  }

  const summary = data?.stats?.[0]
  // No aggregate row means the agent has never received feedback.
  const reviewCount = summary
    ? summary.feedbackCreated - summary.feedbackRevoked
    : 0

  if (error || !summary || reviewCount <= 0) {
    return (
      <div className={cn("inline-flex items-center gap-3", className)}>
        <span className="text-2xl font-semibold tabular-nums text-erc8004-muted-fg">
          --
        </span>
      </div>
    )
  }

  // The subgraph no longer precomputes an average; derive it from the running
  // sum over the same net count used for display so the two always agree.
  const totalFeedback = reviewCount
  const score = (summary.valueDeltaSum / reviewCount).toFixed(precision)

  return (
    <div
      className={cn("inline-flex items-center gap-3 cursor-default", className)}
      title={`${totalFeedback} ${totalFeedback === 1 ? "review" : "reviews"}`}
    >
      <span className="text-2xl font-semibold tabular-nums text-erc8004-card-fg">
        {score}
      </span>
      {showCount && (
        <div className="flex flex-col">
          <span className="text-xs text-erc8004-muted-fg uppercase tracking-wide">
            AVG
          </span>
          <span className="text-xs text-erc8004-muted-fg">
            {totalFeedback} {totalFeedback === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}
    </div>
  )
}

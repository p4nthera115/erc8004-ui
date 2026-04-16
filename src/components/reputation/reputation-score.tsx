import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { Skeleton } from "@/components/_internal"
import type { AgentStats } from "@/types"
import * as v from "valibot"

type ReputationStatsResponse = {
  agentStats: Pick<AgentStats, "averageFeedbackValue" | "totalFeedback">
}

const reputationStatsSchema = v.object({
  agentStats: v.pipe(
    v.object({
      averageFeedbackValue: v.string(),
      totalFeedback: v.string(),
    }),
    v.transform((raw) => ({
      totalFeedback: parseInt(raw.totalFeedback, 10),
      averageFeedbackValue: parseFloat(raw.averageFeedbackValue),
    }))
  ),
})

const REPUTATION_STATS_QUERY = `#graphql
  query ($id: ID!) {
    agentStats(id: $id) {
      averageFeedbackValue
      totalFeedback
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
      const variables = { id: `${chainId}:${agentId}` }

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

  if (error || !data?.agentStats) {
    return (
      <div className={cn("inline-flex items-center gap-3", className)}>
        <span className="text-2xl font-semibold tabular-nums text-erc8004-muted-fg">--</span>
      </div>
    )
  }

  const { averageFeedbackValue, totalFeedback } = data.agentStats
  const score = averageFeedbackValue.toFixed(precision)

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

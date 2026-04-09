import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
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

function scoreColor(value: number) {
  if (value >= 7) return "bg-erc8004-positive"
  if (value >= 4) return "bg-erc8004-chart-5"
  return "bg-erc8004-negative"
}

interface ReputationScoreProps extends AgentIdentityProps {
  className?: string
}

export function ReputationScore({ className, ...props }: ReputationScoreProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useReputationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 animate-pulse", className)} aria-busy="true" aria-live="polite">
        <div className="h-1.5 w-1.5 rounded-full bg-erc8004-muted" />
        <div className="h-3 w-8 rounded-erc8004-sm bg-erc8004-muted" />
      </div>
    )
  }

  if (error || !data?.agentStats) {
    return <div className={cn("h-1.5 w-1.5 rounded-full bg-erc8004-muted", className)} />
  }

  const { averageFeedbackValue, totalFeedback } = data.agentStats
  const score = averageFeedbackValue.toFixed(1)

  return (
    <div
      className={cn("group inline-flex items-center gap-3 cursor-default", className)}
      title={`${totalFeedback} ${totalFeedback === 1 ? "review" : "reviews"}`}
    >
      <div
        className={`h-2 w-2 rounded-full ${scoreColor(averageFeedbackValue)}`}
      />
      <span className="font-mono text-xl text-erc8004-card-fg/80">{score}</span>
      <span className="text-xs text-erc8004-muted-fg opacity-0 group-hover:opacity-100 transition-opacity">
        ({totalFeedback})
      </span>
    </div>
  )
}

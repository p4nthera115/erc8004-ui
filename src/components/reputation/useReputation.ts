import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import type { AgentStats, Feedback } from "@/types"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import * as v from "valibot"

// ============================================================================
// useReputationStats
// ============================================================================

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

export function useReputationStats(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["reputationStats", agentRegistry, agentId],
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

// ============================================================================
// useFeedbackList
// ============================================================================

type FeedbackListResponse = {
  feedbacks: Pick<Feedback, "value" | "createdAt">[]
}

const feedbackListSchema = v.object({
  feedbacks: v.pipe(
    v.array(
      v.object({
        value: v.string(),
        createdAt: v.string(),
      })
    ),
    v.transform((raw) =>
      raw.map((item) => ({
        value: parseFloat(item.value),
        createdAt: parseInt(item.createdAt, 10),
      }))
    )
  ),
})

const FEEDBACK_LIST_QUERY = `#graphql
  query ($id: ID!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: 100,
    ) {
      value
      createdAt
    }
  }
`

export function useFeedbackList(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["feedbackList", agentRegistry, agentId],
    queryFn: async (): Promise<FeedbackListResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<FeedbackListResponse>(
        url,
        FEEDBACK_LIST_QUERY,
        variables
      )

      try {
        return v.parse(feedbackListSchema, data)
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

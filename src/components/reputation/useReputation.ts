import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import type { AgentStats } from "@/types"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import * as v from "valibot"

const agentStatsSchema = v.pipe(
  v.object({
    averageFeedbackValue: v.string(),
    totalFeedback: v.string(),
  }),
  v.transform((raw) => ({
    totalFeedback: parseInt(raw.totalFeedback, 10),
    averageFeedbackValue: parseFloat(raw.averageFeedbackValue),
  }))
)

const REPUTATION_QUERY = `#graphql
query ($id: ID!){
  agentStats(id: $id) {
    averageFeedbackValue
    totalFeedback
  }
}

`

export function useReputation(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["reputation", agentRegistry, agentId],
    queryFn: async (): Promise<AgentStats> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)

      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<{ agentStats: AgentStats | null }>(
        url,
        REPUTATION_QUERY,
        variables
      )

      try {
        return v.parse(agentStatsSchema, data.agentStats)
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

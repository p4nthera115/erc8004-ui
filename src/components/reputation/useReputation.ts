import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import type { AgentStats } from "@/types"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"

const REPUTATION_QUERY = `#graphql
query ($id: ID!){
  agentStats(id: $id) {
    averageValue
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

      const data = await subgraphFetch<{ agentStats: AgentStats }>(
        url,
        REPUTATION_QUERY,
        variables
      )

      return data.agentStats
    },
  })
}

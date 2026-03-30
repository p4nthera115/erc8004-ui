import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"

export function useActivity(
  agentRegistry: string,
  agentId: number,
  limit?: number
) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["activity", agentRegistry, agentId, limit],
    queryFn: async () => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      // TODO: implement GraphQL query for activity events
      void subgraphFetch(url, "")
      throw new Error("useActivity not yet implemented")
    },
  })
}

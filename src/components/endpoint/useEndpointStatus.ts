import { useQuery } from '@tanstack/react-query'
import { useERC8004Config } from '../../provider/ERC8004Provider'
import { parseAgentRegistry } from '../../lib/parse-registry'
import { getSubgraphUrl, subgraphFetch } from '../../lib/subgraph-client'

export function useEndpointStatus(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ['endpoint-status', agentRegistry, agentId],
    queryFn: async () => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      // TODO: implement GraphQL query for endpoints + health checks
      void subgraphFetch(url, '')
      throw new Error('useEndpointStatus not yet implemented')
    },
    staleTime: 1000 * 30,  // 30s — endpoint status changes more frequently
  })
}

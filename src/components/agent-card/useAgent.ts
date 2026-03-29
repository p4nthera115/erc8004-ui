import { useQuery } from '@tanstack/react-query'
import { useERC8004Config } from '../../provider/ERC8004Provider'
import { parseAgentRegistry } from '../../lib/parse-registry'
import { getSubgraphUrl, subgraphFetch } from '../../lib/subgraph-client'
import type { AgentData } from '../../types'

export function useAgent(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ['agent', agentRegistry, agentId],
    queryFn: async (): Promise<AgentData> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      // TODO: implement GraphQL query + tokenURI resolution
      void subgraphFetch(url, '')
      throw new Error('useAgent not yet implemented')
    },
  })
}

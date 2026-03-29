import { useQuery } from '@tanstack/react-query'
import { useERC8004Config } from '../../provider/ERC8004Provider'
import { parseAgentRegistry } from '../../lib/parse-registry'
import { getSubgraphUrl, subgraphFetch } from '../../lib/subgraph-client'
import type { ReputationData } from '../../types'

export function useReputation(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ['reputation', agentRegistry, agentId],
    queryFn: async (): Promise<ReputationData> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      // TODO: implement GraphQL query for AgentStats + Feedback list
      void subgraphFetch(url, '')
      throw new Error('useReputation not yet implemented')
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { fetchReputation } from '../lib/fetchers/reputation'

export function useReputation(agentRegistry: string, agentId: number) {
  return useQuery({
    queryKey: ['reputation', agentRegistry, agentId],
    queryFn: () => fetchReputation({ agentRegistry, agentId }),
  })
}

import { useQuery } from '@tanstack/react-query'
import { fetchIdentity } from '../lib/fetchers/identity'

export function useAgent(agentRegistry: string, agentId: number) {
  return useQuery({
    queryKey: ['agent', agentRegistry, agentId],
    queryFn: () => fetchIdentity({ agentRegistry, agentId }),
  })
}

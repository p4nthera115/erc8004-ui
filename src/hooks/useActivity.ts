import { useQuery } from '@tanstack/react-query'
import { fetchActivity } from '../lib/fetchers/activity'

export function useActivity(
  agentRegistry: string,
  agentId: number,
  limit?: number,
) {
  return useQuery({
    queryKey: ['activity', agentRegistry, agentId, limit],
    queryFn: () => fetchActivity({ agentRegistry, agentId, limit }),
  })
}

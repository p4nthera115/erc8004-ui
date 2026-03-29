import { useQuery } from '@tanstack/react-query'
import { fetchIdentity } from '../lib/fetchers/identity'

// Endpoint status is derived from the registration file (identity fetch).
// Once a dedicated endpoint health-check fetcher exists, swap it in here.
export function useEndpointStatus(agentRegistry: string, agentId: number) {
  return useQuery({
    queryKey: ['endpoint-status', agentRegistry, agentId],
    queryFn: () => fetchIdentity({ agentRegistry, agentId }),
    staleTime: 1000 * 30, // 30 s — endpoint status changes more frequently
  })
}

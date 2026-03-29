import type { ActivityEvent } from '../types';

export interface ActivityFetchParams {
  agentRegistry: string;
  agentId: number;
  limit?: number;
  fromBlock?: number;
}

/**
 * Fetches recent on-chain activity events for an agent.
 */
export async function fetchActivity(
  _params: ActivityFetchParams,
): Promise<ActivityEvent[]> {
  // TODO: query event logs or subgraph
  throw new Error('fetchActivity not yet implemented');
}

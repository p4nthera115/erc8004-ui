import type { ActivityEvent } from '../types';

export interface ActivityFetchParams {
  agentRegistry: `0x${string}`;
  agentId: bigint;
  limit?: number;
  fromBlock?: bigint;
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

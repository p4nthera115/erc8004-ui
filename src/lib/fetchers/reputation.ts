import type { ReputationSummary } from '../types';

export interface ReputationFetchParams {
  agentRegistry: `0x${string}`;
  agentId: bigint;
}

/**
 * Fetches aggregated reputation data for an agent.
 */
export async function fetchReputation(
  _params: ReputationFetchParams,
): Promise<ReputationSummary> {
  // TODO: query feedback contract or subgraph
  throw new Error('fetchReputation not yet implemented');
}

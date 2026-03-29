import type { ReputationSummary } from '../types';

export interface ReputationFetchParams {
  agentRegistry: string;
  agentId: number;
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

export interface SubgraphConfig {
  url: string;
  apiKey?: string;
}

/**
 * Executes a raw GraphQL query against a configured subgraph endpoint.
 */
export async function querySubgraph<T>(
  _config: SubgraphConfig,
  _query: string,
  _variables?: Record<string, unknown>,
): Promise<T> {
  // TODO: implement fetch + error handling
  throw new Error('querySubgraph not yet implemented');
}

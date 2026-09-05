import { SUBGRAPH_BASE_URL, SUBGRAPH_IDS } from "./constants"

export function getSubgraphUrl(
  chainId: number,
  apiKey: string,
  overrides?: Record<number, string>
): string {
  // If a custom subgraph URL is provided for this chain, use it
  if (overrides?.[chainId]) return overrides[chainId]
  // Otherwise, use the default subgraph ID for this chain
  const subgraphId = SUBGRAPH_IDS[chainId]
  // If no subgraph ID is found for this chain, throw an error
  if (!subgraphId) throw new Error(`Unsupported chainId: ${chainId}`)
  return `${SUBGRAPH_BASE_URL}/${apiKey}/subgraphs/id/${subgraphId}`
}

export async function subgraphFetch<T>(
  url: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(
      `Subgraph request failed: ${response.status} ${response.statusText}`
    )
  }

  const json = (await response.json()) as {
    data?: T
    errors?: { message: string }[]
  }

  if (json.errors?.length) {
    throw new Error(`Subgraph error: ${json.errors[0].message}`)
  }

  if (!json.data) {
    throw new Error("Subgraph returned no data")
  }

  return json.data
}

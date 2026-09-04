/**
 * Live subgraph probing.
 *
 * Everything here talks to The Graph at runtime, which is what separates the
 * MCP server from the static llms.txt docs: an agent can ask "will this
 * component actually render on this chain / for this agent?" and get an
 * answer from the deployed schema rather than from documentation that may
 * have drifted away from it.
 */

import registry from "./generated/registry.json" with { type: "json" }

export type Chain = (typeof registry.chains)[number]

export function getChains(): Chain[] {
  return registry.chains
}

/**
 * Accepts a chain id (8453), a chain name ("base"), or a full agentRegistry
 * string ("eip155:8453:0x…") and resolves it to a known chain.
 */
export function resolveChain(input: string | number): Chain | undefined {
  const raw = String(input).trim()

  // agentRegistry form: {namespace}:{chainId}:{address}
  const parts = raw.split(":")
  if (parts.length === 3) {
    const id = Number(parts[1])
    if (Number.isFinite(id)) return registry.chains.find((c) => c.chainId === id)
  }

  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && raw !== "") {
    return registry.chains.find((c) => c.chainId === asNumber)
  }

  const normalised = raw.toLowerCase().replace(/[\s_-]/g, "")
  return registry.chains.find(
    (c) => c.name.toLowerCase().replace(/[\s_-]/g, "") === normalised,
  )
}

export function subgraphUrl(chain: Chain, apiKey: string): string {
  return `${registry.subgraphBaseUrl}/${apiKey}/subgraphs/id/${chain.subgraphId}`
}

export class SubgraphError extends Error {}

export async function subgraphFetch<T>(
  url: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    throw new SubgraphError(
      `Network request to the subgraph failed: ${(error as Error).message}`,
    )
  }

  if (!response.ok) {
    throw new SubgraphError(
      `Subgraph returned HTTP ${response.status} ${response.statusText}. ` +
        (response.status === 401 || response.status === 403
          ? "This usually means GRAPH_API_KEY is invalid or lacks access."
          : ""),
    )
  }

  const json = (await response.json()) as {
    data?: T
    errors?: { message: string }[]
  }

  // A subgraph that is still syncing, or whose indexers are unhealthy, answers
  // with `errors` and no `data`. Surface that verbatim — it's the difference
  // between "your query is wrong" and "this chain is temporarily unavailable".
  if (json.errors?.length && json.data == null) {
    throw new SubgraphError(json.errors.map((e) => e.message).join("; "))
  }
  if (json.data == null) {
    throw new SubgraphError("Subgraph returned no data.")
  }
  return json.data
}

// ---------------------------------------------------------------------------
// Schema introspection
// ---------------------------------------------------------------------------

export type SchemaShape = {
  queryFields: Set<string>
  agentFields: Set<string>
  registrationFileFields: Set<string>
}

const INTROSPECTION = `{
  __schema { queryType { fields { name } } }
  agent: __type(name: "Agent") { fields { name } }
  regfile: __type(name: "AgentRegistrationFile") { fields { name } }
}`

type IntrospectionResponse = {
  __schema: { queryType: { fields: { name: string }[] } }
  agent: { fields: { name: string }[] } | null
  regfile: { fields: { name: string }[] } | null
}

export async function introspect(url: string): Promise<SchemaShape> {
  const data = await subgraphFetch<IntrospectionResponse>(url, INTROSPECTION)
  return {
    queryFields: new Set(data.__schema.queryType.fields.map((f) => f.name)),
    agentFields: new Set((data.agent?.fields ?? []).map((f) => f.name)),
    registrationFileFields: new Set(
      (data.regfile?.fields ?? []).map((f) => f.name),
    ),
  }
}

// ---------------------------------------------------------------------------
// Component → query-root requirements
//
// Derived from the GraphQL query each component actually sends (the root field
// it selects), not from the documented data model. When the deployed schema
// drops a root field, every component listed against it stops working — which
// is precisely what these tools exist to detect.
// ---------------------------------------------------------------------------

export const COMPONENT_REQUIREMENTS: Record<string, string | null> = {
  "erc8004-provider": null,
  "agent-provider": null,
  "agent-name": "agent",
  "agent-image": "agent",
  "agent-description": "agent",
  "agent-card": "agent",
  "endpoint-status": "agent",
  "reputation-score": "agentFeedbackStats_collection",
  "reputation-timeline": "feedbacks",
  "reputation-distribution": "feedbacks",
  "feedback-list": "feedbacks",
  "tag-cloud": "feedbacks",
  "verification-badge": "agentValidationStats_collection",
  "validation-score": "agentValidationStats_collection",
  "validation-list": "validations",
  "validation-display": "validations",
  "last-activity": "agent",
  "activity-log": "feedbacks",
}

// ---------------------------------------------------------------------------
// Registry deployment status
//
// A query root existing in the schema does NOT mean the underlying contract is
// deployed. The subgraph's `Protocol` entity records the three registry
// addresses per chain, and an undeployed registry is recorded as the zero
// address. Checking this is the difference between "this component can fetch"
// and "there is anything to fetch".
// ---------------------------------------------------------------------------

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export type RegistryAddresses = {
  identityRegistry: string
  reputationRegistry: string
  validationRegistry: string
}

const PROTOCOL_QUERY = `query ($id: ID!) {
  protocol(id: $id) {
    identityRegistry
    reputationRegistry
    validationRegistry
  }
}`

export async function fetchRegistries(
  url: string,
  chainId: number,
): Promise<RegistryAddresses | undefined> {
  try {
    const data = await subgraphFetch<{ protocol: RegistryAddresses | null }>(
      url,
      PROTOCOL_QUERY,
      { id: String(chainId) },
    )
    return data.protocol ?? undefined
  } catch {
    // Older subgraphs may not expose `protocol`. Absence is not an error —
    // the caller just reports registry status as unknown.
    return undefined
  }
}

export function isDeployed(address: string | undefined): boolean {
  return Boolean(address) && address !== ZERO_ADDRESS
}

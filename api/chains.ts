/**
 * GET /api/chains — the chains this library can read.
 *
 * Deliberately reports the *subgraph* the library would query rather than
 * claiming the chain works: whether a given component renders on a chain also
 * depends on which registry contracts are deployed there, which only the live
 * MCP tools can answer.
 */
import { handler, json } from "./_lib/http"
import { REGISTRY } from "./_lib/registry"

export default {
  fetch: handler({
    GET: () =>
      json({
        count: REGISTRY.chains.length,
        subgraphUrlTemplate: `${REGISTRY.subgraphBaseUrl}/{apiKey}/subgraphs/id/{subgraphId}`,
        note:
          "The Validation Registry is not yet deployed on any supported chain, " +
          "so VerificationBadge, ValidationScore, ValidationList and " +
          "ValidationDisplay render their empty state everywhere for now.",
        chains: REGISTRY.chains.map((chain) => ({
          chainId: chain.chainId,
          name: chain.name,
          testnet: chain.testnet,
          subgraphId: chain.subgraphId,
          agentRegistryFormat: `eip155:${chain.chainId}:{identityRegistryAddress}`,
        })),
      }),
  }),
}

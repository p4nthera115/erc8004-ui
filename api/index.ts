/**
 * GET /api — the discovery document.
 *
 * An agent that lands on this API with no prior knowledge gets, from one
 * request, every endpoint it can call, the OpenAPI document describing them,
 * and the non-API entry points (llms.txt, agents.md, the MCP endpoint).
 */
import { handler, json } from "./_lib/http"
import { REGISTRY } from "./_lib/registry"

const base = REGISTRY.siteUrl

export default {
  fetch: handler({
    GET: () =>
      json({
        name: `${REGISTRY.packageName} docs API`,
        description:
          "Read-only JSON API over the documentation for " +
          `${REGISTRY.packageName}: components, props, usage examples, guides ` +
          "and supported chains. No authentication, no rate limit beyond fair " +
          "use, CORS open to any origin.",
        version: REGISTRY.generatedAt,
        documentation: `${base}/docs/introduction`,
        specification: `${base}/openapi.json`,
        agentInstructions: `${base}/agents.md`,
        llmsTxt: `${base}/llms.txt`,
        llmsFullTxt: `${base}/llms-full.txt`,
        mcp: {
          transport: "streamable-http",
          endpoint: `${base}/api/mcp`,
          manifest: `${base}/.well-known/mcp`,
          stdio: "npx -y @erc8004/ui-mcp",
        },
        endpoints: [
          {
            method: "GET",
            path: "/api/health",
            description: "Liveness plus snapshot counts and build timestamp.",
          },
          {
            method: "GET",
            path: "/api/components",
            description:
              "Every component. Filter with ?group= or free-text ?q=.",
          },
          {
            method: "GET",
            path: "/api/components/{slug}",
            description:
              "One component in full: props, usage, examples, states. " +
              "Add ?format=markdown for the markdown rendering.",
          },
          {
            method: "GET",
            path: "/api/guides",
            description: "Setup and concept guides.",
          },
          {
            method: "GET",
            path: "/api/guides/{slug}",
            description:
              "One guide. Add ?format=markdown for the markdown rendering.",
          },
          {
            method: "GET",
            path: "/api/chains",
            description:
              "Chains with a deployed subgraph, and their subgraph ids.",
          },
          {
            method: "GET",
            path: "/api/types",
            description: "The library's exported TypeScript definitions.",
          },
          {
            method: "POST",
            path: "/api/mcp",
            description:
              "Model Context Protocol endpoint, Streamable HTTP transport.",
          },
        ],
        counts: {
          components: REGISTRY.components.length,
          guides: REGISTRY.guides.length,
          chains: REGISTRY.chains.length,
        },
      }),
  }),
}

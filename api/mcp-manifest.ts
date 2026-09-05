/**
 * GET /.well-known/mcp — the MCP discovery manifest.
 *
 * A pointer, not a second source of truth: everything here is derived from the
 * live tool definitions and the versions `_lib/mcp-rpc.ts` actually implements,
 * so a client that reads the manifest and a client that calls `server/discover`
 * cannot be told different things.
 */
import { handler, json } from "./_lib/http.js"
import {
  SERVER_INSTRUCTIONS,
  SERVER_NAME,
  SERVER_TITLE,
  SERVER_VERSION,
  SUPPORTED_VERSIONS,
} from "./_lib/mcp-rpc.js"
import { toolDescriptors } from "./_lib/mcp-tools.js"
import { REGISTRY } from "./_lib/registry.js"

const base = REGISTRY.siteUrl

export default {
  fetch: handler({
    GET: () =>
      json({
        name: SERVER_NAME,
        title: SERVER_TITLE,
        version: SERVER_VERSION,
        description:
          `Documentation tools for ${REGISTRY.packageName}: component reference, ` +
          "props, usage examples, setup guides and the on-chain data model.",
        instructions: SERVER_INSTRUCTIONS,
        protocolVersions: [...SUPPORTED_VERSIONS],
        capabilities: { tools: { listChanged: false } },
        authentication: { type: "none" },
        transport: { type: "streamable-http", url: `${base}/api/mcp` },
        remotes: [
          {
            type: "streamable-http",
            url: `${base}/api/mcp`,
            description:
              "Hosted documentation tools. No key required, open CORS, stateless.",
          },
        ],
        packages: [
          {
            registry: "npm",
            name: "@erc8004/ui-mcp",
            transport: { type: "stdio" },
            command: "npx",
            args: ["-y", "@erc8004/ui-mcp"],
            environmentVariables: [
              {
                name: "GRAPH_API_KEY",
                required: false,
                description:
                  "Enables the two live tools (check_chain_support, check_agent). " +
                  "The documentation tools work without it.",
              },
            ],
            description:
              "Local stdio server. Superset of this endpoint: the same four " +
              "documentation tools plus live subgraph and agent checks.",
          },
        ],
        tools: toolDescriptors().map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
        })),
        documentation: `${base}/docs/mcp`,
        openapi: `${base}/openapi.json`,
        repository: REGISTRY.githubUrl,
      }),
  }),
}

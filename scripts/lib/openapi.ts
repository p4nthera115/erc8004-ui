/**
 * Builds the OpenAPI 3.1 document published at /openapi.json and /openapi.yaml.
 *
 * Generated rather than hand-maintained so the enumerated values in it — group
 * names, component slugs, guide slugs — come from the same registries as the
 * API itself. A component added to the registry appears in the spec on the next
 * build; it cannot be documented as existing when it does not, or vice versa.
 *
 * The paths here are the contract `api/**` implements. `tests/openapi.test.ts`
 * asserts the two stay in step.
 */

export type OpenApiInput = {
  siteUrl: string
  packageName: string
  tagline: string
  githubUrl: string
  /** Version of the API contract itself — bump on a breaking change. */
  apiVersion: string
  groupTitles: string[]
  componentSlugs: string[]
  guideSlugs: string[]
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const headerRef = (name: string) => ({ $ref: `#/components/headers/${name}` })

/**
 * Every response carries the quota headers, so a caller can pace itself from
 * the first successful request instead of discovering the limit by hitting it.
 */
const RATE_LIMIT_HEADERS: Record<string, unknown> = {
  RateLimit: headerRef("RateLimit"),
  "RateLimit-Policy": headerRef("RateLimitPolicy"),
  "RateLimit-Limit": headerRef("RateLimitLimit"),
  "RateLimit-Remaining": headerRef("RateLimitRemaining"),
  "RateLimit-Reset": headerRef("RateLimitReset"),
}

function jsonResponse(
  description: string,
  schema: unknown,
  headers: Record<string, unknown> = {}
) {
  return {
    description,
    headers: { ...RATE_LIMIT_HEADERS, ...headers },
    content: { "application/json": { schema } },
  }
}

function errorResponse(
  description: string,
  headers: Record<string, unknown> = {}
) {
  return jsonResponse(description, ref("Error"), headers)
}

/** Every operation can fail these ways; spelled out so agents can plan for them. */
function commonErrors(extra: Record<string, unknown> = {}) {
  return {
    "404": errorResponse("No such resource. `error.allowed` lists valid values."),
    "405": errorResponse("Method not supported by this endpoint."),
    "406": errorResponse(
      "The Accept header rules out every media type this endpoint can " +
        "produce. `error.allowed` lists what it can. Omitting Accept, or " +
        "sending `*/*`, is never rejected."
    ),
    "429": errorResponse(
      "Over the fair-use quota. `Retry-After` and `RateLimit-Reset` both give " +
        "the seconds to wait.",
      { "Retry-After": headerRef("RetryAfter") }
    ),
    "500": errorResponse("Unhandled server error."),
    ...extra,
  }
}

export function buildOpenApiDocument(input: OpenApiInput): Record<string, unknown> {
  const {
    siteUrl,
    packageName,
    tagline,
    githubUrl,
    apiVersion,
    groupTitles,
    componentSlugs,
    guideSlugs,
  } = input

  const formatParameter = {
    name: "format",
    in: "query",
    required: false,
    description:
      "Response format. Defaults to `json`, or to `markdown` when the request's " +
      "Accept header asks for text/markdown.",
    schema: { type: "string", enum: ["json", "markdown"] },
  }

  return {
    openapi: "3.1.0",
    info: {
      title: `${packageName} documentation API`,
      summary: "Read-only JSON documentation API for the ERC-8004 UI component library.",
      description: [
        tagline,
        "",
        "This API serves the library's own documentation — components, props, usage",
        "examples, setup guides and supported chains — as JSON, so an agent can read",
        "the reference without scraping HTML. It is generated from the same registry",
        "that produces the documentation site, llms.txt and the MCP server, so all",
        "four describe the same library.",
        "",
        "No authentication. No API keys. CORS is open to every origin. Responses are",
        "cacheable for five minutes and only change when the site is redeployed.",
        "",
        "A fair-use quota of 300 requests per 60 seconds per client applies, enforced",
        "per function instance. Every response — success or failure — carries the",
        "`RateLimit` and `RateLimit-Policy` structured fields, plus the older",
        "`RateLimit-Limit` / `-Remaining` / `-Reset` triple, so a client can pace",
        "itself rather than discover the limit by being refused. A 429 adds",
        "`Retry-After`. If you need the whole reference in bulk and would rather not",
        "think about any of this, fetch /llms-full.txt once instead.",
        "",
        "It does **not** proxy on-chain data: the components query The Graph directly",
        "from the browser with the consuming application's own Graph API key. To check",
        "live subgraph or agent state, use the MCP server's live tools instead.",
      ].join("\n"),
      version: apiVersion,
      license: { name: "MIT", identifier: "MIT" },
      contact: { name: "Issues and questions", url: `${githubUrl}/issues` },
    },
    servers: [{ url: siteUrl, description: "Production" }],
    externalDocs: {
      description: "Human documentation",
      url: `${siteUrl}/docs/introduction`,
    },
    tags: [
      { name: "discovery", description: "Find out what this API offers." },
      { name: "components", description: "The component reference." },
      { name: "guides", description: "Setup and concept guides." },
      { name: "reference", description: "Types and chain support." },
      {
        name: "mcp",
        description:
          "Model Context Protocol endpoint and its discovery manifest.",
      },
    ],
    paths: {
      "/api": {
        get: {
          tags: ["discovery"],
          operationId: "getApiIndex",
          summary: "API index",
          description:
            "Every endpoint, the OpenAPI document, and the non-API entry points " +
            "(llms.txt, agents.md, the MCP endpoint). Start here.",
          responses: {
            "200": jsonResponse("The endpoint index.", ref("ApiIndex")),
            ...commonErrors(),
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["discovery"],
          operationId: "getHealth",
          summary: "Health and build stamp",
          description:
            "Liveness plus the documentation snapshot's timestamp, so a caller can " +
            "tell whether a redeploy has picked up a docs change.",
          responses: {
            "200": jsonResponse("Service is up.", ref("Health")),
            ...commonErrors(),
          },
        },
      },
      "/api/components": {
        get: {
          tags: ["components"],
          operationId: "listComponents",
          summary: "List components",
          parameters: [
            {
              name: "group",
              in: "query",
              required: false,
              description: "Restrict to one registry group.",
              schema: { type: "string", enum: groupTitles },
            },
            {
              name: "q",
              in: "query",
              required: false,
              description:
                "Free-text search across component names, slugs, props and documentation.",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonResponse("Matching components.", ref("ComponentList")),
            "400": errorResponse("Unknown `group`. `error.allowed` lists the valid groups."),
            ...commonErrors(),
          },
        },
      },
      "/api/components/{slug}": {
        get: {
          tags: ["components"],
          operationId: "getComponent",
          summary: "Get one component",
          description:
            "Full documentation: description, caveats, import line, usage, worked " +
            "examples, props table and state handling. Accepts either the slug " +
            "(`reputation-score`) or the component name (`ReputationScore`).",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              description: "Component slug or name.",
              schema: { type: "string", examples: componentSlugs.slice(0, 3) },
            },
            formatParameter,
          ],
          responses: {
            "200": {
              description: "The component, as JSON or as markdown.",
              headers: { ...RATE_LIMIT_HEADERS },
              content: {
                "application/json": { schema: ref("Component") },
                "text/markdown": { schema: { type: "string" } },
              },
            },
            "400": errorResponse("Unknown `format`."),
            ...commonErrors(),
          },
        },
      },
      "/api/guides": {
        get: {
          tags: ["guides"],
          operationId: "listGuides",
          summary: "List guides",
          responses: {
            "200": jsonResponse("Guides in reading order.", ref("GuideList")),
            ...commonErrors(),
          },
        },
      },
      "/api/guides/{slug}": {
        get: {
          tags: ["guides"],
          operationId: "getGuide",
          summary: "Get one guide",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string", enum: guideSlugs },
            },
            formatParameter,
          ],
          responses: {
            "200": {
              description: "The guide, as JSON or as markdown.",
              headers: { ...RATE_LIMIT_HEADERS },
              content: {
                "application/json": { schema: ref("Guide") },
                "text/markdown": { schema: { type: "string" } },
              },
            },
            "400": errorResponse("Unknown `format`."),
            ...commonErrors(),
          },
        },
      },
      "/api/chains": {
        get: {
          tags: ["reference"],
          operationId: "listChains",
          summary: "Supported chains",
          description:
            "Chains with a deployed subgraph this library can query, and the " +
            "subgraph id used for each.",
          responses: {
            "200": jsonResponse("Supported chains.", ref("ChainList")),
            ...commonErrors(),
          },
        },
      },
      "/api/types": {
        get: {
          tags: ["reference"],
          operationId: "getTypes",
          summary: "TypeScript type definitions",
          description: "`packages/ui/src/types.ts` verbatim — the public data model.",
          parameters: [formatParameter],
          responses: {
            "200": {
              description: "The type definitions.",
              headers: { ...RATE_LIMIT_HEADERS },
              content: {
                "application/json": { schema: ref("Types") },
                "text/markdown": { schema: { type: "string" } },
              },
            },
            "400": errorResponse("Unknown `format`."),
            ...commonErrors(),
          },
        },
      },
      "/api/mcp": {
        post: {
          tags: ["mcp"],
          operationId: "callMcp",
          summary: "Model Context Protocol endpoint",
          description: [
            "Streamable HTTP transport. Stateless: no sessions are minted, no SSE",
            "streams are opened, and each JSON-RPC message is its own POST.",
            "",
            "Dual-era. Modern clients (protocol 2026-07-28 and later) send their",
            "version in `params._meta` mirrored into the MCP-Protocol-Version,",
            "Mcp-Method and Mcp-Name headers, and may call the mandatory",
            "`server/discover`. Clients on 2025-11-25 and earlier use the",
            "`initialize` handshake instead.",
            "",
            "Exposes the four documentation tools: list_components, get_component,",
            "get_setup_guide, get_types. The live subgraph tools are stdio-only —",
            "they spend a Graph API key, which a public endpoint should not do with",
            "someone else's quota.",
          ].join("\n"),
          parameters: [
            {
              name: "MCP-Protocol-Version",
              in: "header",
              required: false,
              description:
                "Required for protocol 2026-07-28 and later; must match the version " +
                "in the body's `params._meta`.",
              schema: { type: "string", examples: ["2026-07-28"] },
            },
            {
              name: "Mcp-Method",
              in: "header",
              required: false,
              description:
                "Required for protocol 2026-07-28 and later; must match the body's `method`.",
              schema: { type: "string", examples: ["tools/list"] },
            },
            {
              name: "Mcp-Name",
              in: "header",
              required: false,
              description:
                "Required for `tools/call` on protocol 2026-07-28 and later; must " +
                "match `params.name`.",
              schema: { type: "string", examples: ["get_component"] },
            },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: ref("JsonRpcRequest") } },
          },
          responses: {
            "200": jsonResponse("JSON-RPC response.", ref("JsonRpcResponse")),
            "202": {
              description: "Notification accepted. No body.",
              headers: { ...RATE_LIMIT_HEADERS },
            },
            "400": jsonResponse(
              "Malformed message, header mismatch (-32020) or unsupported protocol " +
                "version (-32022).",
              ref("JsonRpcResponse")
            ),
            "403": jsonResponse("Invalid Origin header.", ref("JsonRpcResponse")),
            "404": jsonResponse(
              "Unimplemented JSON-RPC method (-32601), for modern protocol versions.",
              ref("JsonRpcResponse")
            ),
            "405": jsonResponse(
              "GET and DELETE are not supported: this endpoint is stateless and " +
                "offers no standalone stream.",
              ref("JsonRpcResponse")
            ),
            "429": jsonResponse(
              "Over the fair-use quota, as a JSON-RPC error (-32000) rather than " +
                "the REST envelope — this endpoint's clients read JSON-RPC.",
              ref("JsonRpcResponse"),
              { "Retry-After": headerRef("RetryAfter") }
            ),
          },
        },
      },
      "/.well-known/mcp": {
        get: {
          tags: ["mcp"],
          operationId: "getMcpManifest",
          summary: "MCP discovery manifest",
          description:
            "Transport, supported protocol versions, capabilities and tool list for " +
            "the MCP endpoint, plus the stdio package that adds the live tools.",
          responses: {
            "200": jsonResponse("The manifest.", ref("McpManifest")),
            ...commonErrors(),
          },
        },
      },
    },
    components: {
      headers: {
        RateLimit: {
          description:
            "This caller's position in the quota window, as the structured " +
            "field from draft-ietf-httpapi-ratelimit-headers: the policy name, " +
            "`r` remaining requests, `t` seconds until the window resets.",
          schema: { type: "string", examples: ['"default";r=299;t=60'] },
        },
        RateLimitPolicy: {
          description:
            "The quota policy itself: `q` requests per `w` seconds. Enforced " +
            "per function instance, so the effective ceiling is at least this.",
          schema: { type: "string", examples: ['"default";q=300;w=60'] },
        },
        RateLimitLimit: {
          description:
            "Requests allowed in the current window. The earlier spelling of " +
            "the `q` parameter of RateLimit-Policy, emitted for clients that " +
            "only understand the original draft.",
          schema: { type: "integer", examples: [300] },
        },
        RateLimitRemaining: {
          description: "Requests left in the current window.",
          schema: { type: "integer", examples: [299] },
        },
        RateLimitReset: {
          description: "Seconds until the current window resets.",
          schema: { type: "integer", examples: [60] },
        },
        RetryAfter: {
          description:
            "Seconds to wait before retrying. Only on a 429.",
          schema: { type: "integer", examples: [42] },
        },
      },
      schemas: {
        Error: {
          type: "object",
          description:
            "Every failure this API produces, in one shape. `code` is stable and " +
            "safe to branch on; `hint` says what to do next.",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "status", "message", "hint"],
              properties: {
                code: {
                  type: "string",
                  enum: [
                    "not_found",
                    "invalid_parameter",
                    "method_not_allowed",
                    "not_acceptable",
                    "unsupported_media_type",
                    "rate_limited",
                    "internal_error",
                  ],
                },
                status: { type: "integer", examples: [404] },
                message: { type: "string" },
                hint: {
                  type: "string",
                  description: "The corrective action, not a restatement of the error.",
                },
                allowed: {
                  type: "array",
                  items: { type: "string" },
                  description: "Valid values, when the failure was an unknown identifier.",
                },
                documentation: { type: "string", format: "uri" },
                specification: { type: "string", format: "uri" },
              },
            },
          },
        },
        PropDef: {
          type: "object",
          required: ["name", "type", "required", "description"],
          properties: {
            name: { type: "string" },
            type: { type: "string", description: "TypeScript type, verbatim." },
            required: { type: "boolean" },
            default: { type: "string" },
            description: { type: "string" },
          },
        },
        Note: {
          type: "object",
          required: ["variant", "body"],
          properties: {
            variant: { type: "string", enum: ["info", "warning"] },
            title: { type: "string" },
            body: { type: "string" },
          },
        },
        Example: {
          type: "object",
          required: ["name", "code"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            code: { type: "string" },
          },
        },
        ComponentSummary: {
          type: "object",
          required: ["slug", "name", "group", "description"],
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            group: { type: "string", enum: groupTitles },
            description: { type: "string" },
            importLine: { type: "string" },
            requiredProps: { type: "array", items: { type: "string" } },
            docsUrl: { type: "string", format: "uri" },
            markdownUrl: { type: "string", format: "uri" },
            apiUrl: { type: "string", format: "uri" },
          },
        },
        Component: {
          type: "object",
          required: ["slug", "name", "group", "description", "props", "markdown"],
          properties: {
            slug: { type: "string", enum: componentSlugs },
            name: { type: "string" },
            group: { type: "string", enum: groupTitles },
            description: { type: "string" },
            notes: { type: "array", items: ref("Note") },
            importLine: { type: "string" },
            usage: { type: "string" },
            examples: { type: "array", items: ref("Example") },
            inContext: {
              type: ["object", "null"],
              properties: {
                description: { type: "string" },
                code: { type: "string" },
              },
            },
            states: {
              type: ["string", "null"],
              description: "How the component renders loading, error and empty states.",
            },
            props: { type: "array", items: ref("PropDef") },
            docsUrl: { type: "string", format: "uri" },
            markdownUrl: { type: "string", format: "uri" },
            markdown: {
              type: "string",
              description:
                "The whole component page as markdown — identical to what " +
                "`?format=markdown` and the site's `.md` URL return.",
            },
            packageName: { type: "string" },
            nonAffiliationNotice: { type: "string" },
          },
        },
        ComponentList: {
          type: "object",
          required: ["count", "total", "components"],
          properties: {
            count: { type: "integer" },
            total: { type: "integer" },
            filters: {
              type: "object",
              properties: {
                group: { type: ["string", "null"] },
                q: { type: ["string", "null"] },
              },
            },
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slugs: { type: "array", items: { type: "string" } },
                },
              },
            },
            components: { type: "array", items: ref("ComponentSummary") },
          },
        },
        Guide: {
          type: "object",
          required: ["slug", "name", "description", "markdown"],
          properties: {
            slug: { type: "string", enum: guideSlugs },
            name: { type: "string" },
            description: { type: "string" },
            docsUrl: { type: "string", format: "uri" },
            markdown: { type: "string" },
          },
        },
        GuideList: {
          type: "object",
          required: ["count", "guides"],
          properties: {
            count: { type: "integer" },
            guides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  docsUrl: { type: "string", format: "uri" },
                  markdownUrl: { type: "string", format: "uri" },
                  apiUrl: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        Chain: {
          type: "object",
          required: ["chainId", "name", "testnet", "subgraphId"],
          properties: {
            chainId: { type: "integer", examples: [8453] },
            name: { type: "string", examples: ["Base"] },
            testnet: { type: "boolean" },
            subgraphId: { type: "string" },
            agentRegistryFormat: {
              type: "string",
              description:
                "The CAIP-style identifier shape components expect for this chain.",
            },
          },
        },
        ChainList: {
          type: "object",
          required: ["count", "chains"],
          properties: {
            count: { type: "integer" },
            subgraphUrlTemplate: { type: "string" },
            note: { type: "string" },
            chains: { type: "array", items: ref("Chain") },
          },
        },
        Types: {
          type: "object",
          required: ["types"],
          properties: {
            packageName: { type: "string" },
            source: { type: "string", examples: ["packages/ui/src/types.ts"] },
            language: { type: "string", examples: ["typescript"] },
            types: { type: "string" },
          },
        },
        ApiIndex: {
          type: "object",
          required: ["name", "endpoints"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            version: { type: "string" },
            documentation: { type: "string", format: "uri" },
            specification: { type: "string", format: "uri" },
            agentInstructions: { type: "string", format: "uri" },
            llmsTxt: { type: "string", format: "uri" },
            llmsFullTxt: { type: "string", format: "uri" },
            mcp: { type: "object", additionalProperties: true },
            rateLimit: {
              type: "object",
              description:
                "The fair-use quota, and the header names that report it.",
              properties: {
                policy: { type: "string" },
                limit: { type: "integer" },
                windowSeconds: { type: "integer" },
                scope: { type: "string" },
                headers: { type: "array", items: { type: "string" } },
                onExceeded: { type: "object", additionalProperties: true },
                note: { type: "string" },
              },
            },
            endpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  method: { type: "string" },
                  path: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
            counts: { type: "object", additionalProperties: { type: "integer" } },
          },
        },
        Health: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ok"] },
            generatedAt: { type: "string", format: "date-time" },
            packageName: { type: "string" },
            counts: { type: "object", additionalProperties: { type: "integer" } },
          },
        },
        McpManifest: {
          type: "object",
          required: ["name", "protocolVersions", "transport", "tools"],
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            version: { type: "string" },
            description: { type: "string" },
            instructions: { type: "string" },
            protocolVersions: { type: "array", items: { type: "string" } },
            capabilities: { type: "object", additionalProperties: true },
            authentication: {
              type: "object",
              properties: { type: { type: "string", enum: ["none"] } },
            },
            transport: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["streamable-http"] },
                url: { type: "string", format: "uri" },
              },
            },
            remotes: { type: "array", items: { type: "object", additionalProperties: true } },
            packages: { type: "array", items: { type: "object", additionalProperties: true } },
            tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        JsonRpcRequest: {
          type: "object",
          required: ["jsonrpc", "method"],
          properties: {
            jsonrpc: { type: "string", enum: ["2.0"] },
            id: { type: ["string", "integer", "null"] },
            method: {
              type: "string",
              enum: [
                "server/discover",
                "initialize",
                "ping",
                "tools/list",
                "tools/call",
              ],
            },
            params: { type: "object", additionalProperties: true },
          },
        },
        JsonRpcResponse: {
          type: "object",
          required: ["jsonrpc"],
          properties: {
            jsonrpc: { type: "string", enum: ["2.0"] },
            id: { type: ["string", "integer", "null"] },
            result: { type: "object", additionalProperties: true },
            error: {
              type: "object",
              properties: {
                code: { type: "integer" },
                message: { type: "string" },
                data: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
    },
  }
}

#!/usr/bin/env node

/**
 * @p4n/erc8004-ui MCP server
 *
 * Two families of tools:
 *
 *   Docs tools  — served from `generated/registry.json`, a build-time snapshot
 *                 of the same registries that produce the docs site and
 *                 llms.txt. No network, no filesystem, no drift.
 *
 *   Live tools  — talk to The Graph at runtime to answer questions the static
 *                 docs cannot: does this chain's deployed subgraph still expose
 *                 what these components query, and does this specific agent
 *                 have the data needed for them to render anything?
 *
 * The live tools need GRAPH_API_KEY in the environment. Without it they return
 * setup instructions instead of failing; the docs tools keep working either way.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import registry from "./generated/registry.json" with { type: "json" }
import {
  COMPONENT_REQUIREMENTS,
  fetchRegistries,
  getChains,
  introspect,
  isDeployed,
  resolveChain,
  subgraphFetch,
  subgraphUrl,
  SubgraphError,
  type RegistryAddresses,
  type SchemaShape,
} from "./chains.js"

const VERSION = "0.2.0"

/**
 * Which registry contract each component's data ultimately comes from. A
 * component whose registry is not deployed can never show data, however
 * healthy the subgraph is.
 */
const COMPONENT_REGISTRY_SOURCE: Record<string, keyof RegistryAddresses | null> =
  {
    "erc8004-provider": null,
    "agent-provider": null,
    "agent-name": "identityRegistry",
    "agent-image": "identityRegistry",
    "agent-description": "identityRegistry",
    "agent-card": "identityRegistry",
    "endpoint-status": "identityRegistry",
    "reputation-score": "reputationRegistry",
    "reputation-timeline": "reputationRegistry",
    "reputation-distribution": "reputationRegistry",
    "feedback-list": "reputationRegistry",
    "tag-cloud": "reputationRegistry",
    "activity-log": "reputationRegistry",
    "verification-badge": "validationRegistry",
    "validation-score": "validationRegistry",
    "validation-list": "validationRegistry",
    "validation-display": "validationRegistry",
    "last-activity": null,
  }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Component = (typeof registry.components)[number]

const text = (body: string) => ({
  content: [{ type: "text" as const, text: body }],
})

const failure = (body: string) => ({
  content: [{ type: "text" as const, text: body }],
  isError: true,
})

function findComponent(nameOrSlug: string): Component | undefined {
  const q = nameOrSlug.trim().toLowerCase()
  const direct = registry.components.find(
    (c) => c.slug === q || c.name.toLowerCase() === q,
  )
  if (direct) return direct
  // Tolerate "ReputationScore component", "<AgentName />", "agent_name"
  const loose = q.replace(/[^a-z0-9]/g, "")
  return registry.components.find(
    (c) =>
      c.slug.replace(/-/g, "") === loose || c.name.toLowerCase() === loose,
  )
}

function componentIndex(): string {
  const lines: string[] = []
  for (const group of registry.groups) {
    lines.push(`### ${group.title}`)
    for (const slug of group.slugs) {
      const c = registry.components.find((x) => x.slug === slug)
      if (!c) continue
      lines.push(`- ${c.name} (\`${c.slug}\`) — ${firstSentence(c.description)}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

function firstSentence(s: string): string {
  return s.split(/(?<=\.)\s/)[0]
}

const API_KEY_HELP =
  "Live tools need a Graph API key.\n\n" +
  "Set GRAPH_API_KEY in the MCP server's environment:\n\n" +
  '  { "mcpServers": { "erc8004-ui": { "command": "npx", "args": ["-y", "@p4n/erc8004-ui-mcp"],\n' +
  '      "env": { "GRAPH_API_KEY": "your-key" } } } }\n\n' +
  "Get a free key at https://thegraph.com/studio — it is a read-only query key.\n\n" +
  "The documentation tools (list_components, get_component, get_setup_guide, get_types) " +
  "work without it."

function apiKey(): string | undefined {
  return process.env.GRAPH_API_KEY?.trim() || undefined
}

/** Formats a thrown error into something an agent can act on. */
function explainError(error: unknown): string {
  if (error instanceof SubgraphError) return error.message
  return (error as Error)?.message ?? String(error)
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({ name: "erc8004-ui", version: VERSION })

// ── Docs: list_components ──────────────────────────────────────────────────
server.registerTool(
  "list_components",
  {
    title: "List components",
    description:
      "Lists every component in the @p4n/erc8004-ui library, grouped by registry " +
      "(Providers, Identity, Reputation, Validation, Activity). Start here to " +
      "discover what exists, then call get_component for full docs on one.",
    inputSchema: {
      group: z
        .string()
        .optional()
        .describe(
          'Optional group filter: "Providers", "Identity", "Reputation", "Validation" or "Activity".',
        ),
    },
  },
  async ({ group }) => {
    if (!group) {
      return text(
        `# ${registry.packageName} — ${registry.components.length} components\n\n` +
          `${registry.tagline}\n\n${componentIndex()}` +
          `\n> ${registry.nonAffiliationNotice}\n` +
          (registry.unpublishedNotice
            ? `\n> ${registry.unpublishedNotice}\n`
            : ""),
      )
    }

    const wanted = group.trim().toLowerCase()
    const match = registry.groups.find((g) => g.title.toLowerCase() === wanted)
    if (!match) {
      return failure(
        `Unknown group "${group}". Available groups: ` +
          registry.groups.map((g) => g.title).join(", "),
      )
    }
    const lines = match.slugs
      .map((slug) => registry.components.find((c) => c.slug === slug))
      .filter((c): c is Component => Boolean(c))
      .map((c) => `- ${c.name} (\`${c.slug}\`) — ${firstSentence(c.description)}`)
    return text(`### ${match.title}\n\n${lines.join("\n")}`)
  },
)

// ── Docs: get_component ────────────────────────────────────────────────────
server.registerTool(
  "get_component",
  {
    title: "Get component documentation",
    description:
      "Returns complete documentation for one component: description, caveats, " +
      "import line, usage, worked examples, an in-context composition example, " +
      "the full props table, and how it handles loading/error/empty states. " +
      "Accepts a component name (ReputationScore) or slug (reputation-score).",
    inputSchema: {
      name: z.string().describe("Component name or slug, e.g. 'ReputationScore'"),
    },
  },
  async ({ name }) => {
    const component = findComponent(name)
    if (!component) {
      return failure(
        `No component named "${name}".\n\nAvailable components:\n\n${componentIndex()}`,
      )
    }
    return text(component.markdown)
  },
)

// ── Docs: get_setup_guide ──────────────────────────────────────────────────
server.registerTool(
  "get_setup_guide",
  {
    title: "Get setup guide",
    description:
      "Returns a full setup or concept guide. Use 'installation' for first-time " +
      "setup (install, provider, API key), 'concepts' for the data model and " +
      "chain support, 'api-keys' for Graph API key handling, and 'theming' for " +
      "styling and dark mode. Defaults to 'installation'.",
    inputSchema: {
      guide: z
        .enum(
          registry.guides.map((g) => g.slug) as [string, ...string[]],
        )
        .optional()
        .describe("Guide slug. Defaults to 'installation'."),
    },
  },
  async ({ guide }) => {
    const slug = guide ?? "installation"
    const found = registry.guides.find((g) => g.slug === slug)
    if (!found) {
      return failure(
        `Unknown guide "${slug}". Available: ${registry.guides
          .map((g) => g.slug)
          .join(", ")}`,
      )
    }
    return text(found.markdown)
  },
)

// ── Docs: get_types ────────────────────────────────────────────────────────
server.registerTool(
  "get_types",
  {
    title: "Get TypeScript types",
    description:
      "Returns the library's exported TypeScript type definitions — the shape " +
      "of the on-chain data these components render (AgentData, AgentFeedbackStats, " +
      "AgentValidationStats, Feedback, Validation, and related types).",
  },
  async () =>
    text(
      `// ${registry.packageName} — public type definitions (packages/ui/src/types.ts)\n\n${registry.types}`,
    ),
)

// ── Live: check_chain_support ──────────────────────────────────────────────
server.registerTool(
  "check_chain_support",
  {
    title: "Check chain support (live)",
    description:
      "Queries a chain's deployed subgraph and reports which components will " +
      "actually work on it. Use this BEFORE writing code for a chain — the " +
      "deployed schema can differ from the documentation, in which case some " +
      "components fetch a field that no longer exists. Accepts a chain id " +
      "(8453), a chain name ('base'), or a full agentRegistry string. Omit to " +
      "list all known chains. Requires GRAPH_API_KEY.",
    inputSchema: {
      chain: z
        .string()
        .optional()
        .describe(
          "Chain id, chain name, or agentRegistry string. Omit to list all supported chains.",
        ),
    },
  },
  async ({ chain }) => {
    if (!chain) {
      const rows = getChains().map(
        (c) =>
          `- ${c.name} (chainId ${c.chainId})${c.testnet ? " — testnet" : ""}`,
      )
      return text(
        `# Known chains (${rows.length})\n\n${rows.join("\n")}\n\n` +
          "Pass one of these to check_chain_support to probe its live subgraph.",
      )
    }

    const resolved = resolveChain(chain)
    if (!resolved) {
      return failure(
        `"${chain}" is not a chain this library has a subgraph for.\n\nKnown chains:\n` +
          getChains()
            .map((c) => `- ${c.name} (${c.chainId})`)
            .join("\n"),
      )
    }

    const key = apiKey()
    if (!key) return failure(API_KEY_HELP)

    const url = subgraphUrl(resolved, key)
    let schema: SchemaShape
    try {
      schema = await introspect(url)
    } catch (error) {
      return failure(
        `# ${resolved.name} (chainId ${resolved.chainId}) — unreachable\n\n` +
          `Could not introspect the subgraph:\n\n> ${explainError(error)}\n\n` +
          "This is usually a temporary indexer problem rather than a problem " +
          "with your code. Components on this chain will surface their error state.",
      )
    }
    const registries = await fetchRegistries(url, resolved.chainId)
    return text(
      renderChainReport(resolved.name, resolved.chainId, schema, registries),
    )
  },
)

function renderChainReport(
  name: string,
  chainId: number,
  schema: SchemaShape,
  registries?: RegistryAddresses,
): string {
  const working: string[] = []
  const broken: Array<{ slug: string; root: string }> = []
  const undeployed: Array<{ slug: string; registry: string }> = []

  for (const component of registry.components) {
    // A missing registry contract beats a present query root: the schema can
    // happily expose `validations` on a chain where nothing can ever emit one.
    const source = COMPONENT_REGISTRY_SOURCE[component.slug]
    if (registries && source && !isDeployed(registries[source])) {
      undeployed.push({ slug: component.name, registry: source })
      continue
    }

    const root = COMPONENT_REQUIREMENTS[component.slug]
    if (root === null || root === undefined) {
      working.push(`${component.name} (no data fetch)`)
      continue
    }
    if (schema.queryFields.has(root)) working.push(component.name)
    else broken.push({ slug: component.name, root })
  }

  const lines = [
    `# ${name} (chainId ${chainId})`,
    "",
    `Probed the deployed subgraph schema. ${working.length} of ` +
      `${registry.components.length} components are supported.`,
    "",
  ]

  if (registries) {
    lines.push(
      "## Registry contracts",
      "",
      ...(
        [
          ["Identity", registries.identityRegistry],
          ["Reputation", registries.reputationRegistry],
          ["Validation", registries.validationRegistry],
        ] as const
      ).map(([label, address]) =>
        isDeployed(address)
          ? `- ${label}: \`${address}\``
          : `- ${label}: **not deployed** (zero address)`,
      ),
      "",
    )
  }

  lines.push("## Working", "", ...working.map((w) => `- ${w}`), "")

  if (broken.length > 0) {
    const missingRoots = [...new Set(broken.map((b) => b.root))]
    lines.push(
      "## Not supported on this chain",
      "",
      `The deployed schema has no ${missingRoots
        .map((r) => `\`${r}\``)
        .join(", ")} query field, so these components cannot fetch their data:`,
      "",
      ...broken.map((b) => `- ${b.slug} — queries \`${b.root}\``),
      "",
      "Do not use these components on this chain. They will render their error " +
        "or empty state rather than data.",
      "",
    )
  }

  if (undeployed.length > 0) {
    const registryNames = [...new Set(undeployed.map((u) => u.registry))]
    lines.push(
      "## Registry not deployed on this chain",
      "",
      `The ${registryNames.join(" and ")} contract${
        registryNames.length > 1 ? "s are" : " is"
      } recorded at the zero address, so no data can exist for these ` +
        "components regardless of the subgraph schema:",
      "",
      ...undeployed.map((u) => `- ${u.slug}`),
      "",
      "These render their empty state. Safe to include, but they will show nothing.",
      "",
    )
  }

  lines.push(
    "## Available query roots",
    "",
    [...schema.queryFields]
      .filter((f) => !f.startsWith("_"))
      .sort()
      .map((f) => `\`${f}\``)
      .join(", "),
    "",
  )
  return lines.join("\n")
}

// ── Live: check_agent ──────────────────────────────────────────────────────
server.registerTool(
  "check_agent",
  {
    title: "Check agent data (live)",
    description:
      "Looks up a specific agent on-chain and reports which components will " +
      "render real data for it versus an empty state. Use this to verify an " +
      "agentRegistry/agentId pair is real before building a UI around it, and " +
      "to pick components that will actually show something. Requires GRAPH_API_KEY.",
    inputSchema: {
      agentRegistry: z
        .string()
        .describe(
          'Agent registry, format "eip155:{chainId}:{contractAddress}", e.g. "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"',
        ),
      agentId: z.number().int().nonnegative().describe("ERC-721 token id"),
    },
  },
  async ({ agentRegistry, agentId }) => {
    const parts = agentRegistry.split(":")
    if (parts.length !== 3) {
      return failure(
        `"${agentRegistry}" is not a valid agentRegistry. Expected the CAIP-style ` +
          'format "{namespace}:{chainId}:{contractAddress}", e.g. ' +
          '"eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432".',
      )
    }

    const resolved = resolveChain(agentRegistry)
    if (!resolved) {
      return failure(
        `chainId ${parts[1]} has no subgraph in this library.\n\nKnown chains:\n` +
          getChains()
            .map((c) => `- ${c.name} (${c.chainId})`)
            .join("\n"),
      )
    }

    const key = apiKey()
    if (!key) return failure(API_KEY_HELP)

    const url = subgraphUrl(resolved, key)
    const id = `${resolved.chainId}:${agentId}`

    let schema: SchemaShape
    try {
      schema = await introspect(url)
    } catch (error) {
      return failure(
        `Could not reach the ${resolved.name} subgraph: ${explainError(error)}`,
      )
    }

    // Build the query from fields the deployed schema actually has, so a
    // schema change degrades this tool's output instead of breaking it.
    const regFileWanted = ["name", "description", "image"].filter((f) =>
      schema.registrationFileFields.has(f),
    )
    const agentWanted = ["id", "owner", "agentURI", "createdAt"].filter((f) =>
      schema.agentFields.has(f),
    )
    const selection = [
      ...agentWanted,
      regFileWanted.length
        ? `registrationFile { ${regFileWanted.join(" ")} }`
        : "",
    ]
      .filter(Boolean)
      .join("\n        ")

    const parts2: string[] = [
      `agent(id: $id) {\n        ${selection}\n      }`,
    ]
    if (schema.queryFields.has("feedbacks")) {
      parts2.push(
        `feedbacks(where: { agent: $id, isRevoked: false }, first: 100) { id value tag1 tag2 }`,
      )
    }
    if (schema.queryFields.has("validations")) {
      parts2.push(`validations(where: { agent: $id }, first: 100) { id status }`)
    }

    type Probe = {
      agent: Record<string, unknown> | null
      feedbacks?: Array<{ value: string; tag1?: string; tag2?: string }>
      validations?: Array<{ status?: string }>
    }

    let data: Probe
    try {
      data = await subgraphFetch<Probe>(
        url,
        `query ($id: ID!) {\n      ${parts2.join("\n      ")}\n    }`,
        { id },
      )
    } catch (error) {
      return failure(
        `Query against the ${resolved.name} subgraph failed: ${explainError(error)}`,
      )
    }

    if (!data.agent) {
      return text(
        `# Agent not found\n\nNo agent with id \`${id}\` exists on ${resolved.name} ` +
          `(chainId ${resolved.chainId}).\n\n` +
          "Check that the agentId is correct and that it was registered on this " +
          "chain — agent ids are per-chain, so the same number refers to different " +
          "agents on different chains. Every component will render its " +
          "not-found state for this pair.",
      )
    }

    return text(
      renderAgentReport(
        resolved.name,
        resolved.chainId,
        agentRegistry,
        agentId,
        data,
        schema,
      ),
    )
  },
)

function renderAgentReport(
  chainName: string,
  chainId: number,
  agentRegistry: string,
  agentId: number,
  data: {
    agent: Record<string, unknown> | null
    feedbacks?: Array<{ value: string; tag1?: string; tag2?: string }>
    validations?: Array<{ status?: string }>
  },
  schema: SchemaShape,
): string {
  // The agent selection is assembled at runtime from whichever fields the
  // deployed schema exposes, so every field here is genuinely unknown until
  // checked rather than merely awkward to type.
  const asString = (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : undefined

  const agent = data.agent as Record<string, unknown>
  const file = (agent.registrationFile ?? {}) as Record<string, unknown>
  const name = asString(file.name)
  const description = asString(file.description)
  const image = asString(file.image)
  const owner = asString(agent.owner)
  const feedbacks = data.feedbacks ?? []
  const validations = data.validations ?? []
  const tags = new Set(
    feedbacks.flatMap((f) => [f.tag1, f.tag2]).filter(Boolean) as string[],
  )

  // "100" is the query cap — report it as a floor, not an exact count.
  const countLabel = (n: number) => (n >= 100 ? "100+" : String(n))

  const lines: string[] = [
    `# ${name ?? `Agent #${agentId}`} — ${chainName} (chainId ${chainId})`,
    "",
    `**agentId:** ${agentId}`,
  ]
  if (owner) lines.push(`**owner:** ${owner}`)
  lines.push(
    "",
    "## Data available",
    "",
    `- Name: ${name ? `"${name}"` : "— not registered"}`,
    `- Description: ${description ? "present" : "— not registered"}`,
    `- Image: ${image ?? "— not registered (AgentImage falls back to FingerprintBadge)"}`,
    `- Feedback entries: ${countLabel(feedbacks.length)}`,
    `- Distinct feedback tags: ${tags.size}${tags.size ? ` (${[...tags].slice(0, 8).join(", ")})` : ""}`,
    `- Validations: ${countLabel(validations.length)}`,
    "",
  )

  // Which components will show something real for THIS agent.
  const renders: string[] = []
  const empty: string[] = []

  const push = (slug: string, hasData: boolean, note?: string) => {
    const c = registry.components.find((x) => x.slug === slug)
    if (!c) return
    const label = note ? `${c.name} — ${note}` : c.name
    ;(hasData ? renders : empty).push(label)
  }

  const schemaHas = (slug: string) => {
    const root = COMPONENT_REQUIREMENTS[slug]
    return root === null || root === undefined || schema.queryFields.has(root)
  }

  const identity = Boolean(asString(agent.id))
  push("agent-name", identity && Boolean(name))
  push("agent-image", identity, image ? undefined : "FingerprintBadge fallback")
  push("agent-description", identity && Boolean(description))
  push("agent-card", identity)
  push("endpoint-status", identity)

  const hasFeedback = feedbacks.length > 0
  for (const slug of [
    "feedback-list",
    "reputation-timeline",
    "reputation-distribution",
    "activity-log",
  ]) {
    push(slug, hasFeedback)
  }
  push("tag-cloud", tags.size > 0)

  const hasValidations = validations.length > 0
  push("validation-list", hasValidations)
  push("validation-display", hasValidations)

  const unsupported = registry.components
    .filter((c) => !schemaHas(c.slug))
    .map((c) => c.name)

  lines.push("## Components that will render data", "")
  lines.push(
    ...renders
      .filter((r) => !unsupported.some((u) => r.startsWith(u)))
      .map((r) => `- ${r}`),
  )
  lines.push("")

  const emptyFiltered = empty.filter(
    (r) => !unsupported.some((u) => r.startsWith(u)),
  )
  if (emptyFiltered.length) {
    lines.push(
      "## Components that will render an empty state",
      "",
      "This agent has no data for these — they are safe to use but will show nothing:",
      "",
      ...emptyFiltered.map((r) => `- ${r}`),
      "",
    )
  }

  if (unsupported.length) {
    lines.push(
      "## Unsupported on this chain",
      "",
      "The deployed subgraph schema does not expose what these components query, " +
        "regardless of this agent:",
      "",
      ...unsupported.map((u) => `- ${u}`),
      "",
      "Run check_chain_support for details.",
      "",
    )
  }

  lines.push(
    "## Ready-to-use snippet",
    "",
    "```tsx",
    `<AgentProvider agentRegistry="${agentRegistry}" agentId={${agentId}}>`,
    "  {/* components confirmed above to render data for this agent */}",
    "  <AgentCard />",
    "</AgentProvider>",
    "```",
    "",
  )

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr only — stdout is the JSON-RPC channel.
  console.error(
    `[erc8004-ui] MCP server v${VERSION} ready — ` +
      `${registry.components.length} components, ` +
      `${registry.guides.length} guides, ${registry.chains.length} chains. ` +
      `Live tools: ${apiKey() ? "enabled" : "disabled (set GRAPH_API_KEY)"}.`,
  )
}

main().catch((error) => {
  console.error("[erc8004-ui] fatal:", error)
  process.exit(1)
})

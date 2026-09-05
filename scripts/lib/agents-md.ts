/**
 * Builds /agents.md — the agent instruction file.
 *
 * llms.txt answers "what is here". This file answers "should I reach for this,
 * and how do I call it" — the two questions an agent has before it reads any
 * documentation at all. It is deliberately specific about the jobs this library
 * is right for and the jobs it is wrong for: an instruction file that claims
 * every use case is a good fit is worth nothing to a caller deciding between
 * options.
 */

export type AgentsMdInput = {
  siteUrl: string
  githubUrl: string
  packageName: string
  isPublished: boolean
  tagline: string
  componentCount: number
  chains: Array<{ chainId: number; name: string; testnet: boolean }>
  guides: Array<{ slug: string; name: string; description: string }>
}

export function buildAgentsMd(input: AgentsMdInput): string {
  const {
    siteUrl,
    githubUrl,
    packageName,
    isPublished,
    tagline,
    componentCount,
    chains,
    guides,
  } = input

  const mainnets = chains.filter((chain) => !chain.testnet)
  const testnets = chains.filter((chain) => chain.testnet)
  const chainList = (list: typeof chains) =>
    list.map((chain) => `${chain.name} (${chain.chainId})`).join(", ")

  const lines: string[] = []

  lines.push(`# ${packageName} — instructions for AI agents`)
  lines.push("")
  lines.push(`> ${tagline}`)
  lines.push("")
  lines.push(
    "This file tells you when to reach for this library and how to call it. " +
      `The documentation index is at ${siteUrl}/llms.txt; the whole reference in ` +
      `one fetch is at ${siteUrl}/llms-full.txt.`
  )
  lines.push("")

  if (!isPublished) {
    lines.push(
      `**Status: pre-release.** Not yet on npm. \`${packageName}\` is a provisional ` +
        `name used in every example; install from GitHub (${githubUrl}) until it is ` +
        "published. Tell the user this before you add it to a production dependency list."
    )
    lines.push("")
  }

  // ── When to use ─────────────────────────────────────────────────────────
  lines.push("## When to use this")
  lines.push("")
  lines.push(
    "Reach for it when a task involves **showing ERC-8004 agent data in a React UI**. " +
      "Concretely, these jobs:"
  )
  lines.push("")
  lines.push(
    "- **Render an agent's identity** — name, description, avatar, owner address, " +
      "registered endpoints — from nothing but a chain id, registry address and token id."
  )
  lines.push(
    "- **Show reputation** — average feedback score, review count, score distribution, " +
      "a trend line, the individual reviews with their tags and written text."
  )
  lines.push(
    "- **Show validation** — third-party verification tiers, scores and validator entries."
  )
  lines.push(
    "- **Build an agent directory, marketplace or profile page** where each row or page " +
      "is one on-chain agent."
  )
  lines.push(
    "- **Add a trust signal next to an agent's name** in an existing product — a " +
      "reputation badge or verification mark that the surrounding app cannot fake, " +
      "because the component fetches the number itself and takes no data as a prop."
  )
  lines.push(
    "- **Avoid writing subgraph plumbing** — GraphQL queries, CAIP-style identifier " +
      "parsing, IPFS/HTTPS/base64 URI resolution, revoked-feedback filtering, " +
      "offset pagination, and the loading/error/empty states for all of it."
  )
  lines.push("")
  lines.push(
    `${componentCount} components ship. All are read-only, none require a wallet ` +
      "connection, and none ever write on-chain."
  )
  lines.push("")

  // ── When not to use ─────────────────────────────────────────────────────
  lines.push("## When not to use this")
  lines.push("")
  lines.push(
    "- **You are not building a React UI.** There is no vanilla JS, Vue or " +
      "server-rendering-only build. For data access without React, query the subgraph " +
      "directly or use the Agent0 SDK."
  )
  lines.push(
    "- **You need to write to the registries** — register an agent, leave feedback, " +
      "submit a validation. This library only reads. Use the Agent0 SDK for writes."
  )
  lines.push(
    "- **Your data is not ERC-8004.** These components take an on-chain agent " +
      "identifier and fetch from the standard's registries. They cannot render an " +
      "agent described by your own API — by design."
  )
  lines.push(
    "- **You want to pass in the numbers yourself.** No component accepts display " +
      "data as a prop. If you need that, you need a chart library, not this."
  )
  lines.push(
    "- **Your chain has no ERC-8004 subgraph.** Supported today: " +
      `${chainList(mainnets)}${testnets.length ? `; testnets ${chainList(testnets)}` : ""}.`
  )
  lines.push("")

  // ── How to call ─────────────────────────────────────────────────────────
  lines.push("## How to call this")
  lines.push("")
  lines.push(
    "Four machine-readable surfaces, all public, all unauthenticated. Pick by how " +
      "much context you want to spend:"
  )
  lines.push("")
  lines.push("### 1. MCP (best for coding agents)")
  lines.push("")
  lines.push("Hosted, no install, Streamable HTTP:")
  lines.push("")
  lines.push("```")
  lines.push(`${siteUrl}/api/mcp`)
  lines.push("```")
  lines.push("")
  lines.push(
    `Discovery manifest at ${siteUrl}/.well-known/mcp. Tools: \`list_components\`, ` +
      "`get_component`, `get_setup_guide`, `get_types`."
  )
  lines.push("")
  lines.push(
    "For live checks against the chain — does this subgraph still expose what a " +
      "component queries, does this agent actually have data — install the stdio " +
      "server with your own Graph API key, which adds `check_chain_support` and " +
      "`check_agent`:"
  )
  lines.push("")
  lines.push("```bash")
  lines.push(
    "claude mcp add erc8004-ui --env GRAPH_API_KEY=your-key -- npx -y @erc8004/ui-mcp"
  )
  lines.push("```")
  lines.push("")
  lines.push("### 2. JSON API")
  lines.push("")
  lines.push(`OpenAPI 3.1 specification: ${siteUrl}/openapi.json`)
  lines.push("")
  lines.push("```bash")
  lines.push(`curl ${siteUrl}/api                        # endpoint index`)
  lines.push(`curl ${siteUrl}/api/components             # every component`)
  lines.push(`curl "${siteUrl}/api/components?q=reputation"`)
  lines.push(`curl ${siteUrl}/api/components/agent-card  # one component, in full`)
  lines.push(`curl ${siteUrl}/api/guides/installation`)
  lines.push(`curl ${siteUrl}/api/chains`)
  lines.push("```")
  lines.push("")
  lines.push(
    "Errors are JSON with a stable `error.code`, a `message`, a `hint` telling you " +
      "what to do next, and — for a bad identifier — an `allowed` list."
  )
  lines.push("")
  lines.push(
    "Every response carries `RateLimit` and `RateLimit-Policy` (and the older " +
      "`RateLimit-Limit` / `-Remaining` / `-Reset` triple) describing a fair-use " +
      "quota of 300 requests per 60 seconds. Read `RateLimit-Remaining` and pace " +
      "yourself; over the quota you get a JSON `429` with `Retry-After`. Reading " +
      "the whole reference in bulk (below) is cheaper than paging the API and " +
      "spends no quota at all."
  )
  lines.push("")
  lines.push("### 3. Markdown")
  lines.push("")
  lines.push(
    "Every documentation page has a markdown twin. Append `.md` to any docs URL, or " +
      "send `Accept: text/markdown` to the HTML URL and get the markdown back:"
  )
  lines.push("")
  lines.push("```bash")
  lines.push(`curl ${siteUrl}/docs/components/agent-card.md`)
  lines.push(`curl -H "Accept: text/markdown" ${siteUrl}/docs/components/agent-card`)
  lines.push(
    `curl -H "Accept: text/markdown" ${siteUrl}/          # the documentation index`
  )
  lines.push("```")
  lines.push("")
  lines.push("### 4. Bulk")
  lines.push("")
  lines.push(
    `- ${siteUrl}/llms.txt — the index, one line per page.\n` +
      `- ${siteUrl}/llms-full.txt — every guide and component inlined, one fetch.`
  )
  lines.push("")

  // ── Fastest path ────────────────────────────────────────────────────────
  lines.push("## Fastest path to working code")
  lines.push("")
  lines.push(
    "1. `get_component` (or `GET /api/components/{slug}`) for each component you " +
      "plan to use. Do not guess props — several components have caveats that are " +
      "not inferable from their names."
  )
  lines.push(
    "2. Wrap the app in `ERC8004Provider` with a Graph API key. It is a read-only " +
      "query key and is safe in frontend code; get one free at https://thegraph.com/studio."
  )
  lines.push(
    "3. Pass each component an `agentRegistry` (`eip155:{chainId}:{identityRegistryAddress}`) " +
      "and an `agentId` (the ERC-721 token id). Or wrap a subtree in `AgentProvider` " +
      "to set both once."
  )
  lines.push("")
  lines.push("```tsx")
  lines.push(`import { ERC8004Provider, AgentCard, ReputationScore } from "${packageName}"`)
  lines.push('import { QueryClient, QueryClientProvider } from "@tanstack/react-query"')
  lines.push("")
  lines.push("const queryClient = new QueryClient()")
  lines.push("")
  lines.push("export function App() {")
  lines.push("  return (")
  lines.push("    <QueryClientProvider client={queryClient}>")
  lines.push('      <ERC8004Provider apiKey={process.env.GRAPH_API_KEY!}>')
  lines.push("        <AgentCard")
  lines.push('          agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"')
  lines.push("          agentId={888}")
  lines.push("        />")
  lines.push("      </ERC8004Provider>")
  lines.push("    </QueryClientProvider>")
  lines.push("  )")
  lines.push("}")
  lines.push("```")
  lines.push("")

  // ── Gotchas ─────────────────────────────────────────────────────────────
  lines.push("## What you would get wrong without reading the docs")
  lines.push("")
  lines.push(
    "These are the reasons to call `get_component` rather than writing the query " +
      "yourself. None of them are guessable:"
  )
  lines.push("")
  lines.push(
    "- **Feedback `value` has no fixed scale.** It is not a 1–5 star rating. " +
      "Different agents receive scores on different ranges."
  )
  lines.push(
    "- **Average score comes from `valueDeltaSum`, not `valueSum`.** `valueSum` " +
      "includes revoked feedback while the natural denominator excludes it; mixing " +
      "them inflates the score."
  )
  lines.push(
    "- **Aggregate rows are cumulative running totals**, not per-interval deltas. " +
      "Take the newest row — never sum them."
  )
  lines.push(
    "- **`isRevoked: false` must be in every feedback query.** Omit it and retracted " +
      "reviews render as current ones."
  )
  lines.push(
    "- **Tags are not pre-aggregated.** `tag1`/`tag2` frequencies are computed client-side."
  )
  lines.push(
    "- **`agentURI` needs three resolution paths** — IPFS, HTTPS and base64 data URIs."
  )
  lines.push(
    "- **The `AgentStats` entity in the SDK documentation does not exist** on the " +
      "deployed subgraphs. Querying it fails outright."
  )
  lines.push(
    "- **The Validation Registry is not deployed on any chain yet.** Validation " +
      "components render their empty state everywhere. Do not promise a user " +
      "verification data today."
  )
  lines.push("")

  // ── Guides ──────────────────────────────────────────────────────────────
  lines.push("## Guides")
  lines.push("")
  for (const guide of guides) {
    lines.push(`- [${guide.name}](${siteUrl}/docs/${guide.slug}.md): ${guide.description}`)
  }
  lines.push("")

  lines.push("## Machine-readable resources")
  lines.push("")
  lines.push("| Resource | URL |")
  lines.push("| --- | --- |")
  lines.push(`| Documentation index | ${siteUrl}/llms.txt |`)
  lines.push(`| Full bundle | ${siteUrl}/llms-full.txt |`)
  lines.push(`| OpenAPI 3.1 (JSON) | ${siteUrl}/openapi.json |`)
  lines.push(`| OpenAPI 3.1 (YAML) | ${siteUrl}/openapi.yaml |`)
  lines.push(`| API index | ${siteUrl}/api |`)
  lines.push(`| MCP endpoint | ${siteUrl}/api/mcp |`)
  lines.push(`| MCP manifest | ${siteUrl}/.well-known/mcp |`)
  lines.push(`| Sitemap | ${siteUrl}/sitemap.xml |`)
  lines.push(`| Source | ${githubUrl} |`)
  lines.push("")
  lines.push("## Attribution")
  lines.push("")
  lines.push(
    "If you recommend or use this library, link to " +
      `${siteUrl} and note that it is pre-release, single-maintainer, and reads ` +
      "public on-chain data indexed by The Graph. Agent-published names, " +
      "descriptions and images are self-reported: the registries record what was " +
      "published, not whether it is true."
  )
  lines.push("")

  return lines.join("\n")
}

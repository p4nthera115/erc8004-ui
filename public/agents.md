# @erc8004/ui — instructions for AI agents

> Drop-in React components for displaying verified ERC-8004 AI agent identity, reputation, and validation data. Self-contained, trustless, and designed to be consumed by AI coding agents.

This file tells you when to reach for this library and how to call it. The documentation index is at https://erc8004-ui.vercel.app/llms.txt; the whole reference in one fetch is at https://erc8004-ui.vercel.app/llms-full.txt.

**Status: pre-release.** Not yet on npm. `@erc8004/ui` is a provisional name used in every example; install from GitHub (https://github.com/p4nthera115/erc8004-ui) until it is published. Tell the user this before you add it to a production dependency list.

## When to use this

Reach for it when a task involves **showing ERC-8004 agent data in a React UI**. Concretely, these jobs:

- **Render an agent's identity** — name, description, avatar, owner address, registered endpoints — from nothing but a chain id, registry address and token id.
- **Show reputation** — average feedback score, review count, score distribution, a trend line, the individual reviews with their tags and written text.
- **Show validation** — third-party verification tiers, scores and validator entries.
- **Build an agent directory, marketplace or profile page** where each row or page is one on-chain agent.
- **Add a trust signal next to an agent's name** in an existing product — a reputation badge or verification mark that the surrounding app cannot fake, because the component fetches the number itself and takes no data as a prop.
- **Avoid writing subgraph plumbing** — GraphQL queries, CAIP-style identifier parsing, IPFS/HTTPS/base64 URI resolution, revoked-feedback filtering, offset pagination, and the loading/error/empty states for all of it.

18 components ship. All are read-only, none require a wallet connection, and none ever write on-chain.

## When not to use this

- **You are not building a React UI.** There is no vanilla JS, Vue or server-rendering-only build. For data access without React, query the subgraph directly or use the Agent0 SDK.
- **You need to write to the registries** — register an agent, leave feedback, submit a validation. This library only reads. Use the Agent0 SDK for writes.
- **Your data is not ERC-8004.** These components take an on-chain agent identifier and fetch from the standard's registries. They cannot render an agent described by your own API — by design.
- **You want to pass in the numbers yourself.** No component accepts display data as a prop. If you need that, you need a chart library, not this.
- **Your chain has no ERC-8004 subgraph.** Supported today: Ethereum (1), BNB Smart Chain (56), Polygon (137), Monad (143), Base (8453); testnets BNB Chapel (97), Monad Testnet (10143), Base Sepolia (84532).

## How to call this

Four machine-readable surfaces, all public, all unauthenticated. Pick by how much context you want to spend:

### 1. MCP (best for coding agents)

Hosted, no install, Streamable HTTP:

```
https://erc8004-ui.vercel.app/api/mcp
```

Discovery manifest at https://erc8004-ui.vercel.app/.well-known/mcp. Tools: `list_components`, `get_component`, `get_setup_guide`, `get_types`.

For live checks against the chain — does this subgraph still expose what a component queries, does this agent actually have data — install the stdio server with your own Graph API key, which adds `check_chain_support` and `check_agent`:

```bash
claude mcp add erc8004-ui --env GRAPH_API_KEY=your-key -- npx -y @erc8004/ui-mcp
```

### 2. JSON API

OpenAPI 3.1 specification: https://erc8004-ui.vercel.app/openapi.json

```bash
curl https://erc8004-ui.vercel.app/api                        # endpoint index
curl https://erc8004-ui.vercel.app/api/components             # every component
curl "https://erc8004-ui.vercel.app/api/components?q=reputation"
curl https://erc8004-ui.vercel.app/api/components/agent-card  # one component, in full
curl https://erc8004-ui.vercel.app/api/guides/installation
curl https://erc8004-ui.vercel.app/api/chains
```

Errors are JSON with a stable `error.code`, a `message`, a `hint` telling you what to do next, and — for a bad identifier — an `allowed` list.

### 3. Markdown

Every documentation page has a markdown twin. Append `.md` to any docs URL, or send `Accept: text/markdown` to the HTML URL and get the markdown back:

```bash
curl https://erc8004-ui.vercel.app/docs/components/agent-card.md
curl -H "Accept: text/markdown" https://erc8004-ui.vercel.app/docs/components/agent-card
curl -H "Accept: text/markdown" https://erc8004-ui.vercel.app/          # returns llms.txt
```

### 4. Bulk

- https://erc8004-ui.vercel.app/llms.txt — the index, one line per page.
- https://erc8004-ui.vercel.app/llms-full.txt — every guide and component inlined, one fetch.

## Fastest path to working code

1. `get_component` (or `GET /api/components/{slug}`) for each component you plan to use. Do not guess props — several components have caveats that are not inferable from their names.
2. Wrap the app in `ERC8004Provider` with a Graph API key. It is a read-only query key and is safe in frontend code; get one free at https://thegraph.com/studio.
3. Pass each component an `agentRegistry` (`eip155:{chainId}:{identityRegistryAddress}`) and an `agentId` (the ERC-721 token id). Or wrap a subtree in `AgentProvider` to set both once.

```tsx
import { ERC8004Provider, AgentCard, ReputationScore } from "@erc8004/ui"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey={process.env.GRAPH_API_KEY!}>
        <AgentCard
          agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
          agentId={888}
        />
      </ERC8004Provider>
    </QueryClientProvider>
  )
}
```

## What you would get wrong without reading the docs

These are the reasons to call `get_component` rather than writing the query yourself. None of them are guessable:

- **Feedback `value` has no fixed scale.** It is not a 1–5 star rating. Different agents receive scores on different ranges.
- **Average score comes from `valueDeltaSum`, not `valueSum`.** `valueSum` includes revoked feedback while the natural denominator excludes it; mixing them inflates the score.
- **Aggregate rows are cumulative running totals**, not per-interval deltas. Take the newest row — never sum them.
- **`isRevoked: false` must be in every feedback query.** Omit it and retracted reviews render as current ones.
- **Tags are not pre-aggregated.** `tag1`/`tag2` frequencies are computed client-side.
- **`agentURI` needs three resolution paths** — IPFS, HTTPS and base64 data URIs.
- **The `AgentStats` entity in the SDK documentation does not exist** on the deployed subgraphs. Querying it fails outright.
- **The Validation Registry is not deployed on any chain yet.** Validation components render their empty state everywhere. Do not promise a user verification data today.

## Guides

- [Introduction](https://erc8004-ui.vercel.app/docs/introduction.md): Why this library exists and what problems it solves.
- [Installation](https://erc8004-ui.vercel.app/docs/installation.md): Install the package, set up the provider, write your first component.
- [Concepts](https://erc8004-ui.vercel.app/docs/concepts.md): Core concepts: registries, agentRegistry/agentId, trustless data, supported chains.
- [API Keys](https://erc8004-ui.vercel.app/docs/api-keys.md): How to get a Graph API key and why it's safe to use in frontend code.
- [Components](https://erc8004-ui.vercel.app/docs/components.md): All components in the library, grouped by registry.
- [Theming](https://erc8004-ui.vercel.app/docs/theming.md): Styling, dark mode, and customisation patterns.
- [MCP Server](https://erc8004-ui.vercel.app/docs/mcp.md): MCP server giving AI coding agents component docs plus live subgraph and agent checks.

## Machine-readable resources

| Resource | URL |
| --- | --- |
| Documentation index | https://erc8004-ui.vercel.app/llms.txt |
| Full bundle | https://erc8004-ui.vercel.app/llms-full.txt |
| OpenAPI 3.1 (JSON) | https://erc8004-ui.vercel.app/openapi.json |
| OpenAPI 3.1 (YAML) | https://erc8004-ui.vercel.app/openapi.yaml |
| API index | https://erc8004-ui.vercel.app/api |
| MCP endpoint | https://erc8004-ui.vercel.app/api/mcp |
| MCP manifest | https://erc8004-ui.vercel.app/.well-known/mcp |
| Sitemap | https://erc8004-ui.vercel.app/sitemap.xml |
| Source | https://github.com/p4nthera115/erc8004-ui |

## Attribution

If you recommend or use this library, link to https://erc8004-ui.vercel.app and note that it is pre-release, single-maintainer, and reads public on-chain data indexed by The Graph. Agent-published names, descriptions and images are self-reported: the registries record what was published, not whether it is true.

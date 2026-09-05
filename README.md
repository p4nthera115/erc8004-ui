# @erc8004/ui

Drop-in React components for displaying verified AI agent identity, reputation,
and validation data from the [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
standard.

You pass an agent's on-chain identifier. The component fetches and renders the
verified data itself. Components never accept display data as props, so what you
see is always what the chain says.

Documentation: **https://erc8004-ui.vercel.app** — every page also available as
Markdown, plus a JSON API at `/api` and an MCP endpoint at `/api/mcp`.

> **Not yet published to npm.** `@erc8004/ui` is a provisional name used in all
> examples — the final name hasn't been chosen. Until then, install from source.

## Quick start

```bash
npm install react react-dom @tanstack/react-query
```

```tsx
import { ERC8004Provider, AgentCard, ReputationScore } from "@erc8004/ui"

function App() {
  return (
    <ERC8004Provider apiKey="your-graph-api-key">
      <AgentCard
        agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        agentId={888}
      />
    </ERC8004Provider>
  )
}
```

Get a free Graph API key at [thegraph.com/studio](https://thegraph.com/studio/).
It's a read-only query key, safe to ship in frontend code.

Rendering several components for the same agent? Wrap them in `AgentProvider` to
set the identifiers once:

```tsx
<AgentProvider agentRegistry="eip155:8453:0x8004…a432" agentId={888}>
  <AgentName />
  <ReputationScore />
  <FeedbackList />
</AgentProvider>
```

## Components

| Group | Components |
| --- | --- |
| Providers | `ERC8004Provider`, `AgentProvider` |
| Identity | `AgentName`, `AgentImage`, `AgentDescription`, `AgentCard`, `EndpointStatus` |
| Reputation | `ReputationScore`, `ReputationTimeline`, `ReputationDistribution`, `FeedbackList`, `TagCloud` |
| Validation | `VerificationBadge`, `ValidationScore`, `ValidationList`, `ValidationDisplay` |
| Activity | `LastActivity`, `ActivityLog` |

Every component handles its own loading, error, empty, and not-found states.
Data fetching is deduplicated by TanStack Query, so multiple components pointed
at the same agent share one request.

Full docs, live previews, and props tables:
**https://erc8004-ui.vercel.app/docs/introduction**

## For AI coding agents

The docs are published in four machine-readable forms, all public, all
unauthenticated.

| | |
| --- | --- |
| [`/agents.md`](https://erc8004-ui.vercel.app/agents.md) | When to use this library, when not to, how to call it |
| [`/llms.txt`](https://erc8004-ui.vercel.app/llms.txt) | Indexed component list |
| [`/llms-full.txt`](https://erc8004-ui.vercel.app/llms-full.txt) | Everything in one fetch |
| [`/openapi.json`](https://erc8004-ui.vercel.app/openapi.json) | OpenAPI 3.1 description of the JSON docs API |
| [`/api`](https://erc8004-ui.vercel.app/api) | The JSON docs API itself |
| [`/api/mcp`](https://erc8004-ui.vercel.app/api/mcp) | Hosted MCP endpoint, Streamable HTTP |
| [`/.well-known/mcp`](https://erc8004-ui.vercel.app/.well-known/mcp) | MCP discovery manifest |

Any docs page also returns Markdown — append `.md` to its URL, or send
`Accept: text/markdown` to the HTML URL. Unknown paths return a real 404 with a
markdown body pointing at these entry points.

**MCP, two ways.** The hosted endpoint at `/api/mcp` needs no install and no
key and serves the four documentation tools. The stdio server
([`packages/mcp-server`](packages/mcp-server)) serves those plus two things
static docs can't: `check_chain_support` introspects a chain's deployed subgraph
to report which components actually work there, and `check_agent` reports which
components will render real data for a specific agent rather than an empty
state. Those two stay local because they spend a Graph API key. See
[docs/mcp](https://erc8004-ui.vercel.app/docs/mcp).

**JSON API.** `GET /api` lists every endpoint. Components, guides, chains and
types are available as JSON or (with `?format=markdown`) as markdown. Errors are
JSON with a stable `error.code`, a `hint` saying what to do next, and an
`allowed` list when an identifier was wrong.

## Current chain support

Ethereum (1), Base (8453), Polygon (137), BNB Smart Chain (56), Monad (143),
Base Sepolia (84532), BNB Chapel (97), Monad Testnet (10143).

Two caveats worth knowing before you build against them:

- **The Validation Registry isn't deployed on any chain yet.** The subgraph
  records `validationRegistry` as the zero address everywhere, testnets
  included, so the four validation components render their empty state
  everywhere. The queries succeed — there's simply nothing to return.
- **Monad and Monad Testnet subgraphs are currently unreachable** (indexer
  errors), and Ethereum Sepolia was removed entirely: its subgraph has been
  halted since 2026-03-19 and never migrated to the current schema.

Run `check_chain_support` from the MCP server for a live answer rather than
trusting this list.

## Repo layout

```
src/
  components/{identity,reputation,validation,activity}/   the library
  provider/                ERC8004Provider, AgentProvider
  lib/                     subgraph client, registry parsing, shared utils
  components/docs/registry.tsx    canonical component docs — SOURCE OF TRUTH
  routes/                  the docs site (TanStack Router)
  content/site-pages.ts    /about, /contact, /privacy content (HTML + markdown)
  server/negotiation.ts    markdown content negotiation and 404 resolution
  generated/               route manifest (committed; the app imports it)
api/                       Vercel functions: the JSON docs API and MCP endpoint
  _lib/                    shared HTTP helpers, registry lookups, MCP protocol
middleware.ts              edge middleware: Accept negotiation, agent-friendly 404s
scripts/
  generate-llms.ts         registry -> llms.txt, markdown, OpenAPI, sitemap, robots
  guides-registry.ts       canonical guide content
  lib/                     openapi, agents.md, sitemap and YAML builders
  generate-og-image.mjs    regenerates public/og.png (not part of the build)
packages/mcp-server/       the stdio MCP server
tests/                     vitest: routing, API, MCP protocol, published files
```

`src/components/docs/registry.tsx` and `scripts/guides-registry.ts` are the
single source of truth. The docs site, `llms.txt`, the per-component Markdown,
and the MCP server all derive from them, so adding a component in one place
propagates everywhere. Regenerate with `pnpm gen:registry` — it runs
automatically as a `prebuild` hook.

Note this guarantees every consumer says the *same* thing, not that the thing is
*true*. Two agents in [`.claude/agents/`](.claude/agents) exist to check that:
`subgraph-drift-auditor` verifies the docs against the live subgraphs, and
`docs-parity-checker` verifies them against the code.

## Development

```bash
pnpm install
pnpm dev              # docs site at localhost:5173
pnpm build            # regenerates docs, then builds the site
pnpm build:mcp        # regenerates the snapshot, then builds the MCP server
pnpm test             # vitest — routing, API, MCP protocol, published files
pnpm lint
```

The MCP server needs a build before the checked-in `.mcp.json` can start it, and
`GRAPH_API_KEY` in the environment for its two live tools.

## License

Not yet chosen. A license must be added before publishing.

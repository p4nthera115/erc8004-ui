# ERC-8004 Agent Identity Component Library

## Project Summary

A React component library for rendering AI agent identity, reputation, and activity data from the ERC-8004 standard. Components are self-contained, trustless, and visually distinctive — each one takes an agent's on-chain identifier and fetches verified blockchain data internally. No shared agent state, no fake props.

The library is distributed as an **npm package** (`@erc8004/ui`). Developers install it, wrap their app in a lightweight provider, and drop components in. The target audience is backend-heavy blockchain developers and AI coding agents — the developer experience is optimised for "install, import, done" with zero frontend expertise required.

The flagship visual element — a deterministic SVG fingerprint generated via dithering algorithms — is the piece no one else can replicate.

**Author:** @p4nthera
**Live Fingerprint MVP:** https://fingerprint-erc8004.vercel.app/
**Portfolio:** https://p4n.me

---

## Why This Exists

ERC-8004 ("Trustless Agents") is Ethereum's on-chain agent identity standard, co-authored by MetaMask, Ethereum Foundation, Google, and Coinbase. It's deployed on 13+ chains (Ethereum, Polygon, Base, Arbitrum, BNB Chain, Monad, Scroll, Mantle, Taiko, Gnosis, Avalanche, Celo, MegaETH) with 22,000+ registered agents.

The ecosystem has explorers (8004scan, Agentscan, RNWY Explorer, trust8004), SDKs (Agent0), and infrastructure tooling. What it doesn't have is a visual/component layer. Every project building dashboards, marketplaces, or explorers is rendering agent data as ugly table rows from scratch. There is no shared design system, no reusable component library, no visual identity language.

The ERC-8004 ecosystem is also predominantly backend developers who rely on AI coding agents (Claude Code, Cursor, etc.) to build their frontends. This library is designed with **AI-agent compatibility as a first-class goal** — served via an MCP server and an `llms.txt` file — alongside the standard developer experience.

This library aims to become the visual layer of the standard.

---

## Why npm Package (Not shadcn-Style Copy-Paste)

The original plan was shadcn-style distribution: developers copy component source files into their own projects. This was revisited because the component dependency tree grew too deep. Each component depends on shared data hooks, a provider, a Subgraph client, chain resolvers, parsers, and shared types. A developer copying just one component would need to track and copy 5-7 dependency files manually — and keep them in sync with updates.

More importantly, the target audience is backend blockchain developers who build frontends entirely with AI coding agents. For them, `npm install @erc8004/ui` followed by a single provider wrapper and component import is the fastest possible path. Every AI coding agent already knows this pattern. A custom CLI or manual file-copying workflow adds friction that this audience won't tolerate.

The source code remains fully readable and well-documented on GitHub. Hooks and utilities are exported as public API so developers can build custom UIs on top of the data layer. The npm package is not a black box — it's a convenience layer over open, inspectable code.

---

## How ERC-8004 Works (Simplified)

ERC-8004 is a set of three smart contracts (registries) deployed as singletons on each supported chain:

### Identity Registry

An ERC-721 NFT contract. Each registered agent gets a token with a `tokenURI` pointing to a registration file (JSON stored on IPFS, HTTPS, or as a base64 data URI on-chain).

### Reputation Registry

Stores feedback from clients who've used an agent. Each feedback entry has:

- `value` (int128) + `valueDecimals` (uint8, 0-18) — a signed decimal score (can be negative or positive, no fixed scale)
- `tag1`, `tag2` — freeform labels (e.g., "data_analyst", "finance", "code_generation")
- `clientAddress` — wallet address of the feedback giver
- `isRevoked` — whether the feedback has been retracted
- `feedbackFile` (optional, stored on IPFS) — rich off-chain data including text reviews, MCP tool references, A2A skill references, OASF domains, and proof-of-payment data
- `responses` — the agent can reply to feedback (like a business replying to reviews)

### Validation Registry

Hooks for independent verifiers (zkML, TEE oracles). Not yet deployed to mainnet.

### Agent Identity Model

Each agent is globally unique via:

- `agentRegistry`: `{namespace}:{chainId}:{identityRegistryAddress}` (e.g., `eip155:1:0x742...`)
- `agentId`: the ERC-721 token ID

---

## Data Access

### Primary: The Graph (Subgraph) — Direct GraphQL Queries

All data fetching goes through The Graph's Subgraph — a pre-indexed GraphQL database that watches the blockchain, extracts ERC-8004 events, and serves them via fast queries. The Subgraph is deployed per-chain.

**Supported Subgraph endpoints:**

- Ethereum Mainnet (Chain ID `1`): `https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k`
- Base Mainnet (Chain ID `8453`): `https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb`
- Ethereum Sepolia (Chain ID `11155111`): `https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT`
- Base Sepolia (Chain ID `84532`): `https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/4yYAvQLFjBhBtdRCY7eUWo181VNoTSLLFd5M7FXQAi6u`
- Polygon Mainnet (Chain ID `137`): `https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF`

The Graph API keys are **read-only query keys** — they exist for usage tracking and rate limiting, not access control. They are safe to use in frontend code. Developers provide their own API key via the `ERC8004Provider`.

### Reference: Agent0 SDK Documentation

The Agent0 TypeScript SDK (`agent0-ts`) is NOT used as a runtime dependency. It's a full agent management toolkit (registration, feedback submission, payments) that requires wallet configuration — too heavy for read-only display components.

However, the Agent0 SDK documentation (https://docs.sdk.ag0.xyz/) is the authoritative reference for understanding the data model, field semantics, subgraph data structures, and example queries. The SDK itself uses the Subgraph under the hood for all read operations — querying the Subgraph directly is equivalent but without the SDK overhead.

---

## Architecture

### Self-Contained Components

Every component fetches its own data. No global agent state. A developer drops a component in, passes `agentRegistry` + `agentId`, and it works.

### Trustless Data

Components NEVER accept display data as props. The only inputs from the developer are identifiers (`agentRegistry` + `agentId`). All rendered data comes from on-chain sources via the Subgraph.

### ERC8004Provider

A lightweight provider that holds infrastructure configuration — specifically the developer's Graph API key and optionally custom Subgraph URL overrides. This is NOT a data provider — it holds no agent state or chain config. It exists to avoid passing `apiKey` as a prop to every component.

```tsx
// The complete developer setup:
import { ERC8004Provider } from "@erc8004/ui"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey="your-graph-api-key">
        <ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />
      </ERC8004Provider>
    </QueryClientProvider>
  )
}
```

### Caching with TanStack Query

All data hooks use `@tanstack/react-query` internally. This provides:

- **Deduplication** — multiple components requesting the same agent on one page share a single fetch
- **Caching** — data is cached in memory (5 min stale, 30 min gc by default) so navigating away and back doesn't refetch
- **Background refetch** — stale data is served instantly while fresh data loads silently

`@tanstack/react-query` and `react` are peer dependencies — not bundled.

---

## Components

### Shared Props

```typescript
type SharedProps = {
  agentRegistry: string // "eip155:{chainId}:{contractAddress}"
  agentId: number // ERC-721 token ID
}
```

### Identity Components

1. **FingerprintBadge** — deterministic SVG visual identity unique to each agent's on-chain identifier ✓
2. **AgentCard** — fingerprint + name, description, services, reputation summary

### Reputation Components

Reputation was broken into focused sub-components so developers can use exactly what they need — a compact badge for a marketplace listing, a full review panel for a profile page, or anything in between. All reputation components share the `useReputation` hook internally, and TanStack Query deduplicates fetches when multiple reputation components appear on the same page for the same agent.

3. **ReputationScore** — compact badge showing the aggregate average score + total review count. Designed for marketplace cards, search results, compact listings. Smallest footprint.
4. **ReputationChart** — visual score distribution (histogram of rating ranges) or chronological timeline of scores over time. For developers who want to show rating trends.
5. **FeedbackList** — scrollable list of individual feedback entries, each showing value, tags (as pills), reviewer address (truncated), timestamp, review text (if available from feedbackFile), and agent responses. Like a reviews section on Amazon.
6. **ReputationDisplay** — composed convenience component that combines ReputationScore + ReputationChart + FeedbackList into a single well-laid-out view. For developers who want a complete reputation section without assembling pieces.

### Infrastructure Components

7. **EndpointStatus** — services list with live health checks
8. **ActivityLog** — chronological on-chain events feed (most complex, build last)

---

## Shared Data Hooks (Public API)

All hooks use `useQuery` from `@tanstack/react-query`. Query keys follow the pattern `[resource, agentRegistry, agentId]`. These are exported as public API so developers can build custom UIs on top of the data layer. Each hook lives in its component category directory (e.g., `useReputation` lives alongside the reputation components), not in a global hooks folder — they're tightly coupled to their consumers.

- `useAgent(agentRegistry, agentId)` — fetches identity + registration file
- `useReputation(agentRegistry, agentId)` — fetches aggregate stats (averageValue, totalFeedback) + individual feedback entries from a single GraphQL query
- `useActivity(agentRegistry, agentId, limit?)` — fetches activity events
- `useEndpointStatus(agentRegistry, agentId)` — fetches endpoints + health checks

Hook return types are TanStack Query's native shape: `{ data, isLoading, error, isFetching, ... }`.

---

## Shared Utilities

Global utilities in `lib/` (used across all categories):

- **`parseAgentRegistry(registry)`** — extracts namespace, chainId, and contract address from `eip155:{chainId}:{address}` format
- **`getSubgraphUrl(chainId, apiKey)`** — maps chainId to the correct Graph endpoint, injecting the API key from the provider
- **`subgraphFetch(url, query, variables)`** — thin wrapper for Subgraph queries (fetch with correct headers)
- **`truncateAddress(address)`** — `0x742d35cc...beb7` → `0x742d...beb7`
- **`formatRelativeTime(timestamp)`** — Unix timestamps → "3 days ago"

Category-specific utilities live in their component directories (e.g., `components/reputation/utils.ts` for tag frequency calculation and score formatting).

---

## AI-Agent Distribution

The primary consumers of this library are AI coding agents. Two distribution layers serve them:

### MCP Server

stdio-based MCP server that AI tools (Claude Code, Cursor, etc.) connect to. Serves component documentation, usage examples, types, and setup guides.

Tools: `list_components`, `get_component`, `get_setup_guide`, `get_types`, `get_hooks`

### llms.txt

Structured text file at the docs site root (`/llms.txt`) for broad LLM discoverability. Contains package name, install instructions, provider setup, component list with props, and usage examples.

---

## Key References

- ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- Agent0 SDK docs (data model reference): https://docs.sdk.ag0.xyz/
- Agent0 Subgraph data structures: https://docs.sdk.ag0.xyz/4-subgraph/4-2-data-structures/
- Agent0 Subgraph example queries: https://docs.sdk.ag0.xyz/4-subgraph/4-3-example-queries/
- Agent0 Feedback documentation: https://docs.sdk.ag0.xyz/2-usage/2-6-use-feedback/
- Agent0 TypeScript SDK (reference only): https://github.com/agent0lab/agent0-ts
- Agent0 Subgraph repo: https://github.com/agent0lab/subgraph
- Existing fingerprint MVP: https://fingerprint-erc8004.vercel.app/

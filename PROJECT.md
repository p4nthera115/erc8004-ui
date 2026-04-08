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

The source code remains fully readable and well-documented on GitHub. The npm package is not a black box — it's a convenience layer over open, inspectable code. If developers need raw data access for custom UIs in the future, hooks can be extracted from components at that point.

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

It also **auto-detects TanStack Query**: if no `QueryClientProvider` exists above it in the React tree, it creates its own internal `QueryClient` with sensible defaults for blockchain data (5 min stale time, 30 min gc, 2 retries, no refetch on window focus). If a `QueryClientProvider` already exists, it uses that one — preserving the shared cache and deduplication.

This means most developers only need one line of setup:

```tsx
// Minimal setup — no TanStack Query knowledge required:
import { ERC8004Provider } from "@erc8004/ui"

function App() {
  return (
    <ERC8004Provider apiKey="your-graph-api-key">
      <ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />
    </ERC8004Provider>
  )
}
```

If the app already uses TanStack Query, `ERC8004Provider` integrates seamlessly — it detects the existing client and shares its cache:

```tsx
// With an existing TanStack Query setup — works seamlessly:
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

### AgentProvider (Optional Convenience Wrapper)

When building a page about a single agent (like a profile page), you'd end up passing the same `agentRegistry` and `agentId` to every component. `AgentProvider` eliminates that repetition by setting default identity values for all components nested inside it.

**This is entirely optional.** Every component still accepts `agentRegistry` and `agentId` as direct props and works without any `AgentProvider`. The provider is purely a convenience for the common "one agent, many components" pattern.

**Resolution order:** explicit props → AgentProvider context → error. Props always win, so you can still override individual components inside a provider.

```tsx
// Profile page — one agent, many components, no repetition:
<ERC8004Provider apiKey="your-graph-api-key">
  <AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
    <AgentName />
    <AgentImage />
    <ReputationScore />
    <FeedbackList />
  </AgentProvider>
</ERC8004Provider>

// Override one component inside the provider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentName />                                                    {/* agent 374 */}
  <AgentName agentRegistry="eip155:1:0x999..." agentId={12} />    {/* different agent */}
</AgentProvider>

// Marketplace grid — no provider needed, direct props:
{agents.map(a => (
  <AgentCard key={a.id} agentRegistry={a.registry} agentId={a.id} />
))}
```

**Important:** `AgentProvider` is a _separate_ provider from `ERC8004Provider`. They have different jobs — `ERC8004Provider` holds app-wide infrastructure config (API key), while `AgentProvider` scopes agent identity to a section of the component tree. Don't merge them.

Internally, every component calls `useAgentIdentity()` (an internal hook, not exported) to resolve its identity. This hook checks props first, then context, then throws a clear error explaining what's missing.

### Caching with TanStack Query

All components use `@tanstack/react-query` internally for data fetching. This provides:

- **Caching** — data is cached in memory (5 min stale, 30 min gc by default) so navigating away and back doesn't refetch
- **Background refetch** — stale data is served instantly while fresh data loads silently

`@tanstack/react-query` and `react` are peer dependencies — not bundled.

### Data Fetching: Component-Internal

Each component owns its data fetching entirely. There are no shared hooks — every component defines its own GraphQL query, return type, validation schema, and `useQuery` call internally. This avoids overfetching (e.g., ReputationScore only queries 2 aggregate fields, not the 20+ fields FeedbackList needs) and keeps each component fully independent with no unnecessary coupling between them.

Components use the shared infrastructure from `lib/` (subgraph client, registry parser, provider config) but their specific queries are private to each component. Hooks are NOT exported as public API — the library's public surface is components and types only.

---

## Components

Components are organised around ERC-8004's three registries (Identity, Reputation, Validation) plus a standalone cross-registry component. Each category contains **atomic components** (the smallest meaningful pieces a developer could use alone) and **composed components** (pre-built combinations for convenience). Atomic components each fetch only the data they need — no overfetching. Composed components combine atomic pieces into complete views.

When multiple atomic components appear on the same page for the same agent, TanStack Query deduplicates the underlying Subgraph requests — only one network call happens, and all components read from the shared cache.

### Shared Props

```typescript
type SharedProps = {
  agentRegistry: string // "eip155:{chainId}:{contractAddress}"
  agentId: number // ERC-721 token ID
}
```

### Identity Components (Identity Registry)

These render data from the `Agent` and `AgentRegistrationFile` subgraph entities — who the agent is, what it looks like, what services it offers, and where those services live.

**Atomic:**

1. **FingerprintBadge** — deterministic SVG visual identity unique to each agent's on-chain identifier. Does not fetch any data — generates the visual purely from the `agentRegistry` + `agentId` identifiers. The "default avatar" for any agent. ✓ (first draft complete)
2. **AgentName** — the agent's registered name as a text element. Fetches only `registrationFile.name`. Falls back to the truncated agent ID if no name is registered, so it never renders empty. Use case: headings, breadcrumbs, notifications, search results, anywhere you need an agent's name with on-chain proof.
3. **AgentImage** — the agent's registered image (handles IPFS, HTTPS, and base64 data URIs). Fetches only `registrationFile.image`. Falls back to FingerprintBadge if no image is registered, so it always renders something visual. Use case: avatars in chat interfaces, list rows, sidebars.
4. **AgentDescription** — the agent's registered description text. Fetches only `registrationFile.description`. Use case: tooltips, preview blurbs, info panels.

**Composed:**

5. **AgentCard** — summary card combining FingerprintBadge/AgentImage + AgentName + AgentDescription + protocol icons (which services are active: MCP, A2A, OASF, web, email) + owner address (truncated). Fetches from both `Agent` and `AgentRegistrationFile` top-level fields. Think of it like a contact card or social media profile preview.
6. **EndpointStatus** — list of the agent's service endpoints (MCP, A2A, OASF, web, email) with protocol labels and optional live health check indicators (HTTP pings). Fetches the endpoint-related fields from `AgentRegistrationFile`. Endpoints are part of the agent's identity registration — they describe what services the agent provides and where to reach them.
7. **IdentityDisplay** — composed convenience component combining AgentCard + EndpointStatus into a complete identity profile view. For developers who want a full agent identity section without assembling pieces.

### Reputation Components (Reputation Registry)

These render data from the `AgentStats`, `Feedback`, `FeedbackFile`, and `FeedbackResponse` subgraph entities — what others think of the agent based on their experiences using it.

**Atomic:**

8. **ReputationScore** — compact badge showing the aggregate average score + total review count. Fetches only `agentStats` (2 fields). Designed for marketplace cards, search results, compact listings. Smallest footprint. ✓
9. **ReputationChart** — visual score distribution histogram. Fetches only feedback `value` + `createdAt`. For developers who want to show rating trends. ✓
10. **FeedbackList** — scrollable list of individual feedback entries, each showing value, tags (as pills), reviewer address (truncated), timestamp, review text (if available from feedbackFile), and agent responses. Fetches full feedback detail with pagination via Subgraph `first`/`skip`. Like a reviews section on Amazon. ✓
11. **TagCloud** — compact visualization of an agent's most frequently received feedback tags. Fetches all feedback entries but only the `tag1` and `tag2` fields, counts frequencies client-side, and renders the top tags as weighted pills. Answers "what does this agent specialise in, according to the people who've actually used it?" — a fundamentally different question from score (quality) or reviews (individual opinions). Use case: marketplace cards, search filters, agent comparison.

**Composed:**

12. **ReputationDisplay** — composed convenience component combining ReputationScore + ReputationChart + FeedbackList into a single well-laid-out view. For developers who want a complete reputation section without assembling pieces.

### Validation Components (Validation Registry)

These render data from the `Validation` subgraph entity and the validation-related fields on `AgentStats` — independent third-party verification of the agent by validators (auditors, testing services, oracle systems). Each validation has a score (0-100), a status (PENDING, COMPLETED, EXPIRED), and a tag describing what was assessed. The Validation Registry is the newest and least mature — not yet deployed to mainnet — but the subgraph schema already supports it.

**Atomic:**

13. **VerificationBadge** — compact visual verification indicator (like a checkmark icon) with embedded metadata reflecting the strength of verification. Queries only 3 fields from `AgentStats`: `totalValidations`, `completedValidations`, `averageValidationScore`. Visually communicates the degree of verification (unverified → partially verified → fully verified) rather than a binary yes/no. Use case: placed next to any agent name or avatar to signal trustworthiness at a glance.
14. **ValidationScore** — compact stats badge showing aggregate average validation score + completed validations count. Equivalent of ReputationScore but for validations. Fetches only the validation fields from `AgentStats`.
15. **ValidationList** — scrollable list of individual validation entries, each showing: validator address (truncated), score (0-100), tag (what was assessed), status (pending/completed/expired), and timestamp. Paginated via Subgraph `first`/`skip`. Equivalent of FeedbackList but for validations.

**Composed:**

16. **ValidationDisplay** — composed convenience component combining VerificationBadge + ValidationScore + ValidationList. For developers who want a complete validation section.

### Standalone Components (Cross-Registry)

17. **LastActivity** — renders a single relative timestamp like "Active 3 hours ago" or "Last seen 14 days ago". Fetches exactly one field from `AgentStats`: `lastActivity`. Cross-registry by nature — the timestamp reflects the most recent on-chain event of any kind (feedback received, validation completed, registration updated). Use case: any listing, card, or sidebar where you want to signal whether an agent is actively being used or has gone dormant. Like how GitHub shows "last commit 2 days ago" on a repository.
18. **ActivityLog** — chronological feed of all on-chain events for an agent across all three registries: registration, feedback, validations, updates. Fetches from the `Agent` entity and its relationships. The timeline view that ties everything together. Most complex component — build last.

---

## Shared Utilities

Global utilities in `lib/` (used by all components internally):

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

Tools: `list_components`, `get_component`, `get_setup_guide`, `get_types`

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

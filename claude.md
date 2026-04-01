# claude.md — ERC-8004 Agent Identity Component Library

## Project Overview

This is a React component library for rendering AI agent identity data from the ERC-8004 standard. Components are self-contained, trustless, and visually distinctive. Each component takes an agent's on-chain identifier (`agentRegistry` + `agentId`) and fetches verified blockchain data internally.

Distributed as an **npm package** (`@erc8004/ui`). Developers install, wrap their app in `ERC8004Provider` with a Graph API key, and import components. One install, clean imports, zero frontend expertise required.

**Primary consumers are AI coding agents** (Claude Code, Cursor, etc.) — the ERC-8004 ecosystem is predominantly backend developers who use AI for frontend work. The npm package pattern was chosen specifically because every AI coding agent already knows how to `npm install` and import React components.

Read `PROJECT.md` for the full context, architecture decisions, data model, and component specifications before starting any work.

---

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** for styling — no other CSS-in-JS, no external UI libraries
- **SVG-based Fingerprint Badge** — deterministic visual identity, pure SVG with dithering algorithms (not Three.js/R3F)
- **@tanstack/react-query v5** — data caching, deduplication, and stale-while-revalidate for all component data fetching
- **The Graph Subgraph** — primary data source, direct GraphQL queries to per-chain endpoints
- **Vite** for development; **tsup** (or Rollup) for package bundling
- **pnpm** for package management

### What Is NOT a Dependency

- **Agent0 TypeScript SDK** (`agent0-ts`) — NOT used at runtime. It's a full agent management toolkit requiring wallet config — too heavy for read-only display components. Its documentation is used as a reference for the data model. The SDK itself uses the Subgraph under the hood, so querying the Subgraph directly is equivalent without the overhead.

---

## Architecture Rules

### Self-Contained Components

Every component fetches its own data. No global agent state. A developer drops a component in, passes `agentRegistry` + `agentId`, and it works.

```tsx
// The complete developer experience:
import { ERC8004Provider, ReputationScore } from "@erc8004/ui"
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

### ERC8004Provider

Lightweight React context provider that holds infrastructure config only:

- `apiKey` (required) — The Graph API key for Subgraph queries (read-only, safe for frontend)
- `subgraphOverrides` (optional) — custom Subgraph URLs per chainId

This is NOT a data provider. It holds no agent data or chain state. It exists to avoid passing `apiKey` as a prop to every component. Components read the API key from this provider internally.

### Trustless Data

Components NEVER accept display data as props. The only inputs from the developer are identifiers. All rendered data comes from on-chain sources via the Subgraph.

### Data Fetching: Subgraph Direct

All data comes from The Graph's Subgraph via direct GraphQL fetch calls. No SDK dependency.

**Chain → Subgraph URL mapping** (API key injected from ERC8004Provider):

- Chain `1` (Ethereum): `FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k`
- Chain `8453` (Base): `43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb`
- Chain `11155111` (Sepolia): `6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT`
- Chain `84532` (Base Sepolia): `4yYAvQLFjBhBtdRCY7eUWo181VNoTSLLFd5M7FXQAi6u`
- Chain `137` (Polygon): `9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF`

URL format: `https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/{SUBGRAPH_ID}`

### Data Fetching: Component-Internal

Each component owns its data fetching. There are no shared hooks — every component defines its own GraphQL query, return type, and `useQuery` call internally. This avoids overfetching (e.g., ReputationScore only fetches 2 fields, not the 20+ fields FeedbackList needs) and keeps each component fully independent.

Components use the shared infrastructure from `lib/` (subgraph client, registry parser, provider config) but define their own queries. `useQuery` query keys follow the pattern `[component-name, agentRegistry, agentId]`.

Hooks are NOT exported as public API. The library's public surface is components and types only. If developers need raw data access in the future, hooks can be extracted from components at that point.

### Parsing agentRegistry

Format: `{namespace}:{chainId}:{identityRegistryAddress}`
Parse this to determine chain, contract address, and subgraph endpoint.

---

## Reputation Data Model

The Subgraph provides two key entities for reputation:

### AgentStats (aggregate)

```graphql
type AgentStats {
  totalFeedback: BigInt!
  averageValue: BigDecimal!
  totalValidations: BigInt!
  completedValidations: BigInt!
  averageValidationScore: BigDecimal!
  lastActivity: BigInt!
}
```

### Feedback (individual entries)

```graphql
type Feedback {
  id: ID! # "chainId:agentId:clientAddress:feedbackIndex"
  clientAddress: Bytes!
  value: BigDecimal! # signed decimal, no fixed scale
  tag1: String # freeform category label
  tag2: String # freeform category label
  isRevoked: Boolean!
  createdAt: BigInt!
  feedbackFile: FeedbackFile # optional off-chain data (IPFS)
  responses: [FeedbackResponse!]!
}

type FeedbackFile {
  text: String # written review
  mcpTool: String
  a2aSkills: [String!]!
  oasfSkills: [String!]!
  oasfDomains: [String!]!
}
```

Note: `value` has no universal scale — different agents may receive scores on different ranges. Tag frequency must be computed client-side by counting tag1/tag2 across the feedback list. The Subgraph does not pre-aggregate tags.

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

1. **FingerprintBadge** — deterministic SVG visual identity ✓ (first draft complete)
2. **AgentCard** — fingerprint + name, description, services, reputation summary

### Reputation Components

Reputation is broken into focused sub-components. All share `useReputation` internally; TanStack Query deduplicates fetches when multiple appear on the same page for the same agent.

3. **ReputationScore** — compact badge: average score + total review count. For marketplace cards, search results. Fetches only `agentStats`.
4. **ReputationChart** — score distribution histogram. Fetches feedback `value` + `createdAt` only.
5. **FeedbackList** — scrollable individual reviews: value, tag pills, truncated reviewer address, timestamp, review text (from feedbackFile), agent responses. Paginated via Subgraph `first`/`skip`. Fetches full feedback detail.
6. **ReputationDisplay** — composed convenience component combining Score + Chart + FeedbackList.

### Infrastructure Components

7. **EndpointStatus** — services list with live health checks
8. **ActivityLog** — chronological on-chain events feed

---

## Shared Utilities

Global utilities in `src/lib/` (used across all categories):

- **`parseAgentRegistry(registry)`** — extracts `{ namespace, chainId, contractAddress }` from `eip155:{chainId}:{address}`
- **`getSubgraphUrl(chainId, apiKey)`** — resolves chainId to full Subgraph endpoint URL
- **`subgraphFetch(url, query, variables)`** — thin GraphQL fetch wrapper
- **`truncateAddress(address)`** — `0x742d35cc...beb7` → `0x742d...beb7`
- **`formatRelativeTime(timestamp)`** — Unix timestamp → "3 days ago"

Category-specific utilities live in their component directories (e.g., `components/reputation/utils.ts` for tag frequency calculation, score formatting).

---

## Build Order

1. Project scaffolding — Vite + React + TypeScript + Tailwind setup ✓
2. Types and constants — `types.ts`, `constants.ts`, `parse-registry.ts` ✓
3. FingerprintBadge — SVG-based, stable ✓
4. ERC8004Provider — lightweight context for API key + Subgraph URL resolution
5. Subgraph client + shared utilities — GraphQL fetcher, chain resolver, address truncation, time formatting
6. ReputationScore — simplest component, validates the data layer ✓
7. ReputationChart — score distribution histogram
8. FeedbackList — individual reviews with tags, text, responses, pagination
9. ReputationDisplay — composed component combining 6 + 7 + 8
10. AgentCard — identity + registration data display
11. EndpointStatus — including health check logic
12. ActivityLog — most complex, build last
13. Package build setup — tsup/Rollup bundling, tree-shaking, peer deps, package.json exports
14. Demo app — showcase all components with real on-chain data
15. MCP server + llms.txt — AI-agent discovery and documentation
16. Docs site — component previews, install instructions, props docs

---

## Package Structure

Components are grouped by category. Each category directory contains its components and any category-specific utilities. Data fetching lives inside each component — there are no separate hook files. Truly shared utilities (Subgraph client, registry parser, address truncation) live in `/lib/` since every component needs them.

The public API stays flat — developers import `{ ReputationScore }` from `'@erc8004/ui'`, never from subdirectories. `index.ts` re-exports everything.

```
@erc8004/ui
├── src/
│   ├── provider/
│   │   └── ERC8004Provider.tsx
│   ├── components/
│   │   ├── fingerprint/
│   │   │   └── FingerprintBadge.tsx
│   │   ├── reputation/
│   │   │   ├── ReputationScore.tsx     # owns its own query (agentStats only)
│   │   │   ├── ReputationChart.tsx     # owns its own query (feedback value + createdAt)
│   │   │   ├── FeedbackList.tsx        # owns its own query (full feedback detail + pagination)
│   │   │   ├── ReputationDisplay.tsx   # composes Score + Chart + FeedbackList
│   │   │   └── utils.ts               # tag frequency calc, score formatting
│   │   ├── agent-card/
│   │   │   └── AgentCard.tsx
│   │   ├── endpoint/
│   │   │   └── EndpointStatus.tsx
│   │   └── activity/
│   │       └── ActivityLog.tsx
│   ├── lib/                            # globally shared utilities
│   │   ├── subgraph-client.ts
│   │   ├── parse-registry.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── types.ts                        # shared types across all categories
│   └── index.ts                        # flat public exports
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Package Exports

```typescript
// Components
export { FingerprintBadge } from "./components/fingerprint/FingerprintBadge"
export { ReputationScore } from "./components/reputation/ReputationScore"
export { ReputationChart } from "./components/reputation/ReputationChart"
export { FeedbackList } from "./components/reputation/FeedbackList"
export { ReputationDisplay } from "./components/reputation/ReputationDisplay"
export { AgentCard } from "./components/agent-card/AgentCard"
export { EndpointStatus } from "./components/endpoint/EndpointStatus"
export { ActivityLog } from "./components/activity/ActivityLog"

// Provider
export { ERC8004Provider } from "./provider/ERC8004Provider"

// Types
export type {
  SharedProps,
  AgentData,
  ReputationData,
  Feedback,
  FeedbackFile,
} from "./types"
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

## Edge Cases to Handle

Every component must handle:

- **Loading** — TanStack Query `isLoading` state, show skeleton/placeholder
- **Error** — Subgraph unreachable or query fails, show error state with retry
- **Empty** — agent exists but has no data for this component (e.g., zero feedback)
- **Not found** — agent doesn't exist, GraphQL returns null
- **Revoked feedback** — filtered out by default in queries (`isRevoked: false`)

---

## AI-Agent Distribution

### MCP Server

stdio-based MCP server that AI tools connect to. Serves component documentation, usage examples, types, and setup guides.

Tools: `list_components`, `get_component`, `get_setup_guide`, `get_types`

### llms.txt

Structured text file at the docs site root for LLM discoverability. Contains package name, install instructions, provider setup, component list with props, and usage examples.

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

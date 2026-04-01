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

## Data Models

### Reputation Data

The Subgraph provides two key entities for reputation:

#### AgentStats (aggregate)

```graphql
type AgentStats {
  totalFeedback: BigInt!
  averageFeedbackValue: BigDecimal!
  totalValidations: BigInt!
  completedValidations: BigInt!
  averageValidationScore: BigDecimal!
  lastActivity: BigInt!
}
```

#### Feedback (individual entries)

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

### Validation Data

The Subgraph stores independent third-party verification results. Aggregate stats are on `AgentStats` (see above). Individual entries use the `Validation` entity:

```graphql
type Validation {
  id: ID!
  validatorAddress: Bytes!
  requestUri: String
  requestHash: Bytes!
  response: Int # 0-100, null if pending
  responseUri: String
  responseHash: Bytes
  tag: String # what aspect was validated
  status: ValidationStatus! # PENDING | COMPLETED | EXPIRED
  createdAt: BigInt!
  updatedAt: BigInt!
}
```

Note: Validation scores are on a fixed 0-100 scale (unlike feedback values). There are typically far fewer validations than feedback entries — validations come from specialised verifiers, not everyday users. The Validation Registry is not yet deployed to mainnet but the subgraph schema supports it.

---

## Components

Components are organised around ERC-8004's three registries (Identity, Reputation, Validation) plus standalone cross-registry components. Each category contains **atomic** (smallest useful piece) and **composed** (pre-built combinations) components. TanStack Query deduplicates fetches when multiple components target the same agent.

### Shared Props

```typescript
type SharedProps = {
  agentRegistry: string // "eip155:{chainId}:{contractAddress}"
  agentId: number // ERC-721 token ID
}
```

### Identity Components (Identity Registry)

Data source: `Agent` + `AgentRegistrationFile` subgraph entities.

**Atomic:**

1. **FingerprintBadge** — deterministic SVG visual identity. No data fetch — generated from identifiers. ✓
2. **AgentName** — agent's registered name. Fetches `registrationFile.name` only. Falls back to truncated agent ID.
3. **AgentImage** — agent's registered image (IPFS/HTTPS/base64). Fetches `registrationFile.image` only. Falls back to FingerprintBadge.
4. **AgentDescription** — agent's description text. Fetches `registrationFile.description` only.

**Composed:**

5. **AgentCard** — FingerprintBadge/AgentImage + AgentName + AgentDescription + protocol icons + owner address. Fetches `Agent` + `AgentRegistrationFile` top-level fields.
6. **EndpointStatus** — service endpoints list (MCP, A2A, OASF, web, email) with protocol labels + optional live health checks. Fetches endpoint fields from `AgentRegistrationFile`.
7. **IdentityDisplay** — AgentCard + EndpointStatus combined.

### Reputation Components (Reputation Registry)

Data source: `AgentStats`, `Feedback`, `FeedbackFile`, `FeedbackResponse` subgraph entities.

**Atomic:**

8. **ReputationScore** — compact badge: average score + total review count. Fetches only `agentStats`. ✓
9. **ReputationChart** — score distribution histogram. Fetches feedback `value` + `createdAt` only. ✓
10. **FeedbackList** — scrollable individual reviews: value, tag pills, truncated reviewer address, timestamp, review text (from feedbackFile), agent responses. Paginated via Subgraph `first`/`skip`. ✓
11. **TagCloud** — weighted tag pills showing most frequent feedback tags. Fetches only `tag1` + `tag2` from all feedback, counts frequencies client-side. Answers "what does this agent specialise in?"

**Composed:**

12. **ReputationDisplay** — ReputationScore + ReputationChart + FeedbackList combined. ✓

### Validation Components (Validation Registry)

Data source: `Validation` entity + validation fields on `AgentStats`.

**Atomic:**

13. **VerificationBadge** — compact visual verification indicator (checkmark-style icon) with tier metadata. Fetches 3 fields from `AgentStats`: `totalValidations`, `completedValidations`, `averageValidationScore`. Place next to any agent name/avatar.
14. **ValidationScore** — aggregate average validation score + completed count badge. Fetches validation fields from `AgentStats`.
15. **ValidationList** — scrollable individual validation entries: validator address, score (0-100), tag, status, timestamp. Paginated via Subgraph `first`/`skip`.

**Composed:**

16. **ValidationDisplay** — VerificationBadge + ValidationScore + ValidationList combined.

### Standalone Components (Cross-Registry)

17. **LastActivity** — relative timestamp ("Active 3 hours ago"). Fetches 1 field from `AgentStats`: `lastActivity`. Cross-registry — reflects most recent event of any kind.
18. **ActivityLog** — chronological feed of all on-chain events across all registries. Most complex component — build last.

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
4. ERC8004Provider — lightweight context for API key + Subgraph URL resolution ✓
5. Subgraph client + shared utilities — GraphQL fetcher, chain resolver, address truncation, time formatting ✓
6. ReputationScore — simplest data component, validates the data layer ✓
7. ReputationChart — score distribution histogram ✓
8. FeedbackList — individual reviews with tags, text, responses, pagination ✓
9. ReputationDisplay — composed component combining 6 + 7 + 8 ✓
10. AgentName — atomic, fetches one field, validates identity data layer
11. AgentImage — atomic, IPFS/HTTPS/base64 handling + FingerprintBadge fallback
12. AgentDescription — atomic, fetches one field
13. TagCloud — tag frequency aggregation from feedback data
14. LastActivity — atomic, fetches one field from AgentStats
15. AgentCard — composed identity card from atomic pieces
16. EndpointStatus — endpoint listing + optional health check logic
17. IdentityDisplay — composed identity view
18. VerificationBadge — compact verification indicator with tier metadata
19. ValidationScore — aggregate validation stats badge
20. ValidationList — individual validation entries with pagination
21. ValidationDisplay — composed validation view
22. ActivityLog — cross-registry chronological event feed, most complex, build last
23. Package build setup — tsup/Rollup bundling, tree-shaking, peer deps, package.json exports
24. Demo app — showcase all components with real on-chain data
25. MCP server + llms.txt — AI-agent discovery and documentation
26. Docs site — component previews, install instructions, props docs

---

## Package Structure

Components are grouped by registry category. Each category directory contains its components and any category-specific utilities. Data fetching lives inside each component — there are no separate hook files. Truly shared utilities (Subgraph client, registry parser, address truncation) live in `/lib/` since every component needs them.

The public API stays flat — developers import `{ ReputationScore }` from `'@erc8004/ui'`, never from subdirectories. `index.ts` re-exports everything.

```
@erc8004/ui
├── src/
│   ├── provider/
│   │   └── ERC8004Provider.tsx
│   ├── components/
│   │   ├── identity/
│   │   │   ├── FingerprintBadge.tsx     # deterministic SVG, no data fetch
│   │   │   ├── AgentName.tsx            # fetches registrationFile.name only
│   │   │   ├── AgentImage.tsx           # fetches registrationFile.image, falls back to FingerprintBadge
│   │   │   ├── AgentDescription.tsx     # fetches registrationFile.description only
│   │   │   ├── AgentCard.tsx            # composes atomic identity pieces
│   │   │   ├── EndpointStatus.tsx       # endpoint listing + health checks
│   │   │   └── IdentityDisplay.tsx      # composes AgentCard + EndpointStatus
│   │   ├── reputation/
│   │   │   ├── ReputationScore.tsx      # owns its own query (agentStats only)
│   │   │   ├── ReputationChart.tsx      # owns its own query (feedback value + createdAt)
│   │   │   ├── FeedbackList.tsx         # owns its own query (full feedback detail + pagination)
│   │   │   ├── TagCloud.tsx             # owns its own query (tag1 + tag2 only)
│   │   │   ├── ReputationDisplay.tsx    # composes Score + Chart + FeedbackList
│   │   │   └── utils.ts                # tag frequency calc, score formatting
│   │   ├── validation/
│   │   │   ├── VerificationBadge.tsx    # compact verification indicator
│   │   │   ├── ValidationScore.tsx      # aggregate validation stats
│   │   │   ├── ValidationList.tsx       # individual validation entries + pagination
│   │   │   └── ValidationDisplay.tsx    # composes Badge + Score + List
│   │   └── activity/
│   │       ├── LastActivity.tsx         # single timestamp from AgentStats
│   │       └── ActivityLog.tsx          # cross-registry event feed
│   ├── lib/                             # globally shared utilities
│   │   ├── subgraph-client.ts
│   │   ├── parse-registry.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── types.ts                         # shared types across all categories
│   └── index.ts                         # flat public exports
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Package Exports

```typescript
// Identity Components
export { FingerprintBadge } from "./components/identity/FingerprintBadge"
export { AgentName } from "./components/identity/AgentName"
export { AgentImage } from "./components/identity/AgentImage"
export { AgentDescription } from "./components/identity/AgentDescription"
export { AgentCard } from "./components/identity/AgentCard"
export { EndpointStatus } from "./components/identity/EndpointStatus"
export { IdentityDisplay } from "./components/identity/IdentityDisplay"

// Reputation Components
export { ReputationScore } from "./components/reputation/ReputationScore"
export { ReputationChart } from "./components/reputation/ReputationChart"
export { FeedbackList } from "./components/reputation/FeedbackList"
export { TagCloud } from "./components/reputation/TagCloud"
export { ReputationDisplay } from "./components/reputation/ReputationDisplay"

// Validation Components
export { VerificationBadge } from "./components/validation/VerificationBadge"
export { ValidationScore } from "./components/validation/ValidationScore"
export { ValidationList } from "./components/validation/ValidationList"
export { ValidationDisplay } from "./components/validation/ValidationDisplay"

// Standalone Components
export { LastActivity } from "./components/activity/LastActivity"
export { ActivityLog } from "./components/activity/ActivityLog"

// Provider
export { ERC8004Provider } from "./provider/ERC8004Provider"

// Types
export type {
  SharedProps,
  AgentData,
  AgentRegistrationFile,
  ReputationData,
  AgentStats,
  Feedback,
  FeedbackFile,
  FeedbackResponse,
  Validation,
  EndpointDefinition,
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

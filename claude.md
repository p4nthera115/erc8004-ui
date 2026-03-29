# claude.md — ERC-8004 Agent Identity Component Library

## Project Overview

This is a React component library for rendering AI agent identity data from the ERC-8004 standard. Components are self-contained, trustless, and visually distinctive. Each component takes an agent's on-chain identifier (`agentRegistry` + `agentId`) and fetches verified blockchain data internally.

Distributed shadcn-style: developers copy components into their own projects. Not a black-box npm package.

Read `PROJECT.md` for the full context, architecture decisions, data model, and component specifications before starting any work.

---

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** for styling — no other CSS-in-JS, no external UI libraries
- **SVG-based Fingerprint Badge** — deterministic visual identity (no Three.js/R3F)
- **Agent0 TypeScript SDK** as the primary data-fetching layer for ERC-8004 on-chain data
- **The Graph subgraph** queries (GraphQL) as fallback/supplement for data the SDK doesn't cover
- **Vite** for development and building
- **pnpm workspaces** — monorepo with `packages/registry` and `packages/mcp-server`

### What NOT to use
- No shadcn/ui, Radix, Headless UI, or any component library
- No CSS-in-JS (styled-components, emotion, etc.)
- No state management libraries (React hooks only)
- No testing libraries in v1 (focus on building, not test scaffolding)

---

## Architecture Rules

### Self-Contained Components
Every component fetches its own data. There are NO providers, NO context wrappers, NO global state. A developer drops a component in, passes `agentRegistry` + `agentId`, and it works.

```tsx
// This is the entire developer experience:
<AgentCard agentRegistry="eip155:1:0x742..." agentId={22} />
```

### Trustless Data
Components NEVER accept display data as props. The only inputs from the developer are identifiers. All rendered data comes from on-chain sources.

### Shared Data Hooks
- `useAgent(agentRegistry, agentId)` — fetches identity + registration file
- `useReputation(agentRegistry, agentId, options?)` — fetches reputation data
- `useActivity(agentRegistry, agentId, options?)` — fetches activity events
- `useEndpointStatus(agentRegistry, agentId, options?)` — fetches endpoints + health checks

### Parsing agentRegistry
Format: `{namespace}:{chainId}:{identityRegistryAddress}`
Parse this to determine chain, contract address, and subgraph endpoint.

---

## Build Order

1. Project scaffolding — Vite + React + TypeScript + Tailwind + R3F setup
2. Types and constants — `types.ts`, `constants.ts`, `parse-registry.ts`
3. Data fetching layer — `lib/fetchers/`, hooks
4. Fingerprint Badge — port from existing MVP, improve distinctiveness
5. Agent Card — establishes the design system
6. Reputation Display — handle different tag types visually
7. Endpoint Status — including health check logic
8. Activity Log — most complex, build last
9. Demo app — showcase all components with real on-chain data
10. Docs site — component previews, copy-paste code, props docs

---

## Agent-Friendly Distribution

This library is designed for AI coding agents (Claude Code, Cursor, etc.) as the primary consumers. Three distribution layers:

### MCP Server (`packages/mcp-server/`)
stdio-based MCP server that AI tools connect to. Serves component source code, types, and setup guides.

Build: `pnpm build:mcp`
Tools: `list_components`, `get_component`, `get_setup_guide`, `get_types`, `get_hooks`

### Component Registry (`packages/registry/`)
Single source of truth for component metadata. Consumed by the MCP server.

Build: `pnpm build:registry`

### llms.txt (`public/llms.txt`)
Structured text file at the docs site root for LLM discoverability.

---

## Key References

- ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- Agent0 SDK docs: https://docs.sdk.ag0.xyz/
- Agent0 TypeScript SDK: https://github.com/agent0lab/agent0-ts
- Agent0 Subgraph: https://github.com/agent0lab/subgraph
- Existing fingerprint MVP: https://fingerprint-erc8004.vercel.app/

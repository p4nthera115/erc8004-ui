# ERC-8004 Agent Identity Component Library

## Project Summary

A React component library for rendering AI agent identity, reputation, and activity data from the ERC-8004 standard. Components are self-contained, trustless, and visually distinctive — each one takes an agent's on-chain identifier and fetches verified blockchain data internally. No shared agent state, no fake props.

The library is distributed shadcn-style: developers copy components into their own projects rather than installing a black-box npm package. Every component is readable, modifiable, styled with Tailwind, and built with TypeScript. The flagship visual element — a deterministic SVG fingerprint generated via dithering algorithms — is the piece no one else can replicate.

**Author:** @p4nthera
**Live Fingerprint MVP:** https://fingerprint-erc8004.vercel.app/
**Portfolio:** https://p4n.me

---

## Why This Exists

ERC-8004 ("Trustless Agents") is Ethereum's on-chain agent identity standard, co-authored by MetaMask, Ethereum Foundation, Google, and Coinbase. It's deployed on 13+ chains (Ethereum, Polygon, Base, Arbitrum, BNB Chain, Monad, Scroll, Mantle, Taiko, Gnosis, Avalanche, Celo, MegaETH) with 22,000+ registered agents.

The ecosystem has explorers (8004scan, Agentscan, RNWY Explorer, trust8004), SDKs (Agent0), and infrastructure tooling. What it doesn't have is a visual/component layer. Every project building dashboards, marketplaces, or explorers is rendering agent data as ugly table rows from scratch. There is no shared design system, no reusable component library, no visual identity language.

The ERC-8004 ecosystem is also predominantly backend developers who rely on AI coding agents (Claude Code, Cursor, etc.) to build their frontends. This library is designed with **AI-agent compatibility as a first-class goal** — served via an MCP server, a component registry, and an `llms.txt` file — alongside the standard developer experience.

This library aims to become the visual layer of the standard — the way shadcn became the component layer for modern React apps.

---

## How ERC-8004 Works (Simplified)

ERC-8004 is a set of three smart contracts (registries) deployed as singletons on each supported chain:

### Identity Registry

An ERC-721 NFT contract. Each registered agent gets a token with a `tokenURI` pointing to a registration file (JSON stored on IPFS, HTTPS, or as a base64 data URI on-chain).

### Reputation Registry

Stores feedback from clients who've used an agent. Each feedback entry has:

- `value` (int128) + `valueDecimals` (uint8, 0-18)
- `tag1`, `tag2` — freeform labels (e.g., "starred", "uptime", "reachable")

### Validation Registry

Hooks for independent verifiers (zkML, TEE oracles). Not yet deployed to mainnet.

### Agent Identity Model

Each agent is globally unique via:

- `agentRegistry`: `{namespace}:{chainId}:{identityRegistryAddress}` (e.g., `eip155:1:0x742...`)
- `agentId`: the ERC-721 token ID

---

## Data Access

1. **The Graph (Subgraph)** — Primary: pre-indexed GraphQL database across 8+ chains
2. **Agent0 SDK** — Secondary: TypeScript SDK by MetaMask/Consensys
3. **Direct Contract Calls** — Fallback via viem

---

## Architecture

- No domain-layer providers or wrappers — every component is fully self-contained
- Trustless by design — components fetch their own data, never accept display data as props
- shadcn-style distribution — copy components directly into your project

### Caching with TanStack Query

All data hooks (`useAgent`, `useReputation`, `useActivity`, `useEndpointStatus`) use `@tanstack/react-query` internally. This provides:

- **Deduplication** — multiple components requesting the same agent on one page share a single fetch
- **Caching** — data is cached in memory (5 min stale, 30 min gc by default) so navigating away and back doesn't refetch
- **Background refetch** — stale data is served instantly while fresh data loads silently

This requires a `QueryClientProvider` at the app root — pure caching infrastructure, holding no agent data or chain config.

---

## Components

### Shared Props

```typescript
type SharedProps = {
  agentRegistry: string // "eip155:{chainId}:{contractAddress}"
  agentId: number // ERC-721 token ID
}
```

1. **Fingerprint Badge** — deterministic SVG visual identity unique to each agent's on-chain identifier
2. **Agent Card** — fingerprint + name, description, services, reputation summary
3. **Reputation Display** — aggregate score + individual reviews with tag-aware rendering
4. **Endpoint Status** — services list with live health checks
5. **Activity Log** — chronological on-chain events feed

---

## Key References

- ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- Agent0 SDK docs: https://docs.sdk.ag0.xyz/
- Agent0 TypeScript SDK: https://github.com/agent0lab/agent0-ts
- Existing fingerprint MVP: https://fingerprint-erc8004.vercel.app/

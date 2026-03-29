import type { SharedFileDefinition } from "./types.js";

export const sharedFiles: SharedFileDefinition[] = [
  // ── Types & constants ──────────────────────────────────────────────────────
  {
    slug: "types",
    name: "Core Types",
    description:
      "TypeScript interfaces for ERC-8004 data: SharedProps, RegistrationFile, FeedbackEntry, ReputationSummary, ActivityEvent, VisualConfig.",
    category: "types",
    files: [{ source: "src/lib/types.ts", target: "lib/erc8004/types.ts" }],
    dependencies: {},
  },
  {
    slug: "constants",
    name: "Constants",
    description: "ERC-8004 constants: interface ID, score ranges.",
    category: "types",
    files: [{ source: "src/lib/constants.ts", target: "lib/erc8004/constants.ts" }],
    dependencies: {},
  },

  // ── Utilities ──────────────────────────────────────────────────────────────
  {
    slug: "utils",
    name: "Utilities",
    description: "Helper functions: shortenAddress, formatTimestamp.",
    category: "utils",
    files: [{ source: "src/lib/utils.ts", target: "lib/erc8004/utils.ts" }],
    dependencies: {},
  },
  {
    slug: "visual-config",
    name: "Visual Config",
    description:
      "Derives a deterministic VisualConfig from agentRegistry + agentId using FNV-1a hashing. Required by FingerprintBadge.",
    category: "utils",
    files: [{ source: "src/lib/visual-config.ts", target: "lib/erc8004/visual-config.ts" }],
    dependencies: {},
  },
  {
    slug: "parse-registry",
    name: "Parse Registry",
    description:
      "Parses an agentRegistry CAIP-10 string into namespace, chainId, and contract address.",
    category: "utils",
    files: [{ source: "src/lib/parse-registry.ts", target: "lib/erc8004/parse-registry.ts" }],
    dependencies: {},
  },

  // ── Fetchers ───────────────────────────────────────────────────────────────
  {
    slug: "fetcher-identity",
    name: "Identity Fetcher",
    description:
      "Fetches on-chain identity data and resolves the agent's registration file (IPFS, HTTPS, or data URI).",
    category: "fetchers",
    files: [
      { source: "src/lib/fetchers/identity.ts", target: "lib/erc8004/fetchers/identity.ts" },
      { source: "src/lib/fetchers/registration-file.ts", target: "lib/erc8004/fetchers/registration-file.ts" },
    ],
    dependencies: {},
  },
  {
    slug: "fetcher-reputation",
    name: "Reputation Fetcher",
    description: "Fetches aggregated reputation data for an agent from the Reputation Registry.",
    category: "fetchers",
    files: [{ source: "src/lib/fetchers/reputation.ts", target: "lib/erc8004/fetchers/reputation.ts" }],
    dependencies: {},
  },
  {
    slug: "fetcher-activity",
    name: "Activity Fetcher",
    description: "Fetches recent on-chain activity events for an agent.",
    category: "fetchers",
    files: [{ source: "src/lib/fetchers/activity.ts", target: "lib/erc8004/fetchers/activity.ts" }],
    dependencies: {},
  },
  {
    slug: "fetcher-subgraph",
    name: "Subgraph Client",
    description: "GraphQL query helpers for The Graph subgraph — primary data source for ERC-8004.",
    category: "fetchers",
    files: [{ source: "src/lib/fetchers/subgraph.ts", target: "lib/erc8004/fetchers/subgraph.ts" }],
    dependencies: {},
  },

  // ── Hooks ──────────────────────────────────────────────────────────────────
  {
    slug: "use-agent",
    name: "useAgent",
    description:
      "Fetches agent identity and registration file. Returns TanStack Query result: { data: RegistrationFile, isLoading, error }.",
    category: "hooks",
    files: [{ source: "src/hooks/useAgent.ts", target: "hooks/erc8004/useAgent.ts" }],
    dependencies: { "@tanstack/react-query": "^5.0.0" },
  },
  {
    slug: "use-reputation",
    name: "useReputation",
    description:
      "Fetches aggregated reputation data. Returns TanStack Query result: { data: ReputationSummary, isLoading, error }.",
    category: "hooks",
    files: [{ source: "src/hooks/useReputation.ts", target: "hooks/erc8004/useReputation.ts" }],
    dependencies: { "@tanstack/react-query": "^5.0.0" },
  },
  {
    slug: "use-activity",
    name: "useActivity",
    description:
      "Fetches on-chain activity events. Accepts optional limit. Returns TanStack Query result: { data: ActivityEvent[], isLoading, error }.",
    category: "hooks",
    files: [{ source: "src/hooks/useActivity.ts", target: "hooks/erc8004/useActivity.ts" }],
    dependencies: { "@tanstack/react-query": "^5.0.0" },
  },
  {
    slug: "use-endpoint-status",
    name: "useEndpointStatus",
    description:
      "Fetches registered endpoints. Shorter stale time (30s) for near-live health status. Returns TanStack Query result: { data: RegistrationFile, isLoading, error }.",
    category: "hooks",
    files: [{ source: "src/hooks/useEndpointStatus.ts", target: "hooks/erc8004/useEndpointStatus.ts" }],
    dependencies: { "@tanstack/react-query": "^5.0.0" },
  },
];

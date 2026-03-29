import type { ComponentDefinition } from "./types.js";

export const components: ComponentDefinition[] = [
  {
    name: "FingerprintBadge",
    slug: "fingerprint-badge",
    description:
      "Deterministic visual identity badge for an ERC-8004 agent. Generates a unique SVG fingerprint pattern from the agent's on-chain identifier. Each agent gets a visually distinct, unreplicable identity.",
    category: "identity",
    status: "stable",
    files: [
      {
        source: "src/components/FingerprintBadge.tsx",
        target: "components/erc8004/FingerprintBadge.tsx",
      },
    ],
    dependencies: {},
    internalDeps: [],
    usage: `import { FingerprintBadge } from "./components/erc8004/FingerprintBadge";

<FingerprintBadge
  agentRegistry="eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68"
  agentId={22}
  size={200}
/>`,
  },
  {
    name: "AgentCard",
    slug: "agent-card",
    description:
      "Complete agent identity card showing fingerprint badge, name, description, services, and reputation summary. Fetches all data from on-chain sources.",
    category: "identity",
    status: "planned",
    files: [
      {
        source: "src/components/agent-card/AgentCard.tsx",
        target: "components/erc8004/AgentCard.tsx",
      },
    ],
    dependencies: {},
    internalDeps: ["fingerprint-badge", "types", "utils"],
    usage: `import { AgentCard } from "./components/erc8004/AgentCard";

<AgentCard
  agentRegistry="eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68"
  agentId={22}
/>`,
  },
  {
    name: "ReputationDisplay",
    slug: "reputation-display",
    description:
      "Displays aggregate reputation score and individual feedback entries for an ERC-8004 agent. Handles different tag types visually.",
    category: "reputation",
    status: "planned",
    files: [
      {
        source: "src/components/reputation-display/ReputationDisplay.tsx",
        target: "components/erc8004/ReputationDisplay.tsx",
      },
    ],
    dependencies: {},
    internalDeps: ["types", "utils"],
    usage: `import { ReputationDisplay } from "./components/erc8004/ReputationDisplay";

<ReputationDisplay
  agentRegistry="eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68"
  agentId={22}
/>`,
  },
  {
    name: "EndpointStatus",
    slug: "endpoint-status",
    description:
      "Shows an agent's registered service endpoints with live health check status indicators.",
    category: "status",
    status: "planned",
    files: [
      {
        source: "src/components/endpoint-status/EndpointStatus.tsx",
        target: "components/erc8004/EndpointStatus.tsx",
      },
    ],
    dependencies: {},
    internalDeps: ["types", "utils"],
    usage: `import { EndpointStatus } from "./components/erc8004/EndpointStatus";

<EndpointStatus
  agentRegistry="eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68"
  agentId={22}
/>`,
  },
  {
    name: "ActivityLog",
    slug: "activity-log",
    description:
      "Chronological feed of on-chain events for an ERC-8004 agent: registration, updates, feedback, endpoint calls, deregistration.",
    category: "activity",
    status: "planned",
    files: [
      {
        source: "src/components/activity-log/ActivityLog.tsx",
        target: "components/erc8004/ActivityLog.tsx",
      },
    ],
    dependencies: {},
    internalDeps: ["types", "utils"],
    usage: `import { ActivityLog } from "./components/erc8004/ActivityLog";

<ActivityLog
  agentRegistry="eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68"
  agentId={22}
  limit={20}
/>`,
  },
];

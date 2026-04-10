import type React from "react"
import { AgentProvider } from "@/provider/AgentProvider"
import { AgentName } from "@/components/identity/agent-name"
import { AgentImage } from "@/components/identity/agent-image"
import { AgentDescription } from "@/components/identity/agent-description"
import { AgentCard } from "@/components/identity/agent-card"
import { EndpointStatus } from "@/components/identity/endpoint-status"
import { ReputationScore } from "@/components/reputation/reputation-score"
import { ReputationDistribution } from "@/components/reputation/reputation-distribution"
import { ReputationTimeline } from "@/components/reputation/reputation-timeline"
import { FeedbackList } from "@/components/reputation/feedback-list"
import { TagCloud } from "@/components/reputation/tag-cloud"
import { VerificationBadge } from "@/components/validation/verification-badge"
import { ValidationScore } from "@/components/validation/validation-score"
import { ValidationList } from "@/components/validation/validation-list"
import { ValidationDisplay } from "@/components/validation/validation-display"
import { LastActivity } from "@/components/cross-registry/last-activity"
import { ActivityLog } from "@/components/activity/activity-log"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PropDef = {
  name: string
  type: string
  required: boolean
  default?: string
  description: string
}

export type ComponentDoc = {
  slug: string
  name: string
  description: string
  preview: React.ReactNode
  importLine: string
  usage: string
  props: PropDef[]
}

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const DEMO_REGISTRY = "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
const DEMO_AGENT_ID = 2290

/** Props shared by every display component via AgentIdentityProps. */
const AGENT_IDENTITY_PROPS: PropDef[] = [
  {
    name: "agentRegistry",
    type: "string",
    required: false,
    description:
      'Agent registry in the format "eip155:{chainId}:{contractAddress}". Required unless inside an <AgentProvider>.',
  },
  {
    name: "agentId",
    type: "number",
    required: false,
    description:
      "ERC-721 token ID of the agent. Required unless inside an <AgentProvider>.",
  },
  {
    name: "className",
    type: "string",
    required: false,
    description:
      "Optional CSS classes merged onto the component root for layout, spacing, or custom styling (e.g. Tailwind).",
  },
]

function withAgent(children: React.ReactNode): React.ReactNode {
  return (
    <AgentProvider agentRegistry={DEMO_REGISTRY} agentId={DEMO_AGENT_ID}>
      {children}
    </AgentProvider>
  )
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const DOCS: ComponentDoc[] = [
  // --- Providers ---
  {
    slug: "erc8004-provider",
    name: "ERC8004Provider",
    description:
      "Root context provider that holds infrastructure config — your Graph API key and optional subgraph URL overrides. Wrap your app once at the top level. Automatically creates an internal QueryClient if TanStack Query is not already set up in your app.",
    preview: null,
    importLine: `import { ERC8004Provider } from "@erc8004/ui"`,
    usage: `import { ERC8004Provider } from "@erc8004/ui"

// Minimal setup — no TanStack Query knowledge required:
function App() {
  return (
    <ERC8004Provider apiKey="your-graph-api-key">
      {/* your app */}
    </ERC8004Provider>
  )
}

// If you already use TanStack Query, ERC8004Provider detects it
// and shares the existing cache — no duplicate clients:
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey="your-graph-api-key">
        {/* your app */}
      </ERC8004Provider>
    </QueryClientProvider>
  )
}`,
    props: [
      {
        name: "apiKey",
        type: "string",
        required: true,
        description:
          "Your Graph API key. Used to authenticate Subgraph requests. Safe to use in frontend code — read-only.",
      },
      {
        name: "subgraphOverrides",
        type: "Record<number, string>",
        required: false,
        description:
          "Optional map of chainId → custom Subgraph URL. Overrides the default endpoint for that chain.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description:
          "Optional CSS classes merged onto the `.erc8004` wrapper. Use for scoping dark mode (`dark`) or custom layout.",
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Your application tree.",
      },
    ],
  },
  {
    slug: "agent-provider",
    name: "AgentProvider",
    description:
      "Optional convenience wrapper that sets a default agentRegistry and agentId for all child components. Eliminates prop repetition on profile pages. Components inside can still override with their own props.",
    preview: null,
    importLine: `import { AgentProvider } from "@erc8004/ui"`,
    usage: `import { AgentProvider, AgentName, ReputationScore, FeedbackList } from "@erc8004/ui"

// Profile page — one agent, many components, no repetition:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentName />
  <ReputationScore />
  <FeedbackList />
</AgentProvider>

// Override one component inside the provider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentName />
  <AgentName agentRegistry="eip155:1:0x999..." agentId={12} />
</AgentProvider>`,
    props: [
      {
        name: "agentRegistry",
        type: "string",
        required: true,
        description:
          'Agent registry identifier in the format "eip155:{chainId}:{contractAddress}".',
      },
      {
        name: "agentId",
        type: "number",
        required: true,
        description: "ERC-721 token ID of the agent.",
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Components that will inherit this agent identity.",
      },
    ],
  },

  // --- Identity ---
  {
    slug: "agent-name",
    name: "AgentName",
    description:
      "Fetches and renders the agent's registered name from the identity registry. Falls back to a truncated agent ID if no name is registered.",
    preview: withAgent(<AgentName />),
    importLine: `import { AgentName } from "@erc8004/ui"`,
    usage: `import { AgentName } from "@erc8004/ui"

// Direct props:
<AgentName agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentName />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "agent-image",
    name: "AgentImage",
    description:
      "Renders the agent's registered image. Supports IPFS, HTTPS, and base64 sources. Falls back to the deterministic FingerprintBadge when no image is registered.",
    preview: withAgent(<AgentImage />),
    importLine: `import { AgentImage } from "@erc8004/ui"`,
    usage: `import { AgentImage } from "@erc8004/ui"

// Direct props:
<AgentImage agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentImage />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "agent-description",
    name: "AgentDescription",
    description:
      "Renders the agent's registered description text from the identity registry.",
    preview: withAgent(<AgentDescription />),
    importLine: `import { AgentDescription } from "@erc8004/ui"`,
    usage: `import { AgentDescription } from "@erc8004/ui"

// Direct props:
<AgentDescription agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentDescription />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "agent-card",
    name: "AgentCard",
    description:
      "Composed identity card combining avatar, name, description, owner address, and active protocol badges in a single component.",
    preview: withAgent(<AgentCard />),
    importLine: `import { AgentCard } from "@erc8004/ui"`,
    usage: `import { AgentCard } from "@erc8004/ui"

// Direct props:
<AgentCard agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <AgentCard />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "endpoint-status",
    name: "EndpointStatus",
    description:
      "Lists all registered service endpoints (MCP, A2A, OASF, web, email) with protocol labels. Shows live availability status.",
    preview: withAgent(<EndpointStatus />),
    importLine: `import { EndpointStatus } from "@erc8004/ui"`,
    usage: `import { EndpointStatus } from "@erc8004/ui"

// Direct props:
<EndpointStatus agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <EndpointStatus />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },

  // --- Reputation ---
  {
    slug: "reputation-score",
    name: "ReputationScore",
    description:
      "Compact inline badge showing the agent's average feedback score and total review count. Colour-coded by score range.",
    preview: withAgent(<ReputationScore />),
    importLine: `import { ReputationScore } from "@erc8004/ui"`,
    usage: `import { ReputationScore } from "@erc8004/ui"

// Direct props:
<ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ReputationScore />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "reputation-timeline",
    name: "ReputationTimeline",
    description:
      "Sparkline chart showing how the agent's average feedback score has trended over time.",
    preview: withAgent(<ReputationTimeline />),
    importLine: `import { ReputationTimeline } from "@erc8004/ui"`,
    usage: `import { ReputationTimeline } from "@erc8004/ui"

// Direct props:
<ReputationTimeline agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ReputationTimeline />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "reputation-distribution",
    name: "ReputationDistribution",
    description:
      "Score distribution histogram showing the spread of feedback values across 5 ranges.",
    preview: withAgent(<ReputationDistribution />),
    importLine: `import { ReputationDistribution } from "@erc8004/ui"`,
    usage: `import { ReputationDistribution } from "@erc8004/ui"

// Direct props:
<ReputationDistribution agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ReputationDistribution />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "feedback-list",
    name: "FeedbackList",
    description:
      "Paginated list of individual feedback entries with score, tag pills, reviewer address, timestamp, and optional written review text.",
    preview: withAgent(<FeedbackList />),
    importLine: `import { FeedbackList } from "@erc8004/ui"`,
    usage: `import { FeedbackList } from "@erc8004/ui"

// Direct props:
<FeedbackList agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <FeedbackList />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "tag-cloud",
    name: "TagCloud",
    description:
      "Weighted tag pills showing the agent's most frequent feedback tags. Pill size reflects mention frequency across all feedback entries.",
    preview: withAgent(<TagCloud />),
    importLine: `import { TagCloud } from "@erc8004/ui"`,
    usage: `import { TagCloud } from "@erc8004/ui"

// Direct props:
<TagCloud agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <TagCloud />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },

  // --- Validation ---
  {
    slug: "verification-badge",
    name: "VerificationBadge",
    description:
      "Compact inline badge showing the agent's verification tier derived from completed validations and average validation score.",
    preview: withAgent(<VerificationBadge />),
    importLine: `import { VerificationBadge } from "@erc8004/ui"`,
    usage: `import { VerificationBadge } from "@erc8004/ui"

// Direct props:
<VerificationBadge agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <VerificationBadge />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "validation-score",
    name: "ValidationScore",
    description:
      "Average validation score (0–100) with a fill bar and completed/pending counts.",
    preview: withAgent(<ValidationScore />),
    importLine: `import { ValidationScore } from "@erc8004/ui"`,
    usage: `import { ValidationScore } from "@erc8004/ui"

// Direct props:
<ValidationScore agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ValidationScore />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "validation-list",
    name: "ValidationList",
    description:
      "Paginated list of individual validation entries with score, status, tag, validator address, and timestamp.",
    preview: withAgent(<ValidationList />),
    importLine: `import { ValidationList } from "@erc8004/ui"`,
    usage: `import { ValidationList } from "@erc8004/ui"

// Direct props:
<ValidationList agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ValidationList />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "validation-display",
    name: "ValidationDisplay",
    description:
      "Composed view combining VerificationBadge, ValidationScore, and ValidationList into a single unified validation panel.",
    preview: withAgent(<ValidationDisplay />),
    importLine: `import { ValidationDisplay } from "@erc8004/ui"`,
    usage: `import { ValidationDisplay } from "@erc8004/ui"

// Direct props:
<ValidationDisplay agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ValidationDisplay />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },

  // --- Activity ---
  {
    slug: "last-activity",
    name: "LastActivity",
    description:
      'Cross-registry relative timestamp showing when the agent was last active (e.g. "Active 3 hours ago"). Reflects the most recent event across all registries.',
    preview: withAgent(<LastActivity />),
    importLine: `import { LastActivity } from "@erc8004/ui"`,
    usage: `import { LastActivity } from "@erc8004/ui"

// Direct props:
<LastActivity agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <LastActivity />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "activity-log",
    name: "ActivityLog",
    description:
      "Chronological feed of all on-chain events across all registries — feedback and validations merged and sorted by time.",
    preview: withAgent(<ActivityLog />),
    importLine: `import { ActivityLog } from "@erc8004/ui"`,
    usage: `import { ActivityLog } from "@erc8004/ui"

// Direct props:
<ActivityLog agentRegistry="eip155:1:0x742..." agentId={374} />

// Inside AgentProvider:
<AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
  <ActivityLog />
</AgentProvider>`,
    props: AGENT_IDENTITY_PROPS,
  },
]

// ---------------------------------------------------------------------------
// Lookup map
// ---------------------------------------------------------------------------

export const COMPONENT_REGISTRY: Record<string, ComponentDoc> =
  Object.fromEntries(DOCS.map((doc) => [doc.slug, doc]))

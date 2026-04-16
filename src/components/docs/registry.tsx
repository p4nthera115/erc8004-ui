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
import { LastActivity } from "@/components/activity/last-activity"
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

export type ExampleDef = {
  name: string
  description: string
  preview: React.ReactNode
  code: string
}

export type InContextDef = {
  description: string
  preview: React.ReactNode
  code: string
}

export type ComponentDoc = {
  slug: string
  name: string
  description: string
  preview: React.ReactNode
  importLine: string
  previewCode?: string
  usage: string
  examples?: ExampleDef[]
  inContext?: InContextDef
  states?: string
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

// ---------------------------------------------------------------------------
// Shared states text
// ---------------------------------------------------------------------------

const DATA_COMPONENT_STATES =
  "This component handles loading, error, empty, and not-found states internally. A skeleton placeholder is shown while fetching, an error message with details appears if the Subgraph is unreachable, and a short message is displayed when no data exists for this agent."

const INLINE_COMPONENT_STATES =
  "This component handles loading and error states internally with inline placeholders. No configuration needed."

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const DOCS: ComponentDoc[] = [
  // =========================================================================
  // PROVIDERS
  // =========================================================================
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
<AgentProvider agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290}>
  <AgentName />
  <ReputationScore />
  <FeedbackList />
</AgentProvider>

// Override one component inside the provider:
<AgentProvider agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290}>
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

  // =========================================================================
  // IDENTITY
  // =========================================================================
  {
    slug: "agent-name",
    name: "AgentName",
    description:
      "Fetches and renders the agent's registered name from the identity registry. Falls back to a truncated agent ID if no name is registered.",
    preview: withAgent(<AgentName />),
    previewCode: `<AgentName agentRegistry="eip155:8453:0x8004...a432" agentId={2290} />`,
    importLine: `import { AgentName } from "@erc8004/ui"`,
    usage: `<AgentName agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Inside AgentProvider",
        description:
          "Use AgentProvider to avoid repeating props when rendering multiple components for the same agent.",
        preview: withAgent(<AgentName />),
        code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <AgentName />
</AgentProvider>`,
      },
      {
        name: "With Custom Styling",
        description:
          "Pass className to override typography. Useful for heading-level displays.",
        preview: withAgent(
          <AgentName className="text-2xl font-semibold tracking-tight" />
        ),
        code: `<AgentName
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
  className="text-2xl font-semibold tracking-tight"
/>`,
      },
    ],
    inContext: {
      description:
        "AgentName used in a profile header alongside the agent's image, description, and verification status.",
      preview: withAgent(
        <div className="flex items-center gap-6">
          <AgentImage className="min-w-16" />
          <div>
            <div className="flex items-center gap-2">
              <AgentName />
              <VerificationBadge />
            </div>
            <AgentDescription />
          </div>
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-4">
    <AgentImage />
    <div>
      <div className="flex items-center gap-2">
        <AgentName />
        <VerificationBadge />
      </div>
      <AgentDescription />
    </div>
  </div>
</AgentProvider>`,
    },
    states: INLINE_COMPONENT_STATES,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "agent-image",
    name: "AgentImage",
    description:
      "Renders the agent's registered image. Supports IPFS, HTTPS, and base64 sources. Falls back to the deterministic FingerprintBadge when no image is registered.",
    preview: withAgent(<AgentImage />),
    importLine: `import { AgentImage } from "@erc8004/ui"`,
    usage: `<AgentImage agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "With FingerprintBadge Fallback",
        description:
          "When no image is registered, AgentImage automatically renders the deterministic FingerprintBadge as a fallback.",
        preview: withAgent(<AgentImage />),
        code: `// If the agent has no registered image, a FingerprintBadge is shown:
<AgentImage agentRegistry="eip155:8453:0x8004...a432" agentId={2290} />`,
      },
      {
        name: "Circular Avatar",
        description:
          "Use className to render as a circular avatar at a fixed size.",
        preview: withAgent(
          <AgentImage className="h-16 w-16 rounded-full overflow-hidden" />
        ),
        code: `<AgentImage
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
  className="h-16 w-16 rounded-full overflow-hidden"
/>`,
      },
    ],
    inContext: {
      description:
        "AgentImage in a profile header alongside name and verification badge.",
      preview: withAgent(
        <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-white/20 rounded-lg">
          <AgentImage className="min-h-24 min-w-24" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <AgentName />
              <VerificationBadge />
            </div>
            <AgentDescription />
          </div>
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-white/20 rounded-lg">
    <AgentImage className="min-h-24 min-w-24" />
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <AgentName />
        <VerificationBadge />
      </div>
      <AgentDescription />
    </div>
  </div>
</AgentProvider>`,
    },
    states: INLINE_COMPONENT_STATES,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "agent-description",
    name: "AgentDescription",
    description:
      "Renders the agent's registered description text from the identity registry.",
    preview: withAgent(<AgentDescription />),
    importLine: `import { AgentDescription } from "@erc8004/ui"`,
    usage: `<AgentDescription agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Inside AgentProvider",
        description:
          "Renders the description text without repeating agent identity props.",
        preview: withAgent(<AgentDescription />),
        code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <AgentDescription />
</AgentProvider>`,
      },
      {
        name: "Truncated to Two Lines",
        description:
          "Use className with line-clamp to constrain long descriptions inside compact cards.",
        preview: withAgent(
          <AgentDescription className="line-clamp-2 max-w-sm text-sm text-erc8004-muted-fg" />
        ),
        code: `<AgentDescription
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
  className="line-clamp-2 max-w-sm text-sm text-erc8004-muted-fg"
/>`,
      },
    ],
    inContext: {
      description: "AgentDescription as part of a profile header composition.",
      preview: withAgent(
        <AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
          <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-white/20 rounded-lg">
            <AgentImage className="min-h-24 min-w-24" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <AgentName />
                <VerificationBadge />
              </div>
              <AgentDescription />
            </div>
          </div>
        </AgentProvider>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-white/20 rounded-lg">
    <AgentImage className="min-h-24 min-w-24" />
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <AgentName />
        <VerificationBadge />
      </div>
      <AgentDescription />
    </div>
  </div>
</AgentProvider>`,
    },
    states: INLINE_COMPONENT_STATES,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "agent-card",
    name: "AgentCard",
    description:
      "Composed identity card combining avatar, name, description, owner address, and active protocol badges in a single component.",
    preview: withAgent(<AgentCard />),
    importLine: `import { AgentCard } from "@erc8004/ui"`,
    usage: `<AgentCard agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Vertical Layout",
        description:
          "Stack the avatar above the name, agent id, and description. Ideal for marketplace grids and directory tiles.",
        preview: withAgent(<AgentCard layout="vertical" />),
        code: `<AgentCard agentRegistry="eip155:8453:0x8004...a432" agentId={2290} layout="vertical" />`,
      },
      {
        name: "Without Description",
        description: "Hide the description to create a more compact card.",
        preview: withAgent(<AgentCard showDescription={false} />),
        code: `<AgentCard agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showDescription={false} />`,
      },
      {
        name: "Without Protocol Badges",
        description:
          "Hide protocol badges for a cleaner look in contexts where endpoints aren't relevant.",
        preview: withAgent(<AgentCard showProtocolBadges={false} />),
        code: `<AgentCard agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showProtocolBadges={false} />`,
      },
      {
        name: "Minimal",
        description:
          "Show only avatar and name by hiding description, owner, and protocol badges.",
        preview: withAgent(
          <AgentCard
            showDescription={false}
            showOwner={false}
            showProtocolBadges={false}
            layout="vertical"
          />
        ),
        code: `<AgentCard
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
  showDescription={false}
  showOwner={false}
  showProtocolBadges={false}
  layout="vertical"
/>`,
      },
    ],
    inContext: {
      description:
        "AgentCard used in a marketplace grid alongside reputation data.",
      preview: withAgent(
        <div className="w-full space-y-3">
          <AgentCard />
          <div className="flex items-center gap-4 px-1">
            <ReputationScore />
            <LastActivity />
          </div>
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="w-full max-w-sm space-y-3">
    <AgentCard />
    <div className="flex items-center gap-4 px-1">
      <ReputationScore />
      <LastActivity />
    </div>
  </div>
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "layout",
        type: '"horizontal" | "vertical"',
        required: false,
        default: '"horizontal"',
        description:
          'Card layout. "horizontal" places the avatar next to name and description. "vertical" stacks the avatar above name, agent id, and description.',
      },
      {
        name: "showOwner",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the owner wallet address.",
      },
      {
        name: "showProtocolBadges",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show protocol badges (MCP, A2A, OASF, Web, Email).",
      },
      {
        name: "showDescription",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the agent's description text.",
      },
    ],
  },
  {
    slug: "endpoint-status",
    name: "EndpointStatus",
    description:
      "Lists all registered service endpoints (MCP, A2A, OASF, web, email) with protocol labels and optional live health check indicators.",
    preview: withAgent(<EndpointStatus />),
    importLine: `import { EndpointStatus } from "@erc8004/ui"`,
    usage: `<EndpointStatus agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "With Health Checks",
        description:
          "Enable live HTTP health checks to show green/red status dots for each endpoint.",
        preview: withAgent(<EndpointStatus showHealthChecks />),
        code: `<EndpointStatus agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showHealthChecks />`,
      },
      {
        name: "Filtered Protocols",
        description: "Show only MCP and A2A endpoints.",
        preview: withAgent(<EndpointStatus protocols={["mcp", "a2a"]} />),
        code: `<EndpointStatus agentRegistry="eip155:8453:0x8004...a432" agentId={2290} protocols={["mcp", "a2a"]} />`,
      },
    ],
    inContext: {
      description:
        "EndpointStatus alongside an AgentCard to form a complete identity view.",
      preview: withAgent(
        <div className="w-full max-w-md space-y-4">
          <AgentCard />
          <EndpointStatus />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="w-full max-w-md space-y-4">
    <AgentCard />
    <EndpointStatus />
  </div>
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "showHealthChecks",
        type: "boolean",
        required: false,
        default: "false",
        description:
          "Show live HTTP health check dots. Opt-in because pings can be slow.",
      },
      {
        name: "protocols",
        type: 'Array<"mcp" | "a2a" | "oasf" | "web" | "email">',
        required: false,
        description: "Filter which protocols are shown. Default shows all.",
      },
    ],
  },

  // =========================================================================
  // REPUTATION
  // =========================================================================
  {
    slug: "reputation-score",
    name: "ReputationScore",
    description:
      "Compact inline badge showing the agent's average feedback score and total review count. Colour-coded by score range.",
    preview: withAgent(<ReputationScore />),
    importLine: `import { ReputationScore } from "@erc8004/ui"`,
    usage: `<ReputationScore agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Without Count",
        description: "Hide the review count for a more minimal display.",
        preview: withAgent(<ReputationScore showCount={false} />),
        code: `<ReputationScore agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showCount={false} />`,
      },
      {
        name: "Higher Precision",
        description: "Show two decimal places for more precise scores.",
        preview: withAgent(<ReputationScore precision={2} />),
        code: `<ReputationScore agentRegistry="eip155:8453:0x8004...a432" agentId={2290} precision={2} />`,
      },
    ],
    inContext: {
      description:
        "ReputationScore in a marketplace card alongside the agent's image, name, and tag cloud.",
      preview: withAgent(
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-3">
            <AgentImage />
            <div>
              <AgentName />
              <ReputationScore />
            </div>
          </div>
          <TagCloud />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-3">
    <AgentImage />
    <div>
      <AgentName />
      <ReputationScore />
    </div>
  </div>
  <TagCloud />
</AgentProvider>`,
    },
    states: INLINE_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "showCount",
        type: "boolean",
        required: false,
        default: "true",
        description: 'Show/hide the "(N reviews)" count on hover.',
      },
      {
        name: "precision",
        type: "number",
        required: false,
        default: "1",
        description: "Decimal places for the score display.",
      },
    ],
  },
  {
    slug: "reputation-timeline",
    name: "ReputationTimeline",
    description:
      "Sparkline chart showing how the agent's feedback scores have trended over time. Pure SVG, no external charting library.",
    preview: withAgent(<ReputationTimeline />),
    importLine: `import { ReputationTimeline } from "@erc8004/ui"`,
    usage: `<ReputationTimeline agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Last 30 Days",
        description:
          "Filter the timeline to only show feedback from the last 30 days.",
        preview: withAgent(<ReputationTimeline range="30d" />),
        code: `<ReputationTimeline agentRegistry="eip155:8453:0x8004...a432" agentId={2290} range="30d" />`,
      },
      {
        name: "With Data Points",
        description: "Show individual score dots on the chart.",
        preview: withAgent(<ReputationTimeline showDataPoints />),
        code: `<ReputationTimeline agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showDataPoints />`,
      },
      {
        name: "Points Only (No Trend Line)",
        description:
          "Show only the data point dots without the connecting trend line.",
        preview: withAgent(
          <ReputationTimeline showTrendLine={false} showDataPoints />
        ),
        code: `<ReputationTimeline agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showTrendLine={false} showDataPoints />`,
      },
    ],
    inContext: {
      description:
        "ReputationTimeline alongside ReputationDistribution for a complete reputation view.",
      preview: withAgent(
        <div className="w-full space-y-4">
          <ReputationTimeline />
          <ReputationDistribution />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <ReputationTimeline />
  <ReputationDistribution />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "range",
        type: '"7d" | "30d" | "90d" | "all"',
        required: false,
        default: '"all"',
        description: "Time range filter for displayed feedback.",
      },
      {
        name: "showTrendLine",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the connecting line between data points.",
      },
      {
        name: "showDataPoints",
        type: "boolean",
        required: false,
        default: "false",
        description: "Show individual score dots on the chart.",
      },
    ],
  },
  {
    slug: "reputation-distribution",
    name: "ReputationDistribution",
    description:
      "Score distribution histogram showing the spread of feedback values across configurable score ranges.",
    preview: withAgent(<ReputationDistribution />),
    importLine: `import { ReputationDistribution } from "@erc8004/ui"`,
    usage: `<ReputationDistribution agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Horizontal Orientation",
        description:
          "Render the histogram as vertical bars in a horizontal row instead of horizontal bars in a vertical stack.",
        preview: withAgent(<ReputationDistribution orientation="horizontal" />),
        code: `<ReputationDistribution agentRegistry="eip155:8453:0x8004...a432" agentId={2290} orientation="horizontal" />`,
      },
      {
        name: "Custom Bucket Count",
        description: "Use 10 buckets for finer-grained distribution.",
        preview: withAgent(<ReputationDistribution bucketCount={10} />),
        code: `<ReputationDistribution agentRegistry="eip155:8453:0x8004...a432" agentId={2290} bucketCount={10} />`,
      },
      {
        name: "No Axis Labels",
        description: "Hide the range labels for a more compact chart.",
        preview: withAgent(<ReputationDistribution showAxisLabels={false} />),
        code: `<ReputationDistribution agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showAxisLabels={false} />`,
      },
    ],
    inContext: {
      description:
        "ReputationDistribution used alongside a timeline chart to show both trends and spread.",
      preview: withAgent(
        <div className="w-full space-y-4">
          <ReputationTimeline />
          <ReputationDistribution />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <ReputationTimeline />
  <ReputationDistribution />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "bucketCount",
        type: "number",
        required: false,
        default: "5",
        description: "Number of histogram buckets.",
      },
      {
        name: "orientation",
        type: '"vertical" | "horizontal"',
        required: false,
        default: '"vertical"',
        description:
          'Chart layout. "vertical" = horizontal bars stacked vertically. "horizontal" = vertical bars in a row.',
      },
      {
        name: "showAxisLabels",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show score range labels on the axis.",
      },
      {
        name: "colored",
        type: "boolean",
        required: false,
        default: "true",
        description:
          "Colour bars by score band (green → gold → red). When false, uses a single accent colour.",
      },
    ],
  },
  {
    slug: "feedback-list",
    name: "FeedbackList",
    description:
      "Paginated list of individual feedback entries with score, tag pills, reviewer address, timestamp, and optional written review text.",
    preview: withAgent(<FeedbackList />),
    importLine: `import { FeedbackList } from "@erc8004/ui"`,
    usage: `<FeedbackList agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Smaller Page Size",
        description: "Show 5 items per page instead of the default 10.",
        preview: withAgent(<FeedbackList pageSize={5} />),
        code: `<FeedbackList agentRegistry="eip155:8453:0x8004...a432" agentId={2290} pageSize={5} />`,
      },
      {
        name: "Minimal (Scores Only)",
        description:
          "Hide tags, timestamps, and reviewer addresses for a compact score-only list.",
        preview: withAgent(
          <FeedbackList
            showTags={false}
            showTimestamp={false}
            showReviewerAddress={false}
            pageSize={5}
          />
        ),
        code: `<FeedbackList
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
  showTags={false}
  showTimestamp={false}
  showReviewerAddress={false}
  pageSize={5}
/>`,
      },
      {
        name: "Without Responses",
        description: "Hide agent responses under each feedback entry.",
        preview: withAgent(<FeedbackList showResponses={false} />),
        code: `<FeedbackList agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showResponses={false} />`,
      },
    ],
    inContext: {
      description:
        "FeedbackList in a reputation panel alongside the score and tag cloud.",
      preview: withAgent(
        <div className="w-full space-y-4">
          <div className="flex items-center gap-4">
            <ReputationScore />
            <TagCloud />
          </div>
          <FeedbackList pageSize={3} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-4">
    <ReputationScore />
    <TagCloud />
  </div>
  <FeedbackList pageSize={3} />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "pageSize",
        type: "number",
        required: false,
        default: "10",
        description: "Items per page.",
      },
      {
        name: "showReviewerAddress",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the reviewer's wallet address.",
      },
      {
        name: "showTimestamp",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the feedback timestamp.",
      },
      {
        name: "showTags",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show tag pills.",
      },
      {
        name: "showResponses",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show agent responses under each feedback entry.",
      },
      {
        name: "coloredScores",
        type: "boolean",
        required: false,
        default: "true",
        description:
          "Colour the numeric score by score band (green → gold → red).",
      },
      {
        name: "emptyMessage",
        type: "string",
        required: false,
        default: '"No feedback yet."',
        description: "Custom message when there is no feedback.",
      },
    ],
  },
  {
    slug: "tag-cloud",
    name: "TagCloud",
    description:
      "Weighted tag pills showing the agent's most frequent feedback tags. Pill size reflects mention frequency across all feedback entries.",
    preview: withAgent(<TagCloud />),
    importLine: `import { TagCloud } from "@erc8004/ui"`,
    usage: `<TagCloud agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Top 5 Tags",
        description: "Limit to the 5 most frequent tags.",
        preview: withAgent(<TagCloud maxTags={5} />),
        code: `<TagCloud agentRegistry="eip155:8453:0x8004...a432" agentId={2290} maxTags={5} />`,
      },
      {
        name: "Minimum 3 Occurrences",
        description:
          "Only show tags mentioned at least 3 times to filter out noise.",
        preview: withAgent(<TagCloud minOccurrences={3} />),
        code: `<TagCloud agentRegistry="eip155:8453:0x8004...a432" agentId={2290} minOccurrences={3} />`,
      },
    ],
    inContext: {
      description:
        "TagCloud in a marketplace card alongside agent identity and score.",
      preview: withAgent(
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-3">
            <AgentImage />
            <div>
              <AgentName />
              <ReputationScore />
            </div>
          </div>
          <TagCloud maxTags={5} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-3">
    <AgentImage />
    <div>
      <AgentName />
      <ReputationScore />
    </div>
  </div>
  <TagCloud maxTags={5} />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "maxTags",
        type: "number",
        required: false,
        default: "20",
        description: "Maximum number of tags shown.",
      },
      {
        name: "minOccurrences",
        type: "number",
        required: false,
        default: "1",
        description: "Minimum mention count for a tag to appear.",
      },
    ],
  },

  // =========================================================================
  // VALIDATION
  // =========================================================================
  {
    slug: "verification-badge",
    name: "VerificationBadge",
    description:
      "Compact inline badge showing the agent's verification tier derived from completed validations and average validation score.",
    preview: withAgent(<VerificationBadge />),
    importLine: `import { VerificationBadge } from "@erc8004/ui"`,
    usage: `<VerificationBadge agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Alongside Agent Name",
        description: "Place next to an agent name for inline trust indication.",
        preview: withAgent(
          <div className="flex items-center gap-2">
            <AgentName />
            <VerificationBadge />
          </div>
        ),
        code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-2">
    <AgentName />
    <VerificationBadge />
  </div>
</AgentProvider>`,
      },
      {
        name: "Standalone",
        description:
          "Used alone as a compact trust indicator anywhere in the UI.",
        preview: withAgent(<VerificationBadge />),
        code: `<VerificationBadge agentRegistry="eip155:8453:0x8004...a432" agentId={2290} />`,
      },
    ],
    inContext: {
      description:
        "VerificationBadge in a trust panel with validation score and recent validations.",
      preview: withAgent(
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2">
            <AgentName />
            <VerificationBadge />
          </div>
          <ValidationScore />
          <ValidationList pageSize={3} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-2">
    <AgentName />
    <VerificationBadge />
  </div>
  <ValidationScore />
  <ValidationList pageSize={3} />
</AgentProvider>`,
    },
    states: INLINE_COMPONENT_STATES,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "validation-score",
    name: "ValidationScore",
    description:
      "Average validation score (0-100) with a fill bar and completed/pending counts.",
    preview: withAgent(<ValidationScore />),
    importLine: `import { ValidationScore } from "@erc8004/ui"`,
    usage: `<ValidationScore agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Without Fill Bar",
        description: "Hide the score fill bar for a text-only display.",
        preview: withAgent(<ValidationScore showFillBar={false} />),
        code: `<ValidationScore agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showFillBar={false} />`,
      },
      {
        name: "Without Pending Count",
        description: "Hide the pending validation count.",
        preview: withAgent(<ValidationScore showPendingCount={false} />),
        code: `<ValidationScore agentRegistry="eip155:8453:0x8004...a432" agentId={2290} showPendingCount={false} />`,
      },
    ],
    inContext: {
      description:
        "ValidationScore in a trust panel alongside the verification badge and recent validations.",
      preview: withAgent(
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2">
            <AgentName />
            <VerificationBadge />
          </div>
          <ValidationScore />
          <ValidationList pageSize={3} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-2">
    <AgentName />
    <VerificationBadge />
  </div>
  <ValidationScore />
  <ValidationList pageSize={3} />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "showFillBar",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the score fill bar.",
      },
      {
        name: "showPendingCount",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the pending validation count.",
      },
    ],
  },
  {
    slug: "validation-list",
    name: "ValidationList",
    description:
      "Paginated list of individual validation entries with score, status, tag, validator address, and timestamp.",
    preview: withAgent(<ValidationList />),
    importLine: `import { ValidationList } from "@erc8004/ui"`,
    usage: `<ValidationList agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Completed Only",
        description: "Filter to show only completed validations.",
        preview: withAgent(<ValidationList statusFilter="completed" />),
        code: `<ValidationList agentRegistry="eip155:8453:0x8004...a432" agentId={2290} statusFilter="completed" />`,
      },
      {
        name: "Smaller Page Size",
        description: "Show 5 items per page for a compact view.",
        preview: withAgent(<ValidationList pageSize={5} />),
        code: `<ValidationList agentRegistry="eip155:8453:0x8004...a432" agentId={2290} pageSize={5} />`,
      },
    ],
    inContext: {
      description:
        "ValidationList in a trust panel alongside the verification badge and validation score.",
      preview: withAgent(
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2">
            <AgentName />
            <VerificationBadge />
          </div>
          <ValidationScore />
          <ValidationList pageSize={3} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-2">
    <AgentName />
    <VerificationBadge />
  </div>
  <ValidationScore />
  <ValidationList pageSize={3} />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "pageSize",
        type: "number",
        required: false,
        default: "10",
        description: "Items per page.",
      },
      {
        name: "showValidatorAddress",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the validator's wallet address.",
      },
      {
        name: "showTimestamp",
        type: "boolean",
        required: false,
        default: "true",
        description: "Show the validation timestamp.",
      },
      {
        name: "statusFilter",
        type: '"all" | "completed" | "pending" | "expired"',
        required: false,
        default: '"all"',
        description: "Filter validations by status.",
      },
      {
        name: "emptyMessage",
        type: "string",
        required: false,
        default: '"No validations yet."',
        description: "Custom message when there are no validations.",
      },
    ],
  },
  {
    slug: "validation-display",
    name: "ValidationDisplay",
    description:
      "Composed view combining VerificationBadge, ValidationScore, and ValidationList into a single unified validation panel.",
    preview: withAgent(<ValidationDisplay />),
    importLine: `import { ValidationDisplay } from "@erc8004/ui"`,
    usage: `<ValidationDisplay agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Inside AgentProvider",
        description: "Use AgentProvider to avoid repeating identity props.",
        preview: withAgent(<ValidationDisplay />),
        code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <ValidationDisplay />
</AgentProvider>`,
      },
      {
        name: "Constrained Width",
        description:
          "Pass className to fit the composed panel into a sidebar or trust column.",
        preview: withAgent(<ValidationDisplay className="max-w-sm" />),
        code: `<ValidationDisplay
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
  className="max-w-sm"
/>`,
      },
    ],
    inContext: {
      description:
        "ValidationDisplay as a standalone trust panel on an agent profile page.",
      preview: withAgent(
        <div className="w-full max-w-lg space-y-6">
          <AgentCard />
          <ValidationDisplay />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <AgentCard />
  <ValidationDisplay />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: AGENT_IDENTITY_PROPS,
  },

  // =========================================================================
  // ACTIVITY
  // =========================================================================
  {
    slug: "last-activity",
    name: "LastActivity",
    description:
      'Cross-registry relative timestamp showing when the agent was last active (e.g. "Active 3 hours ago"). Reflects the most recent event across all registries.',
    preview: withAgent(<LastActivity />),
    importLine: `import { LastActivity } from "@erc8004/ui"`,
    usage: `<LastActivity agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Inside AgentProvider",
        description:
          "Renders the last activity timestamp without repeating identity props.",
        preview: withAgent(<LastActivity />),
        code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <LastActivity />
</AgentProvider>`,
      },
      {
        name: "As Status Indicator",
        description:
          "Combine with a live dot and muted styling to show agent presence in a header.",
        preview: withAgent(
          <div className="flex items-center gap-2 text-xs text-erc8004-muted-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-erc8004-positive" />
            <LastActivity />
          </div>
        ),
        code: `<div className="flex items-center gap-2 text-xs text-erc8004-muted-fg">
  <span className="h-1.5 w-1.5 rounded-full bg-erc8004-positive" />
  <LastActivity agentRegistry="eip155:8453:0x8004...a432" agentId={2290} />
</div>`,
      },
    ],
    inContext: {
      description:
        "LastActivity in a sidebar showing agent status alongside the activity log.",
      preview: withAgent(
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <AgentName />
            <LastActivity />
          </div>
          <ActivityLog pageSize={5} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-3">
    <AgentName />
    <LastActivity />
  </div>
  <ActivityLog pageSize={5} />
</AgentProvider>`,
    },
    states: INLINE_COMPONENT_STATES,
    props: AGENT_IDENTITY_PROPS,
  },
  {
    slug: "activity-log",
    name: "ActivityLog",
    description:
      "Chronological feed of all on-chain events across all registries — feedback and validations merged and sorted by time.",
    preview: withAgent(<ActivityLog />),
    importLine: `import { ActivityLog } from "@erc8004/ui"`,
    usage: `<ActivityLog agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" agentId={2290} />`,
    examples: [
      {
        name: "Feedback Only",
        description: "Filter to show only feedback events.",
        preview: withAgent(<ActivityLog eventTypes={["feedback"]} />),
        code: `<ActivityLog agentRegistry="eip155:8453:0x8004...a432" agentId={2290} eventTypes={["feedback"]} />`,
      },
      {
        name: "Smaller Page Size",
        description: "Show only the 5 most recent events.",
        preview: withAgent(<ActivityLog pageSize={5} />),
        code: `<ActivityLog agentRegistry="eip155:8453:0x8004...a432" agentId={2290} pageSize={5} />`,
      },
    ],
    inContext: {
      description:
        "ActivityLog in a sidebar showing recent agent activity alongside last activity timestamp.",
      preview: withAgent(
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <AgentName />
            <LastActivity />
          </div>
          <ActivityLog pageSize={5} />
        </div>
      ),
      code: `<AgentProvider agentRegistry="eip155:8453:0x8004...a432" agentId={2290}>
  <div className="flex items-center gap-3">
    <AgentName />
    <LastActivity />
  </div>
  <ActivityLog pageSize={5} />
</AgentProvider>`,
    },
    states: DATA_COMPONENT_STATES,
    props: [
      ...AGENT_IDENTITY_PROPS,
      {
        name: "pageSize",
        type: "number",
        required: false,
        default: "20",
        description: "Maximum number of events to display.",
      },
      {
        name: "eventTypes",
        type: 'Array<"feedback" | "validation">',
        required: false,
        description: "Filter by event type. Default shows all.",
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Lookup map
// ---------------------------------------------------------------------------

export const COMPONENT_REGISTRY: Record<string, ComponentDoc> =
  Object.fromEntries(DOCS.map((doc) => [doc.slug, doc]))

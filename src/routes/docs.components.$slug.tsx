import { createFileRoute, notFound } from "@tanstack/react-router"
import { FingerprintBadgeDocs } from "../pages/docs/components/FingerprintBadgeDocs"
import { PlaceholderDocs } from "../pages/docs/components/PlaceholderDocs"
import { ReputationScore } from "@/components/reputation/reputation-score"
import { ReputationDistribution } from "@/components/reputation/reputation-distribution"
import { ReputationTimeline } from "@/components/reputation/reputation-timeline"
import { FeedbackList } from "@/components/reputation/feedback-list"
import { AgentName } from "@/components/identity/agent-name"
import { AgentImage } from "@/components/identity/agent-image"
import { AgentDescription } from "@/components/identity/agent-description"
import { AgentCard } from "@/components/identity/AgentCard"
import { EndpointStatus } from "@/components/identity/EndpointStatus"
import { IdentityDisplay } from "@/components/identity/IdentityDisplay"
import { AgentProvider } from "@/provider/AgentProvider"

function ComponentPreview({
  name,
  description,
  children,
}: {
  name: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {name}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

const REGISTRY = "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e"
const AGENT_ID = 1073

const COMPONENT_PAGES: Record<string, React.ReactNode> = {
  "fingerprint-badge": <FingerprintBadgeDocs />,
  identity: (
    <AgentProvider agentRegistry={REGISTRY} agentId={AGENT_ID}>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-6">
          <ComponentPreview
            name="AgentName"
            description="Fetches and renders the agent's registered name. Falls back to the agent ID."
          >
            <AgentName />
          </ComponentPreview>
          <ComponentPreview
            name="AgentImage"
            description="Agent's registered image (IPFS/HTTPS/base64). Falls back to FingerprintBadge."
          >
            <AgentImage />
          </ComponentPreview>
          <ComponentPreview
            name="AgentDescription"
            description="Agent's registered description text."
          >
            <AgentDescription />
          </ComponentPreview>
        </section>

        <section className="flex flex-col gap-6">
          <ComponentPreview
            name="AgentCard"
            description="Avatar, name, description, owner address, and active protocol badges in a single card."
          >
            <AgentCard />
          </ComponentPreview>
          <ComponentPreview
            name="EndpointStatus"
            description="Lists all registered service endpoints (MCP, A2A, OASF, web, email) with protocol labels."
          >
            <EndpointStatus />
          </ComponentPreview>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Full Display
          </h2>
          <ComponentPreview
            name="IdentityDisplay"
            description="Complete identity profile — avatar, name, description, owner, and endpoints in one unified card."
          >
            <IdentityDisplay />
          </ComponentPreview>
        </section>
      </div>
    </AgentProvider>
  ),
  reputation: (
    <AgentProvider agentRegistry={REGISTRY} agentId={AGENT_ID}>
      <div className="flex flex-col gap-10">
        <ComponentPreview
          name="ReputationScore"
          description="Compact badge showing average score and total review count."
        >
          <ReputationScore />
        </ComponentPreview>
        <ComponentPreview
          name="ReputationDistribution"
          description="Score distribution histogram across 5 ranges."
        >
          <ReputationDistribution />
        </ComponentPreview>
        <ComponentPreview
          name="ReputationTimeline"
          description="Score trend over time as a sparkline chart."
        >
          <ReputationTimeline />
        </ComponentPreview>
        <ComponentPreview
          name="FeedbackList"
          description="Paginated list of individual reviews with tags, reviewer address, and timestamps."
        >
          <FeedbackList />
        </ComponentPreview>
      </div>
    </AgentProvider>
  ),
  "endpoint-status": (
    <AgentProvider agentRegistry={REGISTRY} agentId={AGENT_ID}>
      <div className="flex flex-col gap-6">
        <ComponentPreview
          name="EndpointStatus"
          description="Lists all registered service endpoints (MCP, A2A, OASF, web, email) with protocol labels and optional live health checks."
        >
          <EndpointStatus />
        </ComponentPreview>
      </div>
    </AgentProvider>
  ),
  "activity-log": (
    <PlaceholderDocs
      name="Activity Log"
      description="Chronological on-chain events feed — registrations, updates, feedback, endpoint calls, deregistrations."
      status="planned"
    />
  ),
  introduction: (
    <PlaceholderDocs
      name="Introduction"
      description="ERC-8004 Agent Identity Component Library — a set of self-contained React components for AI agent identity, reputation, and activity."
      status="planned"
    />
  ),
  installation: (
    <PlaceholderDocs
      name="Installation"
      description="Components are distributed shadcn-style. Copy the source directly into your project."
      status="planned"
    />
  ),
}

export const Route = createFileRoute("/docs/components/$slug")({
  loader: ({ params }) => {
    if (!COMPONENT_PAGES[params.slug]) {
      throw notFound()
    }
  },
  component: function DocPage() {
    const { slug } = Route.useParams()
    return <>{COMPONENT_PAGES[slug]}</>
  },
  notFoundComponent: () => (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold text-text-primary">Not Found</h1>
      <p className="text-text-secondary">No docs page found for this path.</p>
    </div>
  ),
})

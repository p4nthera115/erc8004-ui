import { createFileRoute, notFound } from "@tanstack/react-router"
import { ReputationScore } from "@/components/reputation/reputation-score"
import { ReputationDistribution } from "@/components/reputation/reputation-distribution"
import { ReputationTimeline } from "@/components/reputation/reputation-timeline"
import { FeedbackList } from "@/components/reputation/feedback-list"
import { TagCloud } from "@/components/reputation/tag-cloud"
import { AgentName } from "@/components/identity/agent-name"
import { AgentImage } from "@/components/identity/agent-image"
import { AgentDescription } from "@/components/identity/agent-description"
import { AgentCard } from "@/components/identity/agent-card"
import { EndpointStatus } from "@/components/identity/endpoint-status"
import { IdentityDisplay } from "@/components/identity/identity-display"
import { AgentProvider } from "@/provider/AgentProvider"
import { LastActivity } from "@/components/cross-registry/last-activity"
import { ActivityLog } from "@/components/activity/activity-log"
import { VerificationBadge } from "@/components/validation/verification-badge"
import { ValidationScore } from "@/components/validation/validation-score"
import { ValidationList } from "@/components/validation/validation-list"
import { ValidationDisplay } from "@/components/validation/validation-display"

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
          name="TagCloud"
          description="Weighted tag pills showing the agent's most frequent feedback tags. Pill size reflects mention frequency."
        >
          <TagCloud />
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
  validation: (
    <AgentProvider agentRegistry={REGISTRY} agentId={AGENT_ID}>
      <div className="flex flex-col gap-10">
        <ComponentPreview
          name="VerificationBadge"
          description="Compact inline badge showing verification tier derived from completed validations and average score."
        >
          <VerificationBadge />
        </ComponentPreview>
        <ComponentPreview
          name="ValidationScore"
          description="Average validation score (0–100) with a fill bar and completed/pending counts."
        >
          <ValidationScore />
        </ComponentPreview>
        <ComponentPreview
          name="ValidationList"
          description="Paginated list of individual validation entries with score, status, tag, validator address, and timestamp."
        >
          <ValidationList />
        </ComponentPreview>

        <section className="flex flex-col gap-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Full Display
          </h2>
          <ComponentPreview
            name="ValidationDisplay"
            description="VerificationBadge, ValidationScore, and ValidationList composed into a single view."
          >
            <ValidationDisplay />
          </ComponentPreview>
        </section>
      </div>
    </AgentProvider>
  ),
  "cross-registry": (
    <AgentProvider agentRegistry={REGISTRY} agentId={AGENT_ID}>
      <div className="flex flex-col gap-10">
        <ComponentPreview
          name="LastActivity"
          description="Single timestamp from AgentStats."
        >
          <LastActivity />
        </ComponentPreview>
        <ComponentPreview
          name="ActivityLog"
          description="Chronological feed of all on-chain events across all registries — feedback and validations merged and sorted by time."
        >
          <ActivityLog />
        </ComponentPreview>
      </div>
    </AgentProvider>
  ),
  introduction: <></>,
  installation: <></>,
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

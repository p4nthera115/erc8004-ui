import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import {
  AgentProvider,
  AgentCard,
  EndpointStatus,
  ReputationDistribution,
  ReputationTimeline,
  FeedbackList,
  TagCloud,
  ActivityLog,
} from "@erc8004/ui"
import { RULE, Section } from "./section"

/** Same agent the component docs preview against. */
const DEMO_REGISTRY = "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
const DEMO_AGENT_ID = 888

function Cell({
  name,
  slug,
  align = "center",
  className,
  children,
}: {
  name: string
  slug: string
  /** Where the preview sits when the grid row is taller than the component. */
  align?: "center" | "start"
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`flex min-w-0 flex-col border-r border-b ${RULE} ${className ?? ""}`}
    >
      <div
        className={`flex items-center justify-between border-b px-4 py-2.5 ${RULE}`}
      >
        <span className="text-xs">{name}</span>
        <Link
          to="/docs/components/$slug"
          params={{ slug }}
          className="text-xs text-text-secondary hover:underline"
        >
          docs →
        </Link>
      </div>
      <div
        className={`flex min-w-0 flex-1 justify-center overflow-x-auto bg-neutral-50 p-4 md:p-6 dark:bg-white/2 ${
          align === "start" ? "items-start" : "items-center"
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function Showcase() {
  return (
    <Section
      label="Components"
      title="Sixteen components. Each one fetches its own data."
      intro="Nothing below is a mockup. Each component was handed the same two identifiers and queried Base in your browser as this page loaded."
    >
      <AgentProvider agentRegistry={DEMO_REGISTRY} agentId={DEMO_AGENT_ID}>
        <div
          className={`flex flex-col gap-2 border-b pb-6 md:flex-row md:items-baseline md:justify-between ${RULE}`}
        >
          <span className="text-xs text-text-secondary">
            Agent #{DEMO_AGENT_ID} · {DEMO_REGISTRY}
          </span>
          <span className="text-xs text-text-secondary">
            Queried live from Base
          </span>
        </div>

        <div className={`grid border-t border-l ${RULE} lg:grid-cols-3`}>
          <Cell name="AgentCard" slug="agent-card" className="lg:col-span-2">
            <AgentCard />
          </Cell>
          <Cell name="TagCloud" slug="tag-cloud">
            <TagCloud maxTags={8} />
          </Cell>

          <Cell name="ReputationDistribution" slug="reputation-distribution">
            <ReputationDistribution />
          </Cell>
          <Cell name="ReputationTimeline" slug="reputation-timeline">
            <ReputationTimeline />
          </Cell>
          <Cell name="EndpointStatus" slug="endpoint-status">
            <EndpointStatus />
          </Cell>

          <Cell
            name="FeedbackList"
            slug="feedback-list"
            align="start"
            className="lg:col-span-2"
          >
            <FeedbackList pageSize={7} />
          </Cell>
          <Cell name="ActivityLog" slug="activity-log">
            <ActivityLog pageSize={4} />
          </Cell>
        </div>

        <p className="max-w-2xl text-xs leading-relaxed text-text-secondary">
          The validation components aren't shown here — the Validation Registry
          isn't deployed to mainnet yet, so on Base they render their empty
          state by design. They're documented and previewable against testnet
          data.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          <Link
            to="/docs/components"
            className={`border px-8 py-3 text-sm hover:underline ${RULE}`}
          >
            Browse all components
          </Link>
          <span className="text-xs text-text-secondary">
            Identity · Reputation · Validation · Activity
          </span>
        </div>
      </AgentProvider>
    </Section>
  )
}

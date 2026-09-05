import { createFileRoute, Link } from "@tanstack/react-router"

const COMPONENT_GROUPS = [
  {
    title: "Providers",
    items: [
      {
        slug: "erc8004-provider",
        name: "ERC8004Provider",
        description:
          "Root context provider — holds API key and subgraph config.",
      },
      {
        slug: "agent-provider",
        name: "AgentProvider",
        description:
          "Optional wrapper that sets a default agent for child components.",
      },
    ],
  },
  {
    title: "Identity",
    items: [
      {
        slug: "agent-name",
        name: "AgentName",
        description: "Registered name from the identity registry.",
      },
      {
        slug: "agent-image",
        name: "AgentImage",
        description: "Registered image with FingerprintBadge fallback.",
      },
      {
        slug: "agent-description",
        name: "AgentDescription",
        description: "Registered description text.",
      },
      {
        slug: "agent-card",
        name: "AgentCard",
        description:
          "Composed card — avatar, name, description, owner, protocol badges.",
      },
      {
        slug: "endpoint-status",
        name: "EndpointStatus",
        description:
          "Service endpoints (MCP, A2A, OASF, web, email) with live status.",
      },
    ],
  },
  {
    title: "Reputation",
    items: [
      {
        slug: "reputation-score",
        name: "ReputationScore",
        description: "Inline badge showing average score and review count.",
      },
      {
        slug: "reputation-timeline",
        name: "ReputationTimeline",
        description: "Sparkline of average score over time.",
      },
      {
        slug: "reputation-distribution",
        name: "ReputationDistribution",
        description: "Histogram of feedback value spread.",
      },
      {
        slug: "feedback-list",
        name: "FeedbackList",
        description: "Paginated individual feedback entries.",
      },
      {
        slug: "tag-cloud",
        name: "TagCloud",
        description: "Weighted tag pills from feedback frequency.",
      },
    ],
  },
  {
    title: "Validation",
    items: [
      {
        slug: "verification-badge",
        name: "VerificationBadge",
        description: "Compact verification tier indicator.",
      },
      {
        slug: "validation-score",
        name: "ValidationScore",
        description: "Average validation score with fill bar and counts.",
      },
      {
        slug: "validation-list",
        name: "ValidationList",
        description: "Paginated individual validation entries.",
      },
      {
        slug: "validation-display",
        name: "ValidationDisplay",
        description: "Composed view — badge, score, and list.",
      },
    ],
  },
  {
    title: "Activity",
    items: [
      {
        slug: "last-activity",
        name: "LastActivity",
        description: "Relative timestamp of most recent on-chain event.",
      },
      {
        slug: "activity-log",
        name: "ActivityLog",
        description: "Chronological feed of all events across all registries.",
      },
    ],
  },
]

export const Route = createFileRoute("/docs/components/")({
  component: ComponentsIndex,
})

function ComponentsIndex() {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
          Components
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          All components in the library, grouped by registry. Each component
          fetches its own data — pass two identifiers and it works.
        </p>
      </div>

      {COMPONENT_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-white/40">
            {group.title}
          </h2>
          {/*
            data-markdown-ignore: navigation listing. Each row's name + summary
            collapse into one segment that doesn't substring-match the markdown
            twin's bullet syntax. Agents browse components via llms.txt.
          */}
          <div data-markdown-ignore className="flex flex-col">
            {group.items.map((item) => (
              <Link
                key={item.slug}
                to="/docs/components/$slug"
                params={{ slug: item.slug }}
                className="group flex flex-col gap-1 border-t border-black/60 px-2 py-3 hover:bg-neutral-200 sm:flex-row sm:items-baseline sm:gap-6 dark:border-white/10 dark:hover:bg-white/10"
              >
                <span className="font-mono text-sm text-neutral-900 group-hover:underline sm:w-52 sm:shrink-0 dark:text-white">
                  {item.name}
                </span>
                <span className="text-sm text-neutral-500 dark:text-white/50">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

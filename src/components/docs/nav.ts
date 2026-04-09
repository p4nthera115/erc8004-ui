export type NavItem =
  | { label: string; to: "/docs/introduction" }
  | { label: string; to: "/docs/installation" }
  | { label: string; to: "/docs/concepts" }
  | { label: string; to: "/docs/api-keys" }
  | { label: string; to: "/docs/recipes" }
  | { label: string; to: "/docs/theming" }
  | { label: string; to: "/docs/components" }
  | { label: string; to: "/docs/components/$slug"; slug: string }

export type NavGroup = {
  title?: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    title: "SECTIONS",
    items: [
      { label: "Introduction", to: "/docs/introduction" },
      { label: "Installation", to: "/docs/installation" },
      { label: "Concepts", to: "/docs/concepts" },
      { label: "API Keys", to: "/docs/api-keys" },
      { label: "Components", to: "/docs/components" },
      { label: "Theming", to: "/docs/theming" },
    ],
  },
  {
    title: "COMPONENTS",
    items: [
      {
        label: "ERC8004Provider",
        to: "/docs/components/$slug",
        slug: "erc8004-provider",
      },
      {
        label: "AgentProvider",
        to: "/docs/components/$slug",
        slug: "agent-provider",
      },
    ],
  },
  {
    title: "IDENTITY",
    items: [
      { label: "AgentName", to: "/docs/components/$slug", slug: "agent-name" },
      {
        label: "AgentImage",
        to: "/docs/components/$slug",
        slug: "agent-image",
      },
      {
        label: "AgentDescription",
        to: "/docs/components/$slug",
        slug: "agent-description",
      },
      { label: "AgentCard", to: "/docs/components/$slug", slug: "agent-card" },
      {
        label: "EndpointStatus",
        to: "/docs/components/$slug",
        slug: "endpoint-status",
      },
    ],
  },
  {
    title: "REPUTATION",
    items: [
      {
        label: "ReputationScore",
        to: "/docs/components/$slug",
        slug: "reputation-score",
      },
      {
        label: "ReputationTimeline",
        to: "/docs/components/$slug",
        slug: "reputation-timeline",
      },
      {
        label: "ReputationDistribution",
        to: "/docs/components/$slug",
        slug: "reputation-distribution",
      },
      {
        label: "FeedbackList",
        to: "/docs/components/$slug",
        slug: "feedback-list",
      },
      { label: "TagCloud", to: "/docs/components/$slug", slug: "tag-cloud" },
    ],
  },
  {
    title: "VALIDATION",
    items: [
      {
        label: "VerificationBadge",
        to: "/docs/components/$slug",
        slug: "verification-badge",
      },
      {
        label: "ValidationScore",
        to: "/docs/components/$slug",
        slug: "validation-score",
      },
      {
        label: "ValidationList",
        to: "/docs/components/$slug",
        slug: "validation-list",
      },
      {
        label: "ValidationDisplay",
        to: "/docs/components/$slug",
        slug: "validation-display",
      },
    ],
  },
  {
    title: "ACTIVITY",
    items: [
      {
        label: "LastActivity",
        to: "/docs/components/$slug",
        slug: "last-activity",
      },
      {
        label: "ActivityLog",
        to: "/docs/components/$slug",
        slug: "activity-log",
      },
    ],
  },
  {
    title: "GUIDES",
    items: [{ label: "Recipes", to: "/docs/recipes" }],
  },
]

export type FlatNavItem = {
  label: string
  path: string
  to: string
  slug?: string
}

export function flattenNav(nav: NavGroup[]): FlatNavItem[] {
  return nav.flatMap((group) =>
    group.items.map((item) =>
      "slug" in item
        ? {
            label: item.label,
            path: `/docs/components/${item.slug}`,
            to: item.to,
            slug: item.slug,
          }
        : { label: item.label, path: item.to, to: item.to }
    )
  )
}

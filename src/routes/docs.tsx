import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"

const NAV_GROUPS = [
  {
    label: "Getting Started",
    items: [
      { label: "Introduction", slug: "introduction" },
      { label: "Installation", slug: "installation" },
    ],
  },
  {
    label: "Components",
    items: [
      {
        label: "Fingerprint Badge",
        slug: "fingerprint-badge",
        status: "live" as const,
      },
      { label: "Identity", slug: "identity", status: "live" as const },
      { label: "Reputation", slug: "reputation", status: "live" as const },
      {
        label: "Endpoint Status",
        slug: "endpoint-status",
        status: "live" as const,
      },
      {
        label: "Activity Log",
        slug: "activity-log",
        status: "planned" as const,
      },
    ],
  },
]

const STATUS_BADGE = {
  live: (
    <span className="ml-auto text-[10px] font-medium text-green bg-green/10 px-1.5 py-0.5 rounded">
      Live
    </span>
  ),
  next: (
    <span className="ml-auto text-[10px] font-medium text-amber bg-amber/10 px-1.5 py-0.5 rounded">
      Next
    </span>
  ),
  planned: null,
}

function DocsSidebar() {
  return (
    <aside className="w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const status = "status" in item ? item.status : undefined
              return (
                <li key={item.slug}>
                  <Link
                    to="/docs/components/$slug"
                    params={{ slug: item.slug }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
                    activeProps={{
                      className:
                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left bg-accent/15 text-accent font-medium",
                    }}
                  >
                    {item.label}
                    {status && STATUS_BADGE[status]}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}

export const Route = createFileRoute("/docs")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/docs" || location.pathname === "/docs/") {
      throw redirect({
        to: "/docs/components/$slug",
        params: { slug: "fingerprint-badge" },
      })
    }
  },
  component: () => (
    <div className="max-w-screen-2xl mx-auto px-6 flex gap-8 min-h-[calc(100vh-3.5rem)]">
      <DocsSidebar />
      <main className="flex-1 min-w-0 py-10 max-w-3xl">
        <Outlet />
      </main>
    </div>
  ),
})

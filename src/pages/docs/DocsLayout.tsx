import { useHash, navigate } from '../../lib/router'
import { FingerprintBadgeDocs } from './components/FingerprintBadgeDocs'
import { PlaceholderDocs } from './components/PlaceholderDocs'

const NAV_GROUPS = [
  {
    label: 'Getting Started',
    items: [
      { label: 'Introduction', slug: 'introduction' },
      { label: 'Installation', slug: 'installation' },
    ],
  },
  {
    label: 'Components',
    items: [
      { label: 'Fingerprint Badge', slug: 'fingerprint-badge', status: 'live' as const },
      { label: 'Agent Card', slug: 'agent-card', status: 'next' as const },
      { label: 'Reputation Display', slug: 'reputation-display', status: 'planned' as const },
      { label: 'Endpoint Status', slug: 'endpoint-status', status: 'planned' as const },
      { label: 'Activity Log', slug: 'activity-log', status: 'planned' as const },
    ],
  },
]

const STATUS_BADGE = {
  live: <span className="ml-auto text-[10px] font-medium text-green bg-green/10 px-1.5 py-0.5 rounded">Live</span>,
  next: <span className="ml-auto text-[10px] font-medium text-amber bg-amber/10 px-1.5 py-0.5 rounded">Next</span>,
  planned: null,
}

function Sidebar({ activeSlug }: { activeSlug: string }) {
  return (
    <aside className="w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = activeSlug === item.slug
              const status = 'status' in item ? item.status : undefined
              return (
                <li key={item.slug}>
                  <button
                    onClick={() => navigate(`/docs/components/${item.slug}`)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-accent/15 text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                    }`}
                  >
                    {item.label}
                    {status && STATUS_BADGE[status]}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}

const COMPONENT_PAGES: Record<string, React.ReactNode> = {
  'fingerprint-badge': <FingerprintBadgeDocs />,
  'agent-card': (
    <PlaceholderDocs
      name="Agent Card"
      description="Complete identity card: fingerprint badge, name, description, services, and reputation summary."
      status="next"
    />
  ),
  'reputation-display': (
    <PlaceholderDocs
      name="Reputation Display"
      description='Aggregate score visualization with individual reviews. Tag-aware rendering for labels like "starred", "uptime", "reachable".'
      status="planned"
    />
  ),
  'endpoint-status': (
    <PlaceholderDocs
      name="Endpoint Status"
      description="Live service list with real-time health checks. Shows protocol, URL, and current availability for each registered endpoint."
      status="planned"
    />
  ),
  'activity-log': (
    <PlaceholderDocs
      name="Activity Log"
      description="Chronological on-chain events feed — registrations, updates, feedback, endpoint calls, deregistrations."
      status="planned"
    />
  ),
  'introduction': (
    <PlaceholderDocs
      name="Introduction"
      description="ERC-8004 Agent Identity Component Library — a set of self-contained React components for AI agent identity, reputation, and activity."
      status="planned"
    />
  ),
  'installation': (
    <PlaceholderDocs
      name="Installation"
      description="Components are distributed shadcn-style. Copy the source directly into your project."
      status="planned"
    />
  ),
}

export function DocsLayout() {
  const hash = useHash()
  // hash format: /docs/components/:slug
  const slug = hash.split('/docs/components/')[1] ?? 'fingerprint-badge'

  const page = COMPONENT_PAGES[slug] ?? COMPONENT_PAGES['fingerprint-badge']

  return (
    <div className="max-w-screen-2xl mx-auto px-6 flex gap-8 min-h-[calc(100vh-3.5rem)]">
      <Sidebar activeSlug={slug} />
      <main className="flex-1 min-w-0 py-10 max-w-3xl">
        {page}
      </main>
    </div>
  )
}

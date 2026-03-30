import { createFileRoute, notFound } from '@tanstack/react-router'
import { FingerprintBadgeDocs } from '../pages/docs/components/FingerprintBadgeDocs'
import { PlaceholderDocs } from '../pages/docs/components/PlaceholderDocs'

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

export const Route = createFileRoute('/docs/components/$slug')({
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

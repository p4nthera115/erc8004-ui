import { FingerprintBadge } from "../components/fingerprint/FingerprintBadge"
import { navigate } from "../lib/router"

const DEMO_AGENTS = [
  {
    registry: "eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e",
    id: 1,
    label: "Agent #1",
  },
  {
    registry: "eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e",
    id: 22,
    label: "Agent #22",
  },
  {
    registry: "eip155:137:0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
    id: 7,
    label: "Agent #7",
  },
  {
    registry: "eip155:8453:0xdAC17F958D2ee523a2206206994597C13D831ec7",
    id: 100,
    label: "Agent #100",
  },
]

const COMPONENTS = [
  {
    name: "Fingerprint Badge",
    slug: "fingerprint-badge",
    description:
      "Deterministic visual identity generated from an agent's on-chain identifier. FNV-1a hash drives dithering parameters — every agent gets a unique, unreplicable visual fingerprint.",
    status: "live" as const,
    tags: ["SVG", "Dithering", "Deterministic"],
  },
  {
    name: "Agent Card",
    slug: "agent-card",
    description:
      "Complete identity card: fingerprint badge, name, description, services, and reputation summary. The primary way to display an agent.",
    status: "next" as const,
    tags: ["Identity", "Composite"],
  },
  {
    name: "Reputation Display",
    slug: "reputation-display",
    description:
      'Aggregate score visualization with individual reviews. Tag-aware rendering for labels like "starred", "uptime", "reachable".',
    status: "planned" as const,
    tags: ["Feedback", "Tags"],
  },
  {
    name: "Endpoint Status",
    slug: "endpoint-status",
    description:
      "Live service list with real-time health checks. Shows protocol, URL, and current availability for each registered endpoint.",
    status: "planned" as const,
    tags: ["Health", "Services"],
  },
  {
    name: "Activity Log",
    slug: "activity-log",
    description:
      "Chronological on-chain events feed — registrations, updates, feedback, endpoint calls, deregistrations.",
    status: "planned" as const,
    tags: ["Events", "Timeline"],
  },
]

function StatusBadge({ status }: { status: "live" | "next" | "planned" }) {
  const config = {
    live: {
      label: "Live",
      dotClass: "bg-green pulse-dot",
      textClass: "text-green",
    },
    next: { label: "Next", dotClass: "bg-amber", textClass: "text-amber" },
    planned: {
      label: "Planned",
      dotClass: "bg-text-muted",
      textClass: "text-text-muted",
    },
  }
  const c = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`} />
      {c.label}
    </span>
  )
}

function ComponentCard({
  component,
}: {
  component: (typeof COMPONENTS)[number]
}) {
  const canNavigate = component.status === "live" || component.status === "next"
  return (
    <button
      onClick={() => navigate(`/docs/components/${component.slug}`)}
      disabled={!canNavigate}
      className="component-card rounded-xl border border-border-subtle bg-surface-raised p-6 flex flex-col gap-3 text-left w-full disabled:cursor-default"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          {component.name}
        </h3>
        <StatusBadge status={component.status} />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">
        {component.description}
      </p>
      <div className="flex gap-2 flex-wrap pt-1">
        {component.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-accent-glow text-accent font-mono"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}

export function Home() {
  return (
    <div className="min-h-screen grid-bg">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="flex flex-col items-center text-center gap-8">
          <div className="fingerprint-glow">
            <FingerprintBadge
              agentRegistry="eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e"
              agentId={1}
              size={220}
            />
          </div>

          <div className="flex flex-col gap-4 max-w-2xl">
            <h1 className="text-5xl font-bold tracking-tight text-text-primary leading-tight">
              The visual layer for <span className="text-accent">ERC-8004</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Self-contained React components for AI agent identity, reputation,
              and activity. Trustless by design. Distributed as an{" "}
              <span className="text-text-primary font-medium">
                npm package
              </span>{" "}
              — install, wrap with a provider, drop components in.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/docs/components/fingerprint-badge")}
              className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dim transition-colors"
            >
              Browse Components
            </button>
            <div className="rounded-xl border border-border-subtle bg-surface-raised overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle">
                <span className="w-2 h-2 rounded-full bg-red/60" />
                <span className="w-2 h-2 rounded-full bg-amber/60" />
                <span className="w-2 h-2 rounded-full bg-green/60" />
                <span className="ml-2 text-xs text-text-muted font-mono">
                  usage.tsx
                </span>
              </div>
              <pre className="px-5 py-3 text-sm font-mono text-left">
                <code>
                  <span className="text-accent">{"<AgentCard"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-amber">agentRegistry</span>
                  <span className="text-text-muted">=</span>
                  <span className="text-green">{'"eip155:1:0x742..."'}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-amber">agentId</span>
                  <span className="text-text-muted">=</span>
                  <span className="text-accent">{"{22}"}</span>
                  {"\n"}
                  <span className="text-accent">{"/>"}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Fingerprint uniqueness demo */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-subtle">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Every agent, a unique fingerprint
          </h2>
          <p className="text-text-secondary">
            Same shader, different seeds. The identity is derived
            deterministically from on-chain data.
          </p>
        </div>
        <div className="flex justify-center gap-8 flex-wrap">
          {DEMO_AGENTS.map((agent) => (
            <div
              key={`${agent.registry}:${agent.id}`}
              className="flex flex-col items-center gap-3"
            >
              <div className="rounded-2xl border border-border-subtle bg-surface-raised p-3">
                <FingerprintBadge
                  agentRegistry={agent.registry}
                  agentId={agent.id}
                  size={140}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  {agent.label}
                </p>
                <p className="text-xs text-text-muted font-mono">
                  {agent.registry.split(":")[2].slice(0, 6)}...
                  {agent.registry.split(":")[2].slice(-4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Components grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-subtle">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Components
          </h2>
          <p className="text-text-secondary">
            Each component is self-contained. Pass identifiers, it fetches its
            own on-chain data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPONENTS.map((component) => (
            <ComponentCard key={component.name} component={component} />
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-subtle">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-6">
            <div className="text-2xl mb-3">{"{"}</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Trustless
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Components never accept display data as props. Only identifiers go
              in — all rendered data comes from on-chain sources.
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-6">
            <div className="text-2xl mb-3">0x</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Self-contained
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              No providers. No wrappers. No global state. Drop a component in,
              pass the agent identifier, it works.
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-6">
            <div className="text-2xl mb-3">npm</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              npm install
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              One install. One provider. Import components. Source is open and
              readable — hooks and utilities are public API.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            ERC-8004 Agent Identity Component Library
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://p4n.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              @p4nthera_
            </a>
            <span className="text-text-muted">|</span>
            <a
              href="https://fingerprint-erc8004.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              Live MVP
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { Link } from "@tanstack/react-router"
import { RULE } from "./section"

const DOCS = [
  { label: "Introduction", to: "/docs/introduction" },
  { label: "Installation", to: "/docs/installation" },
  { label: "Concepts", to: "/docs/concepts" },
  { label: "API Keys", to: "/docs/api-keys" },
  { label: "Theming", to: "/docs/theming" },
]

const COMPONENTS = [
  { label: "AgentCard", slug: "agent-card" },
  { label: "ReputationScore", slug: "reputation-score" },
  { label: "FeedbackList", slug: "feedback-list" },
  { label: "VerificationBadge", slug: "verification-badge" },
  { label: "ActivityLog", slug: "activity-log" },
]

const EXTERNAL = [
  { label: "GitHub", href: "https://github.com/p4nthera115/erc8004-ui" },
  { label: "ERC-8004 spec", href: "https://eips.ethereum.org/EIPS/eip-8004" },
  { label: "Agent0 SDK", href: "https://docs.sdk.ag0.xyz" },
  { label: "The Graph", href: "https://thegraph.com/studio/" },
]

const AGENT_FILES = [
  { label: "llms.txt", href: "/llms.txt" },
  { label: "llms-full.txt", href: "/llms-full.txt" },
  { label: "agents.md", href: "/agents.md" },
  { label: "openapi.json", href: "/openapi.json" },
  { label: "sitemap.xml", href: "/sitemap.xml" },
]

const PROJECT = [
  { label: "About", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
  { label: "Privacy", to: "/privacy" as const },
]

function Column({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-3 border-t px-6 py-8 md:border-t-0 md:border-r md:px-8 md:last:border-r-0 ${RULE}`}>
      <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">
        {title}
      </span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="font-mono">
      <div className="grid md:grid-cols-4">
        <Column title="Docs">
          {DOCS.map((item) => (
            <Link key={item.to} to={item.to} className="text-sm hover:underline">
              {item.label}
            </Link>
          ))}
        </Column>
        <Column title="Components">
          {COMPONENTS.map((item) => (
            <Link
              key={item.slug}
              to="/docs/components/$slug"
              params={{ slug: item.slug }}
              className="text-sm hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </Column>
        <Column title="Reference">
          {EXTERNAL.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
            >
              {item.label}
            </a>
          ))}
        </Column>
        <Column title="For agents">
          {AGENT_FILES.map((item) => (
            <a key={item.href} href={item.href} className="text-sm hover:underline">
              {item.label}
            </a>
          ))}
        </Column>
      </div>
      <div
        className={`flex flex-col gap-3 border-t px-6 py-6 text-xs text-text-secondary md:flex-row md:items-center md:justify-between md:px-8 ${RULE}`}
      >
        <span className="max-w-xl">
          @p4n/erc8004-ui — component library for ERC-8004 agent data. An
          independent project, not affiliated with or endorsed by the authors of
          ERC-8004.
        </span>
        <nav className="flex gap-4">
          {PROJECT.map((item) => (
            <Link key={item.to} to={item.to} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <span>Data indexed by The Graph. Not affiliated with the ERC-8004 authors.</span>
      </div>
    </footer>
  )
}

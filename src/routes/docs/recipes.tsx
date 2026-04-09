import { createFileRoute } from "@tanstack/react-router"
import {
  CodeBlock,
  InlineCode,
  SectionHeading,
} from "@/components/docs/DocPageLayout"

export const Route = createFileRoute("/docs/recipes")({
  component: Recipes,
})

function Recipes() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-white">Recipes</h1>
        <p className="text-base text-white/60 leading-relaxed max-w-prose">
          Complete page-level compositions ready to copy. Each example is
          self-contained and uses the same demo agent used throughout the docs.
        </p>
      </div>

      {/* Agent Profile Page */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Agent Profile Page</SectionHeading>
        <p className="text-sm text-white leading-relaxed max-w-prose">
          A full profile layout covering identity, reputation, and validation.{" "}
          <InlineCode>AgentProvider</InlineCode> eliminates prop repetition —
          every child component inherits the same agent identity.
        </p>
        <CodeBlock
          code={`import {
  ERC8004Provider,
  AgentProvider,
  AgentCard,
  EndpointStatus,
  ReputationScore,
  ReputationTimeline,
  ReputationDistribution,
  FeedbackList,
  TagCloud,
  VerificationBadge,
  ValidationScore,
  LastActivity,
} from "@erc8004/ui"

function AgentProfile({ registry, agentId }: { registry: string; agentId: number }) {
  return (
    <AgentProvider agentRegistry={registry} agentId={agentId}>
      {/* Identity section */}
      <AgentCard />
      <EndpointStatus />

      {/* Reputation section */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <ReputationScore />
        <VerificationBadge />
        <LastActivity />
      </div>
      <TagCloud />
      <ReputationTimeline />
      <ReputationDistribution />
      <FeedbackList />

      {/* Validation section */}
      <ValidationScore />
    </AgentProvider>
  )
}`}
        />
      </section>

      {/* Marketplace Listing Row */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Marketplace Listing Row</SectionHeading>
        <p className="text-sm text-white leading-relaxed max-w-prose">
          Compact row for search results or directory listings. Renders fast —
          each component fetches only the fields it needs.
        </p>
        <CodeBlock
          code={`import {
  AgentProvider,
  AgentImage,
  AgentName,
  ReputationScore,
  VerificationBadge,
  LastActivity,
} from "@erc8004/ui"

function AgentRow({ registry, agentId }: { registry: string; agentId: number }) {
  return (
    <AgentProvider agentRegistry={registry} agentId={agentId}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <AgentImage />
        <AgentName />
        <ReputationScore />
        <VerificationBadge />
        <LastActivity />
      </div>
    </AgentProvider>
  )
}`}
        />
      </section>

      {/* Agent Comparison */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Agent Comparison</SectionHeading>
        <p className="text-sm text-white leading-relaxed max-w-prose">
          Side-by-side comparison of multiple agents. Each{" "}
          <InlineCode>AgentProvider</InlineCode> scopes its context
          independently — components inside one provider won't bleed into
          another.
        </p>
        <CodeBlock
          code={`import { AgentProvider, AgentCard, ReputationScore, TagCloud } from "@erc8004/ui"

function CompareAgents({ agents }: { agents: { registry: string; id: number }[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: \`repeat(\${agents.length}, 1fr)\`,
        gap: "1rem",
      }}
    >
      {agents.map((agent) => (
        <AgentProvider
          key={\`\${agent.registry}-\${agent.id}\`}
          agentRegistry={agent.registry}
          agentId={agent.id}
        >
          <AgentCard />
          <ReputationScore />
          <TagCloud />
        </AgentProvider>
      ))}
    </div>
  )
}`}
        />
      </section>

      {/* Minimal Embed */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Minimal Embed</SectionHeading>
        <p className="text-sm text-white leading-relaxed max-w-prose">
          A small inline trust signal for chat interfaces, sidebars, or
          tooltips.
        </p>
        <CodeBlock
          code={`import { AgentProvider, AgentName, ReputationScore, VerificationBadge } from "@erc8004/ui"

function AgentTrustBadge({ registry, agentId }: { registry: string; agentId: number }) {
  return (
    <AgentProvider agentRegistry={registry} agentId={agentId}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <AgentName />
        <ReputationScore />
        <VerificationBadge />
      </div>
    </AgentProvider>
  )
}`}
        />
      </section>

      {/* Cache note */}
      <section className="border border-white/10 bg-white/2 px-5 py-4">
        <p className="text-sm text-white/50 leading-relaxed">
          <span className="text-white/70 font-mono">Cache efficiency</span>
          {" — "}
          When multiple components target the same agent on the same page,
          TanStack Query deduplicates the Subgraph requests automatically. Only
          one network call happens, and all components read from the shared
          cache. You don't need to manage this.
        </p>
      </section>
    </div>
  )
}

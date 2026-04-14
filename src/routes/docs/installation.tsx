import { createFileRoute, Link } from "@tanstack/react-router"
import { SectionHeading } from "@/components/docs/DocPageLayout"
import { CodeBlock, InlineCode } from "@/components/docs/CodeBlock"

export const Route = createFileRoute("/docs/installation")({
  component: Installation,
})

function Installation() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          Installation
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          Install the package, add peer dependencies, and configure your Graph
          API key — then drop any component into your app with a single import.
        </p>
      </div>

      {/* Install */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Install</SectionHeading>
        <div className="border border-black/60 dark:border-white/10 bg-neutral-50 dark:bg-white/2 px-5 py-4">
          <p className="text-sm text-neutral-500 dark:text-white/50 leading-relaxed">
            <span className="text-neutral-600 dark:text-white/70 font-mono">
              Note
            </span>
            {" — "}
            <InlineCode>@erc8004/ui</InlineCode> is a placeholder name — the
            package is not yet published to npm. Until publication, install
            directly from GitHub:
          </p>
          <div className="mt-3">
            <CodeBlock code={`npm install github:p4nthera115/erc8004-ui`} />
          </div>
          <p className="text-sm text-neutral-500 dark:text-white/50 leading-relaxed mt-3">
            All other code examples on this page use the final import path and
            will work unchanged once the package is published.
          </p>
        </div>
        <CodeBlock code={`npm install @erc8004/ui`} />
        <p className="text-sm text-neutral-400 dark:text-white/40 font-mono">
          or
        </p>
        <CodeBlock code={`pnpm add @erc8004/ui\nyarn add @erc8004/ui`} />
      </section>

      {/* Peer deps */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Peer Dependencies</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The library requires React and TanStack Query as peer dependencies:
        </p>
        <CodeBlock code={`npm install react react-dom @tanstack/react-query`} />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          If you already have React in your project, you only need to add{" "}
          <InlineCode>@tanstack/react-query</InlineCode>. TanStack Query handles
          caching and deduplication so multiple components on the same page
          don't make redundant network requests.
        </p>
      </section>

      {/* API key */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Get a Graph API Key</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Components fetch agent data from{" "}
          <a
            href="https://thegraph.com/studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            The Graph
          </a>
          , a blockchain indexing service. Sign up at{" "}
          <a
            href="https://thegraph.com/studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            thegraph.com/studio
          </a>{" "}
          to get a free API key. There is a generous free tier — no credit card
          required for development.
        </p>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          This is a{" "}
          <span className="text-neutral-600 dark:text-white/80">
            read-only query key
          </span>{" "}
          for usage tracking — it's safe to use in frontend code. It does not
          grant write access to anything.
        </p>
      </section>

      {/* Minimal example */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Minimal Working Example</SectionHeading>
        <CodeBlock
          code={`import { ERC8004Provider, ReputationScore } from "@erc8004/ui"

function App() {
  return (
    <ERC8004Provider apiKey="your-graph-api-key">
      <ReputationScore
        agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        agentId={2290}
      />
    </ERC8004Provider>
  )
}`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The component handles all data fetching internally.{" "}
          <InlineCode>ERC8004Provider</InlineCode> auto-creates a TanStack Query
          client if you haven't set one up.
        </p>
      </section>

      {/* Existing TanStack Query */}
      <section className="flex flex-col gap-4">
        <SectionHeading>If You Already Use TanStack Query</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Wrap with your own <InlineCode>QueryClientProvider</InlineCode>.{" "}
          <InlineCode>ERC8004Provider</InlineCode> detects an existing
          QueryClient and shares it — no duplicate clients, no wasted cache.
        </p>
        <CodeBlock
          code={`import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ERC8004Provider, ReputationScore } from "@erc8004/ui"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey="your-graph-api-key">
        <ReputationScore
          agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
          agentId={2290}
        />
      </ERC8004Provider>
    </QueryClientProvider>
  )
}`}
        />
      </section>

      {/* AgentProvider */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Using AgentProvider for Profile Pages</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          When rendering multiple components for the same agent, use{" "}
          <InlineCode>AgentProvider</InlineCode> to avoid repeating{" "}
          <InlineCode>agentRegistry</InlineCode> and{" "}
          <InlineCode>agentId</InlineCode> on every component. Individual
          components can still override with their own props.
        </p>
        <CodeBlock
          code={`import { AgentProvider, AgentCard, ReputationScore, FeedbackList } from "@erc8004/ui"

<AgentProvider agentRegistry="eip155:8453:0x..." agentId={2290}>
  <AgentCard />
  <ReputationScore />
  <FeedbackList />
</AgentProvider>`}
        />
      </section>

      {/* Next steps */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Next Steps</SectionHeading>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              to="/docs/concepts"
              className="text-sm text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-white transition-colors underline underline-offset-2"
            >
              Concepts
            </Link>
            <span className="text-sm text-neutral-400 dark:text-white/40">
              {" "}
              — understand what agentRegistry and agentId mean
            </span>
          </li>
          <li>
            <Link
              to="/docs/components"
              className="text-sm text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-white transition-colors underline underline-offset-2"
            >
              Components
            </Link>
            <span className="text-sm text-neutral-400 dark:text-white/40">
              {" "}
              — browse all available components with live previews
            </span>
          </li>
          <li>
            <Link
              to="/docs/recipes"
              className="text-sm text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-white transition-colors underline underline-offset-2"
            >
              Recipes
            </Link>
            <span className="text-sm text-neutral-400 dark:text-white/40">
              {" "}
              — see full page-level examples ready to copy
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}

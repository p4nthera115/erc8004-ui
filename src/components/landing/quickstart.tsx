import { Link } from "@tanstack/react-router"
import { CodeBlock } from "@/components/docs/CodeBlock"
import { RULE, Section } from "./section"

const STEPS = [
  {
    n: "01",
    title: "Install",
    body: "The library plus its one peer dependency. React 18 or 19.",
    code: `npm install @p4n/erc8004-ui @tanstack/react-query`,
    language: "terminal",
  },
  {
    n: "02",
    title: "Wrap your app once",
    body: "ERC8004Provider holds infrastructure config only — your Graph API key, and optional subgraph overrides. It stores no agent data.",
    code: `import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ERC8004Provider } from "@p4n/erc8004-ui"

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey={import.meta.env.VITE_GRAPH_API_KEY}>
        <Profile />
      </ERC8004Provider>
    </QueryClientProvider>
  )
}`,
  },
  {
    n: "03",
    title: "Render an agent",
    body: "Name the agent once and every component below it resolves its own identity, runs its own query, and shares the cache.",
    code: `import {
  AgentProvider,
  AgentCard,
  ReputationScore,
  FeedbackList,
} from "@p4n/erc8004-ui"

function Profile() {
  return (
    <AgentProvider
      agentRegistry="eip155:8453:0x8004...a432"
      agentId={888}
    >
      <AgentCard />
      <ReputationScore />
      <FeedbackList />
    </AgentProvider>
  )
}`,
  },
]

export function Quickstart() {
  return (
    <Section
      label="Quickstart"
      title="Three steps, and the data is on screen."
      intro="A read-only Graph API key is the only credential involved. No wallet, no RPC provider, no indexer to run."
    >
      <div className={`flex flex-col border-t ${RULE}`}>
        {STEPS.map((step) => (
          <div
            key={step.n}
            className={`grid gap-6 border-b py-8 lg:grid-cols-[16rem_1fr] lg:gap-12 ${RULE}`}
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-secondary">{step.n}</span>
              <h3 className="text-sm">{step.title}</h3>
              <p className="text-xs leading-relaxed text-text-secondary">
                {step.body}
              </p>
            </div>
            <div className="min-w-0">
              <CodeBlock code={step.code} language={step.language} />
            </div>
          </div>
        ))}
      </div>

      <div className={`border p-5 text-xs leading-relaxed text-text-secondary ${RULE}`}>
        <span className="text-text-primary">Note</span> — @p4n/erc8004-ui is a
        placeholder name; the package isn't on npm yet. Until it is, install
        straight from the repo with{" "}
        <span className="text-text-primary">
          npm install github:p4nthera115/erc8004-ui
        </span>
        . Every example above works unchanged once it's published.
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Link
          to="/docs/installation"
          className={`border px-8 py-3 text-sm hover:underline ${RULE}`}
        >
          Full installation guide
        </Link>
        <Link
          to="/docs/api-keys"
          className="text-sm text-text-secondary hover:underline"
        >
          Getting a Graph API key →
        </Link>
      </div>
    </Section>
  )
}

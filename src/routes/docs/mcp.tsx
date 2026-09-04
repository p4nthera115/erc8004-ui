import { createFileRoute } from "@tanstack/react-router"
import { SectionHeading } from "@/components/docs/DocPageLayout"
import { CodeBlock, InlineCode } from "@/components/docs/CodeBlock"
import { Callout } from "@/components/docs/Callout"

export const Route = createFileRoute("/docs/mcp")({
  component: Mcp,
})

const PROSE =
  "text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose"

/** Tool reference rows — kept as data so the list stays scannable. */
const DOC_TOOLS = [
  {
    name: "list_components",
    body: (
      <>
        Lists every component grouped by registry. Takes an optional{" "}
        <InlineCode>group</InlineCode> filter — <InlineCode>Providers</InlineCode>,{" "}
        <InlineCode>Identity</InlineCode>, <InlineCode>Reputation</InlineCode>,{" "}
        <InlineCode>Validation</InlineCode>, or <InlineCode>Activity</InlineCode>.
      </>
    ),
  },
  {
    name: "get_component",
    body: (
      <>
        Full documentation for one component — description, caveats, import line,
        usage, worked examples, an in-context composition example, the props
        table, and how it handles loading, error, and empty states. Accepts a
        name (<InlineCode>ReputationScore</InlineCode>) or a slug (
        <InlineCode>reputation-score</InlineCode>).
      </>
    ),
  },
  {
    name: "get_setup_guide",
    body: (
      <>
        Returns any guide from this site: <InlineCode>introduction</InlineCode>,{" "}
        <InlineCode>installation</InlineCode>, <InlineCode>concepts</InlineCode>,{" "}
        <InlineCode>api-keys</InlineCode>, <InlineCode>components</InlineCode>,{" "}
        <InlineCode>theming</InlineCode>, or <InlineCode>mcp</InlineCode>.
        Defaults to <InlineCode>installation</InlineCode>.
      </>
    ),
  },
  {
    name: "get_types",
    body: (
      <>
        The library's exported TypeScript definitions — the shape of the on-chain
        data these components render.
      </>
    ),
  },
]

const LIVE_TOOLS = [
  {
    name: "check_chain_support",
    body: (
      <>
        Introspects a chain's deployed subgraph and reports which components will
        actually work on it. Accepts a chain id (<InlineCode>8453</InlineCode>), a
        chain name (<InlineCode>base</InlineCode>), or a full{" "}
        <InlineCode>agentRegistry</InlineCode> string. Call it with no argument to
        list every chain the library has a subgraph for.
      </>
    ),
    why: "This catches a failure mode documentation cannot: when a deployed schema stops exposing a field that a component queries, that component breaks on that chain even though its docs are still correct. Checking first is cheaper than debugging an empty component later.",
  },
  {
    name: "check_agent",
    body: (
      <>
        Looks up a specific agent and reports which components will render real
        data for it, which will render an empty state, and which are unsupported
        on its chain. Use it to verify an <InlineCode>agentRegistry</InlineCode> /{" "}
        <InlineCode>agentId</InlineCode> pair is real before building a UI around
        it.
      </>
    ),
    why: "An agent with no validations will render an empty ValidationList no matter how correct your code is. This tool tells you that before you write it.",
  },
]

function ToolList({
  tools,
}: {
  tools: Array<{ name: string; body: React.ReactNode; why?: string }>
}) {
  return (
    <div className="flex flex-col gap-6">
      {tools.map((tool) => (
        <div key={tool.name} className="flex flex-col gap-2">
          <h3 className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
            {tool.name}
          </h3>
          <p className={PROSE}>{tool.body}</p>
          {tool.why && (
            <p className="text-sm text-neutral-500 dark:text-white/50 leading-relaxed max-w-prose">
              {tool.why}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function Mcp() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          MCP Server
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          An MCP server that gives AI coding agents structured access to this
          library — the same component documentation this site renders, plus live
          checks against the deployed subgraph that static documentation cannot
          provide.
        </p>
      </div>

      <p className={PROSE}>
        If your agent can already fetch{" "}
        <a
          href="/llms.txt"
          className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          llms.txt
        </a>
        , the MCP server adds three things: selective retrieval (fetch one
        component's docs instead of a 90KB bundle), no network dependency for
        documentation, and two live tools that answer questions about real
        on-chain state.
      </p>

      {/* Setup */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Setup</SectionHeading>
        <p className={PROSE}>
          Add the server to your MCP client configuration. For Claude Code:
        </p>
        <CodeBlock
          code={`claude mcp add erc8004-ui --env GRAPH_API_KEY=your-graph-api-key -- npx -y @erc8004/ui-mcp`}
        />
        <p className={PROSE}>Or configure it directly:</p>
        <CodeBlock
          code={`{
  "mcpServers": {
    "erc8004-ui": {
      "command": "npx",
      "args": ["-y", "@erc8004/ui-mcp"],
      "env": { "GRAPH_API_KEY": "your-graph-api-key" }
    }
  }
}`}
        />
        <Callout>
          <span className={PROSE}>
            <InlineCode>GRAPH_API_KEY</InlineCode> is the same read-only Graph key
            the components use — see{" "}
            <a
              href="/docs/api-keys"
              className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              API Keys
            </a>
            . It is optional: without it the four documentation tools work
            normally and the two live tools return setup instructions instead of
            results.
          </span>
        </Callout>
      </section>

      {/* Documentation tools */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Documentation Tools</SectionHeading>
        <p className={PROSE}>
          These read a build-time snapshot of the same registry that generates
          this site, so they cannot drift from what you are reading. They need no
          network access.
        </p>
        <ToolList tools={DOC_TOOLS} />
      </section>

      {/* Live tools */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Live Tools</SectionHeading>
        <p className={PROSE}>
          These query The Graph at runtime. They exist because the deployed
          subgraph schema drifts from the documented data model, and because
          whether a component renders anything depends on the specific agent you
          point it at.
        </p>
        <ToolList tools={LIVE_TOOLS} />
      </section>

      {/* Why both */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Why Both</SectionHeading>
        <p className={PROSE}>
          The documentation tools answer <em>how do I use this component</em>. The
          live tools answer <em>will it show anything</em>. Static documentation
          can only answer the first — the second depends on chain state that
          changes independently of this library.
        </p>
      </section>
    </div>
  )
}

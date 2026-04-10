import { createFileRoute } from "@tanstack/react-router"
import { CodeBlock, SectionHeading } from "@/components/docs/DocPageLayout"

export const Route = createFileRoute("/docs/api-keys")({
  component: ApiKeys,
})

function ApiKeys() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          API Keys
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          Components fetch agent data from The Graph, a blockchain indexing
          service. You need a free API key to authenticate your requests.
        </p>
      </div>

      {/* How to get one */}
      <section className="flex flex-col gap-4">
        <SectionHeading>How to Get One</SectionHeading>
        <ol className="flex flex-col gap-3">
          {[
            <>
              Go to{" "}
              <a
                href="https://thegraph.com/studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                thegraph.com/studio
              </a>{" "}
              and create an account
            </>,
            "Create an API key in the dashboard",
            "Copy the key",
            <>
              Pass it to{" "}
              <code className="font-mono text-neutral-700 dark:text-white/80 bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
                ERC8004Provider
              </code>
            </>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="font-mono text-xs text-neutral-400 dark:text-white/30 mt-0.5 shrink-0 w-4">
                {i + 1}.
              </span>
              <span className="text-sm text-neutral-700 dark:text-white leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>
        <CodeBlock
          code={`<ERC8004Provider apiKey="your-graph-api-key">
  {/* your components */}
</ERC8004Provider>`}
        />
      </section>

      {/* Is it safe */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Is It Safe to Use in Frontend Code?</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Yes. Graph API keys are read-only query keys. They exist for usage
          tracking and rate limiting, not access control. They cannot modify any
          data. This is the same pattern used by every dApp that queries The
          Graph — including all major DeFi protocols.
        </p>
      </section>

      {/* Free tier */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Free Tier</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The Graph offers a free tier that's sufficient for development and
          moderate production use. Check{" "}
          <a
            href="https://thegraph.com/studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            their pricing page
          </a>{" "}
          for current limits.
        </p>
      </section>

      {/* Custom subgraph */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Custom Subgraph Endpoint</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          If you run your own Subgraph or use a different indexer, use the{" "}
          <code className="font-mono text-neutral-700 dark:text-white/80 bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
            subgraphOverrides
          </code>{" "}
          prop on{" "}
          <code className="font-mono text-neutral-700 dark:text-white/80 bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
            ERC8004Provider
          </code>{" "}
          to override the default endpoint for any chain:
        </p>
        <CodeBlock
          code={`<ERC8004Provider
  apiKey="your-key"
  subgraphOverrides={{
    1: "https://your-custom-subgraph.com/ethereum",
    8453: "https://your-custom-subgraph.com/base",
  }}
>`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Keys are chain IDs. Overrides apply per-chain — chains not listed fall
          back to the default Graph endpoints.
        </p>
      </section>
    </div>
  )
}

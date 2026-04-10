import { createFileRoute } from "@tanstack/react-router"
import { SectionHeading } from "@/components/docs/DocPageLayout"
import { InlineCode } from "@/components/docs/CodeBlock"

export const Route = createFileRoute("/docs/introduction")({
  component: Introduction,
})

function Introduction() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          Introduction
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          Drop-in React components for displaying verified AI agent data from
          the ERC-8004 standard — built for developers who don't want to become
          Subgraph experts.
        </p>
      </div>

      {/* Why use a library */}
      <section className="flex flex-col gap-6">
        <SectionHeading>Why use this library?</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Displaying ERC-8004 agent data looks straightforward — fetch some
          fields, render them. In practice, the Subgraph has enough quirks that
          AI-generated components will silently get things wrong. Not because
          the AI is bad at React, but because the domain-specific rules aren't
          in any training data.
        </p>

        <div className="">
          <ul className="flex flex-col gap-3 list-disc list-inside marker:text-neutral-300 dark:marker:text-white/20">
            {[
              {
                label: "Feedback value has no universal scale",
                detail:
                  "Different agents receive scores on different ranges. You can't treat it like a standard 1–5 star rating without knowing the context.",
              },
              {
                label: "Tags aren't pre-aggregated",
                detail:
                  "tag1 and tag2 on each feedback entry aren't counted anywhere. You have to fetch all feedback and compute frequencies client-side.",
              },
              {
                label: "The deployed schema drifts from the docs",
                detail:
                  "The schema reference used in this library was captured from an actual Subgraph introspection query — not the SDK docs or the GitHub README.",
              },
              {
                label: "agentURI needs three resolution paths",
                detail:
                  "The registration file URI can be IPFS, HTTPS, or a base64 data URI. Each requires different handling.",
              },
              {
                label: "Revoked feedback must be filtered",
                detail:
                  "isRevoked: false needs to be in every feedback query. A component that omits it will silently include retracted reviews.",
              },
              {
                label: "Pagination is offset-based, not cursor-based",
                detail:
                  "The Subgraph uses first/skip, not a cursor. Deep pagination gets expensive and has known limitations.",
              },
              {
                label: "Chain ID → Subgraph endpoint mapping",
                detail:
                  "Each chain has a different Subgraph deployment ID, and every request needs your API key injected into the URL.",
              },
              {
                label: "Validation Registry isn't on mainnet yet",
                detail:
                  "The schema supports it and testnet works, but mainnet validation data doesn't exist. Components need to handle this gracefully.",
              },
              {
                label: "Four states per component",
                detail:
                  "Every component needs loading, error, empty, and not-found states handled — not just the happy path.",
              },
            ].map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-0.5 border border-black/20 dark:border-white/15 bg-neutral-100 dark:bg-neutral-900 p-5"
              >
                <span className="text-sm text-black dark:text-white">
                  {item.label}
                </span>
                <span className="text-sm text-neutral-600 dark:text-white/50 leading-relaxed">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Every component in this library handles all of this internally. You
          pass two identifiers and get a working UI backed by verified on-chain
          data. Queries are minimal per-component —{" "}
          <InlineCode>ReputationScore</InlineCode> fetches 2 fields, not 20+.
          Caching and request deduplication are automatic via TanStack Query, so
          multiple components targeting the same agent share a single network
          request.
        </p>
      </section>
    </div>
  )
}

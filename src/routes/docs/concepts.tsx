import { createFileRoute, Link } from "@tanstack/react-router"
import { SectionHeading } from "@/components/docs/DocPageLayout"
import { InlineCode } from "@/components/docs/CodeBlock"

export const Route = createFileRoute("/docs/concepts")({
  component: Concepts,
})

function Concepts() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          Concepts
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          What you need to know about ERC-8004 to use this library — no protocol
          deep-dive required.
        </p>
      </div>

      {/* What is ERC-8004 */}
      <section className="flex flex-col gap-4">
        <SectionHeading>What is ERC-8004?</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          ERC-8004 is an Ethereum standard for on-chain AI agent identity. It
          lets agents register themselves on the blockchain with a name,
          description, image, and service endpoints — and lets users leave
          feedback and validations. Think of it like a public profile + review
          system for AI agents, but the data lives on-chain so it can't be
          faked.
        </p>
      </section>

      {/* Why use a library */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Why use this library?</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          For the specific Subgraph quirks this library handles on your behalf,
          see the{" "}
          <Link
            to="/docs/introduction"
            className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Introduction
          </Link>
          .
        </p>
      </section>

      {/* The three registries */}
      <section className="flex flex-col gap-6">
        <SectionHeading>The Three Registries</SectionHeading>

        <div className="flex flex-col gap-1">
          <h3 className="font-mono text-sm text-neutral-800 dark:text-white/90">
            Identity Registry
          </h3>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            Like a business registration. Each agent gets an NFT (ERC-721 token)
            with a registration file containing its name, description, image,
            and service endpoints. This is where "who is this agent?" data
            lives.
          </p>
          <p className="text-xs text-neutral-400 dark:text-white/30 mt-1 font-mono">
            Components: AgentName, AgentImage, AgentDescription, AgentCard,
            EndpointStatus
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-mono text-sm text-neutral-800 dark:text-white/90">
            Reputation Registry
          </h3>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            Like a review system. Users who interact with an agent can leave
            feedback — a score, tags describing what the agent does well, and
            optional written reviews. This is where "is this agent any good?"
            data lives.
          </p>
          <p className="text-xs text-neutral-400 dark:text-white/30 mt-1 font-mono">
            Components: ReputationScore, ReputationTimeline,
            ReputationDistribution, FeedbackList, TagCloud
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-mono text-sm text-neutral-800 dark:text-white/90">
            Validation Registry
          </h3>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            Like a certification body. Independent third-party verifiers can
            assess an agent and record a score (0–100). This is where "has this
            agent been independently verified?" data lives.
          </p>
          <p className="text-xs text-neutral-400 dark:text-white/30 mt-1 font-mono">
            Components: VerificationBadge, ValidationScore, ValidationList —
            Note: Validation Registry not yet deployed to mainnet.
          </p>
        </div>
      </section>

      {/* Agent identity */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Agent Identity: agentRegistry + agentId</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Every component takes two props that together uniquely identify an
          agent across any chain:
        </p>

        <div className="border border-black/60 dark:border-white/10 divide-y divide-black/60 dark:divide-white/10">
          <div className="px-5 py-4 flex flex-col gap-1">
            <span className="font-mono text-sm text-neutral-800 dark:text-white/90">
              agentRegistry
            </span>
            <p className="text-sm text-neutral-700 dark:text-white leading-relaxed">
              A string in the format{" "}
              <InlineCode>
                eip155:{"{chainId}"}:{"{contractAddress}"}
              </InlineCode>
              . Breaking it down:
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-500 dark:text-white/50">
              <li>
                <InlineCode>eip155</InlineCode> — namespace meaning it's an
                Ethereum-compatible chain
              </li>
              <li>
                <InlineCode>chainId</InlineCode> — identifies which blockchain
                (1 = Ethereum, 8453 = Base, etc.)
              </li>
              <li>
                <InlineCode>contractAddress</InlineCode> — where the Identity
                Registry smart contract is deployed
              </li>
            </ul>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <span className="font-mono text-sm text-neutral-800 dark:text-white/90">
              agentId
            </span>
            <p className="text-sm text-neutral-700 dark:text-white leading-relaxed">
              The ERC-721 token ID — the unique number assigned to this agent
              when it registered.
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Example:{" "}
          <InlineCode>
            agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
          </InlineCode>{" "}
          + <InlineCode>agentId={"{2290}"}</InlineCode> means "agent #2290 on
          the Base blockchain."
        </p>
      </section>

      {/* Trustless data */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Trustless Data</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Components never accept display data as props. You only pass
          identifiers — the component fetches verified data from the blockchain
          internally. This means the data you see is guaranteed to be real
          on-chain data, not something that could be spoofed by a developer
          passing fake props.
        </p>
      </section>

      {/* Supported chains */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Supported Chains</SectionHeading>
        <div className="border border-black/60 dark:border-white/10 divide-y divide-black/60 dark:divide-white/10">
          {[
            { name: "Ethereum Mainnet", id: 1 },
            { name: "Base Mainnet", id: 8453 },
            { name: "Ethereum Sepolia", id: 11155111, note: "testnet" },
            { name: "Base Sepolia", id: 84532, note: "testnet" },
            { name: "Polygon Mainnet", id: 137 },
          ].map((chain) => (
            <div
              key={chain.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <span className="text-sm text-neutral-600 dark:text-white/70">
                {chain.name}
                {chain.note && (
                  <span className="ml-2 text-xs text-neutral-400 dark:text-white/30">
                    — {chain.note}
                  </span>
                )}
              </span>
              <span className="font-mono text-sm text-neutral-400 dark:text-white/40">
                {chain.id}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Where data comes from */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Where the Data Comes From</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          All data is fetched from{" "}
          <a
            href="https://thegraph.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 dark:text-white/80 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            The Graph
          </a>{" "}
          — a decentralised indexing service that watches the blockchain,
          extracts ERC-8004 events, and serves them via fast GraphQL queries.
          You don't need to understand GraphQL to use this library — components
          handle all queries internally. You just need a free API key from The
          Graph.
        </p>
      </section>
    </div>
  )
}

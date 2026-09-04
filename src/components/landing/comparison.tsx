import { CodeBlock } from "@/components/docs/CodeBlock"
import { PanelLabel, RULE, Section } from "./section"

const MANUAL_CODE = `const SUBGRAPH_IDS: Record<number, string> = {
  1: "FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k",
  8453: "43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb",
  // ...one entry per chain you support
}

function useReputation(agentRegistry: string, agentId: number) {
  const [, chainId] = agentRegistry.split(":")
  const subgraphId = SUBGRAPH_IDS[Number(chainId)]
  if (!subgraphId) throw new Error("Unsupported chain")

  return useQuery({
    queryKey: ["reputation", chainId, agentId],
    queryFn: async () => {
      const res = await fetch(
        \`https://gateway.thegraph.com/api/\${KEY}/subgraphs/id/\${subgraphId}\`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: \`query ($id: ID!) {
              agentStats(id: $id) {
                averageFeedbackValue
                totalFeedback
              }
            }\`,
            // the entity id is chainId:agentId — not the registry string
            variables: { id: \`\${chainId}:\${agentId}\` },
          }),
        }
      )

      const json = await res.json()
      if (json.errors?.length) throw new Error(json.errors[0].message)
      if (!json.data?.agentStats) return null // agent exists, no stats yet

      // BigInt and BigDecimal arrive as strings
      return {
        total: parseInt(json.data.agentStats.totalFeedback, 10),
        average: parseFloat(json.data.agentStats.averageFeedbackValue),
      }
    },
  })
}

// ...then render loading, error, empty and not-found states.
// Then do all of it again for feedback, validation and identity.`

const LIBRARY_CODE = `import { ReputationScore } from "@erc8004/ui"

<ReputationScore
  agentRegistry="eip155:8453:0x8004...a432"
  agentId={2290}
/>`

const HANDLED = [
  "Chain identifier parsed, subgraph endpoint resolved, API key injected",
  "Only the fields the component renders are requested",
  "Revoked feedback filtered out of every reputation query",
  "String-encoded BigInt and BigDecimal values parsed and validated",
  "IPFS, HTTPS and base64 data URIs all resolved",
  "Loading, error, empty and not-found states rendered",
  "Responses cached and duplicate queries collapsed, page-wide",
]

export function Comparison() {
  return (
    <Section
      label="The problem"
      title="The plumbing is the work. You shouldn't have to write it."
      intro="Rendering one number from the ERC-8004 subgraph means knowing the deployment ID for the chain, the shape of the entity ID, which values come back as strings, and which rows are revoked. Multiply that by every field on the page."
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-3">
          <PanelLabel aside="~50 lines, one field">By hand</PanelLabel>
          <div className="relative">
            <div className="max-h-[30rem] overflow-hidden">
              <CodeBlock code={MANUAL_CODE} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-200 to-transparent dark:from-neutral-900" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <PanelLabel aside="every field, every chain">
            With @erc8004/ui
          </PanelLabel>
          <CodeBlock code={LIBRARY_CODE} />
          <ul className={`mt-3 flex flex-col border-t ${RULE}`}>
            {HANDLED.map((item) => (
              <li
                key={item}
                className={`flex items-baseline gap-3 border-b px-1 py-2.5 text-xs leading-relaxed text-text-secondary ${RULE}`}
              >
                <span aria-hidden className="text-green">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import type { AgentStats, Feedback } from "@/types"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import * as v from "valibot"

type ReputationResponse = {
  agentStats: Pick<AgentStats, "averageFeedbackValue" | "totalFeedback">
  feedbacks: Pick<Feedback, "value" | "createdAt">[]
}

const reputationResponseSchema = v.object({
  agentStats: v.pipe(
    v.object({
      averageFeedbackValue: v.string(),
      totalFeedback: v.string(),
    }),
    v.transform((raw) => ({
      totalFeedback: parseInt(raw.totalFeedback, 10),
      averageFeedbackValue: parseFloat(raw.averageFeedbackValue),
    }))
  ),
  feedbacks: v.pipe(
    v.array(
      v.object({
        value: v.string(),
        createdAt: v.string(),
      })
    ),
    v.transform((raw) =>
      raw.map((item) => ({
        value: parseFloat(item.value),
        createdAt: parseInt(item.createdAt, 10),
      }))
    )
  ),
})

const REPUTATION_QUERY = `#graphql
  query ($id: ID!){
    agentStats(id: $id) {
      averageFeedbackValue
      totalFeedback
    }
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: 100,
    ) {
      value
      createdAt
    }
  }
`

export function useReputation(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["reputation", agentRegistry, agentId],
    queryFn: async (): Promise<ReputationResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)

      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<ReputationResponse>(
        url,
        REPUTATION_QUERY,
        variables
      )

      console.log(data)

      try {
        return v.parse(reputationResponseSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(
            `Invalid subgraph response: ${error.issues[0].message}`
          )
        }
        throw error
      }
    },
  })
}

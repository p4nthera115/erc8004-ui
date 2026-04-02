import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import type { AgentStats } from "@/types"
import * as v from "valibot"
import { formatRelativeTime } from "@/lib/utils"

type LastActivityResponse = {
  agentStats: Pick<AgentStats, "lastActivity">
}

const lastActivitySchema = v.pipe(
  v.object({
    agentStats: v.pipe(
      v.object({
        lastActivity: v.string(),
      }),
      v.transform((raw) => ({
        lastActivity: parseInt(raw.lastActivity, 10),
      }))
    ),
  })
)

const LAST_ACTIVITY_QUERY = `#graphql
  query ($id: ID!) {
    agentStats(id: $id) {
      lastActivity
    }
  }
`

function useLastActivity(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["last-activity", agentRegistry, agentId],
    queryFn: async (): Promise<LastActivityResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<LastActivityResponse>(
        url,
        LAST_ACTIVITY_QUERY,
        variables
      )

      try {
        return v.parse(lastActivitySchema, data)
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

export function LastActivity(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useLastActivity(agentRegistry, agentId)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error.message}</div>
  }

  return <div>{formatRelativeTime(data?.agentStats?.lastActivity ?? 0)}</div>
}

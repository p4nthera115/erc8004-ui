import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "../../lib/useAgentIdentity"
import { cn } from "../../lib/cn"
import * as v from "valibot"
import { formatRelativeTime } from "../../lib/utils"

type LastActivityResponse = {
  agent: { lastActivity: number } | null
}

const lastActivitySchema = v.object({
  // Nullable: the agent may not exist on this chain at all.
  agent: v.nullable(
    v.pipe(
      v.object({
        lastActivity: v.string(),
      }),
      v.transform((raw) => ({
        lastActivity: parseInt(raw.lastActivity, 10),
      }))
    )
  ),
})

// `lastActivity` lives on the Agent entity. The `agentStats` entity this used
// to read is absent from every deployed subgraph — querying it fails outright
// rather than returning null.
const LAST_ACTIVITY_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
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

interface LastActivityProps extends AgentIdentityProps {
  className?: string
}

export function LastActivity({ className, ...props }: LastActivityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useLastActivity(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div
        className={cn("h-3 w-24 animate-pulse rounded-erc8004-sm bg-erc8004-muted", className)}
        aria-busy="true"
        aria-live="polite"
      />
    )
  }

  if (error) {
    return null
  }

  // `agent` is null when the id doesn't exist on this chain. Falling back to 0
  // would render the unix epoch as "20699 days ago" instead of nothing.
  const lastActivity = data?.agent?.lastActivity
  if (lastActivity == null) {
    return null
  }

  return (
    <span className={cn("text-sm text-erc8004-muted-fg", className)}>
      {formatRelativeTime(lastActivity)}
    </span>
  )
}

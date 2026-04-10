import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import type { AgentRegistrationFile } from "@/types"
import { useQuery } from "@tanstack/react-query"
import * as v from "valibot"

type AgentNameResponse = {
  agent: {
    registrationFile: Pick<AgentRegistrationFile, "name"> | null
  } | null
}

const agentNameSchema = v.object({
  agent: v.object({
    registrationFile: v.nullable(
      v.object({
        name: v.nullable(v.string()),
      })
    ),
  }),
})

const AGENT_NAME_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      registrationFile {
        name
      }
    }
  }
`

function useAgentName(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["agent-name", agentRegistry, agentId],
    queryFn: async (): Promise<AgentNameResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<AgentNameResponse>(
        url,
        AGENT_NAME_QUERY,
        variables
      )

      try {
        return v.parse(agentNameSchema, data)
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

interface AgentNameProps extends AgentIdentityProps {
  className?: string
}

export function AgentName({ className, ...props }: AgentNameProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useAgentName(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div
        className={cn("h-4 w-32 animate-pulse rounded-erc8004-sm bg-erc8004-muted", className)}
        aria-busy="true"
        aria-live="polite"
      />
    )
  }

  if (error) {
    return (
      <span className={cn("text-erc8004-negative text-sm", className)}>
        Agent #{agentId}
      </span>
    )
  }

  return (
    <span className={cn("text-erc8004-card-fg", className)}>
      {data?.agent?.registrationFile?.name ?? `Agent #${agentId}`}
    </span>
  )
}

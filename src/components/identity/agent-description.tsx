import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/_internal"
import * as v from "valibot"

type AgentDescriptionResponse = {
  agent: {
    registrationFile: { description: string | null } | null
  } | null
}

const agentDescriptionSchema = v.object({
  agent: v.nullable(
    v.object({
      registrationFile: v.nullable(
        v.object({
          description: v.nullable(v.string()),
        })
      ),
    })
  ),
})

const AGENT_DESCRIPTION_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      registrationFile {
        description
      }
    }
  }
`

function useAgentDescription(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["agent-description", agentRegistry, agentId],
    queryFn: async (): Promise<AgentDescriptionResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<AgentDescriptionResponse>(
        url,
        AGENT_DESCRIPTION_QUERY,
        variables
      )

      try {
        return v.parse(agentDescriptionSchema, data)
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

interface AgentDescriptionProps extends AgentIdentityProps {
  className?: string
}

export function AgentDescription({ className, ...props }: AgentDescriptionProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useAgentDescription(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    )
  }

  if (error) {
    return null
  }

  const description = data?.agent?.registrationFile?.description
  if (!description) return null

  return (
    <p className={cn("text-sm text-erc8004-muted-fg leading-relaxed", className)}>
      {description}
    </p>
  )
}

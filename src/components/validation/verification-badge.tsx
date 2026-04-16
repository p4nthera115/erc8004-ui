import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { Tag, Skeleton } from "@/components/_internal"
import type { AgentStats } from "@/types"
import * as v from "valibot"

type ValidationStatsResponse = {
  agentStats: Pick<AgentStats, "totalValidations" | "completedValidations" | "averageValidationScore"> | null
}

const validationStatsSchema = v.object({
  agentStats: v.nullable(
    v.pipe(
      v.object({
        totalValidations: v.string(),
        completedValidations: v.string(),
        averageValidationScore: v.string(),
      }),
      v.transform((raw) => ({
        totalValidations: parseInt(raw.totalValidations, 10),
        completedValidations: parseInt(raw.completedValidations, 10),
        averageValidationScore: parseFloat(raw.averageValidationScore),
      }))
    )
  ),
})

const VALIDATION_STATS_QUERY = `#graphql
  query ($id: ID!) {
    agentStats(id: $id) {
      totalValidations
      completedValidations
      averageValidationScore
    }
  }
`

function useValidationStats(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["verification-badge", agentRegistry, agentId],
    queryFn: async (): Promise<ValidationStatsResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<ValidationStatsResponse>(
        url,
        VALIDATION_STATS_QUERY,
        variables
      )

      try {
        return v.parse(validationStatsSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(`Invalid subgraph response: ${error.issues[0].message}`)
        }
        throw error
      }
    },
  })
}

type Tier = "unverified" | "verified" | "highly-verified"

function getTier(completedValidations: number, averageScore: number): Tier {
  if (completedValidations >= 5 && averageScore >= 85) return "highly-verified"
  if (completedValidations >= 1 && averageScore >= 70) return "verified"
  return "unverified"
}

interface VerificationBadgeProps extends AgentIdentityProps {
  className?: string
}

export function VerificationBadge({ className, ...props }: VerificationBadgeProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useValidationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <Skeleton className="h-5 w-20 rounded-erc8004-sm" />
      </div>
    )
  }

  if (error || !data?.agentStats) {
    return (
      <Tag className={className}>
        <span className="h-1.5 w-1.5 rounded-full border border-erc8004-muted-fg" />
        Unverified
      </Tag>
    )
  }

  const { completedValidations, averageValidationScore } = data.agentStats
  const tier = getTier(completedValidations, averageValidationScore)

  if (tier === "unverified") {
    return (
      <Tag className={className}>
        <span className="h-1.5 w-1.5 rounded-full border border-erc8004-muted-fg" />
        Unverified
      </Tag>
    )
  }

  if (tier === "highly-verified") {
    return (
      <Tag
        variant="positive"
        className={className}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-erc8004-positive-fg" />
        {`Highly Verified · ${completedValidations}`}
      </Tag>
    )
  }

  return (
    <Tag
      variant="positive"
      className={className}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-erc8004-positive-fg" />
      Verified
    </Tag>
  )
}

import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
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

// Tier thresholds based on completedValidations and averageValidationScore
function getTier(completedValidations: number, averageScore: number): {
  label: string
  color: string
  dotColor: string
} {
  if (completedValidations === 0) {
    return { label: "Unverified", color: "text-erc8004-muted-fg", dotColor: "bg-erc8004-muted-fg" }
  }
  if (averageScore >= 80 && completedValidations >= 5) {
    return { label: "Highly Verified", color: "text-erc8004-positive", dotColor: "bg-erc8004-positive" }
  }
  if (averageScore >= 60 && completedValidations >= 3) {
    return { label: "Verified", color: "text-erc8004-accent", dotColor: "bg-erc8004-accent" }
  }
  return { label: "Partially Verified", color: "text-erc8004-chart-5", dotColor: "bg-erc8004-chart-5" }
}

interface VerificationBadgeProps extends AgentIdentityProps {
  className?: string
}

export function VerificationBadge({ className, ...props }: VerificationBadgeProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useValidationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 animate-pulse", className)} aria-busy="true" aria-live="polite">
        <div className="h-2 w-2 rounded-full bg-erc8004-muted" />
        <div className="h-3 w-20 rounded-erc8004-sm bg-erc8004-muted" />
      </div>
    )
  }

  if (error || !data?.agentStats) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <div className="h-2 w-2 rounded-full bg-erc8004-muted" />
        <span className="text-xs text-erc8004-muted-fg">Unverified</span>
      </div>
    )
  }

  const { completedValidations, averageValidationScore } = data.agentStats
  const tier = getTier(completedValidations, averageValidationScore)

  return (
    <div
      className={cn(`inline-flex items-center gap-1.5 cursor-default ${tier.color}`, className)}
      title={`${completedValidations} validation${completedValidations === 1 ? "" : "s"} · avg score ${averageValidationScore.toFixed(0)}/100`}
    >
      <div className={`h-2 w-2 rounded-full ${tier.dotColor}`} />
      <span className="text-xs font-medium">{tier.label}</span>
    </div>
  )
}

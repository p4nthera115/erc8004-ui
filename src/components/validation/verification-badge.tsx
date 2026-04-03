import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
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
    return { label: "Unverified", color: "text-zinc-400 dark:text-zinc-500", dotColor: "bg-zinc-300 dark:bg-zinc-600" }
  }
  if (averageScore >= 80 && completedValidations >= 5) {
    return { label: "Highly Verified", color: "text-emerald-600 dark:text-emerald-400", dotColor: "bg-emerald-500" }
  }
  if (averageScore >= 60 && completedValidations >= 3) {
    return { label: "Verified", color: "text-blue-600 dark:text-blue-400", dotColor: "bg-blue-500" }
  }
  return { label: "Partially Verified", color: "text-amber-600 dark:text-amber-400", dotColor: "bg-amber-400" }
}

export function VerificationBadge(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useValidationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 animate-pulse">
        <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    )
  }

  if (error || !data?.agentStats) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Unverified</span>
      </div>
    )
  }

  const { completedValidations, averageValidationScore } = data.agentStats
  const tier = getTier(completedValidations, averageValidationScore)

  return (
    <div
      className={`inline-flex items-center gap-1.5 cursor-default ${tier.color}`}
      title={`${completedValidations} validation${completedValidations === 1 ? "" : "s"} · avg score ${averageValidationScore.toFixed(0)}/100`}
    >
      <div className={`h-2 w-2 rounded-full ${tier.dotColor}`} />
      <span className="text-xs font-medium">{tier.label}</span>
    </div>
  )
}

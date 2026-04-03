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
    queryKey: ["validation-score", agentRegistry, agentId],
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

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500"
  if (score >= 60) return "text-blue-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-blue-400"
  if (score >= 40) return "bg-amber-400"
  return "bg-red-400"
}

export function ValidationScore(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useValidationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 animate-pulse">
        <div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-800 mb-4" />
        <div className="h-8 w-16 rounded bg-zinc-100 dark:bg-zinc-800 mb-2" />
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load validation score.</p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.agentStats || data.agentStats.completedValidations === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Validation Score</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No validations yet.</p>
      </div>
    )
  }

  const { totalValidations, completedValidations, averageValidationScore } = data.agentStats
  const pendingCount = totalValidations - completedValidations

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Validation Score</h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {completedValidations} completed
          {pendingCount > 0 && ` · ${pendingCount} pending`}
        </span>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className={`font-mono text-4xl font-semibold tabular-nums leading-none ${scoreColor(averageValidationScore)}`}>
          {averageValidationScore.toFixed(0)}
        </span>
        <span className="text-sm text-zinc-400 dark:text-zinc-500 mb-1">/ 100</span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(averageValidationScore)}`}
          style={{ width: `${Math.min(averageValidationScore, 100)}%` }}
        />
      </div>
    </div>
  )
}

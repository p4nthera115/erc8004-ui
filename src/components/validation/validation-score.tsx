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
  if (score >= 80) return "text-erc8004-positive"
  if (score >= 60) return "text-erc8004-accent"
  if (score >= 40) return "text-erc8004-chart-5"
  return "text-erc8004-negative"
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-erc8004-positive"
  if (score >= 60) return "bg-erc8004-accent"
  if (score >= 40) return "bg-erc8004-chart-5"
  return "bg-erc8004-negative"
}

interface ValidationScoreProps extends AgentIdentityProps {
  className?: string
}

export function ValidationScore({ className, ...props }: ValidationScoreProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useValidationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5 animate-pulse", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-4 w-28 rounded-erc8004-sm bg-erc8004-muted mb-4" />
        <div className="h-8 w-16 rounded-erc8004-sm bg-erc8004-muted mb-2" />
        <div className="h-2 w-full rounded-full bg-erc8004-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">Failed to load validation score.</p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.agentStats || data.agentStats.completedValidations === 0) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <h3 className="text-sm font-semibold text-erc8004-card-fg mb-3">Validation Score</h3>
        <p className="text-sm text-erc8004-muted-fg">No validations yet.</p>
      </div>
    )
  }

  const { totalValidations, completedValidations, averageValidationScore } = data.agentStats
  const pendingCount = totalValidations - completedValidations

  return (
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-erc8004-card-fg">Validation Score</h3>
        <span className="text-xs text-erc8004-muted-fg">
          {completedValidations} completed
          {pendingCount > 0 && ` · ${pendingCount} pending`}
        </span>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className={`font-mono text-4xl font-semibold tabular-nums leading-none ${scoreColor(averageValidationScore)}`}>
          {averageValidationScore.toFixed(0)}
        </span>
        <span className="text-sm text-erc8004-muted-fg mb-1">/ 100</span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 w-full rounded-full bg-erc8004-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(averageValidationScore)}`}
          style={{ width: `${Math.min(averageValidationScore, 100)}%` }}
        />
      </div>
    </div>
  )
}

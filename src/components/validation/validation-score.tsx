import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { Card, Skeleton, EmptyState, ErrorState } from "@/components/_internal"
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

export interface ValidationScoreProps extends AgentIdentityProps {
  /** Show the score fill bar. Default `true`. */
  showFillBar?: boolean
  /** Show the pending validation count. Default `true`. */
  showPendingCount?: boolean
  className?: string
}

export function ValidationScore({
  showFillBar = true,
  showPendingCount = true,
  className,
  ...props
}: ValidationScoreProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useValidationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <Card className={cn("w-full p-5", className)}>
        <Skeleton className="mb-4 h-4 w-28" />
        <Skeleton className="mb-3 h-7 w-20" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <ErrorState message="Couldn't load validation score" />
      </Card>
    )
  }

  if (!data?.agentStats || data.agentStats.completedValidations === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <h3 className="px-4 pt-4 text-sm font-medium text-erc8004-card-fg">Validation Score</h3>
        <EmptyState message="No validations yet" />
      </Card>
    )
  }

  const { totalValidations, completedValidations, averageValidationScore } = data.agentStats
  const pendingCount = totalValidations - completedValidations

  return (
    <Card className={cn("w-full p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-erc8004-card-fg">Validation Score</h3>
        <span className="text-xs text-erc8004-muted-fg">
          {completedValidations} completed
          {showPendingCount && pendingCount > 0 && ` · ${pendingCount} pending`}
        </span>
      </div>

      <div className={cn("flex items-end gap-2", showFillBar && "mb-3")}>
        <span className="text-3xl font-semibold tabular-nums leading-none text-erc8004-card-fg">
          {averageValidationScore.toFixed(0)}
        </span>
        <span className="text-base text-erc8004-muted-fg mb-0.5">/ 100</span>
      </div>

      {showFillBar && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-erc8004-muted">
          <div
            className="h-full rounded-full bg-erc8004-positive"
            style={{
              width: `${Math.min(averageValidationScore, 100)}%`,
              transition: "width 200ms ease-out",
            }}
          />
        </div>
      )}
    </Card>
  )
}

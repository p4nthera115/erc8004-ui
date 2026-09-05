import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "../../lib/useAgentIdentity"
import { cn } from "../../lib/cn"
import { Tag, Skeleton } from "../_internal"
import * as v from "valibot"

type ValidationStatsResponse = {
  stats: {
    validationRequests: number
    validationResponses: number
    scoreSum: number
  }[]
}

const validationStatsSchema = v.object({
  stats: v.array(
    v.pipe(
      v.object({
        validationRequests: v.string(),
        validationResponses: v.string(),
        scoreSum: v.string(),
      }),
      v.transform((raw) => ({
        validationRequests: parseInt(raw.validationRequests, 10),
        validationResponses: parseInt(raw.validationResponses, 10),
        scoreSum: parseFloat(raw.scoreSum),
      }))
    )
  ),
})

// The `agentStats` entity this used to read no longer exists on any deployed
// subgraph. Validation aggregates now live in a timeseries collection whose
// rows are CUMULATIVE, so the newest row holds the all-time totals.
//
// Note this returns an empty array on every chain today: the Validation
// Registry contract is recorded at the zero address everywhere, so nothing can
// emit a validation. That is an empty state, not an error.
const VALIDATION_STATS_QUERY = `#graphql
  query ($agent: String!) {
    stats: agentValidationStats_collection(
      interval: day
      where: { agent: $agent }
      orderBy: timestamp
      orderDirection: desc
      first: 1
    ) {
      validationRequests
      validationResponses
      scoreSum
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
      const variables = { agent: `${chainId}:${agentId}` }

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

  const summary = data?.stats?.[0]
  const completedValidations = summary?.validationResponses ?? 0
  // Scores are 0-100; derive the average over completed responses only.
  const averageValidationScore =
    summary && completedValidations > 0
      ? summary.scoreSum / completedValidations
      : 0

  if (error || !summary) {
    return (
      <Tag className={className}>
        <span className="h-1.5 w-1.5 rounded-full border border-erc8004-muted-fg" />
        Unverified
      </Tag>
    )
  }

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

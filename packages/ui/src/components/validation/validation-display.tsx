import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "../../lib/useAgentIdentity"
import { cn } from "../../lib/cn"
import { Card, EmptyState } from "../_internal"
import { VerificationBadge } from "./verification-badge"
import { ValidationScore } from "./validation-score"
import { ValidationList } from "./validation-list"

/**
 * Minimal existence probe. VerificationBadge, ValidationScore and ValidationList
 * each render their own empty state, so composing them for an agent with no
 * validations produced three separate ways of saying "nothing here" stacked on
 * top of each other. Since the Validation Registry is not deployed on any chain
 * yet, that stack is what every user currently sees — so this component decides
 * for itself and renders a single empty state instead.
 */
const HAS_VALIDATIONS_QUERY = `#graphql
  query ($agent: String!) {
    validations(where: { agent: $agent }, first: 1) {
      id
    }
  }
`

function useHasValidations(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["validation-display", agentRegistry, agentId],
    queryFn: async (): Promise<boolean> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const data = await subgraphFetch<{ validations: { id: string }[] }>(
        url,
        HAS_VALIDATIONS_QUERY,
        { agent: `${chainId}:${agentId}` }
      )
      return data.validations.length > 0
    },
  })
}

export interface ValidationDisplayProps extends AgentIdentityProps {
  /** Message when the agent has no validations. */
  emptyMessage?: string
  className?: string
}

export function ValidationDisplay({
  emptyMessage = "No validations yet",
  className,
  ...props
}: ValidationDisplayProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data: hasValidations, isLoading, error } = useHasValidations(
    agentRegistry,
    agentId
  )

  // On error, fall through to the children — they surface their own error
  // states, which are more specific than anything this wrapper could say.
  if (!isLoading && !error && hasValidations === false) {
    return (
      <Card className={cn("w-full", className)}>
        <div className="flex items-center gap-3 px-4 pt-4">
          <VerificationBadge {...props} />
        </div>
        <EmptyState message={emptyMessage} />
      </Card>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center gap-3">
        <VerificationBadge {...props} />
      </div>
      <ValidationScore {...props} />
      <ValidationList {...props} />
    </div>
  )
}

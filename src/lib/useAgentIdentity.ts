import { useAgentContext, type AgentIdentity } from "@/provider/AgentProvider"

/**
 * Props that components accept for agent identity. Both fields are optional
 * because they might come from an AgentProvider instead.
 *
 * This is the type that every component's props should extend or intersect
 * with for the agentRegistry + agentId fields.
 */
export interface AgentIdentityProps {
  agentRegistry?: string
  agentId?: number
}

/**
 * Internal hook that resolves agent identity for a component.
 *
 * Resolution order:
 *   1. Explicit props (if both agentRegistry AND agentId are provided)
 *   2. AgentProvider context (if the component is inside an <AgentProvider>)
 *   3. Throws an error with a clear message explaining what's missing
 *
 * Explicit props always win — this means you can wrap 10 components in an
 * AgentProvider and still override one of them with different props.
 *
 * @param props - The component's agentRegistry and agentId props (may be undefined)
 * @returns A resolved AgentIdentity with both fields guaranteed present
 *
 * @example
 * // Inside a component:
 * function ReputationScore({ agentRegistry, agentId, ...rest }: ReputationScoreProps) {
 *   const { agentRegistry: registry, agentId: id } = useAgentIdentity({
 *     agentRegistry,
 *     agentId,
 *   })
 *   // `registry` and `id` are guaranteed to be defined here.
 *   // Use them for your query key and GraphQL fetch.
 * }
 */
export function useAgentIdentity(props: AgentIdentityProps): AgentIdentity {
  const context = useAgentContext()

  // --- Explicit props: both provided → use them, ignore context ---
  if (props.agentRegistry !== undefined && props.agentId !== undefined) {
    return {
      agentRegistry: props.agentRegistry,
      agentId: props.agentId,
    }
  }

  // --- Partial props: one provided but not the other → error ---
  // This catches bugs where a developer passes agentRegistry but forgets agentId
  // (or vice versa). We don't silently fill in one from context and one from props
  // because that would almost certainly be a mistake.
  if (props.agentRegistry !== undefined || props.agentId !== undefined) {
    const provided =
      props.agentRegistry !== undefined ? "agentRegistry" : "agentId"
    const missing =
      props.agentRegistry !== undefined ? "agentId" : "agentRegistry"
    throw new Error(
      `[ERC-8004] Component received "${provided}" as a prop but not "${missing}". ` +
        `Either pass both props explicitly, or pass neither and use an <AgentProvider> wrapper.`
    )
  }

  // --- No props: fall back to AgentProvider context ---
  if (context) {
    return context
  }

  // --- Nothing available: helpful error ---
  throw new Error(
    `[ERC-8004] Missing agent identity. This component needs agentRegistry and agentId. ` +
      `Either pass them as props:\n\n` +
      `  <ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />\n\n` +
      `Or wrap your components in an <AgentProvider>:\n\n` +
      `  <AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>\n` +
      `    <ReputationScore />\n` +
      `  </AgentProvider>`
  )
}

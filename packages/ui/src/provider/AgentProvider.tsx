import { createContext, useContext, type ReactNode } from "react"

// --- Types ---

/** The two identifiers every component needs to fetch agent data. */
export interface AgentIdentity {
  agentRegistry: string // "eip155:{chainId}:{contractAddress}"
  agentId: number // ERC-721 token ID
}

/** Props for the AgentProvider wrapper component. */
export interface AgentProviderProps extends AgentIdentity {
  children: ReactNode
}

// --- Context ---

/**
 * Internal context — holds the agent identity values set by <AgentProvider>.
 *
 * Defaults to `null` (no provider present). Components check for null
 * to know whether they're inside an AgentProvider or not.
 */
const AgentContext = createContext<AgentIdentity | null>(null)

// --- Provider Component ---

/**
 * Optional convenience wrapper that sets default `agentRegistry` and `agentId`
 * for all ERC-8004 components nested inside it.
 *
 * Use this when many components on the same page target the same agent (e.g., a
 * profile page). Components can still override these defaults by passing their
 * own props — explicit props always win over provider values.
 *
 * This is NOT required. Every component still accepts `agentRegistry` and
 * `agentId` as direct props and works fine without any AgentProvider.
 *
 * @example
 * // Profile page — one agent, many components, no repetition:
 * <AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
 *   <AgentName />
 *   <AgentImage />
 *   <ReputationScore />
 *   <FeedbackList />
 * </AgentProvider>
 *
 * @example
 * // Override one component inside the provider:
 * <AgentProvider agentRegistry="eip155:1:0x742..." agentId={374}>
 *   <AgentName />                                                    // agent 374
 *   <AgentName agentRegistry="eip155:1:0x999..." agentId={12} />    // different agent
 * </AgentProvider>
 *
 * @example
 * // Marketplace grid — no provider needed, each component gets its own props:
 * {agents.map(a => (
 *   <AgentCard key={a.id} agentRegistry={a.registry} agentId={a.id} />
 * ))}
 */
export function AgentProvider({
  agentRegistry,
  agentId,
  children,
}: AgentProviderProps) {
  return (
    <AgentContext.Provider value={{ agentRegistry, agentId }}>
      {children}
    </AgentContext.Provider>
  )
}

// --- Internal Hook ---

/**
 * Returns the AgentIdentity from the nearest AgentProvider, or `null` if
 * there is no provider above this component.
 *
 * This is an internal hook — not exported from the package. Components use
 * `useAgentIdentity()` from `useAgentIdentity.ts` instead, which merges
 * provider values with explicit props.
 */
export function useAgentContext(): AgentIdentity | null {
  return useContext(AgentContext)
}

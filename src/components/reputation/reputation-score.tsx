import { useReputation } from "./useReputation"

export function ReputationScore({
  agentRegistry,
  agentId,
}: {
  agentRegistry: string
  agentId: number
}) {
  const { data, isLoading, error } = useReputation(agentRegistry, agentId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>Reputation: {data?.agentStats.averageFeedbackValue}</div>
}

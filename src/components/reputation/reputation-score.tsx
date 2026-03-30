import { useReputation } from "./useReputation"

export function ReputationScore(agentRegistry: string, agentId: number) {
  const { data } = useReputation(agentRegistry, agentId)

  console.log(data)

  return <div>Reputation: {data?.averageValue}</div>
}

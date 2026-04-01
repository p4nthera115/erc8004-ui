import { useReputationStats } from "./useReputation"

function scoreColor(value: number) {
  if (value >= 7) return "bg-emerald-500"
  if (value >= 4) return "bg-amber-400"
  return "bg-red-500"
}

export function ReputationScore({
  agentRegistry,
  agentId,
}: {
  agentRegistry: string
  agentId: number
}) {
  const { data, isLoading, error } = useReputationStats(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 animate-pulse">
        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
        <div className="h-3 w-8 rounded bg-white/10" />
      </div>
    )
  }

  if (error || !data?.agentStats) {
    return <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
  }

  const { averageFeedbackValue, totalFeedback } = data.agentStats
  const score = averageFeedbackValue.toFixed(1)

  return (
    <div
      className="group inline-flex items-center gap-3 cursor-default"
      title={`${totalFeedback} ${totalFeedback === 1 ? "review" : "reviews"}`}
    >
      <div
        className={`h-2 w-2 rounded-full ${scoreColor(averageFeedbackValue)}`}
      />
      <span className="font-mono text-xl text-white/80">{score}</span>
      <span className="text-xs text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
        ({totalFeedback})
      </span>
    </div>
  )
}

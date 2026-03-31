import { useReputation } from "./useReputation"

export function ReputationScore({
  agentRegistry,
  agentId,
}: {
  agentRegistry: string
  agentId: number
}) {
  const { data, isLoading, error } = useReputation(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 animate-pulse">
        <div className="h-4 w-8 rounded bg-white/10" />
        <div className="h-3 w-px bg-white/10" />
        <div className="h-3 w-12 rounded bg-white/10" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400">
        <span>⚠</span>
        <span>Failed to load</span>
      </div>
    )
  }

  if (!data?.agentStats) {
    return (
      <div className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/30">
        No reputation data
      </div>
    )
  }

  const { averageFeedbackValue, totalFeedback } = data.agentStats
  const score = averageFeedbackValue.toFixed(2)

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-mono">
      <span className="font-semibold text-white">{score}</span>
      <span className="h-3 w-px bg-white/20" />
      <span className="text-white/50">
        {totalFeedback} {totalFeedback === 1 ? "review" : "reviews"}
      </span>
    </div>
  )
}

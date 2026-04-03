import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { truncateAddress, formatRelativeTime } from "@/lib/utils"
import * as v from "valibot"

// ============================================================================
// TYPES
// ============================================================================

type FeedbackEvent = {
  kind: "feedback"
  id: string
  createdAt: number
  clientAddress: string
  value: number
  tag1: string | null
  tag2: string | null
  text: string | null
}

type ValidationEvent = {
  kind: "validation"
  id: string
  createdAt: number
  validatorAddress: string
  response: number | null
  status: "PENDING" | "COMPLETED" | "EXPIRED"
  tag: string | null
}

type ActivityEvent = FeedbackEvent | ValidationEvent

// ============================================================================
// QUERY
// ============================================================================

const FETCH_SIZE = 50

const ACTIVITY_LOG_QUERY = `#graphql
  query ($id: ID!, $first: Int!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first
    ) {
      id
      clientAddress
      value
      tag1
      tag2
      createdAt
      feedbackFile {
        text
      }
    }
    validations(
      where: { agent_: { id: $id } },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first
    ) {
      id
      validatorAddress
      response
      tag
      status
      createdAt
    }
  }
`

type RawActivityResponse = {
  feedbacks: Array<{
    id: string
    clientAddress: string
    value: string
    tag1: string | null
    tag2: string | null
    createdAt: string
    feedbackFile: { text: string | null } | null
  }>
  validations: Array<{
    id: string
    validatorAddress: string
    response: number | null
    tag: string | null
    status: "PENDING" | "COMPLETED" | "EXPIRED"
    createdAt: string
  }>
}

const activityLogSchema = v.object({
  feedbacks: v.array(
    v.object({
      id: v.string(),
      clientAddress: v.string(),
      value: v.string(),
      tag1: v.nullable(v.string()),
      tag2: v.nullable(v.string()),
      createdAt: v.string(),
      feedbackFile: v.nullable(v.object({ text: v.nullable(v.string()) })),
    })
  ),
  validations: v.array(
    v.object({
      id: v.string(),
      validatorAddress: v.string(),
      response: v.nullable(v.number()),
      tag: v.nullable(v.string()),
      status: v.picklist(["PENDING", "COMPLETED", "EXPIRED"]),
      createdAt: v.string(),
    })
  ),
})

function useActivityLog(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  const query = useQuery({
    queryKey: ["activity-log", agentRegistry, agentId],
    queryFn: async (): Promise<RawActivityResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}`, first: FETCH_SIZE }

      const data = await subgraphFetch<RawActivityResponse>(
        url,
        ACTIVITY_LOG_QUERY,
        variables
      )

      try {
        return v.parse(activityLogSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(`Invalid subgraph response: ${error.issues[0].message}`)
        }
        throw error
      }
    },
  })

  const events = useMemo<ActivityEvent[]>(() => {
    if (!query.data) return []

    const feedbackEvents: FeedbackEvent[] = query.data.feedbacks.map((f) => ({
      kind: "feedback",
      id: f.id,
      createdAt: parseInt(f.createdAt, 10),
      clientAddress: f.clientAddress,
      value: parseFloat(f.value),
      tag1: f.tag1,
      tag2: f.tag2,
      text: f.feedbackFile?.text ?? null,
    }))

    const validationEvents: ValidationEvent[] = query.data.validations.map((v) => ({
      kind: "validation",
      id: v.id,
      createdAt: parseInt(v.createdAt, 10),
      validatorAddress: v.validatorAddress,
      response: v.response,
      status: v.status,
      tag: v.tag,
    }))

    return [...feedbackEvents, ...validationEvents].sort(
      (a, b) => b.createdAt - a.createdAt
    )
  }, [query.data])

  return { ...query, events }
}

// ============================================================================
// EVENT ROW COMPONENTS
// ============================================================================

function FeedbackRow({ event }: { event: FeedbackEvent }) {
  const tags = [event.tag1, event.tag2].filter(Boolean) as string[]

  function scoreColor(v: number) {
    if (v >= 81) return "text-emerald-500"
    if (v >= 61) return "text-emerald-400"
    if (v >= 41) return "text-amber-400"
    if (v >= 21) return "text-orange-400"
    return "text-red-400"
  }

  return (
    <div className="flex items-start gap-3">
      {/* Icon */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <svg className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 16 16" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 8c0 3.314-2.686 6-6 6a5.98 5.98 0 01-3.5-1.125L2 13.5l.625-2.5A5.98 5.98 0 012 8c0-3.314 2.686-6 6-6s6 2.686 6 6z" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`font-mono text-sm font-semibold tabular-nums ${scoreColor(event.value)}`}>
            {event.value.toFixed(1)}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            feedback from{" "}
            <span className="font-mono">{truncateAddress(event.clientAddress)}</span>
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
        {event.text && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
            {event.text}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
        {formatRelativeTime(event.createdAt)}
      </span>
    </div>
  )
}

function ValidationRow({ event }: { event: ValidationEvent }) {
  function statusColor(s: ValidationEvent["status"]) {
    if (s === "COMPLETED") return "text-emerald-500"
    if (s === "PENDING") return "text-amber-400"
    return "text-zinc-400 dark:text-zinc-500"
  }

  function scoreColor(v: number) {
    if (v >= 80) return "text-emerald-500"
    if (v >= 60) return "text-blue-400"
    if (v >= 40) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <div className="flex items-start gap-3">
      {/* Icon */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <svg className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 16 16" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l-6 6-3-3" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {event.response !== null ? (
            <span className={`font-mono text-sm font-semibold tabular-nums ${scoreColor(event.response)}`}>
              {event.response}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">/100</span>
            </span>
          ) : null}
          <span className={`text-xs font-medium ${statusColor(event.status)}`}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            validation by{" "}
            <span className="font-mono">{truncateAddress(event.validatorAddress)}</span>
          </span>
          {event.tag && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {event.tag}
            </span>
          )}
        </div>
      </div>

      {/* Time */}
      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
        {formatRelativeTime(event.createdAt)}
      </span>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityLog(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { events, isLoading, error } = useActivityLog(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load activity log.</p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity yet.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{events.length} events</span>
        </div>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {events.map((event) => (
          <div key={event.id} className="px-5 py-3.5">
            {event.kind === "feedback" ? (
              <FeedbackRow event={event} />
            ) : (
              <ValidationRow event={event} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

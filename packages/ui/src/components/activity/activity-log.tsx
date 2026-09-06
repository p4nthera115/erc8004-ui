import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "../../lib/useAgentIdentity"
import { formatRelativeTime } from "../../lib/utils"
import { cn } from "../../lib/cn"
import type { HeadingLevel } from "../../types"
import * as v from "valibot"
import { Address, LoadingLabel } from "../_internal"

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
    if (v >= 81) return "text-erc8004-positive"
    if (v >= 61) return "text-erc8004-positive/80"
    if (v >= 41) return "text-erc8004-chart-5"
    if (v >= 21) return "text-erc8004-chart-3"
    return "text-erc8004-negative"
  }

  return (
    <div className="flex items-start gap-3">
      {/* Icon — carries the event type, so the row text doesn't have to */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-erc8004-muted"
        title="Feedback"
      >
        <span className="sr-only">Feedback</span>
        <svg aria-hidden="true" className="h-3.5 w-3.5 text-erc8004-muted-fg" fill="none" viewBox="0 0 16 16" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 8c0 3.314-2.686 6-6 6a5.98 5.98 0 01-3.5-1.125L2 13.5l.625-2.5A5.98 5.98 0 012 8c0-3.314 2.686-6 6-6s6 2.686 6 6z" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* Fixed width: scores range from "1.0" to "100.0", and an auto-width
              column pushed every row's address to a different x. */}
          <span className={`w-11 shrink-0 text-right font-mono text-sm font-semibold tabular-nums ${scoreColor(event.value)}`}>
            <span aria-hidden="true">{event.value.toFixed(1)}</span>
            <span className="sr-only">{`Score ${event.value.toFixed(1)}`}</span>
          </span>
          <Address address={event.clientAddress} />
          {tags.map((tag) => (
            <span
              key={tag}
              title={tag}
              className="max-w-[14rem] truncate rounded-erc8004-sm bg-erc8004-muted px-2 py-0.5 text-xs text-erc8004-muted-fg"
            >
              {tag}
            </span>
          ))}
        </div>
        {event.text && (
          <p className="mt-1 line-clamp-2 text-xs text-erc8004-muted-fg">
            {event.text}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="shrink-0 text-xs text-erc8004-muted-fg">
        {formatRelativeTime(event.createdAt)}
      </span>
    </div>
  )
}

function ValidationRow({ event }: { event: ValidationEvent }) {
  function statusColor(s: ValidationEvent["status"]) {
    if (s === "COMPLETED") return "text-erc8004-positive"
    if (s === "PENDING") return "text-erc8004-chart-5"
    return "text-erc8004-muted-fg"
  }

  function scoreColor(v: number) {
    if (v >= 80) return "text-erc8004-positive"
    if (v >= 60) return "text-erc8004-accent"
    if (v >= 40) return "text-erc8004-chart-5"
    return "text-erc8004-negative"
  }

  return (
    <div className="flex items-start gap-3">
      {/* Icon — carries the event type, so the row text doesn't have to */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-erc8004-muted"
        title="Validation"
      >
        <span className="sr-only">Validation</span>
        <svg aria-hidden="true" className="h-3.5 w-3.5 text-erc8004-muted-fg" fill="none" viewBox="0 0 16 16" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l-6 6-3-3" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* Same fixed width as the feedback row so the two event types line
              up with each other in a mixed feed. */}
          <span className={`w-11 shrink-0 text-right font-mono text-sm font-semibold tabular-nums ${event.response !== null ? scoreColor(event.response) : "text-erc8004-muted-fg"}`}>
            {event.response !== null ? (
              <>
                {event.response}
                <span className="text-xs font-normal text-erc8004-muted-fg">/100</span>
              </>
            ) : (
              "\u2014"
            )}
          </span>
          <span className={`text-xs font-medium ${statusColor(event.status)}`}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </span>
          <Address address={event.validatorAddress} />
          {event.tag && (
            <span
              title={event.tag}
              className="max-w-[14rem] truncate rounded-erc8004-sm bg-erc8004-muted px-2 py-0.5 text-xs text-erc8004-muted-fg"
            >
              {event.tag}
            </span>
          )}
        </div>
      </div>

      {/* Time */}
      <span className="shrink-0 text-xs text-erc8004-muted-fg">
        {formatRelativeTime(event.createdAt)}
      </span>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export type ActivityEventType = "feedback" | "validation"

export interface ActivityLogProps extends AgentIdentityProps {
  /** Maximum events to display. Default `20`. */
  pageSize?: number
  /** Filter by event type. Default shows all. */
  eventTypes?: ActivityEventType[]
  /**
   * Heading level for this component's title. Default `3` — the level it was
   * previously hardcoded to, so the default renders identically.
   */
  headingLevel?: HeadingLevel
  className?: string
}

export function ActivityLog({
  pageSize = 20,
  eventTypes,
  headingLevel = 3,
  className,
  ...props
}: ActivityLogProps) {
  const Heading = `h${headingLevel}` as const
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { events: allEvents, isLoading, error } = useActivityLog(agentRegistry, agentId)

  const events = useMemo(() => {
    let filtered = allEvents
    if (eventTypes) {
      filtered = filtered.filter((e) => eventTypes.includes(e.kind as ActivityEventType))
    }
    return filtered.slice(0, pageSize)
  }, [allEvents, eventTypes, pageSize])

  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card", className)}
        aria-busy="true"
      >
        <LoadingLabel />
        <div aria-hidden="true" className="border-b border-erc8004-border px-5 py-4">
          <div className="h-4 w-20 animate-pulse rounded-erc8004-sm bg-erc8004-muted" />
        </div>
        <div aria-hidden="true" className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-erc8004-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-48 animate-pulse rounded-erc8004-sm bg-erc8004-muted" />
                <div className="h-3 w-32 animate-pulse rounded-erc8004-sm bg-erc8004-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">Failed to load activity log.</p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div role="status" className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <p className="text-sm text-erc8004-muted-fg">No activity yet.</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card", className)}>
      <div className="border-b border-erc8004-border px-5 py-4">
        <div className="flex items-center justify-between">
          <Heading className="text-sm font-semibold text-erc8004-card-fg">Activity</Heading>
          <span className="text-xs text-erc8004-muted-fg">{events.length} events</span>
        </div>
      </div>
      {/* tabIndex makes the scroll container reachable by keyboard — a
          scrollable region that cannot be focused cannot be scrolled without
          a pointer. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Agent activity"
        className="max-h-[32rem] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-erc8004-ring"
      >
        <ul className="divide-y divide-erc8004-border">
          {events.map((event) => (
            <li key={event.id} className="px-5 py-3.5">
              {event.kind === "feedback" ? (
                <FeedbackRow event={event} />
              ) : (
                <ValidationRow event={event} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

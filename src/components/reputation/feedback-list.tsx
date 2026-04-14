import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import type { Feedback, FeedbackFile, FeedbackResponse } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { truncateAddress, formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/cn"
import * as v from "valibot"

const DEFAULT_PAGE_SIZE = 10

type FeedbackItem = Pick<
  Feedback,
  "id" | "clientAddress" | "value" | "tag1" | "tag2" | "createdAt"
> & {
  feedbackFile: Pick<FeedbackFile, "id" | "text"> | null
  responses: Array<Pick<FeedbackResponse, "id" | "responder" | "responseUri" | "createdAt">>
}

type FeedbackListResponse = {
  feedbacks: FeedbackItem[]
}

const feedbackListSchema = v.object({
  feedbacks: v.pipe(
    v.array(
      v.object({
        id: v.string(),
        clientAddress: v.string(),
        value: v.string(),
        tag1: v.nullable(v.string()),
        tag2: v.nullable(v.string()),
        createdAt: v.string(),
        feedbackFile: v.nullable(
          v.object({
            id: v.string(),
            text: v.nullable(v.string()),
          })
        ),
        responses: v.array(
          v.object({
            id: v.string(),
            responder: v.string(),
            responseUri: v.nullable(v.string()),
            createdAt: v.string(),
          })
        ),
      })
    ),
    v.transform((raw) =>
      raw.map((item) => ({
        id: item.id,
        clientAddress: item.clientAddress,
        value: parseFloat(item.value),
        tag1: item.tag1,
        tag2: item.tag2,
        createdAt: parseInt(item.createdAt, 10),
        feedbackFile: item.feedbackFile,
        responses: item.responses.map((r) => ({
          id: r.id,
          responder: r.responder,
          responseUri: r.responseUri,
          createdAt: parseInt(r.createdAt, 10),
        })),
      }))
    )
  ),
})

const FEEDBACK_LIST_QUERY = `#graphql
  query ($id: ID!, $first: Int!, $skip: Int!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first,
      skip: $skip
    ) {
      id
      clientAddress
      value
      tag1
      tag2
      createdAt
      feedbackFile {
        id
        text
      }
      responses {
        id
        responder
        responseUri
        createdAt
      }
    }
  }
`

function useFeedbackList(
  agentRegistry: string,
  agentId: number,
  page: number,
  pageSize: number
) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["feedback-list", agentRegistry, agentId, page, pageSize],
    queryFn: async (): Promise<FeedbackListResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = {
        id: `${chainId}:${agentId}`,
        first: pageSize,
        skip: page * pageSize,
      }

      const data = await subgraphFetch<FeedbackListResponse>(
        url,
        FEEDBACK_LIST_QUERY,
        variables
      )

      try {
        return v.parse(feedbackListSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(
            `Invalid subgraph response: ${error.issues[0].message}`
          )
        }
        throw error
      }
    },
  })
}

function scoreColor(value: number) {
  if (value >= 81) return "text-erc8004-positive"
  if (value >= 61) return "text-erc8004-positive/80"
  if (value >= 41) return "text-erc8004-chart-5"
  if (value >= 21) return "text-erc8004-chart-3"
  return "text-erc8004-negative"
}

interface FeedbackCardOptions {
  showReviewerAddress: boolean
  showTimestamp: boolean
  showTags: boolean
  showResponses: boolean
}

function FeedbackCard({ item, options }: { item: FeedbackItem; options: FeedbackCardOptions }) {
  const tags = options.showTags ? ([item.tag1, item.tag2].filter(Boolean) as string[]) : []

  return (
    <div className="rounded-erc8004-lg border border-erc8004-border bg-erc8004-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-mono text-lg font-semibold tabular-nums ${scoreColor(item.value)}`}>
            {item.value.toFixed(1)}
          </span>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-erc8004-muted px-2 py-0.5 text-xs text-erc8004-muted-fg"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {(options.showReviewerAddress || options.showTimestamp) && (
          <div className="shrink-0 text-right">
            {options.showReviewerAddress && (
              <div className="font-mono text-xs text-erc8004-muted-fg" title={item.clientAddress}>
                {truncateAddress(item.clientAddress)}
              </div>
            )}
            {options.showTimestamp && (
              <div className="text-xs text-erc8004-muted-fg">
                {formatRelativeTime(item.createdAt)}
              </div>
            )}
          </div>
        )}
      </div>

      {item.feedbackFile?.text && (
        <p className="mt-3 text-sm text-erc8004-card-fg line-clamp-3">
          {item.feedbackFile.text}
        </p>
      )}

      {options.showResponses && item.responses.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-erc8004-border pl-3">
          {item.responses.map((response) => (
            <div key={response.id} className="text-xs text-erc8004-muted-fg">
              <span className="font-mono">{truncateAddress(response.responder)}</span>
              {" · "}
              <span>{formatRelativeTime(response.createdAt)}</span>
              {response.responseUri && (
                <span className="ml-1 text-erc8004-muted-fg/70 truncate">
                  {response.responseUri}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export interface FeedbackListProps extends AgentIdentityProps {
  /** Items per page. Default `10`. */
  pageSize?: number
  /** Show reviewer address. Default `true`. */
  showReviewerAddress?: boolean
  /** Show timestamp. Default `true`. */
  showTimestamp?: boolean
  /** Show tag pills. Default `true`. */
  showTags?: boolean
  /** Show agent responses under each feedback entry. Default `true`. */
  showResponses?: boolean
  /** Message when there's no feedback. Default `"No feedback yet."`. */
  emptyMessage?: string
  className?: string
}

export function FeedbackList({
  pageSize = DEFAULT_PAGE_SIZE,
  showReviewerAddress = true,
  showTimestamp = true,
  showTags = true,
  showResponses = true,
  emptyMessage = "No feedback yet.",
  className,
  ...props
}: FeedbackListProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useFeedbackList(agentRegistry, agentId, page, pageSize)

  const cardOptions: FeedbackCardOptions = { showReviewerAddress, showTimestamp, showTags, showResponses }

  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="border-b border-erc8004-border px-5 py-4">
          <div className="h-4 w-16 animate-pulse rounded-erc8004-sm bg-erc8004-muted" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-erc8004-lg border border-erc8004-border bg-erc8004-muted"
            />
          ))}
          <div className="flex items-center justify-between pt-1">
            <div className="h-7 w-20 animate-pulse rounded-erc8004-md bg-erc8004-muted" />
            <div className="h-4 w-12 animate-pulse rounded-erc8004-sm bg-erc8004-muted" />
            <div className="h-7 w-14 animate-pulse rounded-erc8004-md bg-erc8004-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">
          Failed to load feedback.
        </p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.feedbacks.length && page === 0) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <p className="text-sm text-erc8004-muted-fg">{emptyMessage}</p>
      </div>
    )
  }

  const feedbacks = data?.feedbacks ?? []
  const hasNext = feedbacks.length === pageSize
  const hasPrev = page > 0

  return (
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card", className)}>
      <div className="border-b border-erc8004-border px-5 py-4">
        <h3 className="text-sm font-semibold text-erc8004-card-fg">Feedback</h3>
      </div>
      <div className="space-y-3 p-5">
        <ul role="list" className="space-y-3">
          {feedbacks.map((item) => (
            <li key={item.id}>
              <FeedbackCard item={item} options={cardOptions} />
            </li>
          ))}
        </ul>

        {(hasPrev || hasNext) && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev}
              aria-label="Previous page"
              className="rounded-erc8004-md px-3 py-1.5 text-xs text-erc8004-muted-fg hover:text-erc8004-card-fg disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring focus-visible:ring-offset-2"
            >
              ← Previous
            </button>
            <span className="text-xs text-erc8004-muted-fg">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              aria-label="Next page"
              className="rounded-erc8004-md px-3 py-1.5 text-xs text-erc8004-muted-fg hover:text-erc8004-card-fg disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring focus-visible:ring-offset-2"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

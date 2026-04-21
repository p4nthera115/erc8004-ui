import { useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import type { Feedback, FeedbackFile, FeedbackResponse } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/cn"
import { Card, Tag, Address, Skeleton, EmptyState, ErrorState } from "@/components/_internal"
import * as v from "valibot"

const DEFAULT_PAGE_SIZE = 10
const COUNT_QUERY_LIMIT = 1000

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

const FEEDBACK_COUNT_QUERY = `#graphql
  query ($id: ID!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      first: ${COUNT_QUERY_LIMIT}
    ) {
      id
    }
  }
`

function useFeedbackCount(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["feedback-count", agentRegistry, agentId],
    queryFn: async (): Promise<number> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const data = await subgraphFetch<{ feedbacks: { id: string }[] }>(
        url,
        FEEDBACK_COUNT_QUERY,
        { id: `${chainId}:${agentId}` }
      )
      return data.feedbacks.length
    },
  })
}

function useFeedbackList(
  agentRegistry: string,
  agentId: number,
  page: number,
  pageSize: number
) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["feedback-list", agentRegistry, agentId, page, pageSize],
    placeholderData: keepPreviousData,
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

interface FeedbackRowOptions {
  showReviewerAddress: boolean
  showTimestamp: boolean
  showTags: boolean
  showResponses: boolean
  coloredScores: boolean
}

/** CSS var for a score value, banded green → gold → red. */
function scoreColorVar(score: number): string {
  if (score >= 81) return "oklch(var(--erc8004-positive))"
  if (score >= 61) return "oklch(var(--erc8004-chart-2))"
  if (score >= 41) return "oklch(var(--erc8004-chart-5))"
  if (score >= 21) return "oklch(var(--erc8004-chart-3))"
  return "oklch(var(--erc8004-negative))"
}

function FeedbackRow({ item, options }: { item: FeedbackItem; options: FeedbackRowOptions }) {
  const tags = options.showTags ? ([item.tag1, item.tag2].filter(Boolean) as string[]) : []

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "font-mono text-base font-semibold tabular-nums",
            !options.coloredScores && "text-erc8004-card-fg"
          )}
          style={
            options.coloredScores
              ? { color: scoreColorVar(item.value) }
              : undefined
          }
        >
          {item.value.toFixed(1)}
        </span>
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
        {options.showReviewerAddress && (
          <Address address={item.clientAddress} className="ml-auto shrink-0" />
        )}
        {options.showTimestamp && (
          <span className="text-xs text-erc8004-muted-fg shrink-0">
            {formatRelativeTime(item.createdAt)}
          </span>
        )}
      </div>

      {item.feedbackFile?.text && (
        <p className="mt-2 text-sm text-erc8004-card-fg line-clamp-3">
          {item.feedbackFile.text}
        </p>
      )}

      {options.showResponses && item.responses.length > 0 && (
        <div className="mt-3 space-y-2 pl-4 border-l border-erc8004-border ml-2">
          {item.responses.map((response) => (
            <div key={response.id} className="text-xs text-erc8004-muted-fg">
              <Address address={response.responder} />
              {" · "}
              <span>{formatRelativeTime(response.createdAt)}</span>
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
  /**
   * Colour the numeric score by score band (green/gold/red). Default `true`.
   */
  coloredScores?: boolean
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
  coloredScores = true,
  emptyMessage = "No feedback yet.",
  className,
  ...props
}: FeedbackListProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [page, setPage] = useState(0)
  const { data, isLoading, error, refetch } = useFeedbackList(agentRegistry, agentId, page, pageSize)
  const { data: totalCount } = useFeedbackCount(agentRegistry, agentId)

  const rowOptions: FeedbackRowOptions = {
    showReviewerAddress,
    showTimestamp,
    showTags,
    showResponses,
    coloredScores,
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <div className="border-b border-erc8004-border px-4 py-3">
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-erc8004-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-5 w-16 rounded-erc8004-sm" />
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <ErrorState message="Couldn't load feedback" onRetry={() => refetch()} />
      </Card>
    )
  }

  if (!data?.feedbacks.length && page === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <EmptyState message={emptyMessage} />
      </Card>
    )
  }

  const feedbacks = data?.feedbacks ?? []
  const hasNextPage = feedbacks.length === pageSize
  const totalPages = totalCount !== undefined ? Math.ceil(totalCount / pageSize) : undefined
  const countCapped = totalCount === COUNT_QUERY_LIMIT

  return (
    <Card className={cn("w-full", className)}>
      <div className="border-b border-erc8004-border px-4 py-3">
        <h3 className="text-sm font-medium text-erc8004-card-fg">Feedback</h3>
      </div>

      <div className="divide-y divide-erc8004-border" role="list">
        {feedbacks.map((item) => (
          <FeedbackRow key={item.id} item={item} options={rowOptions} />
        ))}
      </div>

      {(page > 0 || hasNextPage) && (
        <div className="border-t border-erc8004-border px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="bg-erc8004-muted hover:bg-erc8004-border text-erc8004-fg text-sm px-3 py-1.5 rounded-erc8004-md disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring"
          >
            &#8592;
          </button>
          <span className="text-xs text-erc8004-muted-fg tabular-nums">
            {totalPages !== undefined
              ? `${page + 1} / ${totalPages}${countCapped ? "+" : ""}`
              : `Page ${page + 1}`}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className="bg-erc8004-muted hover:bg-erc8004-border text-erc8004-fg text-sm px-3 py-1.5 rounded-erc8004-md disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring"
          >
            &#8594;
          </button>
        </div>
      )}
    </Card>
  )
}

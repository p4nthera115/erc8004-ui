import { useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "../../lib/useAgentIdentity"
import type { Feedback, FeedbackFile, FeedbackResponse } from "../../types"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import { formatRelativeTime } from "../../lib/utils"
import { cn } from "../../lib/cn"
import { Card, Tag, Address, Skeleton, EmptyState, ErrorState } from "../_internal"
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
  const text = item.feedbackFile?.text
  const responses = options.showResponses ? item.responses : []
  const hasMeta = options.showReviewerAddress || options.showTimestamp

  // With tags, address and timestamp all hidden there is nothing to fill the
  // row, and a lone number stranded beside a card-width of dead space reads as
  // broken rather than minimal. Derived from props alone, so every row in a
  // given list agrees — no per-row branching on whether data happens to exist.
  const scoreOnly = !options.showTags && !hasMeta

  const score = (
    <span
      className={cn(
        "font-mono text-base font-semibold tabular-nums text-right leading-6",
        !options.coloredScores && "text-erc8004-card-fg"
      )}
      style={options.coloredScores ? { color: scoreColorVar(item.value) } : undefined}
    >
      {item.value.toFixed(1)}
    </span>
  )

  if (scoreOnly) {
    return (
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3 px-4 py-2">
        {score}
        <div className="min-w-0">
          {/* The bar turns the empty width into the one thing still on show:
              how the scores compare to each other down the list. */}
          <div
            className="h-1.5 w-full overflow-hidden rounded-erc8004-sm bg-erc8004-muted"
            role="presentation"
          >
            <div
              className="h-full rounded-erc8004-sm"
              style={{
                width: `${Math.max(0, Math.min(100, item.value))}%`,
                backgroundColor: scoreColorVar(item.value),
              }}
            />
          </div>
          {text && (
            <p className="mt-1.5 line-clamp-2 text-sm text-erc8004-card-fg">{text}</p>
          )}
        </div>
      </div>
    )
  }

  // A three-column grid rather than a flex row with `ml-auto`. Scores vary in
  // width ("1.0" vs "100.0"), so an auto-width first column pushed every row's
  // tags to a different x. Fixing the column keeps tags, text and metadata on
  // the same vertical lines down the whole list.
  //
  // The metadata column is sized to its content, so in a narrow card it took
  // the ~200px an address and a relative time need and left the tags with
  // about 50px — every pill truncated to a single letter. Below `@md` the
  // metadata drops onto its own line under the content instead, which is a
  // container query, not a media query: what matters is how wide the card is,
  // not how wide the window is. The same list is narrow in a sidebar on a
  // desktop and wide in a phone-width single-column page.
  return (
    <div
      className={cn(
        "grid items-start gap-x-3 px-4 py-3",
        hasMeta
          ? "grid-cols-[3.25rem_minmax(0,1fr)] @md:grid-cols-[3.25rem_minmax(0,1fr)_auto]"
          : "grid-cols-[3.25rem_minmax(0,1fr)]"
      )}
    >
      {score}

      <div className="min-w-0">
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 leading-6">
            {tags.map((tag) => (
              <Tag key={tag} className="max-w-full" title={tag}>
                <span className="truncate">{tag}</span>
              </Tag>
            ))}
          </div>
        )}

        {text && (
          <p
            className={cn(
              "text-sm text-erc8004-card-fg line-clamp-3",
              tags.length > 0 ? "mt-1.5" : "leading-6"
            )}
          >
            {text}
          </p>
        )}

        {responses.length > 0 && (
          <div className="mt-2 space-y-1 border-l border-erc8004-border pl-3">
            {responses.map((response) => (
              <div key={response.id} className="text-xs text-erc8004-muted-fg">
                <Address address={response.responder} />
                {" \u00b7 "}
                <span>{formatRelativeTime(response.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMeta && (
        <div className="col-start-2 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 leading-6 @md:col-start-3 @md:row-start-1 @md:mt-0 @md:shrink-0 @md:flex-nowrap">
          {options.showReviewerAddress && <Address address={item.clientAddress} />}
          {options.showTimestamp && (
            <span className="text-xs text-erc8004-muted-fg tabular-nums">
              {formatRelativeTime(item.createdAt)}
            </span>
          )}
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
      <Card className={cn("@container w-full", className)}>
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
      <Card className={cn("@container w-full", className)}>
        <ErrorState message="Couldn't load feedback" onRetry={() => refetch()} />
      </Card>
    )
  }

  if (!data?.feedbacks.length && page === 0) {
    return (
      <Card className={cn("@container w-full", className)}>
        <EmptyState message={emptyMessage} />
      </Card>
    )
  }

  const feedbacks = data?.feedbacks ?? []
  const hasNextPage = feedbacks.length === pageSize
  const totalPages = totalCount !== undefined ? Math.ceil(totalCount / pageSize) : undefined
  const countCapped = totalCount === COUNT_QUERY_LIMIT

  return (
    <Card className={cn("@container w-full", className)}>
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

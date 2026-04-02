import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import type { Feedback, FeedbackFile, FeedbackResponse } from "@/types"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { truncateAddress, formatRelativeTime } from "@/lib/utils"
import * as v from "valibot"

const PAGE_SIZE = 10

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
  page: number
) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["feedback-list", agentRegistry, agentId, page],
    queryFn: async (): Promise<FeedbackListResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = {
        id: `${chainId}:${agentId}`,
        first: PAGE_SIZE,
        skip: page * PAGE_SIZE,
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
  if (value >= 81) return "text-emerald-500"
  if (value >= 61) return "text-emerald-400"
  if (value >= 41) return "text-amber-400"
  if (value >= 21) return "text-orange-400"
  return "text-red-400"
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const tags = [item.tag1, item.tag2].filter(Boolean) as string[]

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
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
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {truncateAddress(item.clientAddress)}
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatRelativeTime(item.createdAt)}
          </div>
        </div>
      </div>

      {item.feedbackFile?.text && (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
          {item.feedbackFile.text}
        </p>
      )}

      {item.responses.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
          {item.responses.map((response) => (
            <div key={response.id} className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">{truncateAddress(response.responder)}</span>
              {" · "}
              <span>{formatRelativeTime(response.createdAt)}</span>
              {response.responseUri && (
                <span className="ml-1 text-zinc-400 dark:text-zinc-500 truncate">
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

export function FeedbackList(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useFeedbackList(agentRegistry, agentId, page)

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
          <div className="flex items-center justify-between pt-1">
            <div className="h-7 w-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-7 w-14 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load feedback.
        </p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.feedbacks.length && page === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No feedback yet.</p>
      </div>
    )
  }

  const feedbacks = data?.feedbacks ?? []
  const hasNext = feedbacks.length === PAGE_SIZE
  const hasPrev = page > 0

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Feedback</h3>
      </div>
      <div className="space-y-3 p-5">
        {feedbacks.map((item) => (
          <FeedbackCard key={item.id} item={item} />
        ))}

        {(hasPrev || hasNext) && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev}
              className="rounded-md px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Previous
            </button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="rounded-md px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { truncateAddress, formatRelativeTime } from "@/lib/utils"
import type { Validation } from "@/types"
import * as v from "valibot"

const PAGE_SIZE = 10

type ValidationItem = Pick<
  Validation,
  "id" | "validatorAddress" | "response" | "tag" | "status" | "createdAt" | "updatedAt"
>

type ValidationListResponse = {
  validations: ValidationItem[]
}

const validationListSchema = v.object({
  validations: v.pipe(
    v.array(
      v.object({
        id: v.string(),
        validatorAddress: v.string(),
        response: v.nullable(v.number()),
        tag: v.nullable(v.string()),
        status: v.picklist(["PENDING", "COMPLETED", "EXPIRED"]),
        createdAt: v.string(),
        updatedAt: v.string(),
      })
    ),
    v.transform((raw) =>
      raw.map((item) => ({
        id: item.id,
        validatorAddress: item.validatorAddress,
        response: item.response,
        tag: item.tag,
        status: item.status,
        createdAt: parseInt(item.createdAt, 10),
        updatedAt: parseInt(item.updatedAt, 10),
      }))
    )
  ),
})

const VALIDATION_LIST_QUERY = `#graphql
  query ($id: ID!, $first: Int!, $skip: Int!) {
    validations(
      where: { agent_: { id: $id } },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first,
      skip: $skip
    ) {
      id
      validatorAddress
      response
      tag
      status
      createdAt
      updatedAt
    }
  }
`

function useValidationList(agentRegistry: string, agentId: number, page: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["validation-list", agentRegistry, agentId, page],
    queryFn: async (): Promise<ValidationListResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = {
        id: `${chainId}:${agentId}`,
        first: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }

      const data = await subgraphFetch<ValidationListResponse>(
        url,
        VALIDATION_LIST_QUERY,
        variables
      )

      try {
        return v.parse(validationListSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(`Invalid subgraph response: ${error.issues[0].message}`)
        }
        throw error
      }
    },
  })
}

function statusBadge(status: Validation["status"]) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "PENDING":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    case "EXPIRED":
      return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500"
  if (score >= 60) return "text-blue-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

function ValidationCard({ item }: { item: ValidationItem }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {item.response !== null ? (
            <span className={`font-mono text-lg font-semibold tabular-nums ${scoreColor(item.response)}`}>
              {item.response}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">/100</span>
            </span>
          ) : (
            <span className="font-mono text-lg font-semibold text-zinc-300 dark:text-zinc-600">—</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(item.status)}`}
          >
            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
          </span>
          {item.tag && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {item.tag}
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {truncateAddress(item.validatorAddress)}
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatRelativeTime(item.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ValidationList(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useValidationList(agentRegistry, agentId, page)

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load validations.</p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.validations.length && page === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No validations yet.</p>
      </div>
    )
  }

  const validations = data?.validations ?? []
  const hasNext = validations.length === PAGE_SIZE
  const hasPrev = page > 0

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Validations</h3>
      </div>
      <div className="space-y-3 p-5">
        {validations.map((item) => (
          <ValidationCard key={item.id} item={item} />
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
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Page {page + 1}</span>
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

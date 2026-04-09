import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { truncateAddress, formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/cn"
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
      return "bg-erc8004-positive/20 text-erc8004-positive"
    case "PENDING":
      return "bg-erc8004-chart-5/20 text-erc8004-chart-5"
    case "EXPIRED":
      return "bg-erc8004-muted text-erc8004-muted-fg"
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-erc8004-positive"
  if (score >= 60) return "text-erc8004-accent"
  if (score >= 40) return "text-erc8004-chart-5"
  return "text-erc8004-negative"
}

function ValidationCard({ item }: { item: ValidationItem }) {
  return (
    <div className="rounded-erc8004-lg border border-erc8004-border bg-erc8004-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {item.response !== null ? (
            <span className={`font-mono text-lg font-semibold tabular-nums ${scoreColor(item.response)}`}>
              {item.response}
              <span className="text-xs font-normal text-erc8004-muted-fg">/100</span>
            </span>
          ) : (
            <span className="font-mono text-lg font-semibold text-erc8004-muted-fg">—</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(item.status)}`}
          >
            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
          </span>
          {item.tag && (
            <span className="rounded-full bg-erc8004-muted px-2 py-0.5 text-xs text-erc8004-muted-fg">
              {item.tag}
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-erc8004-muted-fg" title={item.validatorAddress}>
            {truncateAddress(item.validatorAddress)}
          </div>
          <div className="text-xs text-erc8004-muted-fg">
            {formatRelativeTime(item.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ValidationListProps extends AgentIdentityProps {
  className?: string
}

export function ValidationList({ className, ...props }: ValidationListProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useValidationList(agentRegistry, agentId, page)

  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="border-b border-erc8004-border px-5 py-4">
          <div className="h-4 w-20 animate-pulse rounded-erc8004-sm bg-erc8004-muted" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-erc8004-lg border border-erc8004-border bg-erc8004-muted"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">Failed to load validations.</p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.validations.length && page === 0) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <p className="text-sm text-erc8004-muted-fg">No validations yet.</p>
      </div>
    )
  }

  const validations = data?.validations ?? []
  const hasNext = validations.length === PAGE_SIZE
  const hasPrev = page > 0

  return (
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card", className)}>
      <div className="border-b border-erc8004-border px-5 py-4">
        <h3 className="text-sm font-semibold text-erc8004-card-fg">Validations</h3>
      </div>
      <div className="space-y-3 p-5">
        <ul role="list" className="space-y-3">
          {validations.map((item) => (
            <li key={item.id}>
              <ValidationCard item={item} />
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
            <span className="text-xs text-erc8004-muted-fg">Page {page + 1}</span>
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

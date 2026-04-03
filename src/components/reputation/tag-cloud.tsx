import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import * as v from "valibot"

// ============================================================================
// QUERY — fetch only tag1 + tag2, nothing else
// ============================================================================

const TAG_CLOUD_QUERY = `#graphql
  query ($id: ID!, $first: Int!) {
    feedbacks(
      where: { agent_: { id: $id }, isRevoked: false },
      orderBy: createdAt,
      orderDirection: desc,
      first: $first
    ) {
      tag1
      tag2
    }
  }
`

type TagsResponse = {
  feedbacks: Array<{ tag1: string | null; tag2: string | null }>
}

const tagsSchema = v.object({
  feedbacks: v.array(
    v.object({
      tag1: v.nullable(v.string()),
      tag2: v.nullable(v.string()),
    })
  ),
})

function useTagCloud(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["tag-cloud", agentRegistry, agentId],
    queryFn: async (): Promise<TagsResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}`, first: 1000 }

      const data = await subgraphFetch<TagsResponse>(url, TAG_CLOUD_QUERY, variables)

      try {
        return v.parse(tagsSchema, data)
      } catch (error) {
        if (v.isValiError(error)) {
          throw new Error(`Invalid subgraph response: ${error.issues[0].message}`)
        }
        throw error
      }
    },
  })
}

// ============================================================================
// TAG FREQUENCY
// ============================================================================
// Count occurrences of every tag across tag1 + tag2, then sort by frequency
// descending. We cap at TOP_N to avoid visual clutter.
// ============================================================================

const TOP_N = 20

interface TagEntry {
  tag: string
  count: number
  /** 0–1, relative to the most frequent tag */
  weight: number
}

function computeTagFrequency(
  feedbacks: Array<{ tag1: string | null; tag2: string | null }>
): TagEntry[] {
  const counts = new Map<string, number>()

  for (const fb of feedbacks) {
    if (fb.tag1) counts.set(fb.tag1, (counts.get(fb.tag1) ?? 0) + 1)
    if (fb.tag2) counts.set(fb.tag2, (counts.get(fb.tag2) ?? 0) + 1)
  }

  if (counts.size === 0) return []

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)

  const maxCount = sorted[0][1]

  return sorted.map(([tag, count]) => ({
    tag,
    count,
    weight: count / maxCount,
  }))
}

// ============================================================================
// VISUAL SCALING
// ============================================================================
// Map a weight (0–1) to Tailwind classes for font size, font weight, and
// opacity. Three tiers keeps it readable without needing inline styles.
// ============================================================================

function pillClasses(weight: number): string {
  if (weight >= 0.66) {
    // Top tier — largest, boldest, full opacity
    return "text-sm font-semibold text-zinc-800 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800 px-3 py-1"
  }
  if (weight >= 0.33) {
    // Mid tier
    return "text-xs font-medium text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/70 px-2.5 py-1"
  }
  // Bottom tier — smallest, lightest
  return "text-xs font-normal text-zinc-400 bg-zinc-50 dark:text-zinc-500 dark:bg-zinc-900 px-2 py-0.5"
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TagCloud(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useTagCloud(agentRegistry, agentId)

  const tags = useMemo(() => {
    if (!data?.feedbacks) return []
    return computeTagFrequency(data.feedbacks)
  }, [data?.feedbacks])

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex flex-wrap gap-2">
          {[80, 56, 96, 64, 48, 72, 40, 88].map((w) => (
            <div
              key={w}
              className="h-6 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load tags.</p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Specialisations</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tags yet.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Specialisations</h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {tags.length} tag{tags.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count, weight }) => (
          <span
            key={tag}
            className={`rounded-full transition-colors ${pillClasses(weight)}`}
            title={`${count} mention${count === 1 ? "" : "s"}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

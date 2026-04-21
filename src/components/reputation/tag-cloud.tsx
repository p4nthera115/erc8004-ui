import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { cn } from "@/lib/cn"
import { Card, Tag, Skeleton, EmptyState, ErrorState } from "@/components/_internal"
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

interface TagEntry {
  tag: string
  count: number
  /** 0–1, relative to the most frequent tag */
  weight: number
}

function computeTagFrequency(
  feedbacks: Array<{ tag1: string | null; tag2: string | null }>,
  maxTags: number,
  minOccurrences: number
): TagEntry[] {
  const counts = new Map<string, number>()

  for (const fb of feedbacks) {
    if (fb.tag1) counts.set(fb.tag1, (counts.get(fb.tag1) ?? 0) + 1)
    if (fb.tag2) counts.set(fb.tag2, (counts.get(fb.tag2) ?? 0) + 1)
  }

  if (counts.size === 0) return []

  const sorted = [...counts.entries()]
    .filter(([, count]) => count >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)

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

function tagSizeClass(weight: number): string {
  if (weight >= 0.66) return "text-sm"
  if (weight >= 0.33) return "text-xs"
  return "text-xs opacity-70"
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface TagCloudProps extends AgentIdentityProps {
  /** Maximum number of tags shown. Default `20`. */
  maxTags?: number
  /** Minimum occurrences for a tag to appear. Default `1`. */
  minOccurrences?: number
  className?: string
}

export function TagCloud({
  maxTags = 20,
  minOccurrences = 1,
  className,
  ...props
}: TagCloudProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useTagCloud(agentRegistry, agentId)

  const tags = useMemo(() => {
    if (!data?.feedbacks) return []
    return computeTagFrequency(data.feedbacks, maxTags, minOccurrences)
  }, [data?.feedbacks, maxTags, minOccurrences])

  if (isLoading) {
    return (
      <Card className={cn("w-full p-4", className)}>
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="flex flex-wrap gap-2">
          {[80, 56, 96, 64, 48, 72, 40, 88].map((w) => (
            <Skeleton
              key={w}
              className="h-6 rounded-erc8004-sm"
              style={{ width: w }}
            />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <ErrorState message="Couldn't load tags" />
      </Card>
    )
  }

  if (tags.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <h3 className="px-4 pt-4 text-sm font-medium text-erc8004-card-fg">Specialisations</h3>
        <EmptyState message="No tags yet" />
      </Card>
    )
  }

  return (
    <Card className={cn("w-full p-4", className)}>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-erc8004-card-fg">Specialisations</h3>
        <span className="text-xs text-erc8004-muted-fg">
          {tags.length} tag{tags.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count, weight }) => (
          <Tag
            key={tag}
            className={tagSizeClass(weight)}
          >
            <span title={`${count} mention${count === 1 ? "" : "s"}`}>{tag}</span>
          </Tag>
        ))}
      </div>
    </Card>
  )
}

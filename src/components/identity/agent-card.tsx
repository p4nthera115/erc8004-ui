import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { truncateAddress } from "@/lib/utils"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import * as v from "valibot"
import { FingerprintBadge } from "./FingerprintBadge"

type AgentCardResponse = {
  agent: {
    owner: string
    registrationFile: {
      name: string | null
      description: string | null
      image: string | null
      mcpEndpoint: string | null
      a2aEndpoint: string | null
      oasfEndpoint: string | null
      webEndpoint: string | null
      emailEndpoint: string | null
    } | null
  } | null
}

const agentCardSchema = v.object({
  agent: v.nullable(
    v.object({
      owner: v.string(),
      registrationFile: v.nullable(
        v.object({
          name: v.nullable(v.string()),
          description: v.nullable(v.string()),
          image: v.nullable(v.string()),
          mcpEndpoint: v.nullable(v.string()),
          a2aEndpoint: v.nullable(v.string()),
          oasfEndpoint: v.nullable(v.string()),
          webEndpoint: v.nullable(v.string()),
          emailEndpoint: v.nullable(v.string()),
        })
      ),
    })
  ),
})

const AGENT_CARD_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      owner
      registrationFile {
        name
        description
        image
        mcpEndpoint
        a2aEndpoint
        oasfEndpoint
        webEndpoint
        emailEndpoint
      }
    }
  }
`

function useAgentCard(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["agent-card", agentRegistry, agentId],
    queryFn: async (): Promise<AgentCardResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<AgentCardResponse>(
        url,
        AGENT_CARD_QUERY,
        variables
      )

      try {
        return v.parse(agentCardSchema, data)
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

function resolveImageUrl(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/")
  }
  return uri
}

const PROTOCOL_LABELS: Array<{
  key:
    | "mcpEndpoint"
    | "a2aEndpoint"
    | "oasfEndpoint"
    | "webEndpoint"
    | "emailEndpoint"
  label: string
}> = [
  { key: "mcpEndpoint", label: "MCP" },
  { key: "a2aEndpoint", label: "A2A" },
  { key: "oasfEndpoint", label: "OASF" },
  { key: "webEndpoint", label: "Web" },
  { key: "emailEndpoint", label: "Email" },
]

export function AgentCard(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useAgentCard(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 animate-pulse">
        <div className="flex gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-3 w-3/4 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load agent data.
        </p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.agent) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Agent not found.
        </p>
      </div>
    )
  }

  const { owner, registrationFile: rf } = data.agent
  const name = rf?.name ?? `Agent #${agentId}`
  const description = rf?.description ?? null
  const imageUrl = rf?.image ? resolveImageUrl(rf.image) : null

  const activeProtocols = PROTOCOL_LABELS.filter(({ key }) => rf?.[key] != null)

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FingerprintBadge
              agentRegistry={agentRegistry}
              agentId={agentId}
              size={64}
            />
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {name}
            </h2>
          </div>

          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Owner address */}
            <span
              className="font-mono text-xs text-zinc-400 dark:text-zinc-500"
              title={owner}
            >
              {truncateAddress(owner)}
            </span>

            {activeProtocols.length > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                {activeProtocols.map(({ key, label }) => (
                  <span
                    key={key}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {label}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { truncateAddress } from "@/lib/utils"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
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

interface AgentCardProps extends AgentIdentityProps {
  className?: string
}

export function AgentCard({ className, ...props }: AgentCardProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useAgentCard(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5 animate-pulse", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-erc8004-muted" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-32 rounded-erc8004-sm bg-erc8004-muted" />
            <div className="h-3 w-full rounded-erc8004-sm bg-erc8004-muted/50" />
            <div className="h-3 w-3/4 rounded-erc8004-sm bg-erc8004-muted/50" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">
          Failed to load agent data.
        </p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.agent) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <p className="text-sm text-erc8004-muted-fg">
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
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
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
            <h2 className="truncate text-base font-semibold text-erc8004-card-fg">
              {name}
            </h2>
          </div>

          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-erc8004-muted-fg">
              {description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Owner address */}
            <span
              className="font-mono text-xs text-erc8004-muted-fg"
              title={owner}
            >
              {truncateAddress(owner)}
            </span>

            {activeProtocols.length > 0 && (
              <>
                <span className="text-erc8004-border">·</span>
                {activeProtocols.map(({ key, label }) => (
                  <span
                    key={key}
                    className="rounded-full bg-erc8004-muted px-2 py-0.5 text-xs font-medium text-erc8004-muted-fg"
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

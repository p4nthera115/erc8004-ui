import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "../../lib/useAgentIdentity"
import { cn } from "../../lib/cn"
import { Address, Card, EmptyState, ErrorState, LoadingLabel, Skeleton, Tag } from "../_internal"
import * as v from "valibot"
import { AgentAvatar } from "./agent-avatar"
import type { HeadingLevel } from "../../types"

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

export type AgentCardLayout = "horizontal" | "vertical"

export interface AgentCardProps extends AgentIdentityProps {
  /**
   * Card layout. `"horizontal"` places the avatar next to the name and
   * description (default). `"vertical"` stacks avatar above name, id, and
   * description — better for grid tiles and marketplace listings.
   */
  layout?: AgentCardLayout
  /** Show owner address. Default `true`. */
  showOwner?: boolean
  /** Show protocol badges (MCP, A2A, etc.). Default `true`. */
  showProtocolBadges?: boolean
  /** Show description text. Default `true`. */
  showDescription?: boolean
  /**
   * Heading level for the agent name. Default `2`. Set this to keep the card
   * from breaking the surrounding page's heading order.
   */
  headingLevel?: HeadingLevel
  className?: string
}

export function AgentCard({
  layout = "horizontal",
  showOwner = true,
  showProtocolBadges = true,
  showDescription = true,
  headingLevel = 2,
  className,
  ...props
}: AgentCardProps) {
  const Heading = `h${headingLevel}` as const
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error, refetch } = useAgentCard(
    agentRegistry,
    agentId
  )

  if (isLoading) {
    if (layout === "vertical") {
      return (
        <Card shadow busy className={cn("w-full p-6", className)}>
          <LoadingLabel />
          <Skeleton className="h-20 w-20 rounded-erc8004-md" />
          <Skeleton className="mt-4 h-5 w-36" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-12 rounded-erc8004-sm" />
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </Card>
      )
    }
    return (
      <Card shadow busy className={cn("w-full p-6", className)}>
        <LoadingLabel />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-erc8004-md" />
          <div className="flex-1 space-y-3 pt-0.5">
            <Skeleton className="h-5 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-12 rounded-erc8004-sm" />
              <Skeleton className="h-5 w-10 rounded-erc8004-sm" />
            </div>
          </div>
        </div>
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card shadow className={cn("w-full", className)}>
        <ErrorState
          message="Couldn't load this agent"
          onRetry={() => refetch()}
        />
      </Card>
    )
  }

  if (!data?.agent) {
    return (
      <Card shadow className={cn("w-full", className)}>
        <EmptyState message="Agent not found" />
      </Card>
    )
  }

  const { owner, registrationFile: rf } = data.agent
  const registeredName = rf?.name ?? null
  const name = registeredName ?? `Agent #${agentId}`
  const description = rf?.description ?? null

  const activeProtocols = PROTOCOL_LABELS.filter(({ key }) => rf?.[key] != null)

  if (layout === "vertical") {
    const avatarSize = 80
    return (
      <Card shadow className={cn("p-6 max-w-sm w-full", className)}>
        <div className="flex w-full min-w-0 flex-col justify-center items-center text-center">
          {/* Avatar */}
          <div
            className="aspect-square shrink-0 overflow-hidden rounded-erc8004-md border border-erc8004-border"
            style={{ width: avatarSize, height: avatarSize }}
          >
            <AgentAvatar
              agentRegistry={agentRegistry}
              agentId={agentId}
              name={registeredName}
              image={rf?.image}
              size={avatarSize}
              decorative
            />
          </div>

          {/* Name + agent id */}
          <div className="mt-4 w-full min-w-0">
            <Heading className="truncate text-lg font-medium text-erc8004-card-fg">
              {name}
            </Heading>
            <p className="mt-0.5 text-xs text-erc8004-muted-fg tabular-nums">
              #{agentId}
            </p>
          </div>

          {/* Owner + protocols */}
          {(showOwner ||
            (showProtocolBadges && activeProtocols.length > 0)) && (
            <div className="mt-3 flex w-full min-w-0 flex-col items-center">
              {showOwner && <Address address={owner} />}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {showProtocolBadges &&
                  activeProtocols.map(({ key, label }) => (
                    <Tag key={key}>{label}</Tag>
                  ))}
              </div>
            </div>
          )}

          {/* Description */}
          {showDescription && description && (
            <p className="mt-4 w-full min-w-0 line-clamp-3 break-words text-sm text-erc8004-muted-fg leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card shadow className={cn("w-full p-6", className)}>
      {/* Top row: avatar + name + address + protocol tags */}
      <div className="flex gap-4">
        <div className="h-12 w-12 aspect-square shrink-0 overflow-hidden rounded-erc8004-md border border-erc8004-border">
          <AgentAvatar
            agentRegistry={agentRegistry}
            agentId={agentId}
            name={registeredName}
            image={rf?.image}
            size={48}
            decorative
          />
        </div>

        <div className="min-w-0 flex-1">
          <Heading className="truncate text-lg font-medium text-erc8004-card-fg">
            {name}
          </Heading>

          {(showOwner ||
            (showProtocolBadges && activeProtocols.length > 0)) && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {showOwner && <Address address={owner} />}

              {showOwner &&
                showProtocolBadges &&
                activeProtocols.length > 0 && (
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-erc8004-border" />
                )}

              {showProtocolBadges &&
                activeProtocols.map(({ key, label }) => (
                  <Tag key={key}>{label}</Tag>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: description */}
      {showDescription && description && (
        <p className="mt-4 line-clamp-2 break-words text-sm text-erc8004-muted-fg leading-relaxed">
          {description}
        </p>
      )}
    </Card>
  )
}

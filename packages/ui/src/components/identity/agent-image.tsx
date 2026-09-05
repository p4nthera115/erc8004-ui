import { parseAgentRegistry } from "../../lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "../../lib/subgraph-client"
import { useERC8004Config } from "../../provider/ERC8004Provider"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "../../lib/useAgentIdentity"
import { cn } from "../../lib/cn"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "../_internal"
import * as v from "valibot"
import { FingerprintBadge } from "./FingerprintBadge"
import { AgentAvatar, agentInitials } from "./agent-avatar"

type AgentImageResponse = {
  agent: {
    // `name` is only here for the initials fallback, not rendered on its own.
    registrationFile: { image: string | null; name: string | null } | null
  } | null
}

const agentImageSchema = v.object({
  agent: v.nullable(
    v.object({
      registrationFile: v.nullable(
        v.object({
          image: v.nullable(v.string()),
          name: v.nullable(v.string()),
        })
      ),
    })
  ),
})

const AGENT_IMAGE_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      registrationFile {
        image
        name
      }
    }
  }
`

function useAgentImage(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["agent-image", agentRegistry, agentId],
    queryFn: async (): Promise<AgentImageResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<AgentImageResponse>(
        url,
        AGENT_IMAGE_QUERY,
        variables
      )

      try {
        return v.parse(agentImageSchema, data)
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

function resolveImageUrl(uri: string) {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/")
  }
  return uri
}

interface AgentImageProps extends AgentIdentityProps {
  className?: string
  size?: number
}

export function AgentImage({
  className,
  size = 64,
  ...props
}: AgentImageProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading } = useAgentImage(agentRegistry, agentId)

  if (isLoading) {
    return (
      <Skeleton
        className={cn("rounded-erc8004-md", className)}
        style={{ width: size, height: size }}
      />
    )
  }

  const imageUrl = data?.agent?.registrationFile?.image
  // No image: initials off the registered name, or the fingerprint when the
  // agent has no name to take initials from.
  const initials = agentInitials(data?.agent?.registrationFile?.name)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-erc8004-md border border-erc8004-border ",
        className
      )}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img
          src={resolveImageUrl(imageUrl)}
          alt={`Agent #${agentId}`}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <AgentAvatar
          agentRegistry={agentRegistry}
          agentId={agentId}
          initials={initials}
          size={size}
        />
      ) : (
        <FingerprintBadge
          agentRegistry={agentRegistry}
          agentId={agentId}
          size={size}
        />
      )}
    </div>
  )
}

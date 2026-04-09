import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import {
  useAgentIdentity,
  type AgentIdentityProps,
} from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { useQuery } from "@tanstack/react-query"
import * as v from "valibot"
import { FingerprintBadge } from "./FingerprintBadge"

type AgentImageResponse = {
  agent: {
    registrationFile: { image: string | null } | null
  } | null
}

const agentImageSchema = v.object({
  agent: v.object({
    registrationFile: v.nullable(
      v.object({
        image: v.nullable(v.string()),
      })
    ),
  }),
})

const AGENT_IMAGE_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      registrationFile {
        image
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

export function AgentImage({ className, size = 64, ...props }: AgentImageProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading } = useAgentImage(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div
        className={cn("animate-pulse rounded-full bg-erc8004-muted", className)}
        style={{ width: size, height: size }}
        aria-busy="true"
        aria-live="polite"
      />
    )
  }

  const imageUrl = data?.agent?.registrationFile?.image

  return (
    <div className={cn("overflow-hidden rounded-full", className)} style={{ width: size, height: size }}>
      {imageUrl ? (
        <img
          src={resolveImageUrl(imageUrl)}
          alt={`Agent #${agentId}`}
          className="h-full w-full object-cover"
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

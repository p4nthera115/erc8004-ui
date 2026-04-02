import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { useQuery } from "@tanstack/react-query"
import * as v from "valibot"
import { FingerprintBadge } from "../fingerprint/FingerprintBadge"

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

export function AgentImage(props: AgentIdentityProps) {
  const { agentRegistry, agentId } = useAgentIdentity(props)
  const { data, isLoading, error } = useAgentImage(agentRegistry, agentId)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error.message}</div>
  }

  const imageUrl = data?.agent?.registrationFile?.image

  function resolveImageUrl(uri: string) {
    if (uri.startsWith("ipfs://")) {
      return uri.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
    return uri
  }
  return (
    <div>
      {imageUrl ? (
        <img
          src={resolveImageUrl(imageUrl)}
          alt={`Agent Image for ${agentId}`}
          className="w-32 h-32 rounded-full"
        />
      ) : (
        <FingerprintBadge
          agentRegistry={agentRegistry}
          agentId={agentId}
          size={32}
        />
      )}
    </div>
  )
}

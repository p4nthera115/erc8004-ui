import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { truncateAddress } from "@/lib/utils"
import type { SharedProps } from "@/types"
import * as v from "valibot"
import { FingerprintBadge } from "../fingerprint/FingerprintBadge"

type IdentityDisplayResponse = {
  agent: {
    owner: string
    registrationFile: {
      name: string | null
      description: string | null
      image: string | null
      mcpEndpoint: string | null
      mcpVersion: string | null
      a2aEndpoint: string | null
      a2aVersion: string | null
      oasfEndpoint: string | null
      oasfVersion: string | null
      webEndpoint: string | null
      emailEndpoint: string | null
    } | null
  } | null
}

const identityDisplaySchema = v.object({
  agent: v.nullable(
    v.object({
      owner: v.string(),
      registrationFile: v.nullable(
        v.object({
          name: v.nullable(v.string()),
          description: v.nullable(v.string()),
          image: v.nullable(v.string()),
          mcpEndpoint: v.nullable(v.string()),
          mcpVersion: v.nullable(v.string()),
          a2aEndpoint: v.nullable(v.string()),
          a2aVersion: v.nullable(v.string()),
          oasfEndpoint: v.nullable(v.string()),
          oasfVersion: v.nullable(v.string()),
          webEndpoint: v.nullable(v.string()),
          emailEndpoint: v.nullable(v.string()),
        })
      ),
    })
  ),
})

const IDENTITY_DISPLAY_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      owner
      registrationFile {
        name
        description
        image
        mcpEndpoint
        mcpVersion
        a2aEndpoint
        a2aVersion
        oasfEndpoint
        oasfVersion
        webEndpoint
        emailEndpoint
      }
    }
  }
`

function useIdentityDisplay(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["identity-display", agentRegistry, agentId],
    queryFn: async (): Promise<IdentityDisplayResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<IdentityDisplayResponse>(
        url,
        IDENTITY_DISPLAY_QUERY,
        variables
      )

      try {
        return v.parse(identityDisplaySchema, data)
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

function truncateUrl(url: string, maxLen = 38): string {
  try {
    const u = new URL(url)
    const display = u.hostname + (u.pathname !== "/" ? u.pathname : "")
    return display.length > maxLen ? display.slice(0, maxLen) + "…" : display
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + "…" : url
  }
}

const ENDPOINT_DEFS = [
  { key: "mcpEndpoint" as const, versionKey: "mcpVersion" as const, label: "MCP", isEmail: false },
  { key: "a2aEndpoint" as const, versionKey: "a2aVersion" as const, label: "A2A", isEmail: false },
  { key: "oasfEndpoint" as const, versionKey: "oasfVersion" as const, label: "OASF", isEmail: false },
  { key: "webEndpoint" as const, versionKey: null, label: "Web", isEmail: false },
  { key: "emailEndpoint" as const, versionKey: null, label: "Email", isEmail: true },
]

interface Props extends SharedProps {
  showHealthChecks?: boolean
}

export function IdentityDisplay({ agentRegistry, agentId }: Props) {
  const { data, isLoading, error } = useIdentityDisplay(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 animate-pulse">
        <div className="flex gap-4 p-5">
          <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
        <div className="border-t border-zinc-100 p-5 space-y-2.5 dark:border-zinc-800/60">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900" />
              <div className="h-3 flex-1 rounded bg-zinc-100 dark:bg-zinc-900" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load agent identity.</p>
        <p className="mt-1 text-xs text-red-500/70 dark:text-red-500/50">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!data?.agent) {
    return (
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Agent not found.</p>
      </div>
    )
  }

  const { owner, registrationFile: rf } = data.agent
  const name = rf?.name ?? `Agent #${agentId}`
  const description = rf?.description ?? null
  const imageUrl = rf?.image ? resolveImageUrl(rf.image) : null

  const endpoints = rf
    ? ENDPOINT_DEFS.flatMap(({ key, versionKey, label, isEmail }) => {
        const url = rf[key]
        if (!url) return []
        const version = versionKey ? rf[versionKey] : null
        return [{ label, url, version, isEmail }]
      })
    : []

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Identity header */}
      <div className="flex gap-4 p-5">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <FingerprintBadge agentRegistry={agentRegistry} agentId={agentId} size={64} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {name}
          </h2>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
          <p className="mt-2 font-mono text-xs text-zinc-400 dark:text-zinc-500" title={owner}>
            {truncateAddress(owner)}
          </p>
        </div>
      </div>

      {/* Endpoints */}
      {endpoints.length > 0 && (
        <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800/60">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Endpoints
          </p>
          <div className="flex flex-col gap-2">
            {endpoints.map(({ label, url, version, isEmail }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-14 shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-center text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {label}
                </span>

                {isEmail ? (
                  <a
                    href={`mailto:${url}`}
                    className="min-w-0 flex-1 truncate text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    title={url}
                  >
                    {url}
                  </a>
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    title={url}
                  >
                    {truncateUrl(url)}
                  </a>
                )}

                {version && (
                  <span className="shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                    v{version}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

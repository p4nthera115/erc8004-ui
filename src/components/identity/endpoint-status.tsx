import { useQuery } from "@tanstack/react-query"
import { useERC8004Config } from "@/provider/ERC8004Provider"
import { parseAgentRegistry } from "@/lib/parse-registry"
import { getSubgraphUrl, subgraphFetch } from "@/lib/subgraph-client"
import { useAgentIdentity, type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import * as v from "valibot"

type EndpointStatusResponse = {
  agent: {
    registrationFile: {
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

const endpointStatusSchema = v.object({
  agent: v.nullable(
    v.object({
      registrationFile: v.nullable(
        v.object({
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

const ENDPOINT_STATUS_QUERY = `#graphql
  query ($id: ID!) {
    agent(id: $id) {
      registrationFile {
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

function useEndpointStatus(agentRegistry: string, agentId: number) {
  const { apiKey, subgraphOverrides } = useERC8004Config()

  return useQuery({
    queryKey: ["endpoint-status", agentRegistry, agentId],
    queryFn: async (): Promise<EndpointStatusResponse> => {
      const { chainId } = parseAgentRegistry(agentRegistry)
      const url = getSubgraphUrl(chainId, apiKey, subgraphOverrides)
      const variables = { id: `${chainId}:${agentId}` }

      const data = await subgraphFetch<EndpointStatusResponse>(
        url,
        ENDPOINT_STATUS_QUERY,
        variables
      )

      try {
        return v.parse(endpointStatusSchema, data)
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

interface EndpointRow {
  protocol: string
  url: string
  version: string | null
  isEmail: boolean
}

function buildEndpoints(
  rf: NonNullable<
    NonNullable<EndpointStatusResponse["agent"]>["registrationFile"]
  >
): EndpointRow[] {
  const rows: EndpointRow[] = []
  if (rf.mcpEndpoint)
    rows.push({ protocol: "MCP", url: rf.mcpEndpoint, version: rf.mcpVersion, isEmail: false })
  if (rf.a2aEndpoint)
    rows.push({ protocol: "A2A", url: rf.a2aEndpoint, version: rf.a2aVersion, isEmail: false })
  if (rf.oasfEndpoint)
    rows.push({ protocol: "OASF", url: rf.oasfEndpoint, version: rf.oasfVersion, isEmail: false })
  if (rf.webEndpoint)
    rows.push({ protocol: "Web", url: rf.webEndpoint, version: null, isEmail: false })
  if (rf.emailEndpoint)
    rows.push({ protocol: "Email", url: rf.emailEndpoint, version: null, isEmail: true })
  return rows
}

function truncateUrl(url: string, maxLen = 40): string {
  try {
    const u = new URL(url)
    const display = u.hostname + (u.pathname !== "/" ? u.pathname : "")
    return display.length > maxLen ? display.slice(0, maxLen) + "…" : display
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + "…" : url
  }
}

function HealthIndicator({ url }: { url: string }) {
  const { data: ok, isLoading } = useQuery({
    queryKey: ["health", url],
    queryFn: async (): Promise<boolean> => {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        })
        return res.ok
      } catch {
        return false
      }
    },
    staleTime: 60_000,
    retry: false,
  })

  if (isLoading) {
    return (
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-erc8004-muted" />
    )
  }

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-erc8004-positive" : "bg-erc8004-negative"}`}
      title={ok ? "Reachable" : "Unreachable"}
    />
  )
}

interface EndpointStatusProps extends AgentIdentityProps {
  /** Show live HTTP health check dots. Default: false */
  showHealthChecks?: boolean
  className?: string
}

export function EndpointStatus({ showHealthChecks = false, className, ...agentProps }: EndpointStatusProps) {
  const { agentRegistry, agentId } = useAgentIdentity(agentProps)
  const { data, isLoading, error } = useEndpointStatus(agentRegistry, agentId)

  if (isLoading) {
    return (
      <div
        className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5 animate-pulse", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="mb-4 h-4 w-24 rounded-erc8004-sm bg-erc8004-muted" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-12 rounded-erc8004-sm bg-erc8004-muted/50" />
              <div className="h-3 flex-1 rounded-erc8004-sm bg-erc8004-muted/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-negative/30 bg-erc8004-negative/10 p-5", className)}>
        <p className="text-sm text-erc8004-negative">
          Failed to load endpoints.
        </p>
        <p className="mt-1 text-xs text-erc8004-negative/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  const rf = data?.agent?.registrationFile
  const endpoints = rf ? buildEndpoints(rf) : []

  if (endpoints.length === 0) {
    return (
      <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
        <h3 className="mb-3 text-sm font-semibold text-erc8004-card-fg">
          Endpoints
        </h3>
        <p className="text-sm text-erc8004-muted-fg">
          No endpoints registered.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("w-full rounded-erc8004-xl border border-erc8004-border bg-erc8004-card p-5", className)}>
      <h3 className="mb-4 text-sm font-semibold text-erc8004-card-fg">
        Endpoints
      </h3>

      <div className="flex flex-col gap-2">
        {endpoints.map(({ protocol, url, version, isEmail }) => (
          <div key={protocol} className="flex items-center gap-3">
            {/* Protocol badge */}
            <span className="w-14 shrink-0 rounded-full bg-erc8004-muted px-2 py-0.5 text-center text-xs font-medium text-erc8004-muted-fg">
              {protocol}
            </span>

            {/* URL */}
            {isEmail ? (
              <a
                href={`mailto:${url}`}
                className="min-w-0 flex-1 truncate text-sm text-erc8004-muted-fg hover:text-erc8004-card-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring"
                title={url}
              >
                {url}
              </a>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-erc8004-muted-fg hover:text-erc8004-card-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring"
                title={url}
              >
                {truncateUrl(url)}
              </a>
            )}

            {/* Version tag */}
            {version && (
              <span className="shrink-0 text-xs tabular-nums text-erc8004-muted-fg">
                v{version}
              </span>
            )}

            {/* Health check dot */}
            {showHealthChecks && !isEmail && <HealthIndicator url={url} />}
          </div>
        ))}
      </div>
    </div>
  )
}

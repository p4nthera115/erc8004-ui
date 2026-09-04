/**
 * The /api docs API — every endpoint, and every failure shape.
 *
 * Handlers are plain functions of a Request, so these call them directly. The
 * point of most of these assertions is the *error* side: an agent that mistypes
 * an endpoint or a slug has to get JSON it can branch on, never HTML.
 */
import { describe, expect, it } from "vitest"

import apiIndex from "../api/index"
import health from "../api/health"
import components from "../api/components/index"
import component from "../api/components/[slug]"
import guides from "../api/guides/index"
import guide from "../api/guides/[slug]"
import chains from "../api/chains"
import types from "../api/types"
import notFound from "../api/not-found"
import mcpManifest from "../api/mcp-manifest"
import { REGISTRY } from "../api/_lib/registry"

const BASE = "https://erc8004-ui.vercel.app"

const get = (handler: { fetch(request: Request): Response | Promise<Response> }, path: string, init?: RequestInit) =>
  Promise.resolve(handler.fetch(new Request(`${BASE}${path}`, init)))

async function json(response: Response) {
  return JSON.parse(await response.text())
}

describe("GET /api", () => {
  it("lists every endpoint and the machine-readable entry points", async () => {
    const response = await get(apiIndex, "/api")
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")

    const body = await json(response)
    expect(body.specification).toBe(`${BASE}/openapi.json`)
    expect(body.agentInstructions).toBe(`${BASE}/agents.md`)
    expect(body.mcp.endpoint).toBe(`${BASE}/api/mcp`)
    expect(body.endpoints.length).toBeGreaterThan(5)
    expect(body.counts.components).toBe(REGISTRY.components.length)
  })

  it("advertises the OpenAPI document in a Link header", async () => {
    const response = await get(apiIndex, "/api")
    expect(response.headers.get("link")).toContain('rel="service-desc"')
  })

  it("is callable cross-origin", async () => {
    const response = await get(apiIndex, "/api")
    expect(response.headers.get("access-control-allow-origin")).toBe("*")
  })
})

describe("GET /api/health", () => {
  it("reports the snapshot build stamp so callers can detect a redeploy", async () => {
    const body = await json(await get(health, "/api/health"))
    expect(body.status).toBe("ok")
    expect(body.generatedAt).toBe(REGISTRY.generatedAt)
  })

  it("is not cached", async () => {
    const response = await get(health, "/api/health")
    expect(response.headers.get("cache-control")).toBe("no-store")
  })
})

describe("GET /api/components", () => {
  it("returns every component", async () => {
    const body = await json(await get(components, "/api/components"))
    expect(body.count).toBe(REGISTRY.components.length)
    expect(body.components[0]).toHaveProperty("slug")
    expect(body.components[0]).toHaveProperty("docsUrl")
  })

  it("filters by group", async () => {
    const body = await json(
      await get(components, "/api/components?group=Identity")
    )
    expect(body.count).toBeGreaterThan(0)
    expect(body.count).toBeLessThan(REGISTRY.components.length)
    for (const entry of body.components) expect(entry.group).toBe("Identity")
  })

  it("rejects an unknown group with the valid values", async () => {
    const response = await get(components, "/api/components?group=Nonsense")
    expect(response.status).toBe(400)

    const body = await json(response)
    expect(body.error.code).toBe("invalid_parameter")
    expect(body.error.allowed).toContain("Identity")
    expect(body.error.hint).toBeTruthy()
  })

  it("searches free text", async () => {
    const body = await json(await get(components, "/api/components?q=reputation"))
    expect(body.count).toBeGreaterThan(0)
    expect(
      body.components.some((entry: { slug: string }) => entry.slug === "reputation-score")
    ).toBe(true)
  })
})

describe("GET /api/components/{slug}", () => {
  it("returns one component in full", async () => {
    const body = await json(
      await get(component, "/api/components/reputation-score")
    )
    expect(body.slug).toBe("reputation-score")
    expect(Array.isArray(body.props)).toBe(true)
    expect(body.markdown).toContain("# ReputationScore")
  })

  it("resolves a component name as well as a slug", async () => {
    const body = await json(
      await get(component, "/api/components/ReputationScore")
    )
    expect(body.slug).toBe("reputation-score")
  })

  it("returns markdown when asked, by parameter or by Accept", async () => {
    const byParameter = await get(
      component,
      "/api/components/agent-card?format=markdown"
    )
    expect(byParameter.headers.get("content-type")).toContain("text/markdown")
    expect(await byParameter.text()).toContain("# AgentCard")

    const byAccept = await get(component, "/api/components/agent-card", {
      headers: { Accept: "text/markdown" },
    })
    expect(byAccept.headers.get("content-type")).toContain("text/markdown")
  })

  it("marks both variants of a negotiated URL as varying on Accept", async () => {
    // Both branches, not just the markdown one: these responses are cached at
    // the edge, so a JSON reply without Vary is the variant a CDN would go on
    // to serve to an agent that asked for markdown.
    const asMarkdown = await get(component, "/api/components/agent-card", {
      headers: { Accept: "text/markdown" },
    })
    expect(asMarkdown.headers.get("vary")).toContain("Accept")

    const asJson = await get(component, "/api/components/agent-card")
    expect(asJson.headers.get("content-type")).toContain("application/json")
    expect(asJson.headers.get("vary")).toContain("Accept")
  })

  it("404s an unknown slug with JSON and the list of valid slugs", async () => {
    const response = await get(component, "/api/components/not-a-component")
    expect(response.status).toBe(404)
    expect(response.headers.get("content-type")).toContain("application/json")

    const body = await json(response)
    expect(body.error.code).toBe("not_found")
    expect(body.error.status).toBe(404)
    expect(body.error.allowed).toContain("agent-card")
    expect(body.error.documentation).toBeTruthy()
  })

  it("rejects an unknown format rather than silently returning JSON", async () => {
    const response = await get(component, "/api/components/agent-card?format=yaml")
    expect(response.status).toBe(400)
    const body = await json(response)
    expect(body.error.code).toBe("invalid_parameter")
    expect(body.error.allowed).toEqual(["json", "markdown"])
  })
})

describe("GET /api/guides", () => {
  it("lists guides in reading order", async () => {
    const body = await json(await get(guides, "/api/guides"))
    expect(body.count).toBe(REGISTRY.guides.length)
    expect(body.guides[0].slug).toBe(REGISTRY.guides[0].slug)
  })

  it("returns one guide, and markdown on request", async () => {
    const body = await json(await get(guide, "/api/guides/installation"))
    expect(body.slug).toBe("installation")
    expect(body.markdown.length).toBeGreaterThan(100)

    const markdown = await get(guide, "/api/guides/installation?format=markdown")
    expect(markdown.headers.get("content-type")).toContain("text/markdown")
  })

  it("marks both variants as varying on Accept", async () => {
    for (const url of [
      "/api/guides/installation",
      "/api/guides/installation?format=markdown",
    ]) {
      expect((await get(guide, url)).headers.get("vary"), url).toContain("Accept")
    }
  })

  it("404s an unknown guide with JSON", async () => {
    const response = await get(guide, "/api/guides/nope")
    expect(response.status).toBe(404)
    const body = await json(response)
    expect(body.error.code).toBe("not_found")
    expect(body.error.allowed).toContain("installation")
  })
})

describe("GET /api/chains and /api/types", () => {
  it("reports the chains with a deployed subgraph", async () => {
    const body = await json(await get(chains, "/api/chains"))
    expect(body.count).toBe(REGISTRY.chains.length)
    expect(body.chains.some((chain: { chainId: number }) => chain.chainId === 8453)).toBe(true)
    // The undeployed Validation Registry is the single most misleading thing an
    // agent could assume works; the endpoint has to say so.
    expect(body.note).toContain("Validation Registry")
  })

  it("returns the public type definitions", async () => {
    const body = await json(await get(types, "/api/types"))
    expect(body.source).toBe("src/types.ts")
    expect(body.types).toContain("export interface")

    const markdown = await get(types, "/api/types?format=markdown")
    expect(await markdown.text()).toContain("```ts")
    expect(markdown.headers.get("vary")).toContain("Accept")
  })
})

describe("failure modes", () => {
  it("answers an unknown /api path with JSON, not the HTML 404 page", async () => {
    const response = await get(notFound, "/api/nope")
    expect(response.status).toBe(404)
    expect(response.headers.get("content-type")).toContain("application/json")

    const body = await json(response)
    expect(body.error.code).toBe("not_found")
    expect(body.error.message).toContain("/api/nope")
    expect(body.error.allowed).toContain("/api/components")
    expect(body.error.hint).toContain("/openapi.json")
  })

  it("does not quote its own route when it was reached by rewrite", async () => {
    // vercel.json rewrites unmatched /api/* here, and a rewrite rewrites the
    // URL the function sees — echoing it would name a path the caller never
    // typed.
    const body = await json(await get(notFound, "/api/not-found"))
    expect(body.error.message).not.toContain("/api/not-found")
    expect(body.error.allowed).toContain("/api/components")
  })

  it("answers an unsupported method with a JSON 405 and an Allow header", async () => {
    const response = await get(components, "/api/components", { method: "DELETE" })
    expect(response.status).toBe(405)
    expect(response.headers.get("allow")).toContain("GET")

    const body = await json(response)
    expect(body.error.code).toBe("method_not_allowed")
  })

  it("answers CORS preflight", async () => {
    const response = await get(components, "/api/components", { method: "OPTIONS" })
    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-methods")).toContain("GET")
  })

  it("answers HEAD with the GET headers and no body", async () => {
    const response = await get(health, "/api/health", { method: "HEAD" })
    expect(response.status).toBe(200)
    expect(await response.text()).toBe("")
  })
})

describe("GET /.well-known/mcp", () => {
  it("describes the transport, the versions and the tools", async () => {
    const body = await json(await get(mcpManifest, "/api/mcp-manifest"))
    expect(body.transport).toEqual({
      type: "streamable-http",
      url: `${BASE}/api/mcp`,
    })
    expect(body.protocolVersions).toContain("2026-07-28")
    expect(body.authentication.type).toBe("none")
    expect(body.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "list_components",
      "get_component",
      "get_setup_guide",
      "get_types",
    ])
  })

  it("points at the stdio package for the live tools", async () => {
    const body = await json(await get(mcpManifest, "/api/mcp-manifest"))
    expect(body.packages[0].name).toBe("@erc8004/ui-mcp")
  })
})

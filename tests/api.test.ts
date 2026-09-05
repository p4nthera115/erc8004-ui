/**
 * The /api docs API — every endpoint, and every failure shape.
 *
 * Handlers are plain functions of a Request, so these call them directly. The
 * point of most of these assertions is the *error* side: an agent that mistypes
 * an endpoint or a slug has to get JSON it can branch on, never HTML.
 */
import { beforeEach, describe, expect, it } from "vitest"

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
import { acceptsType, isNotAcceptable } from "../api/_lib/accept"
import {
  RATE_LIMIT,
  RATE_WINDOW_SECONDS,
  resetRateLimits,
} from "../api/_lib/rate-limit"

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
    expect(body.source).toBe("packages/ui/src/types.ts")
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
    expect(body.packages[0].name).toBe("@p4n/erc8004-ui-mcp")
  })
})

describe("content negotiation", () => {
  it("answers 406 when the caller accepts nothing this endpoint produces", async () => {
    const response = await get(components, "/api/components", {
      headers: { Accept: "application/pdf" },
    })
    expect(response.status).toBe(406)

    const body = await json(response)
    expect(body.error.code).toBe("not_acceptable")
    expect(body.error.allowed).toEqual(["application/json"])
    expect(body.error.hint).toContain("application/json")
  })

  it("never 406s a caller that asked for anything, or for nothing", async () => {
    // The common bug is 406-ing too eagerly. A missing header and a wildcard
    // both mean "no constraint".
    for (const headers of [
      undefined,
      { Accept: "*/*" },
      { Accept: "application/json" },
      {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    ]) {
      const response = await get(components, "/api/components", { headers })
      expect(response.status, JSON.stringify(headers)).toBe(200)
    }
  })

  it("does not 406 a markdown-only caller on an endpoint that speaks markdown", async () => {
    const response = await get(component, "/api/components/agent-card", {
      headers: { Accept: "text/markdown" },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/markdown")
  })

  it("406s a markdown-only caller on an endpoint that only speaks JSON", async () => {
    const response = await get(chains, "/api/chains", {
      headers: { Accept: "text/markdown" },
    })
    expect(response.status).toBe(406)
    expect((await json(response)).error.code).toBe("not_acceptable")
  })
})

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits())

  const headers = (response: Response) => ({
    policy: response.headers.get("ratelimit-policy"),
    current: response.headers.get("ratelimit"),
    limit: response.headers.get("ratelimit-limit"),
    remaining: response.headers.get("ratelimit-remaining"),
    reset: response.headers.get("ratelimit-reset"),
  })

  it("reports the quota on an ordinary successful response", async () => {
    // Advertised on every response, not only on a refusal, so a client can
    // slow down before it is refused rather than after.
    const values = headers(await get(health, "/api/health"))
    expect(values.policy).toBe(`"default";q=${RATE_LIMIT};w=${RATE_WINDOW_SECONDS}`)
    expect(values.current).toBe(`"default";r=${RATE_LIMIT - 1};t=${RATE_WINDOW_SECONDS}`)
    expect(values.limit).toBe(String(RATE_LIMIT))
    expect(values.remaining).toBe(String(RATE_LIMIT - 1))
    expect(Number(values.reset)).toBeGreaterThan(0)
  })

  it("counts down as a client spends its quota", async () => {
    const first = headers(await get(health, "/api/health"))
    const second = headers(await get(health, "/api/health"))
    expect(Number(second.remaining)).toBe(Number(first.remaining) - 1)
  })

  it("counts each client separately", async () => {
    await get(health, "/api/health", { headers: { "x-forwarded-for": "203.0.113.1" } })
    const other = await get(health, "/api/health", {
      headers: { "x-forwarded-for": "198.51.100.7" },
    })
    expect(other.headers.get("ratelimit-remaining")).toBe(String(RATE_LIMIT - 1))
  })

  it("reads only the first hop of x-forwarded-for", async () => {
    // The rest of that header is client-supplied and would let a caller mint a
    // fresh bucket per request.
    for (let i = 0; i < 3; i++) {
      await get(health, "/api/health", {
        headers: { "x-forwarded-for": `203.0.113.9, 10.0.0.${i}` },
      })
    }
    const response = await get(health, "/api/health", {
      headers: { "x-forwarded-for": "203.0.113.9, 172.16.0.1" },
    })
    expect(response.headers.get("ratelimit-remaining")).toBe(String(RATE_LIMIT - 4))
  })

  it("refuses with a JSON 429 and Retry-After once the window is spent", async () => {
    const ip = { "x-forwarded-for": "203.0.113.42" }
    let response!: Response
    for (let i = 0; i <= RATE_LIMIT; i++) {
      response = await get(health, "/api/health", { headers: ip })
    }

    expect(response.status).toBe(429)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0)
    expect(response.headers.get("ratelimit-remaining")).toBe("0")

    const body = await json(response)
    expect(body.error.code).toBe("rate_limited")
    expect(body.error.status).toBe(429)
    // The hint has to name a way out, not just restate the refusal.
    expect(body.error.hint).toContain("llms-full.txt")
  })

  it("does not spend quota on a CORS preflight", async () => {
    const ip = { "x-forwarded-for": "203.0.113.77" }
    await get(components, "/api/components", { method: "OPTIONS", headers: ip })
    const response = await get(components, "/api/components", { headers: ip })
    expect(response.headers.get("ratelimit-remaining")).toBe(String(RATE_LIMIT - 1))
  })
})

describe("module resolution", () => {
  it("gives every relative import under /api a file extension", async () => {
    // package.json declares "type": "module" and Vercel compiles the functions
    // under /api one file at a time rather than bundling them, so Node's ESM
    // resolver sees these specifiers verbatim. An extensionless one throws
    // ERR_MODULE_NOT_FOUND at import — which is a 500 on every route, with no
    // build-time warning. This is the assertion that stops it recurring.
    const { readdirSync, readFileSync: read } = await import("node:fs")
    const { join: joinPath } = await import("node:path")

    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = joinPath(dir, entry.name)
        if (entry.isDirectory()) return walk(full)
        return entry.name.endsWith(".ts") ? [full] : []
      })

    const files = walk(joinPath(__dirname, "..", "api"))
    expect(files.length).toBeGreaterThan(10)

    for (const file of files) {
      const source = read(file, "utf8")
      for (const match of source.matchAll(/from\s+"(\.[^"]*)"/g)) {
        expect(match[1], `${file}: ${match[1]}`).toMatch(/\.(js|json)$/)
      }
    }
  })
})

describe("accept parsing", () => {
  it("decides identically to the edge middleware's copy", async () => {
    // api/_lib/accept.ts is a deliberate duplicate of the pair in
    // src/server/negotiation.ts — the /api functions must not drag the front
    // end's module graph in. This is what stops the two drifting.
    const { acceptsType: edgeAcceptsType, isNotAcceptable: edgeIsNotAcceptable } =
      await import("../src/server/negotiation")

    const accepts = [
      null,
      "",
      "*/*",
      "text/*",
      "text/markdown",
      "application/json",
      "application/pdf",
      "text/markdown;q=0, */*",
      "text/html;q=0.9, text/markdown;q=0.1",
      "*/*;q=0",
      "garbage",
    ]
    const types = ["text/html", "text/markdown", "application/json"]

    for (const accept of accepts) {
      for (const type of types) {
        expect(acceptsType(accept, type), `${accept} / ${type}`).toBe(
          edgeAcceptsType(accept, type)
        )
      }
      expect(isNotAcceptable(accept, types), String(accept)).toBe(
        edgeIsNotAcceptable(accept, types)
      )
    }
  })
})

describe("the /api catch-all", () => {
  it("reports the quota too — a probe usually lands on a mistyped path", async () => {
    const response = await get(notFound, "/api/nope")
    expect(response.status).toBe(404)
    expect(response.headers.get("ratelimit-policy")).toContain('"default"')
    expect(response.headers.get("ratelimit-remaining")).toBeTruthy()
  })

  it("still answers 404 whatever the caller says it accepts", async () => {
    // 404 beats 406: the path is wrong, which is the more useful correction.
    const response = await get(notFound, "/api/nope", {
      headers: { Accept: "application/pdf" },
    })
    expect(response.status).toBe(404)
    expect((await json(response)).error.code).toBe("not_found")
  })
})

/**
 * vercel.json and middleware.ts are configuration, not code — nothing else
 * fails if a rewrite is dropped, and the failure only shows up in production.
 * These assertions pin the routing decisions the rest of the work depends on.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import middleware, { config as middlewareConfig } from "../middleware"
import { negotiate } from "../src/server/negotiation"
import { ROUTE_MANIFEST } from "../src/generated/route-manifest"

const REPO_ROOT = join(__dirname, "..")
const config = JSON.parse(readFileSync(join(REPO_ROOT, "vercel.json"), "utf8")) as {
  rewrites: Array<{ source: string; destination: string }>
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>
}

const rewriteFor = (source: string) =>
  config.rewrites.find((rewrite) => rewrite.source === source)

const headerFor = (source: string, key: string) =>
  config.headers
    .find((entry) => entry.source === source)
    ?.headers.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value

describe("rewrites", () => {
  it("serves the markdown twin of every standalone page", () => {
    for (const slug of ["about", "contact", "privacy"]) {
      expect(rewriteFor(`/${slug}.md`)?.destination).toBe(`/llms/_pages/${slug}.md`)
    }
  })

  it("serves the MCP manifest at both well-known spellings", () => {
    expect(rewriteFor("/.well-known/mcp")?.destination).toBe("/api/mcp-manifest")
    expect(rewriteFor("/.well-known/mcp.json")?.destination).toBe("/api/mcp-manifest")
  })

  it("serves the OpenAPI document at the alternate conventional paths", () => {
    expect(rewriteFor("/api/openapi.json")?.destination).toBe("/openapi.json")
    expect(rewriteFor("/api/openapi.yaml")?.destination).toBe("/openapi.yaml")
    expect(rewriteFor("/.well-known/openapi.json")?.destination).toBe("/openapi.json")
  })

  it("serves the agent instructions at the uppercase and well-known spellings", () => {
    expect(rewriteFor("/AGENTS.md")?.destination).toBe("/agents.md")
    expect(rewriteFor("/.well-known/agent-instructions.md")?.destination).toBe(
      "/agents.md"
    )
  })

  it("catches unmatched /api paths, and catches them last", () => {
    const catchAll = rewriteFor("/api/(.*)")
    expect(catchAll?.destination).toBe("/api/not-found")
    // Rewrites resolve in order: anything after this would be unreachable.
    expect(config.rewrites.at(-1)).toBe(catchAll)
  })

  it("keeps the specific /api rewrites ahead of the catch-all", () => {
    const catchAllIndex = config.rewrites.findIndex(
      (rewrite) => rewrite.source === "/api/(.*)"
    )
    for (const source of ["/api/openapi.json", "/api/openapi.yaml"]) {
      const index = config.rewrites.findIndex((rewrite) => rewrite.source === source)
      expect(index, source).toBeGreaterThan(-1)
      expect(index, source).toBeLessThan(catchAllIndex)
    }
  })
})

describe("headers", () => {
  it("varies the markdown files on Accept", () => {
    // Without Vary a CDN can serve the cached HTML variant to an agent asking
    // for markdown, or the reverse — the acceptmarkdown.com failure mode.
    expect(headerFor("/(llms.txt|llms-full.txt|agents.md)", "Vary")).toContain("Accept")
    expect(headerFor("/llms/(.*).md", "Vary")).toContain("Accept")
  })

  it("serves markdown files as text/markdown", () => {
    expect(headerFor("/(llms.txt|llms-full.txt|agents.md)", "Content-Type")).toContain(
      "text/markdown"
    )
    expect(headerFor("/llms/(.*).md", "Content-Type")).toContain("text/markdown")
  })

  it("serves the OpenAPI documents with their own content types, CORS-open", () => {
    expect(headerFor("/openapi.json", "Content-Type")).toContain("application/json")
    expect(headerFor("/openapi.yaml", "Content-Type")).toContain("application/yaml")
    expect(headerFor("/openapi.json", "Access-Control-Allow-Origin")).toBe("*")
  })
})

describe("middleware", () => {
  // The real exported config, not a copy of it — a matcher that drifts from
  // what ships would make every assertion below meaningless.
  const pattern = new RegExp(`^${middlewareConfig.matcher[0]}$`)

  it("skips only paths the negotiation would have passed through anyway", () => {
    // Every middleware run is a billable function invocation, so the matcher
    // exists to avoid paying one just to decide to do nothing. That is only
    // safe while every skipped path is one `negotiate` would have passed —
    // this is the assertion that stops the optimisation becoming a bug.
    const skipped = [
      "/favicon.svg",
      "/og.png",
      "/llms.txt",
      "/llms-full.txt",
      "/agents.md",
      "/sitemap.xml",
      "/robots.txt",
      "/openapi.json",
      "/openapi.yaml",
      "/about.md",
      "/docs/components/agent-card.md",
      "/assets/index-abc123.js",
      "/api/components",
      "/api/mcp",
    ]

    for (const path of skipped) {
      expect(pattern.test(path), `matcher should skip ${path}`).toBe(false)
      if (path.startsWith("/assets/")) continue
      expect(negotiate(path, "text/markdown"), path).toEqual({ kind: "pass" })
      expect(negotiate(path, null), path).toEqual({ kind: "pass" })
    }
  })

  it("still runs on every path that needs a decision", () => {
    const needed = [
      "/",
      ...ROUTE_MANIFEST.map((route) => route.path),
      "/some-path-that-does-not-exist",
    ]

    for (const path of needed) {
      expect(pattern.test(path), `matcher must run on ${path}`).toBe(true)
    }
  })

  const run = (path: string, accept?: string) =>
    middleware(
      new Request(`https://erc8004-ui.vercel.app${path}`, {
        headers: accept ? { Accept: accept } : {},
      })
    )

  it("rewrites a markdown request to the twin, and marks it varying", () => {
    const response = run("/docs/installation", "text/markdown")
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://erc8004-ui.vercel.app/llms/_guides/installation.md"
    )
    expect(response.headers.get("vary")).toBe("Accept, Accept-Encoding")
  })

  it("marks the HTML variant varying too, and otherwise leaves it alone", () => {
    const response = run("/docs/installation", "text/html")
    expect(response.headers.get("x-middleware-next")).toBe("1")
    expect(response.headers.get("vary")).toBe("Accept, Accept-Encoding")
  })

  it("answers an unknown path with a 404 an agent can read", () => {
    const response = run("/some-path-that-does-not-exist")
    expect(response.status).toBe(404)
    expect(response.headers.get("content-type")).toContain("text/markdown")
    expect(response.headers.get("vary")).toBe("Accept, Accept-Encoding")
    expect(response.headers.get("x-robots-tag")).toBe("noindex")
  })

  it("hands an unknown path back to the styled 404 page for a browser", () => {
    const response = run("/some-path-that-does-not-exist", "text/html")
    expect(response.headers.get("x-middleware-next")).toBe("1")
    // Both 404 branches are negotiated responses for the same URL.
    expect(response.headers.get("vary")).toBe("Accept, Accept-Encoding")
  })
})

describe("open graph image", () => {
  const png = readFileSync(join(REPO_ROOT, "public", "og.png"))

  it("is a PNG at the size link previews expect", () => {
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG")
    // IHDR width/height, big-endian, at a fixed offset in every PNG.
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  })
})

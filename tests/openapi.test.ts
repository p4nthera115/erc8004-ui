/**
 * The published OpenAPI document has to describe the API that actually exists.
 *
 * A spec is worse than no spec when it drifts: an agent that plans a call from
 * it and gets a 404 has been actively misled. These tests tie every documented
 * path to a handler file and every handler file to a documented path.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { load as parseYaml } from "js-yaml"
import { describe, expect, it } from "vitest"

const REPO_ROOT = join(__dirname, "..")
const spec = JSON.parse(
  readFileSync(join(REPO_ROOT, "public", "openapi.json"), "utf8")
) as {
  openapi: string
  info: Record<string, unknown>
  servers: Array<{ url: string }>
  paths: Record<string, Record<string, { operationId?: string; responses: Record<string, unknown> }>>
  components: { schemas: Record<string, unknown> }
}

/** Documented path → the file under /api that Vercel routes it to. */
const HANDLER_FOR: Record<string, string> = {
  "/api": "api/index.ts",
  "/api/health": "api/health.ts",
  "/api/components": "api/components/index.ts",
  "/api/components/{slug}": "api/components/[slug].ts",
  "/api/guides": "api/guides/index.ts",
  "/api/guides/{slug}": "api/guides/[slug].ts",
  "/api/chains": "api/chains.ts",
  "/api/types": "api/types.ts",
  "/api/mcp": "api/mcp.ts",
  // Reached through the vercel.json rewrite rather than by filename.
  "/.well-known/mcp": "api/mcp-manifest.ts",
}

describe("openapi document", () => {
  it("is OpenAPI 3.1 with a server and a stable version", () => {
    expect(spec.openapi).toBe("3.1.0")
    expect(spec.servers[0].url).toBe("https://erc8004-ui.vercel.app")
    expect(spec.info.version).toBe("1.0.0")
    expect(String(spec.info.title)).toContain("@erc8004/ui")
  })

  it("documents every implemented endpoint", () => {
    expect(Object.keys(spec.paths).sort()).toEqual(Object.keys(HANDLER_FOR).sort())
  })

  it("has a handler file behind every documented path", () => {
    for (const [path, file] of Object.entries(HANDLER_FOR)) {
      expect(existsSync(join(REPO_ROOT, file)), `${path} → ${file}`).toBe(true)
    }
  })

  it("does not document an endpoint no file serves", () => {
    // Guards the reverse drift: a path added to the spec but never built.
    for (const path of Object.keys(spec.paths)) {
      expect(HANDLER_FOR[path], `undocumented handler for ${path}`).toBeTruthy()
    }
  })

  it("gives every operation an operationId", () => {
    const ids: string[] = []
    for (const operations of Object.values(spec.paths)) {
      for (const operation of Object.values(operations)) {
        expect(operation.operationId).toBeTruthy()
        ids.push(operation.operationId as string)
      }
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("documents the JSON error shape on every failure response", () => {
    for (const [path, operations] of Object.entries(spec.paths)) {
      for (const operation of Object.values(operations)) {
        for (const [status, response] of Object.entries(operation.responses)) {
          if (!/^[45]/.test(status)) continue
          const content = (response as { content?: Record<string, unknown> }).content
          expect(content, `${path} ${status}`).toBeTruthy()
          expect(Object.keys(content!), `${path} ${status}`).toContain(
            "application/json"
          )
        }
      }
    }
  })

  it("resolves every $ref", () => {
    const refs = new Set<string>()
    const walk = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(walk)
      if (!node || typeof node !== "object") return
      for (const [key, value] of Object.entries(node)) {
        if (key === "$ref" && typeof value === "string") refs.add(value)
        else walk(value)
      }
    }
    walk(spec)

    expect(refs.size).toBeGreaterThan(0)
    for (const ref of refs) {
      const name = ref.replace("#/components/schemas/", "")
      expect(spec.components.schemas[name], ref).toBeTruthy()
    }
  })

  it("enumerates real slugs, so a caller cannot plan an impossible request", () => {
    const registry = JSON.parse(
      readFileSync(
        join(REPO_ROOT, "packages", "mcp-server", "src", "generated", "registry.json"),
        "utf8"
      )
    ) as { components: Array<{ slug: string }>; guides: Array<{ slug: string }> }

    const componentEnum = (
      spec.components.schemas.Component as { properties: { slug: { enum: string[] } } }
    ).properties.slug.enum
    // Copy before sorting: `spec` is shared with the round-trip test below.
    expect([...componentEnum].sort()).toEqual(
      registry.components.map((component) => component.slug).sort()
    )

    const guideEnum = (
      spec.components.schemas.Guide as { properties: { slug: { enum: string[] } } }
    ).properties.slug.enum
    expect([...guideEnum].sort()).toEqual(registry.guides.map((guide) => guide.slug).sort())
  })

  it("describes the error codes the API actually returns", () => {
    const codes = (
      spec.components.schemas.Error as {
        properties: { error: { properties: { code: { enum: string[] } } } }
      }
    ).properties.error.properties.code.enum

    const source = readFileSync(join(REPO_ROOT, "api", "_lib", "http.ts"), "utf8")
    const implemented = source
      .slice(source.indexOf("export type ErrorCode"), source.indexOf("export const DOCS_URL"))
      .match(/"([a-z_]+)"/g)!
      .map((match) => match.replaceAll('"', ""))

    expect([...codes].sort()).toEqual(implemented.sort())
  })
})

describe("openapi.yaml", () => {
  const yaml = readFileSync(join(REPO_ROOT, "public", "openapi.yaml"), "utf8")

  it("is emitted alongside the JSON", () => {
    expect(yaml.startsWith("openapi: 3.1.0")).toBe(true)
  })

  it("parses, and describes exactly the same API as the JSON", () => {
    // The YAML is hand-serialised, so this is the assertion that matters:
    // a reader that picks the .yaml must not see a different contract.
    expect(parseYaml(yaml)).toEqual(spec)
  })

  it("quotes keys that YAML would otherwise read as numbers", () => {
    // Bare `200:` parses as an integer key, which breaks strict OpenAPI readers.
    expect(yaml).toContain('"200":')
    expect(yaml).not.toMatch(/^\s+200:/m)
  })
})

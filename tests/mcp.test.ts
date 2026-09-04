/**
 * The MCP endpoint — protocol behaviour and the HTTP skin around it.
 *
 * The server is dual-era: it answers the current per-request-metadata revision
 * (2026-07-28) *and* the `initialize` handshake used by 2025-11-25 and earlier.
 * Both paths are exercised here, because a client on either era arriving at
 * this URL has to work.
 */
import { describe, expect, it } from "vitest"

import mcp from "../api/mcp"
import {
  dispatch,
  decodeHeaderValue,
  MODERN_VERSION,
  RPC_HEADER_MISMATCH,
  RPC_INVALID_PARAMS,
  RPC_METHOD_NOT_FOUND,
  RPC_UNSUPPORTED_VERSION,
  SUPPORTED_VERSIONS,
} from "../api/_lib/mcp-rpc"
import { TOOLS } from "../api/_lib/mcp-tools"

const ENDPOINT = "https://erc8004-ui.vercel.app/api/mcp"

const modernContext = (method: string, name?: string) => ({
  protocolVersion: MODERN_VERSION,
  method,
  name,
})

const modernMessage = (id: number, method: string, params: Record<string, unknown> = {}) => ({
  jsonrpc: "2.0",
  id,
  method,
  params: {
    ...params,
    _meta: { "io.modelcontextprotocol/protocolVersion": MODERN_VERSION },
  },
})

// ---------------------------------------------------------------------------
// Modern era
// ---------------------------------------------------------------------------

describe("modern protocol (2026-07-28)", () => {
  it("implements the mandatory server/discover", () => {
    const outcome = dispatch(
      modernMessage(1, "server/discover"),
      modernContext("server/discover")
    )
    expect(outcome.status).toBe(200)

    const body = outcome.body as { result: Record<string, unknown> }
    expect(body.result.resultType).toBe("complete")
    expect(body.result.supportedVersions).toContain(MODERN_VERSION)
    expect(body.result.capabilities).toEqual({ tools: { listChanged: false } })
    expect(
      (body.result._meta as Record<string, unknown>)[
        "io.modelcontextprotocol/serverInfo"
      ]
    ).toMatchObject({ name: "erc8004-ui" })
    expect(String(body.result.instructions)).toContain("get_component")
  })

  it("lists its tools", () => {
    const outcome = dispatch(
      modernMessage(2, "tools/list"),
      modernContext("tools/list")
    )
    const body = outcome.body as { result: { tools: Array<{ name: string; inputSchema: unknown }> } }
    expect(body.result.tools.map((tool) => tool.name)).toEqual(
      TOOLS.map((tool) => tool.name)
    )
    for (const tool of body.result.tools) {
      expect(tool.inputSchema).toMatchObject({ type: "object" })
    }
  })

  it("calls a tool", () => {
    const outcome = dispatch(
      modernMessage(3, "tools/call", {
        name: "get_component",
        arguments: { name: "ReputationScore" },
      }),
      modernContext("tools/call", "get_component")
    )
    const body = outcome.body as { result: { content: Array<{ text: string }> } }
    expect(body.result.content[0].text).toContain("# ReputationScore")
  })

  it("rejects a missing MCP-Protocol-Version header", () => {
    const outcome = dispatch(modernMessage(4, "tools/list"), { method: "tools/list" })
    expect(outcome.status).toBe(400)
    expect((outcome.body as { error: { code: number } }).error.code).toBe(
      RPC_HEADER_MISMATCH
    )
  })

  it("rejects a Mcp-Method header that disagrees with the body", () => {
    const outcome = dispatch(
      modernMessage(5, "tools/list"),
      modernContext("tools/call")
    )
    expect(outcome.status).toBe(400)
    expect((outcome.body as { error: { code: number } }).error.code).toBe(
      RPC_HEADER_MISMATCH
    )
  })

  it("rejects a Mcp-Name header that disagrees with params.name", () => {
    const outcome = dispatch(
      modernMessage(6, "tools/call", { name: "get_types", arguments: {} }),
      modernContext("tools/call", "get_component")
    )
    expect(outcome.status).toBe(400)
    expect((outcome.body as { error: { code: number } }).error.code).toBe(
      RPC_HEADER_MISMATCH
    )
  })

  it("accepts a base64-encoded Mcp-Name", () => {
    const encoded = `=?base64?${Buffer.from("get_types", "utf8").toString("base64")}?=`
    expect(decodeHeaderValue(encoded)).toBe("get_types")

    const outcome = dispatch(
      modernMessage(7, "tools/call", { name: "get_types", arguments: {} }),
      modernContext("tools/call", encoded)
    )
    expect(outcome.status).toBe(200)
  })

  it("answers an unsupported version with the versions it does speak", () => {
    const outcome = dispatch(
      {
        jsonrpc: "2.0",
        id: 8,
        method: "tools/list",
        params: {
          _meta: { "io.modelcontextprotocol/protocolVersion": "1900-01-01" },
        },
      },
      { protocolVersion: "1900-01-01", method: "tools/list" }
    )
    expect(outcome.status).toBe(400)

    const error = (outcome.body as { error: { code: number; data: { supported: string[]; requested: string } } }).error
    expect(error.code).toBe(RPC_UNSUPPORTED_VERSION)
    expect(error.data.supported).toEqual([...SUPPORTED_VERSIONS])
    expect(error.data.requested).toBe("1900-01-01")
  })

  it("404s an unimplemented method so a client can tell it from a missing endpoint", () => {
    const outcome = dispatch(
      modernMessage(9, "resources/list"),
      modernContext("resources/list")
    )
    expect(outcome.status).toBe(404)
    expect((outcome.body as { error: { code: number } }).error.code).toBe(
      RPC_METHOD_NOT_FOUND
    )
  })
})

// ---------------------------------------------------------------------------
// Legacy era
// ---------------------------------------------------------------------------

describe("legacy protocol (initialize handshake)", () => {
  it("completes the handshake and echoes a version it supports", () => {
    const outcome = dispatch({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
      },
    })
    expect(outcome.status).toBe(200)

    const result = (outcome.body as { result: Record<string, unknown> }).result
    expect(result.protocolVersion).toBe("2025-06-18")
    expect(result.capabilities).toEqual({ tools: { listChanged: false } })
    expect(result.serverInfo).toMatchObject({ name: "erc8004-ui" })
  })

  it("falls back to the newest legacy revision for a version it does not speak", () => {
    const outcome = dispatch({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    })
    const result = (outcome.body as { result: Record<string, unknown> }).result
    expect(result.protocolVersion).toBe("2025-11-25")
  })

  it("accepts notifications/initialized with 202 and no body", () => {
    const outcome = dispatch({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    })
    expect(outcome).toEqual({ status: 202, body: null })
  })

  it("serves tools without the modern headers", () => {
    const outcome = dispatch({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    const body = outcome.body as { result: { tools: unknown[] } }
    expect(body.result.tools).toHaveLength(TOOLS.length)
  })

  it("answers ping", () => {
    const outcome = dispatch({ jsonrpc: "2.0", id: 3, method: "ping" })
    expect(outcome.body).toEqual({ jsonrpc: "2.0", id: 3, result: {} })
  })

  it("reports an unknown method in-band, without an HTTP error", () => {
    const outcome = dispatch({ jsonrpc: "2.0", id: 4, method: "prompts/list" })
    expect(outcome.status).toBe(200)
    expect((outcome.body as { error: { code: number } }).error.code).toBe(
      RPC_METHOD_NOT_FOUND
    )
  })
})

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

describe("tools", () => {
  const call = (name: string, args: Record<string, unknown> = {}) => {
    const tool = TOOLS.find((entry) => entry.name === name)
    if (!tool) throw new Error(`no tool ${name}`)
    return tool.run(args)
  }

  it("list_components groups everything", () => {
    const text = call("list_components").content[0].text
    expect(text).toContain("### Identity")
    expect(text).toContain("ReputationScore")
  })

  it("list_components filters by group and by query", () => {
    expect(call("list_components", { group: "Validation" }).content[0].text).toContain(
      "ValidationScore"
    )
    expect(call("list_components", { q: "tag" }).content[0].text).toContain("TagCloud")
  })

  it("list_components rejects an unknown group", () => {
    const outcome = call("list_components", { group: "Nope" })
    expect(outcome.isError).toBe(true)
    expect(outcome.content[0].text).toContain("Available groups")
  })

  it("get_component tolerates the shapes agents actually send", () => {
    for (const name of ["agent-card", "AgentCard", "<AgentCard />", "agent card"]) {
      expect(call("get_component", { name }).content[0].text).toContain("# AgentCard")
    }
  })

  it("get_component lists what exists when the name is wrong", () => {
    const outcome = call("get_component", { name: "AgentSparkles" })
    expect(outcome.isError).toBe(true)
    expect(outcome.content[0].text).toContain("### Identity")
  })

  it("get_setup_guide defaults to installation", () => {
    expect(call("get_setup_guide").content[0].text).toContain("# Installation")
  })

  it("get_types returns the type source", () => {
    expect(call("get_types").content[0].text).toContain("export interface")
  })

  it("reports an unknown tool as invalid params", () => {
    const outcome = dispatch({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "drop_tables", arguments: {} },
    })
    expect((outcome.body as { error: { code: number } }).error.code).toBe(
      RPC_INVALID_PARAMS
    )
  })
})

// ---------------------------------------------------------------------------
// HTTP transport
// ---------------------------------------------------------------------------

describe("HTTP transport", () => {
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    mcp.fetch(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      })
    )

  it("answers a handshake over HTTP", async () => {
    const response = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")

    const body = JSON.parse(await response.text())
    expect(body.result.serverInfo.name).toBe("erc8004-ui")
  })

  it("returns 202 with no body for a notification", async () => {
    const response = await post({ jsonrpc: "2.0", method: "notifications/initialized" })
    expect(response.status).toBe(202)
    expect(await response.text()).toBe("")
  })

  it("405s GET and DELETE — there is no standalone stream to open", async () => {
    for (const method of ["GET", "DELETE"]) {
      const response = await mcp.fetch(new Request(ENDPOINT, { method }))
      expect(response.status).toBe(405)
      expect(response.headers.get("allow")).toContain("POST")
      expect(JSON.parse(await response.text()).error.code).toBe(-32600)
    }
  })

  it("answers CORS preflight so browser agents can call it", async () => {
    const response = await mcp.fetch(new Request(ENDPOINT, { method: "OPTIONS" }))
    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-headers")).toContain(
      "MCP-Protocol-Version"
    )
  })

  it("rejects a malformed Origin but allows well-formed ones", async () => {
    const bad = await mcp.fetch(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { Origin: "not a url" },
        body: "{}",
      })
    )
    expect(bad.status).toBe(403)

    const good = await post(
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { Origin: "https://claude.ai" }
    )
    expect(good.status).toBe(200)
  })

  it("reports a parse error rather than throwing", async () => {
    const response = await mcp.fetch(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not json",
      })
    )
    expect(response.status).toBe(400)
    expect(JSON.parse(await response.text()).error.code).toBe(-32700)
  })

  it("answers a 2025-03-26 batch", async () => {
    const response = await post([
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
    ])
    const body = JSON.parse(await response.text())
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
  })

  it("never caches protocol responses", async () => {
    const response = await post({ jsonrpc: "2.0", id: 1, method: "ping" })
    expect(response.headers.get("cache-control")).toBe("no-store")
  })
})

/**
 * JSON-RPC dispatch for the HTTP MCP endpoint.
 *
 * Kept transport-free on purpose: `dispatch()` is a pure function of a parsed
 * message plus the request-metadata headers, so the whole protocol surface is
 * testable without a server.
 *
 * The server is dual-era, as MCP's versioning page defines the term:
 *
 *   modern (2026-07-28+) — no handshake. Every request carries its protocol
 *     version in `params._meta`, mirrored into the MCP-Protocol-Version header,
 *     with Mcp-Method (and Mcp-Name for tools/call) mirroring body fields. The
 *     server validates that mirroring, implements the mandatory
 *     `server/discover`, and answers `UnsupportedProtocolVersionError` for
 *     versions it does not speak.
 *
 *   legacy (2025-11-25 and earlier) — the `initialize` handshake. Recognised by
 *     an `initialize` request or by the absence of modern metadata, and served
 *     without the header validation those revisions never defined.
 *
 * Everything is stateless: no sessions are minted, `Mcp-Session-Id` is ignored,
 * and no SSE streams are opened. Each documentation tool answers from a
 * build-time snapshot, so there is nothing to stream and nothing to remember
 * between requests.
 */

import { findTool, toolDescriptors } from "./mcp-tools.js"
import { REGISTRY } from "./registry.js"

export const SERVER_NAME = "erc8004-ui"
export const SERVER_TITLE = "@erc8004/ui component documentation"
export const SERVER_VERSION = "0.3.0"

/** Newest first — the order `supported`/`supportedVersions` is reported in. */
export const SUPPORTED_VERSIONS = [
  "2026-07-28",
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
] as const

export const MODERN_VERSION = "2026-07-28"

/** Revisions at or after this one use per-request metadata instead of a handshake. */
function isModernVersion(version: string): boolean {
  return version >= MODERN_VERSION
}

function isSupportedVersion(version: string): boolean {
  return (SUPPORTED_VERSIONS as readonly string[]).includes(version)
}

export const SERVER_INSTRUCTIONS =
  `Documentation for ${REGISTRY.packageName}, a React component library that renders ` +
  "verified ERC-8004 agent identity, reputation and validation data from The Graph. " +
  "Call list_components to see what exists, get_component before writing any code " +
  "that uses a component (the props and the subgraph caveats are not guessable), " +
  "get_setup_guide for provider and API-key setup, and get_types for the on-chain " +
  "data model. This endpoint serves documentation only; for live subgraph and agent " +
  "checks install the stdio server (npx -y @erc8004/ui-mcp) with your own GRAPH_API_KEY."

// ---------------------------------------------------------------------------
// JSON-RPC primitives
// ---------------------------------------------------------------------------

export const RPC_PARSE_ERROR = -32700
export const RPC_INVALID_REQUEST = -32600
export const RPC_METHOD_NOT_FOUND = -32601
export const RPC_INVALID_PARAMS = -32602
/** MCP-allocated: HTTP headers disagree with the body they mirror. */
export const RPC_HEADER_MISMATCH = -32020
/** MCP-allocated: the requested protocol version is not implemented. */
export const RPC_UNSUPPORTED_VERSION = -32022

type JsonRpcId = string | number | null

export type RpcOutcome = {
  status: number
  /** `null` means "no body" — a 202 for an accepted notification. */
  body: unknown
}

export type RpcContext = {
  /** MCP-Protocol-Version request header, if any. */
  protocolVersion?: string | null
  /** Mcp-Method request header, if any. */
  method?: string | null
  /** Mcp-Name request header, if any. */
  name?: string | null
}

function result(id: JsonRpcId, value: unknown, status = 200): RpcOutcome {
  return { status, body: { jsonrpc: "2.0", id, result: value } }
}

function failure(
  id: JsonRpcId,
  code: number,
  message: string,
  status: number,
  data?: unknown
): RpcOutcome {
  return {
    status,
    body: {
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data === undefined ? {} : { data }) },
    },
  }
}

// ---------------------------------------------------------------------------
// Header mirroring (modern revisions only)
// ---------------------------------------------------------------------------

const BASE64_SENTINEL = /^=\?base64\?(.*)\?=$/

/** Decodes the `=?base64?…?=` sentinel MCP uses for header-unsafe values. */
export function decodeHeaderValue(value: string): string {
  const match = BASE64_SENTINEL.exec(value)
  if (!match) return value
  try {
    return Buffer.from(match[1], "base64").toString("utf8")
  } catch {
    return value
  }
}

// ---------------------------------------------------------------------------
// Message shapes
// ---------------------------------------------------------------------------

type RpcMessage = {
  jsonrpc?: unknown
  id?: JsonRpcId
  method?: unknown
  params?: unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** The protocol version a modern request declares in `params._meta`. */
function metaProtocolVersion(params: unknown): string | undefined {
  const meta = asRecord(asRecord(params)._meta)
  const version = meta["io.modelcontextprotocol/protocolVersion"]
  return typeof version === "string" ? version : undefined
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export function discoverResult() {
  return {
    resultType: "complete",
    supportedVersions: [...SUPPORTED_VERSIONS],
    capabilities: { tools: { listChanged: false } },
    instructions: SERVER_INSTRUCTIONS,
    // Documentation only changes on redeploy, so this is safe to cache and
    // safe to share between callers.
    ttlMs: 3_600_000,
    cacheScope: "public",
    _meta: {
      "io.modelcontextprotocol/serverInfo": {
        name: SERVER_NAME,
        title: SERVER_TITLE,
        version: SERVER_VERSION,
      },
    },
  }
}

function callTool(id: JsonRpcId, params: unknown, modern: boolean): RpcOutcome {
  const record = asRecord(params)
  const name = typeof record.name === "string" ? record.name : ""
  const tool = findTool(name)

  if (!tool) {
    return failure(
      id,
      RPC_INVALID_PARAMS,
      `Unknown tool "${name}". Available tools: ${toolDescriptors()
        .map((descriptor) => descriptor.name)
        .join(", ")}.`,
      modern ? 400 : 200
    )
  }

  const args = asRecord(record.arguments)
  const outcome = tool.run(args)
  return result(id, {
    content: outcome.content,
    ...(outcome.isError ? { isError: true } : {}),
  })
}

/**
 * Handles one JSON-RPC message. `ctx` carries the mirrored request headers so
 * the modern revisions' server-validation rules can be enforced.
 */
export function dispatch(message: unknown, ctx: RpcContext = {}): RpcOutcome {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return failure(
      null,
      RPC_INVALID_REQUEST,
      "Expected a single JSON-RPC request object.",
      400
    )
  }

  const rpc = message as RpcMessage
  const id: JsonRpcId = rpc.id === undefined ? null : (rpc.id as JsonRpcId)
  const method = typeof rpc.method === "string" ? rpc.method : ""
  const isNotification = rpc.id === undefined

  if (!method) {
    return failure(id, RPC_INVALID_REQUEST, "Missing `method`.", 400)
  }

  // ── Era detection ────────────────────────────────────────────────────────
  // An `initialize` request is the legacy handshake by definition. Otherwise a
  // modern version in the body metadata or the header selects modern rules.
  const bodyVersion = metaProtocolVersion(rpc.params)
  const headerVersion = ctx.protocolVersion?.trim() || undefined
  const declared = bodyVersion ?? headerVersion
  const modern =
    method !== "initialize" && Boolean(declared && isModernVersion(declared))

  if (declared && !isSupportedVersion(declared)) {
    return failure(
      id,
      RPC_UNSUPPORTED_VERSION,
      "Unsupported protocol version",
      400,
      { supported: [...SUPPORTED_VERSIONS], requested: declared }
    )
  }

  if (modern) {
    // The header must be present and must agree with the body it mirrors. A
    // body that omits `_meta` while the header declares a modern version is
    // accepted: the divergence this rule guards against needs two values.
    if (!headerVersion) {
      return failure(
        id,
        RPC_HEADER_MISMATCH,
        "Missing required MCP-Protocol-Version header.",
        400
      )
    }
    if (bodyVersion && headerVersion !== bodyVersion) {
      return failure(
        id,
        RPC_HEADER_MISMATCH,
        `MCP-Protocol-Version header "${headerVersion}" does not match ` +
          `params._meta protocol version "${bodyVersion}".`,
        400
      )
    }

    const methodHeader = ctx.method?.trim()
    if (!methodHeader) {
      return failure(id, RPC_HEADER_MISMATCH, "Missing required Mcp-Method header.", 400)
    }
    if (methodHeader !== method) {
      return failure(
        id,
        RPC_HEADER_MISMATCH,
        `Mcp-Method header "${methodHeader}" does not match body method "${method}".`,
        400
      )
    }

    if (method === "tools/call") {
      const bodyName = asRecord(rpc.params).name
      const nameHeader = ctx.name ? decodeHeaderValue(ctx.name.trim()) : ""
      if (!nameHeader) {
        return failure(
          id,
          RPC_HEADER_MISMATCH,
          "Missing required Mcp-Name header for tools/call.",
          400
        )
      }
      if (typeof bodyName === "string" && nameHeader !== bodyName) {
        return failure(
          id,
          RPC_HEADER_MISMATCH,
          `Mcp-Name header "${nameHeader}" does not match params.name "${bodyName}".`,
          400
        )
      }
    }
  }

  // ── Notifications ────────────────────────────────────────────────────────
  // Nothing this server exposes reacts to a client notification, and every
  // one it can receive is accepted. 202 with no body, per the transport.
  if (isNotification || method.startsWith("notifications/")) {
    return { status: 202, body: null }
  }

  // ── Methods ──────────────────────────────────────────────────────────────
  switch (method) {
    case "server/discover":
      return result(id, discoverResult())

    case "initialize": {
      // Legacy handshake. Echo the client's version when it is one we speak,
      // otherwise answer with the newest legacy revision — a legacy client
      // cannot fall forward to a modern one.
      const requested =
        typeof asRecord(rpc.params).protocolVersion === "string"
          ? (asRecord(rpc.params).protocolVersion as string)
          : undefined
      const negotiated =
        requested && isSupportedVersion(requested) ? requested : "2025-11-25"
      return result(id, {
        protocolVersion: negotiated,
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: SERVER_NAME,
          title: SERVER_TITLE,
          version: SERVER_VERSION,
        },
        instructions: SERVER_INSTRUCTIONS,
      })
    }

    case "ping":
      return result(id, {})

    case "tools/list":
      return result(id, { tools: toolDescriptors() })

    case "tools/call":
      return callTool(id, rpc.params, modern)

    default:
      return failure(
        id,
        RPC_METHOD_NOT_FOUND,
        `Method "${method}" is not implemented. This server exposes tools only: ` +
          "server/discover, initialize, ping, tools/list, tools/call.",
        // Modern transport requires 404 for an unimplemented RPC so a client can
        // tell it apart from a legacy endpoint that is not there at all.
        modern ? 404 : 200
      )
  }
}

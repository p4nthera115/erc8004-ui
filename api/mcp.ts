/**
 * POST /api/mcp — the MCP endpoint, Streamable HTTP transport.
 *
 * Stateless by construction: every tool answers from a build-time
 * documentation snapshot, so there is no session to mint, nothing to stream,
 * and no reason to keep a connection open. That maps cleanly onto the
 * 2026-07-28 transport, which removed both sessions and the GET stream.
 *
 * GET and DELETE answer 405, which the transport explicitly allows for a
 * server that offers no standalone stream — and which is what older clients
 * probe for before falling back.
 *
 * The protocol itself lives in `_lib/mcp-rpc.ts`; this file is only the HTTP
 * skin around it.
 */

import { dispatch, MODERN_VERSION, SUPPORTED_VERSIONS } from "./_lib/mcp-rpc.js"
import {
  consume,
  RATE_LIMIT,
  RATE_WINDOW_SECONDS,
  rateLimitHeaders,
} from "./_lib/rate-limit.js"

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
}

function respond(
  body: unknown,
  status: number,
  extra: Record<string, string> = {}
): Response {
  if (body === null) {
    return new Response(null, { status, headers: { ...CORS_HEADERS, ...extra } })
  }
  return new Response(JSON.stringify(body) + "\n", {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS_HEADERS,
      ...extra,
    },
  })
}

/**
 * The transport requires Origin validation to block DNS rebinding. That attack
 * targets servers a victim's browser can reach but an attacker's server cannot
 * — localhost and private networks. This endpoint is public, unauthenticated
 * and read-only: everything it returns is already fetchable server-side by
 * anyone, so there is no privilege for a rebound origin to borrow. Malformed
 * Origin values are still rejected; well-formed ones are all accepted, which
 * is what lets browser-based agents call it at all.
 */
function originIsAcceptable(origin: string | null): boolean {
  if (!origin || origin === "null") return true
  try {
    const url = new URL(origin)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

const notAllowed = (
  method: string,
  extra: Record<string, string> = {}
): Response =>
  respond(
    {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message:
          `${method} is not supported on this MCP endpoint. This server is ` +
          "stateless and offers no standalone stream: send each JSON-RPC message " +
          "as its own HTTP POST.",
      },
    },
    405,
    { Allow: "POST, OPTIONS", ...extra }
  )

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    // Same fair-use quota as the REST endpoints, reported the same way. The
    // refusal is a JSON-RPC error rather than the REST envelope, because that
    // is the shape a client of this endpoint knows how to read.
    const limit = consume(request)
    const limitHeaders = rateLimitHeaders(limit)

    if (limit.exceeded) {
      return respond(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32000,
            message:
              `Over the fair-use limit of ${RATE_LIMIT} requests per ` +
              `${RATE_WINDOW_SECONDS} seconds. Retry in ${limit.reset} seconds.`,
          },
        },
        429,
        { ...limitHeaders, "Retry-After": String(limit.reset) }
      )
    }

    if (!originIsAcceptable(request.headers.get("origin"))) {
      return respond(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32600, message: "Invalid Origin header." },
        },
        403,
        limitHeaders
      )
    }

    if (request.method !== "POST") return notAllowed(request.method, limitHeaders)

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return respond(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message:
              "Parse error: the request body must be a single JSON-RPC message. " +
              `Supported protocol versions: ${SUPPORTED_VERSIONS.join(", ")}.`,
          },
        },
        400,
        limitHeaders
      )
    }

    const context = {
      protocolVersion: request.headers.get("mcp-protocol-version"),
      method: request.headers.get("mcp-method"),
      name: request.headers.get("mcp-name"),
    }

    // JSON-RPC batching existed only in 2025-03-26. Answering an array keeps
    // those clients working; every current revision sends one message per POST.
    if (Array.isArray(payload)) {
      const responses = payload
        .map((message) => dispatch(message, context))
        .filter((outcome) => outcome.body !== null)
        .map((outcome) => outcome.body)
      if (responses.length === 0) return respond(null, 202, limitHeaders)
      return respond(responses, 200, {
        ...limitHeaders,
        "MCP-Protocol-Version": context.protocolVersion ?? "2025-03-26",
      })
    }

    const outcome = dispatch(payload, context)
    return respond(outcome.body, outcome.status, {
      ...limitHeaders,
      "MCP-Protocol-Version": context.protocolVersion ?? MODERN_VERSION,
    })
  },
}

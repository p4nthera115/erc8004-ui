/**
 * Shared HTTP plumbing for the /api docs API.
 *
 * Every response this API produces — success or failure — is JSON, because the
 * consumers are agents. An HTML error page is unparseable to them, so the
 * error envelope below is the single failure shape for the whole surface and
 * is described in the published OpenAPI document as `Error`.
 *
 * Handlers are written against Web `Request`/`Response` (Vercel's current
 * Node-runtime function signature) which also makes them directly callable
 * from tests with no server involved.
 */

export type ErrorCode =
  | "not_found"
  | "invalid_parameter"
  | "method_not_allowed"
  | "unsupported_media_type"
  | "internal_error"

export const DOCS_URL = "https://erc8004-ui.vercel.app/docs"
export const OPENAPI_URL = "https://erc8004-ui.vercel.app/openapi.json"

const STATUS_FOR: Record<ErrorCode, number> = {
  not_found: 404,
  invalid_parameter: 400,
  method_not_allowed: 405,
  unsupported_media_type: 415,
  internal_error: 500,
}

/** Cache profile for the docs data — it only changes on redeploy. */
const CACHE_CONTROL = "public, max-age=300, s-maxage=3600"

function baseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    // The API is public, read-only and unauthenticated: an agent running in a
    // browser sandbox should be able to call it directly.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version",
    "X-Robots-Tag": "all",
    Link: `<${OPENAPI_URL}>; rel="service-desc"`,
    ...extra,
  }
}

export function json(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify(body, null, 2) + "\n", {
    status: init.status ?? 200,
    headers: baseHeaders({ "Cache-Control": CACHE_CONTROL, ...init.headers }),
  })
}

export function markdown(body: string, init: { status?: number } = {}): Response {
  return new Response(body, {
    status: init.status ?? 200,
    headers: baseHeaders({
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
      Vary: "Accept, Accept-Encoding",
    }),
  })
}

export type ApiErrorInit = {
  code: ErrorCode
  message: string
  /** What the caller should do next. Always actionable, never "try again". */
  hint: string
  /** Valid values, when the failure was a bad enum-ish parameter. */
  allowed?: string[]
  headers?: Record<string, string>
}

/**
 * The one error shape. `code` is stable and machine-comparable, `message` says
 * what went wrong, `hint` says what to do about it, `documentation` points at
 * the human page covering the endpoint.
 */
export function error(init: ApiErrorInit): Response {
  const status = STATUS_FOR[init.code]
  return json(
    {
      error: {
        code: init.code,
        status,
        message: init.message,
        hint: init.hint,
        ...(init.allowed ? { allowed: init.allowed } : {}),
        documentation: DOCS_URL,
        specification: OPENAPI_URL,
      },
    },
    { status, headers: { "Cache-Control": "no-store", ...init.headers } }
  )
}

/**
 * Wraps a handler so that unsupported methods produce a JSON 405 (rather than
 * the platform's HTML default), CORS preflight works, and an unexpected throw
 * becomes a JSON 500 instead of a stack trace.
 */
export function handler(
  methods: Record<string, (request: Request) => Response | Promise<Response>>
) {
  const allow = [...Object.keys(methods), "OPTIONS"]
  if (methods.GET && !methods.HEAD) allow.push("HEAD")

  return async function fetchHandler(request: Request): Promise<Response> {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: baseHeaders({ Allow: allow.join(", ") }),
        })
      }

      // HEAD is GET without a body — same headers, same status.
      if (request.method === "HEAD" && methods.GET) {
        const response = await methods.GET(request)
        return new Response(null, {
          status: response.status,
          headers: response.headers,
        })
      }

      const method = methods[request.method]
      if (!method) {
        return error({
          code: "method_not_allowed",
          message: `${request.method} is not supported by this endpoint.`,
          hint: `Use ${allow.join(", ")}. The full endpoint contract is published at ${OPENAPI_URL}.`,
          allowed: allow,
          headers: { Allow: allow.join(", ") },
        })
      }

      return await method(request)
    } catch (cause) {
      return error({
        code: "internal_error",
        message:
          cause instanceof Error
            ? `Unhandled error: ${cause.message}`
            : "Unhandled error.",
        hint: `This is a bug in the API, not in your request. Report it at https://github.com/p4nthera115/erc8004-ui/issues with the URL you called.`,
      })
    }
  }
}

/**
 * Resolves the response format for the endpoints that can return either JSON
 * or the same document as markdown. `?format=` wins; otherwise the Accept
 * header decides. An unrecognised value is a caller error, not a silent
 * fallback — returning JSON to someone who asked for `format=yaml` hides the
 * mistake.
 */
export function readFormat(
  request: Request
): { format: "json" | "markdown" } | { invalid: string } {
  const format = new URL(request.url).searchParams.get("format")
  if (format === null || format === "") {
    return {
      format: /text\/markdown/i.test(request.headers.get("accept") ?? "")
        ? "markdown"
        : "json",
    }
  }
  if (format === "json") return { format: "json" }
  if (format === "markdown" || format === "md") return { format: "markdown" }
  return { invalid: format }
}

export function badFormat(value: string): Response {
  return error({
    code: "invalid_parameter",
    message: `Unknown format "${value}".`,
    hint: "Use format=json (the default) or format=markdown.",
    allowed: ["json", "markdown"],
  })
}

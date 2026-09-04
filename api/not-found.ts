/**
 * Catch-all for unmatched /api/* paths.
 *
 * `vercel.json` rewrites anything under /api that the filesystem did not match
 * here. Without it those requests fall through to the static 404 page, and an
 * agent calling a mistyped endpoint gets HTML it cannot parse — the failure
 * the "JSON error responses" check is looking for.
 */
import { error } from "./_lib/http"
import { REGISTRY } from "./_lib/registry"

export default {
  fetch: (request: Request): Response => {
    // A rewrite rewrites the URL the function sees, so the path here is this
    // file's own route rather than what the caller typed. Echo it only when it
    // is genuinely the caller's — otherwise say so plainly instead of quoting
    // a path nobody asked for.
    const { pathname } = new URL(request.url)
    const isRewriteTarget = pathname === "/api/not-found"

    return error({
      code: "not_found",
      message: isRewriteTarget
        ? "That path is not an endpoint of this API."
        : `No API endpoint at ${pathname}.`,
      hint:
        `Call GET ${REGISTRY.siteUrl}/api for the endpoint index, or read the ` +
        `OpenAPI document at ${REGISTRY.siteUrl}/openapi.json.`,
      allowed: [
        "/api",
        "/api/health",
        "/api/components",
        "/api/components/{slug}",
        "/api/guides",
        "/api/guides/{slug}",
        "/api/chains",
        "/api/types",
        "/api/mcp",
      ],
    })
  },
}

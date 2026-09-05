/**
 * GET /api/components/{slug} — one component, in full.
 *
 * The slug is read from the path rather than an injected params object so the
 * handler is a plain function of a Request: the same call works in a test, in
 * local dev and on the platform.
 */
import {
  badFormat,
  error,
  handler,
  json,
  JSON_TYPE,
  markdown,
  MARKDOWN_TYPE,
  readFormat,
} from "../_lib/http.js"
import { REGISTRY, componentSlugs, findComponent } from "../_lib/registry.js"

function slugFromUrl(url: string): string {
  const { pathname } = new URL(url)
  const last = pathname.replace(/\/+$/, "").split("/").pop() ?? ""
  return decodeURIComponent(last)
}

export default {
  fetch: handler({
    GET: (request) => {
      const slug = slugFromUrl(request.url)
      const component = findComponent(slug)

      if (!component) {
        return error({
          code: "not_found",
          message: `No component named "${slug}".`,
          hint:
            "Call GET /api/components for the full list. Names and slugs both " +
            'work: "ReputationScore" and "reputation-score" resolve to the same component.',
          allowed: componentSlugs(),
        })
      }

      const format = readFormat(request)
      if ("invalid" in format) return badFormat(format.invalid)
      if (format.format === "markdown") return markdown(component.markdown)

      return json({
        ...component,
        markdownUrl: `${component.docsUrl}.md`,
        packageName: REGISTRY.packageName,
        nonAffiliationNotice: REGISTRY.nonAffiliationNotice,
        unpublishedNotice: REGISTRY.unpublishedNotice,
      })
    },
  }, {
    // This endpoint answers the same URL as JSON or as markdown, so a caller
    // accepting only one of the two is still satisfiable and must not get 406.
    offers: [JSON_TYPE, MARKDOWN_TYPE],
  }),
}

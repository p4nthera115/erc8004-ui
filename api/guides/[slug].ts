/**
 * GET /api/guides/{slug} — one guide, as JSON metadata plus its markdown body,
 * or as raw markdown with ?format=markdown.
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
import { findGuide, guideSlugs } from "../_lib/registry.js"

function slugFromUrl(url: string): string {
  const { pathname } = new URL(url)
  const last = pathname.replace(/\/+$/, "").split("/").pop() ?? ""
  return decodeURIComponent(last)
}

export default {
  fetch: handler({
    GET: (request) => {
      const slug = slugFromUrl(request.url)
      const guide = findGuide(slug)

      if (!guide) {
        return error({
          code: "not_found",
          message: `No guide named "${slug}".`,
          hint: "Call GET /api/guides for the list, or start with the installation guide.",
          allowed: guideSlugs(),
        })
      }

      const format = readFormat(request)
      if ("invalid" in format) return badFormat(format.invalid)
      if (format.format === "markdown") return markdown(guide.markdown)

      return json(guide)
    },
  }, {
    // This endpoint answers the same URL as JSON or as markdown, so a caller
    // accepting only one of the two is still satisfiable and must not get 406.
    offers: [JSON_TYPE, MARKDOWN_TYPE],
  }),
}

/**
 * GET /api/guides/{slug} — one guide, as JSON metadata plus its markdown body,
 * or as raw markdown with ?format=markdown.
 */
import { badFormat, error, handler, json, markdown, readFormat } from "../_lib/http"
import { findGuide, guideSlugs } from "../_lib/registry"

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
  }),
}

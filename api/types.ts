/**
 * GET /api/types — packages/ui/src/types.ts verbatim.
 *
 * The public data model an integrator codes against. Served as TypeScript
 * source with `?format=markdown`, and wrapped in JSON otherwise, so both a
 * curl-and-read agent and a JSON client get something usable.
 */
import {
  badFormat,
  handler,
  json,
  JSON_TYPE,
  markdown,
  MARKDOWN_TYPE,
  readFormat,
} from "./_lib/http.js"
import { REGISTRY } from "./_lib/registry.js"

export default {
  fetch: handler({
    GET: (request) => {
      const format = readFormat(request)
      if ("invalid" in format) return badFormat(format.invalid)

      if (format.format === "markdown") {
        return markdown(
          `# ${REGISTRY.packageName} — public types\n\n` +
            "Source of `packages/ui/src/types.ts`.\n\n" +
            "```ts\n" +
            REGISTRY.types +
            "\n```\n"
        )
      }

      return json({
        packageName: REGISTRY.packageName,
        source: "packages/ui/src/types.ts",
        language: "typescript",
        types: REGISTRY.types,
      })
    },
  }, {
    // This endpoint answers the same URL as JSON or as markdown, so a caller
    // accepting only one of the two is still satisfiable and must not get 406.
    offers: [JSON_TYPE, MARKDOWN_TYPE],
  }),
}

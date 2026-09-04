/**
 * GET /api/types — src/types.ts verbatim.
 *
 * The public data model an integrator codes against. Served as TypeScript
 * source with `?format=markdown`, and wrapped in JSON otherwise, so both a
 * curl-and-read agent and a JSON client get something usable.
 */
import { badFormat, handler, json, markdown, readFormat } from "./_lib/http"
import { REGISTRY } from "./_lib/registry"

export default {
  fetch: handler({
    GET: (request) => {
      const format = readFormat(request)
      if ("invalid" in format) return badFormat(format.invalid)

      if (format.format === "markdown") {
        return markdown(
          `# ${REGISTRY.packageName} — public types\n\n` +
            "Source of `src/types.ts`.\n\n" +
            "```ts\n" +
            REGISTRY.types +
            "\n```\n"
        )
      }

      return json({
        packageName: REGISTRY.packageName,
        source: "src/types.ts",
        language: "typescript",
        types: REGISTRY.types,
      })
    },
  }),
}

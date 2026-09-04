/**
 * GET /api/components — the component index.
 *
 * Two optional filters, both narrowing the same list:
 *   ?group=Identity   exact group match (the registry categories)
 *   ?q=reputation     free-text search across name, slug, props and body
 */
import { error, handler, json } from "../_lib/http"
import {
  REGISTRY,
  componentSummary,
  findGroup,
  groupTitles,
  searchComponents,
} from "../_lib/registry"

export default {
  fetch: handler({
    GET: (request) => {
      const params = new URL(request.url).searchParams
      const group = params.get("group")
      const query = params.get("q")

      let components = REGISTRY.components

      if (group) {
        const matched = findGroup(group)
        if (!matched) {
          return error({
            code: "invalid_parameter",
            message: `Unknown group "${group}".`,
            hint: "Omit ?group= to list every component, or use one of the allowed values.",
            allowed: groupTitles(),
          })
        }
        components = components.filter(
          (component) => component.group === matched.title
        )
      }

      if (query) {
        const matches = new Set(
          searchComponents(query).map((component) => component.slug)
        )
        components = components.filter((component) => matches.has(component.slug))
      }

      return json({
        count: components.length,
        total: REGISTRY.components.length,
        filters: { group: group ?? null, q: query ?? null },
        groups: REGISTRY.groups.map((entry) => ({
          title: entry.title,
          slugs: entry.slugs,
        })),
        components: components.map(componentSummary),
      })
    },
  }),
}

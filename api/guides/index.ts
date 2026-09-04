/**
 * GET /api/guides — the setup and concept guides, in reading order.
 */
import { handler, json } from "../_lib/http"
import { REGISTRY } from "../_lib/registry"

export default {
  fetch: handler({
    GET: () =>
      json({
        count: REGISTRY.guides.length,
        guides: REGISTRY.guides.map((guide) => ({
          slug: guide.slug,
          name: guide.name,
          description: guide.description,
          docsUrl: guide.docsUrl,
          markdownUrl: `${guide.docsUrl}.md`,
          apiUrl: `${REGISTRY.siteUrl}/api/guides/${guide.slug}`,
        })),
      }),
  }),
}

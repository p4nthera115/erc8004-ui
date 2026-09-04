/**
 * GET /api/health — is this API up, and which documentation build is it
 * serving? `generatedAt` is the snapshot timestamp, so a caller can tell
 * whether a redeploy has picked up a docs change.
 */
import { handler, json } from "./_lib/http"
import { REGISTRY } from "./_lib/registry"

export default {
  fetch: handler({
    GET: () =>
      json(
        {
          status: "ok",
          generatedAt: REGISTRY.generatedAt,
          packageName: REGISTRY.packageName,
          isPublished: REGISTRY.isPublished,
          counts: {
            components: REGISTRY.components.length,
            guides: REGISTRY.guides.length,
            chains: REGISTRY.chains.length,
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      ),
  }),
}

import { createFileRoute, notFound, rootRouteId } from "@tanstack/react-router"
import { COMPONENT_REGISTRY } from "@/components/docs/registry"
import { DocPageLayout } from "@/components/docs/DocPageLayout"

export const Route = createFileRoute("/docs/components/$slug")({
  loader: ({ params }) => {
    if (!COMPONENT_REGISTRY[params.slug]) {
      // Target the root boundary so an unknown slug renders the same full-page
      // 404 the server already sent as 404.html. Handling it here instead
      // would swap that page for a stub inside the docs shell the moment the
      // app hydrated — the same URL showing two different "not found" pages
      // half a second apart.
      throw notFound({ routeId: rootRouteId })
    }
  },
  component: function DocPage() {
    const { slug } = Route.useParams()
    const doc = COMPONENT_REGISTRY[slug]
    return <DocPageLayout doc={doc} />
  },
})

import { createFileRoute, notFound } from "@tanstack/react-router"
import { COMPONENT_REGISTRY } from "@/components/docs/registry"
import { DocPageLayout } from "@/components/docs/DocPageLayout"

export const Route = createFileRoute("/docs/components/$slug")({
  loader: ({ params }) => {
    if (!COMPONENT_REGISTRY[params.slug]) {
      throw notFound()
    }
  },
  component: function DocPage() {
    const { slug } = Route.useParams()
    const doc = COMPONENT_REGISTRY[slug]
    return <DocPageLayout doc={doc} />
  },
  notFoundComponent: () => (
    <div className="flex flex-col gap-3">
      <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
        Not Found
      </h1>
      <p className="text-neutral-700 dark:text-white/60">
        No docs page found for this path.
      </p>
    </div>
  ),
})

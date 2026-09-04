import { createFileRoute, notFound, rootRouteId } from "@tanstack/react-router"

/**
 * Catch-all for unmatched paths under /docs.
 *
 * Without it the router fails to match a child of the `/docs` layout, and
 * renders its default "Not Found" text inside the docs shell — a second,
 * unstyled 404 that replaced the real one as soon as the app hydrated. This
 * route matches nothing more specific than itself (static and dynamic
 * segments both win over a splat), so `/docs/introduction` and
 * `/docs/components/agent-card` are unaffected; only genuine misses land
 * here, and they bubble to the root boundary and render the full 404 page the
 * server already sent.
 */
export const Route = createFileRoute("/docs/$")({
  loader: () => {
    throw notFound({ routeId: rootRouteId })
  },
})

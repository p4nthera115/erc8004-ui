/**
 * Not-found handling under /docs.
 *
 * The server already answers every unmatched path with `404.html`, which is
 * the full 404 page. If a route inside /docs handles its own not-found, that
 * page gets swapped for a different one the moment the app hydrates — the same
 * URL showing two different "not found" screens half a second apart. These
 * tests pin the routes to the root boundary so there is only ever one.
 */
import { rootRouteId } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { Route as DocsSplatRoute } from "../src/routes/docs/$"
import { Route as ComponentSlugRoute } from "../src/routes/docs/components/$slug"
import { ROUTE_MANIFEST } from "../src/generated/route-manifest"

/** Runs a route loader and returns whatever it threw, or null. */
async function thrownBy(run: () => unknown): Promise<unknown> {
  try {
    await run()
    return null
  } catch (thrown) {
    return thrown
  }
}

const isRootNotFound = (thrown: unknown) =>
  Boolean(thrown) &&
  typeof thrown === "object" &&
  (thrown as { routeId?: string }).routeId === rootRouteId

describe("/docs/$ — unmatched paths under the docs layout", () => {
  it("bubbles its not-found to the root boundary", async () => {
    const loader = DocsSplatRoute.options.loader
    expect(loader).toBeTypeOf("function")

    const thrown = await thrownBy(() =>
      (loader as (context: unknown) => unknown)({
        params: { _splat: "nonexistent-guide" },
      })
    )
    expect(isRootNotFound(thrown), JSON.stringify(thrown)).toBe(true)
  })

  it("declares no notFoundComponent of its own", () => {
    // A local one would render inside the docs shell instead of replacing it.
    expect(DocsSplatRoute.options.notFoundComponent).toBeUndefined()
  })
})

describe("/docs/components/$slug", () => {
  const loader = ComponentSlugRoute.options.loader as (
    context: { params: { slug: string } }
  ) => unknown

  it("bubbles an unknown slug to the root boundary", async () => {
    const thrown = await thrownBy(() => loader({ params: { slug: "not-a-component" } }))
    expect(isRootNotFound(thrown), JSON.stringify(thrown)).toBe(true)
  })

  it("does not throw for a component that exists", async () => {
    const slugs = ROUTE_MANIFEST.filter((route) => route.kind === "component").map(
      (route) => route.path.split("/").pop() as string
    )
    expect(slugs.length).toBeGreaterThan(0)

    for (const slug of slugs) {
      expect(await thrownBy(() => loader({ params: { slug } })), slug).toBeNull()
    }
  })

  it("declares no notFoundComponent of its own", () => {
    expect(ComponentSlugRoute.options.notFoundComponent).toBeUndefined()
  })
})

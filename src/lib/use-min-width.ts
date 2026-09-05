import { useCallback, useSyncExternalStore } from "react"

/**
 * True when the viewport is at least `px` wide.
 *
 * This exists because `hidden md:block` only hides — it still mounts. The hero
 * wall and the mobile carousel are a dozen-plus live subgraph queries each, so
 * a CSS-only swap would have every phone paying for the wall it cannot see and
 * every desktop paying for the carousel. Gating on the real viewport means
 * only one of the two ever mounts.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the site is
 * prerendered, and this is the supported way to declare a different snapshot
 * for that pass without tripping a hydration mismatch. The prerenderer runs at
 * a desktop viewport, so the server snapshot is `true` and the prerendered
 * HTML keeps the wall it has always had.
 */
export function useMinWidth(px: number): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const query = window.matchMedia(`(min-width: ${px}px)`)
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    [px]
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(`(min-width: ${px}px)`).matches,
    () => true
  )
}

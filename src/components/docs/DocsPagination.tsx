import { Link, useLocation } from "@tanstack/react-router"
import { NAV, flattenNav } from "./nav"

const FLAT_NAV = flattenNav(NAV)

export function DocsPagination() {
  const { pathname } = useLocation()

  const currentIndex = FLAT_NAV.findIndex((item) => item.path === pathname)
  if (currentIndex === -1) return null

  const prev = currentIndex > 0 ? FLAT_NAV[currentIndex - 1] : null
  const next =
    currentIndex < FLAT_NAV.length - 1 ? FLAT_NAV[currentIndex + 1] : null

  return (
    <div className="mt-16 pt-8 border-t border-black/60 dark:border-white/10 flex items-center justify-between gap-4 font-mono">
      {prev ? (
        prev.slug ? (
          <Link
            to="/docs/components/$slug"
            params={{ slug: prev.slug }}
            className="group px-4 min-w-0 max-w-[45%] text-neutral-500 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white"
          >
            <span className="text-xl inline-block mr-2">←</span>
            <span className="text-sm transition-colors truncate">
              {prev.label}
            </span>
          </Link>
        ) : (
          <Link
            to={prev.to as "/docs/introduction" | "/docs/installation" | "/docs/concepts" | "/docs/api-keys" | "/docs/components" | "/docs/recipes" | "/docs/theming"}
            className="group px-4 min-w-0 max-w-[45%] text-neutral-500 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white"
          >
            <span className="text-xl inline-block mr-2">←</span>
            <span className="text-sm transition-colors truncate">
              {prev.label}
            </span>
          </Link>
        )
      ) : (
        <div />
      )}

      {next ? (
        next.slug ? (
          <Link
            to="/docs/components/$slug"
            params={{ slug: next.slug }}
            className="group px-4 min-w-0 max-w-[45%] text-neutral-500 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white"
          >
            <span className="text-sm transition-colors truncate">
              {next.label}
            </span>
            <span className="text-xl inline-block ml-2">→</span>
          </Link>
        ) : (
          <Link
            to={next.to as "/docs/introduction" | "/docs/installation" | "/docs/concepts" | "/docs/api-keys" | "/docs/components" | "/docs/recipes" | "/docs/theming"}
            className="group px-4 min-w-0 max-w-[45%] text-neutral-500 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white"
          >
            <span className="text-sm transition-colors truncate">
              {next.label}
            </span>
            <span className="text-xl inline-block ml-2">→</span>
          </Link>
        )
      ) : (
        <div />
      )}
    </div>
  )
}

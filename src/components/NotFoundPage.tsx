import { Link } from "@tanstack/react-router"
import { RECOVERY_LINKS } from "@/content/recovery-links"

/**
 * Shared 404 body, rendered both by the `/404` route (prerendered to
 * `dist/404.html`, which Vercel serves with a real 404 status for unmatched
 * paths) and by the router's in-app `notFoundComponent`.
 *
 * It lists the recovery entry points explicitly rather than just linking
 * "home": an agent that lands here has no site map in context, and the fastest
 * way out is a short list of machine-readable indexes. The markdown twin of
 * this page — served to `Accept: text/markdown` requests by `middleware.ts` —
 * carries the same links, so both audiences recover the same way.
 */


export function NotFoundPage() {
  return (
    <main className="max-w-2xl mx-auto py-24 px-6 font-mono">
      <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
        404 — Page not found
      </h1>
      <p className="mb-8 text-neutral-600 dark:text-white/60 leading-relaxed">
        That page doesn&apos;t exist on erc8004-ui. Nothing was moved — this URL
        has never resolved. Start from one of the indexes below.
      </p>

      <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-white/50 mb-3">
        Where to look next
      </h2>
      <ul className="mb-8 flex flex-col gap-2">
        {RECOVERY_LINKS.map((item) => (
          <li key={item.href} className="text-sm leading-relaxed">
            <a className="underline underline-offset-2" href={item.href}>
              {item.label}
            </a>
            <span className="text-neutral-600 dark:text-white/60">
              {" "}
              — {item.description}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 text-sm">
        <Link
          to="/docs/introduction"
          className="underline text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
        >
          Documentation →
        </Link>
        <Link
          to="/docs/components"
          className="underline text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
        >
          Component reference →
        </Link>
        <Link
          to="/"
          className="underline text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
        >
          Home →
        </Link>
      </div>
    </main>
  )
}

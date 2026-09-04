import { Link } from "@tanstack/react-router"
import { RECOVERY_LINKS } from "@/content/recovery-links"
import { Footer } from "@/components/landing/footer"
import {
  PageFootnote,
  PageHeader,
  PageSection,
} from "@/components/SitePageView"

/**
 * Shared 404 body, rendered both by the `/404` route (prerendered to
 * `dist/404.html`, which Vercel serves with a real 404 status for unmatched
 * paths) and by the router's in-app `notFoundComponent`.
 *
 * It lists the recovery entry points explicitly rather than just linking
 * "home": whoever lands here has no site map in context, and the fastest way
 * out is a short list of indexes. The markdown twin of this page — served to
 * requests that do not accept HTML, by `middleware.ts` — carries the same
 * links from `RECOVERY_LINKS`, so both audiences recover the same way.
 *
 * Uses the same section chrome as /about, /contact and /privacy so a dead URL
 * still lands somewhere that reads as part of the site.
 */
export function NotFoundPage() {
  return (
    <>
      <main className="font-mono">
        <PageHeader
          kicker="404"
          title="Page not found"
          intro="That page doesn't exist on erc8004-ui. Nothing was moved — this URL has never resolved. Start from one of the indexes below."
        />

        <PageSection heading="Where to look next">
          <ul className="flex max-w-2xl flex-col gap-2">
            {RECOVERY_LINKS.map((item) => (
              <li key={item.href} className="text-sm leading-relaxed">
                <a className="underline underline-offset-2" href={item.href}>
                  {item.label}
                </a>
                <span className="text-text-secondary"> — {item.description}</span>
              </li>
            ))}
          </ul>
        </PageSection>

        <PageSection heading="Keep reading">
          <div className="flex flex-col gap-3 text-sm md:flex-row md:gap-10">
            <Link to="/docs/introduction" className="underline underline-offset-2">
              Documentation →
            </Link>
            <Link to="/docs/components" className="underline underline-offset-2">
              Component reference →
            </Link>
            <Link to="/" className="underline underline-offset-2">
              Home →
            </Link>
          </div>
        </PageSection>

        <PageFootnote
          left={
            <>
              This page as markdown: request any URL with{" "}
              <code>Accept: text/markdown</code>
            </>
          }
          right={
            <>
              Agent index:{" "}
              <a className="underline" href="/llms.txt">
                /llms.txt
              </a>
            </>
          }
        />
      </main>
      <Footer />
    </>
  )
}

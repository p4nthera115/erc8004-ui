import type { ReactNode } from "react"
import type { SitePage, SitePageSection } from "@/content/site-pages"
import { RULE } from "@/components/landing/section"

/**
 * Page chrome for the standalone pages — /about, /contact, /privacy and the
 * 404. Visual language follows the landing page: monospace, full-bleed
 * sections separated by a single hairline, no cards.
 *
 * `PageHeader`, `PageSection` and `PageFootnote` are exported so the 404 can
 * use the same shell without being forced through the `SitePage` data shape:
 * it needs router `<Link>`s and has no markdown file of its own. Sharing the
 * primitives rather than the data keeps the two from drifting apart visually.
 */

export function PageHeader({
  kicker,
  title,
  intro,
}: {
  kicker: string
  title: string
  intro: ReactNode
}) {
  return (
    <header className={`border-b ${RULE} px-6 py-16 md:px-14 md:py-20`}>
      <div className="flex max-w-3xl flex-col gap-4">
        <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">
          {kicker}
        </span>
        <h1 className="text-2xl leading-snug md:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
          {intro}
        </p>
      </div>
    </header>
  )
}

export function PageSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className={`border-b ${RULE}`}>
      <div className="flex flex-col gap-6 px-6 py-12 md:px-14 md:py-16">
        <h2 className="text-xs uppercase tracking-[0.2em] text-text-secondary">
          {heading}
        </h2>
        {children}
      </div>
    </section>
  )
}

/** The small two-up strip that closes a page, above the footer. */
export function PageFootnote({
  left,
  right,
}: {
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div
      className={`flex flex-col gap-2 border-b px-6 py-6 text-xs text-text-secondary md:flex-row md:items-center md:justify-between md:px-14 ${RULE}`}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

/**
 * Renders a `SitePage` from `src/content/site-pages.ts`. The same objects are
 * rendered to markdown by `scripts/generate-llms.ts`, so section order and
 * headings here match the `.md` twin an agent gets from
 * `Accept: text/markdown`.
 */
export function SitePageView({ page }: { page: SitePage }) {
  return (
    <main className="font-mono">
      <PageHeader kicker={page.slug} title={page.title} intro={page.intro} />

      {page.sections.map((section) => (
        <Section key={section.heading} section={section} />
      ))}

      <PageFootnote
        left={
          <>
            This page as markdown:{" "}
            <a className="underline" href={`/${page.slug}.md`}>
              /{page.slug}.md
            </a>
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
  )
}

function Section({ section }: { section: SitePageSection }) {
  return (
    <PageSection heading={section.heading}>
      {section.paragraphs?.map((paragraph, i) => (
        <p key={i} className="max-w-2xl text-sm leading-relaxed md:text-base">
          {paragraph}
        </p>
      ))}

      {section.bullets && (
        <ul className="flex max-w-2xl flex-col gap-2">
          {section.bullets.map((bullet, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm leading-relaxed text-text-secondary"
            >
              <span aria-hidden="true">—</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {section.links && (
        <ul className="flex max-w-2xl flex-col gap-2">
          {section.links.map((link) => (
            <li key={link.href} className="text-sm leading-relaxed">
              <a
                href={link.href}
                className="underline underline-offset-2"
                {...(link.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
              {link.description && (
                <span className="text-text-secondary">
                  {" "}
                  — {link.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  )
}

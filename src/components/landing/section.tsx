import type { ReactNode } from "react"

/** Hairline used across the landing page — matches the nav and hero. */
export const RULE = "border-black/60 dark:border-white/25"

/**
 * Full-bleed landing section. Sections stack against each other and are
 * separated by a single hairline, so the page reads as one continuous grid
 * rather than a series of floating cards.
 */
export function Section({
  label,
  title,
  intro,
  children,
}: {
  label: string
  title: ReactNode
  intro?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className={`border-b ${RULE} font-mono`}>
      <div className="flex flex-col gap-8 px-5 py-12 sm:gap-10 sm:px-6 sm:py-16 md:px-14 md:py-20">
        <header className="flex max-w-3xl flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">
            {label}
          </span>
          <h2 className="text-xl leading-snug sm:text-2xl md:text-3xl">{title}</h2>
          {intro && (
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
              {intro}
            </p>
          )}
        </header>
        {children}
      </div>
    </section>
  )
}

/** Small uppercase caption used above panels inside a section. */
export function PanelLabel({
  children,
  aside,
}: {
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className={`flex items-baseline justify-between border-b ${RULE} pb-2`}>
      <span className="text-xs uppercase tracking-[0.2em]">{children}</span>
      {aside && <span className="text-xs text-text-secondary">{aside}</span>}
    </div>
  )
}

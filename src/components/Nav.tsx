import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useId, useState } from "react"
import { FaGithub } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { BsSun, BsMoon } from "react-icons/bs"
import { DocsNavLinks } from "./docs/nav-links"

interface NavProps {
  isDark: boolean
  onToggle: () => void
}

const EXTERNAL_LINKS = [
  { label: "ERC-8004", href: "https://eips.ethereum.org/EIPS/eip-8004" },
  { label: "Agent0 SDK", href: "https://docs.sdk.ag0.xyz" },
]

export function Nav({ isDark, onToggle }: NavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const menuId = useId()

  // The drawer is the only way to reach the docs tree on a phone, so it must
  // not survive the navigation that opened it. Storing the path it was opened
  // at and deriving `menuOpen` from it closes the drawer on any navigation —
  // a link inside it, or the browser's back button — with no effect involved.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const menuOpen = openedAt === pathname

  // Close on Escape, and hold the page still behind the panel.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAt(null)
    }
    document.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 p-4 px-4 md:px-8 border-b border-black/60 dark:border-white/25 bg-surface">
      <div className="flex items-center justify-between gap-2 font-mono">
        <div className="flex min-w-0 items-center gap-2 md:gap-6">
          <NavLogo />
          {/*
            The two primary destinations stay in the bar from 440px up.
            Below that the bar carries only the logo and the controls, and
            everything moves into the drawer — at 320px there is no room for
            both.
          */}
          <Link
            to="/docs/introduction"
            className="hidden min-[440px]:block hover:underline p-2 ml-2 hover:cursor-pointer"
          >
            Docs
          </Link>
          <Link
            to="/docs/components"
            className="hidden min-[440px]:block hover:underline p-2 hover:cursor-pointer"
          >
            Components
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3 md:gap-6">
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block hover:underline p-2 hover:cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={onToggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="hover:scale-110 transition hover:cursor-pointer p-2 lg:ml-2"
          >
            {isDark ? <BsSun size={22} /> : <BsMoon size={22} />}
          </button>
          <a
            href="https://github.com/p4nthera115/erc8004-ui"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="hover:scale-110 transition hover:cursor-pointer p-1.5"
          >
            <FaGithub size={26} className="md:h-[30px] md:w-[30px]" />
          </a>
          <a
            href="https://x.com/p4nthera_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="@p4nthera_ on X"
            className="hover:scale-110 transition hover:cursor-pointer p-1.5"
          >
            <FaXTwitter size={24} className="md:h-[27px] md:w-[27px]" />
          </a>
          <button
            onClick={() => setOpenedAt(menuOpen ? null : pathname)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="p-2 -mr-1 hover:cursor-pointer lg:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      <MobileMenu
        id={menuId}
        open={menuOpen}
        onClose={() => setOpenedAt(null)}
      />
    </header>
  )
}

const MENU_GROUP = "flex flex-col gap-1"
const MENU_TITLE =
  "mb-1 text-[10px] tracking-widest text-text-muted select-none"
const MENU_LINK =
  "px-2 py-2 text-sm text-neutral-950 hover:bg-black/10 dark:text-white dark:hover:bg-white/20"

/** Two bars that cross into an X when the drawer is open. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="relative flex h-[22px] w-[22px] flex-col items-center justify-center"
    >
      <span
        className={`absolute h-px w-5 bg-current transition duration-200 ${
          open ? "rotate-45" : "-translate-y-[3.5px]"
        }`}
      />
      <span
        className={`absolute h-px w-5 bg-current transition duration-200 ${
          open ? "-rotate-45" : "translate-y-[3.5px]"
        }`}
      />
    </span>
  )
}

/**
 * Below `lg`, the sole route to the site's navigation — including the docs
 * tree, whose sidebar is hidden at that width. Rendered inside the sticky
 * header and pinned under it, so it scrolls independently of the page.
 */
function MobileMenu({
  id,
  open,
  onClose,
}: {
  id: string
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-x-0 bottom-0 top-[81px] z-40 bg-black/30 lg:hidden dark:bg-black/60"
      />
      <div
        id={id}
        className="fixed inset-x-0 bottom-0 top-[81px] z-50 overflow-y-auto overscroll-contain border-t border-black/60 bg-surface px-6 py-8 font-mono lg:hidden dark:border-white/25"
      >
        <nav className="flex flex-col gap-8 pb-16">
          <div className={MENU_GROUP}>
            <span className={MENU_TITLE}>SITE</span>
            <Link to="/" className={MENU_LINK}>
              Home
            </Link>
          </div>

          <DocsNavLinks
            groupClassName={MENU_GROUP}
            titleClassName={MENU_TITLE}
            linkClassName={MENU_LINK}
          />

          <div className={MENU_GROUP}>
            <span className={MENU_TITLE}>REFERENCE</span>
            {EXTERNAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={MENU_LINK}
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}

function NavLogo() {
  return (
    <Link to="/" aria-label="Home">
      <div className="group grid gap-0.5 grid-cols-4 grid-rows-4 w-12 h-12 hover:cursor-pointer">
        <div className="bg-current rounded-xs col-span-2 row-span-1 group-hover:translate-x-[12.5px] transition group-hover:delay-150 active:scale-85 hover:delay-0" />
        <div className="bg-current rounded-xs col-span-1 row-span-1 group-hover:translate-x-[12.5px] transition group-hover:delay-100 active:scale-85 hover:delay-0" />
        <div className="bg-current rounded-xs col-span-1 row-span-1 group-hover:translate-y-[12.5px] transition active:scale-85" />

        <div className="bg-current rounded-xs col-span-1 row-span-1 active:scale-85 transition" />
        <div className="bg-current rounded-xs col-span-2 row-span-2 active:scale-90 transition" />
        <div className="rounded-xs col-span-1 row-span-1 active:scale-85 transition" />
        <div className="bg-current rounded-xs col-span-1 row-span-2 active:scale-85 transition" />
        <div className="bg-current rounded-xs col-span-1 row-span-1 active:scale-85 transition" />

        <div className="rounded-xs col-span-1 row-span-1 active:scale-85 transition" />
        <div className="bg-current rounded-xs col-span-2 row-span-1 group-hover:translate-x-[-12.5px] transition active:scale-85" />
      </div>
    </Link>
  )
}

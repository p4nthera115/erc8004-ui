import { Link } from "@tanstack/react-router"
import { FaGithub } from "react-icons/fa"
import { BsSun, BsMoon } from "react-icons/bs"

interface NavProps {
  isDark: boolean
  onToggle: () => void
}

export function Nav({ isDark, onToggle }: NavProps) {
  return (
    <header className="sticky top-0 z-50 p-4 px-8 border-b border-black/60 dark:border-white/25 bg-surface">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-6">
          <NavLogo />
          <Link
            to="/docs/introduction"
            className="hover:underline p-2 ml-2 hover:cursor-pointer"
          >
            Docs
          </Link>
          <Link
            to="/docs/components"
            className="hover:underline p-2 hover:cursor-pointer"
          >
            Components
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://eips.ethereum.org/EIPS/eip-8004"
            target="_blank"
            className="hover:underline p-2 hover:cursor-pointer"
          >
            ERC-8004
          </a>
          <a
            href="https://docs.sdk.ag0.xyz"
            target="_blank"
            className="hover:underline p-2 mr-2 hover:cursor-pointer"
          >
            Agent0 SDK
          </a>
          <button
            onClick={onToggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="hover:scale-110 transition hover:cursor-pointer p-1"
          >
            {isDark ? <BsSun size={22} /> : <BsMoon size={22} />}
          </button>
          <a
            href="https://github.com/p4nthera115/erc8004-ui"
            target="_blank"
            className="hover:scale-110 transition hover:cursor-pointer"
          >
            <FaGithub size={30} />
          </a>
        </div>
      </div>
    </header>
  )
}

function NavLogo() {
  return (
    <Link to="/">
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

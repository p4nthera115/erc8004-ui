import { Link } from "@tanstack/react-router"
import { FaGithub } from "react-icons/fa"

export function Nav() {
  return (
    <header className="sticky top-0 z-50 p-4 px-8 border-b border-white/25 bg-surface">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-8">
          <NavLogo />
          <Link to="/docs/introduction" className="hover:underline">
            Docs
          </Link>
          <Link to="/docs/components" className="hover:underline">
            Components
          </Link>
        </div>
        <div className="flex items-center gap-10">
          <a
            href="https://eips.ethereum.org/EIPS/eip-8004"
            target="_blank"
            className="hover:underline"
          >
            ERC-8004
          </a>
          <a
            href="https://docs.sdk.ag0.xyz"
            target="_blank"
            className="hover:underline"
          >
            Agent0 SDK
          </a>
          <a
            href="https://github.com/p4nthera115/erc8004-ui"
            target="_blank"
            className="hover:scale-110 transition"
          >
            <FaGithub color="white" size={30} />
          </a>
        </div>
      </div>
    </header>
  )
}

function NavLogo() {
  return (
    <Link to="/">
      <div className="group grid gap-0.5 grid-cols-4 grid-rows-4 w-12 h-12 cursor-pointer">
        <div className="bg-white rounded-[2px] col-span-2 row-span-1 group-hover:translate-x-[12.5px] transition group-hover:delay-150" />
        <div className="bg-white rounded-[2px] col-span-1 row-span-1 group-hover:translate-x-[12.5px] transition group-hover:delay-100" />
        <div className="bg-white rounded-[2px] col-span-1 row-span-1 group-hover:translate-y-[12.5px] transition" />

        <div className="bg-white rounded-[2px] col-span-1 row-span-1" />
        <div className="bg-white rounded-[2px] col-span-2 row-span-2" />
        <div className="rounded-[2px] col-span-1 row-span-1" />
        <div className="bg-white rounded-[2px] col-span-1 row-span-2" />
        <div className="bg-white rounded-[2px] col-span-1 row-span-1" />

        <div className="rounded-[2px] col-span-1 row-span-1" />
        <div className="bg-white rounded-[2px] col-span-2 row-span-1 group-hover:translate-x-[-12.5px] transition" />
      </div>
    </Link>
  )
}

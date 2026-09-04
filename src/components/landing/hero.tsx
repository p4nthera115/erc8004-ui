import { Link } from "@tanstack/react-router"
import { ComponentWall } from "./component-wall"

export function HeroSection() {
  return (
    <div className="min-h-[calc(100svh-81px)] md:h-[calc(100svh-81px)] border-b border-black/60 dark:border-white/25 grid grid-cols-1 md:grid-cols-2 font-mono overflow-x-hidden">
      <div className="col-span-1 relative flex flex-col py-10 px-6 gap-8 md:py-14 md:px-14 md:gap-10 md:border-r border-black/60 dark:border-white/25">
        <h1 className="text-3xl md:text-4xl">
          The component library for rendering on-chain agent identity and
          reputation data.
        </h1>
        <p className="text-base md:text-lg">
          Drop-in React components that fetch and display ERC-8004 agent data
          directly from the blockchain. No manual data wiring. No custom UI
          work.
        </p>
        <p>Built for blockchain developers and AI coding agents.</p>
        <div className="flex flex-col md:flex-row mx-auto gap-4 md:gap-10 justify-self-start w-full mt-2 md:mt-6">
          <button
            onClick={() => navigator.clipboard.writeText("npm i @erc8004/ui")}
            className="border py-4 px-10 w-full justify-center items-center flex cursor-pointer hover:underline"
          >
            npm i @erc8004/ui
          </button>
          <Link
            to="/docs/components"
            className="bg-border-default text-surface py-4 w-full justify-center items-center flex hover:opacity-80"
          >
            View Components
          </Link>
        </div>
        {/*
          Tucked into the column's bottom-right corner, against the wall's
          edge, so it reads as a caption for the components scrolling beside
          it. Positioned rather than flowed so it ignores the column padding.
        */}
        <div className="absolute bottom-4 right-5 hidden items-center gap-2.5 text-[11px] text-text-secondary md:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
          </span>
          Live agent data from Base
          <span aria-hidden>→</span>
        </div>
      </div>
      <div className="col-span-1 diagonal-lines relative hidden md:block overflow-hidden">
        <ComponentWall />
      </div>
    </div>
  )
}

import { Link } from "@tanstack/react-router"
import { ComponentWall, LiveIndicator } from "./component-wall"
import { useMinWidth } from "@/lib/use-min-width"

export function HeroSection() {
  // `hidden md:block` would still mount the wall's twelve live queries on a
  // phone that never sees it.
  const isDesktop = useMinWidth(768)

  return (
    <div className="md:h-[calc(100svh-81px)] border-b border-black/60 dark:border-white/25 grid grid-cols-1 md:grid-cols-2 font-mono overflow-x-hidden">
      <div className="col-span-1 relative flex flex-col py-10 px-5 gap-6 sm:px-6 sm:gap-8 md:py-14 md:px-14 md:gap-10 md:border-r border-black/60 dark:border-white/25">
        <h1 className="text-2xl sm:text-3xl md:text-4xl">
          The component library for rendering on-chain agent identity and
          reputation data.
        </h1>
        <p className="text-sm sm:text-base md:text-lg">
          Drop-in React components that fetch and display ERC-8004 agent data
          directly from the blockchain. No manual data wiring. No custom UI
          work.
        </p>
        <p className="text-sm sm:text-base">
          Built for blockchain developers and AI coding agents.
        </p>
        <div className="flex flex-col md:flex-row mx-auto gap-4 md:gap-10 justify-self-start w-full mt-2 md:mt-6">
          <button
            onClick={() => navigator.clipboard.writeText("npm i @p4n/erc8004-ui")}
            className="flex w-full cursor-pointer items-center justify-center border px-4 py-4 text-sm hover:underline sm:px-10 sm:text-base"
          >
            npm i @p4n/erc8004-ui
          </button>
          <Link
            to="/docs/components"
            className="flex w-full items-center justify-center bg-border-default py-4 text-sm text-surface hover:opacity-80 sm:text-base"
          >
            View Components
          </Link>
        </div>
        {/*
          Tucked into the column's bottom-right corner, against the wall's
          edge, so it reads as a caption for the components scrolling beside
          it. Positioned rather than flowed so it ignores the column padding.
        */}
        <LiveIndicator
          arrow="→"
          className="absolute bottom-4 right-5 hidden md:flex"
        />
      </div>
      <div className="col-span-1 diagonal-lines relative hidden md:block overflow-hidden">
        {isDesktop && <ComponentWall />}
      </div>
    </div>
  )
}

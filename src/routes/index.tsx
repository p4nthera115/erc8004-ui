import { Link, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: Home })

export function Home() {
  return (
    <div className="h-dvh grid grid-cols-2 font-mono">
      <div className="col-span-1 flex flex-col py-14 px-14 gap-10 border-r border-white/25">
        <h1 className="text-4xl">
          The component library for rendering on-chain agent identity and
          reputation data.
        </h1>
        <p className="text-lg">
          Drop-in React components that fetch and display ERC-8004 agent data
          directly from the blockchain. No manual data wiring. No custom UI
          work.
        </p>
        <p>Built for blockchain developers and AI coding agents.</p>
        <div className="flex flex-row mx-auto gap-10 justify-self-start w-full mt-6">
          <button
            onClick={() => navigator.clipboard.writeText("npm i @erc8004/ui")}
            className="border py-4 px-10 w-full justify-center items-center flex cursor-pointer hover:underline"
          >
            npm i @erc8004/ui
          </button>
          <Link
            to="/docs/components"
            className="bg-white text-surface-overlay py-4 w-full justify-center items-center flex hover:bg-white/80"
          >
            View Components
          </Link>
        </div>
      </div>
      <div className="col-span-1 diagonal-lines"></div>
    </div>
  )
}

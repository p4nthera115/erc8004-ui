import { Link, createFileRoute } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
import { type ReactNode, useState } from "react"

export const Route = createFileRoute("/")({ component: Home })

export function Home() {
  const [active, setActive] = useState(false)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  return (
    <div className="h-[calc(100svh-80px)] border-b border-white/25 grid grid-cols-2 font-mono overflow-x-hidden">
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
      <div className="col-span-1 diagonal-lines flex flex-col justify-between items-center">
        <div
          className={`h-full p-20 flex ${
            active ? "pt-15" : "pt-22"
          } transition-all duration-350`}
        >
          <MockAgentCard
            active={active}
            setActive={setActive}
            hoveredElement={hoveredElement}
            setHoveredElement={setHoveredElement}
          />
        </div>
        <CodeBlock
          active={active}
          hoveredElement={hoveredElement}
          setHoveredElement={setHoveredElement}
        />
      </div>
    </div>
  )
}

function MockAgentCard({
  active,
  setActive,
  hoveredElement,
  setHoveredElement,
}: {
  active: boolean
  setActive: (active: boolean) => void
  hoveredElement: string | null
  setHoveredElement: (el: string | null) => void
}) {
  const hoverProps = (label: string) =>
    active
      ? {
          onMouseEnter: () => setHoveredElement(label),
          onMouseLeave: () => setHoveredElement(null),
        }
      : {}

  const highlight = (label: string) =>
    active && hoveredElement === label
      ? "outline outline-1 outline-white/30"
      : ""

  return (
    <div
      onClick={() => setActive(!active)}
      className={`bg-surface border border-white/25 flex flex-col p-8 h-fit ${
        !active ? "cursor-pointer hover:border-white/75" : "cursor-pointer"
      }`}
    >
      {/* top row */}
      <div className="flex flex-row justify-between gap-20">
        {/* avatar */}
        <div className="flex flex-row gap-6">
          <div
            aria-label="agent-image"
            className={`bg-surface border border-white/25 flex rounded-lg size-16 ${highlight(
              "agent-image"
            )}`}
            {...hoverProps("agent-image")}
          ></div>
          {/* name and address */}
          <div className="flex flex-col gap-2">
            <h2
              aria-label="agent-name"
              className={`text-2xl ${highlight("agent-name")}`}
              {...hoverProps("agent-name")}
            >
              Agent Name
            </h2>
            <p
              aria-label="agent-address"
              className="text-text-muted/50 text-xs absolute translate-y-10"
            >
              0x742d35Cc6634C0...f2bD68
            </p>
          </div>
        </div>
        {/* reputation */}
        <div>
          <div
            aria-label="reputation-score"
            className={`justify-center items-center flex size-16 text-2xl underline decoration-green-400 underline-offset-8 ${highlight(
              "reputation-score"
            )}`}
            {...hoverProps("reputation-score")}
          >
            88
          </div>
        </div>
      </div>
      <hr className="my-6 border-white/25" />
      {/* bottom row */}
      <div className="flex flex-row justify-between gap-20">
        <p
          aria-label="agent-description"
          className={`text-sm ${highlight("agent-description")}`}
          {...hoverProps("agent-description")}
        >
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias
          enim minima quos numquam animi ut amet quae iusto nam consectetur.
        </p>
      </div>
    </div>
  )
}

function LineNum({ n }: { n: number }) {
  return (
    <span
      className={`text-text-muted/30 select-none pl-1 ${
        n < 10 ? "mr-6" : "mr-4"
      }`}
    >
      {n}
    </span>
  )
}

function Tag({ children }: { children: string }) {
  return <span className="text-sky-300/70">{children}</span>
}

function Attr({ children }: { children: string }) {
  return <span className="text-text/60">{children}</span>
}

function Str({ children }: { children: string }) {
  return <span className="text-amber-300/50">{children}</span>
}

function Num({ children }: { children: number }) {
  return <span className="text-violet-300/60">{children}</span>
}

function Punct({ children }: { children: string }) {
  return <span className="text-text-muted/50">{children}</span>
}

function Line({
  n,
  indent = 0,
  highlighted = false,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  n: number
  indent?: number
  highlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: ReactNode
}) {
  return (
    <span
      className={`block ${highlighted ? "bg-white/8" : ""} ${
        onMouseEnter ? "cursor-default" : ""
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <LineNum n={n} />
      {"  ".repeat(indent)}
      {children}
      {"\n"}
    </span>
  )
}

const ELEMENT_TO_COMPONENT: Record<string, string> = {
  "agent-image": "AgentImage",
  "agent-name": "AgentName",
  "reputation-score": "ReputationScore",
  "agent-description": "AgentDescription",
}

const COMPONENT_TO_ELEMENT: Record<string, string> = Object.fromEntries(
  Object.entries(ELEMENT_TO_COMPONENT).map(([k, v]) => [v, k])
)

function CodeBlock({
  active,
  hoveredElement,
  setHoveredElement,
}: {
  active: boolean
  hoveredElement: string | null
  setHoveredElement: (el: string | null) => void
}) {
  const highlighted = hoveredElement
    ? ELEMENT_TO_COMPONENT[hoveredElement]
    : null

  const lineHoverProps = (component: string) => ({
    onMouseEnter: () => setHoveredElement(COMPONENT_TO_ELEMENT[component]),
    onMouseLeave: () => setHoveredElement(null),
  })
  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        className="bg-neutral-950 border-t border-white/15 flex absolute w-1/2 right-0 bottom-0 overflow-hidden"
      >
        <pre className="px-6 py-8 pt-4 text-sm overflow-hidden w-full">
          <code className="font-mono pl-2">
            <motion.div layout>
              <Line n={1}>
                <Punct>{"<"}</Punct>
                <Tag>AgentProvider</Tag>
              </Line>
              <Line n={2} indent={1}>
                <Attr>agentRegistry</Attr>
                <Punct>=</Punct>
                <Str>{'"eip155:1:0x742d...beb7"'}</Str>
              </Line>
              <Line n={3} indent={1}>
                <Attr>agentId</Attr>
                <Punct>{"={"}</Punct>
                <Num>{374}</Num>
                <Punct>{"}"}</Punct>
              </Line>
              <Line n={4}>
                <Punct>{">"}</Punct>
              </Line>
            </motion.div>
            {!active ? (
              <motion.div
                layout="preserve-aspect"
                key="active"
                layoutDependency={[active]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Line n={5} indent={1}>
                  <Punct>{"<"}</Punct>
                  <Tag>AgentCard</Tag>
                  <Punct>{" />"}</Punct>
                </Line>
              </motion.div>
            ) : (
              <motion.div
                layout="preserve-aspect"
                key="inactive"
                layoutDependency={[active]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Line
                  n={5}
                  indent={1}
                  highlighted={highlighted === "AgentImage"}
                  {...lineHoverProps("AgentImage")}
                >
                  <Punct>{"</"}</Punct>
                  <Tag>AgentImage</Tag>
                  <Punct>{">"}</Punct>
                </Line>
                <Line
                  n={6}
                  indent={1}
                  highlighted={highlighted === "AgentName"}
                  {...lineHoverProps("AgentName")}
                >
                  <Punct>{"</"}</Punct>
                  <Tag>AgentName</Tag>
                  <Punct>{">"}</Punct>
                </Line>
                <Line
                  n={7}
                  indent={1}
                  highlighted={highlighted === "ReputationScore"}
                  {...lineHoverProps("ReputationScore")}
                >
                  <Punct>{"</"}</Punct>
                  <Tag>ReputationScore</Tag>
                  <Punct>{">"}</Punct>
                </Line>
                <Line
                  n={8}
                  indent={1}
                  highlighted={highlighted === "AgentDescription"}
                  {...lineHoverProps("AgentDescription")}
                >
                  <Punct>{"</"}</Punct>
                  <Tag>AgentDescription</Tag>
                  <Punct>{">"}</Punct>
                </Line>
              </motion.div>
            )}
            <motion.div layout>
              <Line n={!active ? 9 : 6}>
                <Punct>{"</"}</Punct>
                <Tag>AgentProvider</Tag>
                <Punct>{">"}</Punct>
              </Line>
            </motion.div>
          </code>
        </pre>
      </motion.div>
      <div className=" absolute w-1/2 bottom-0 h-12.5 z-100 bg-neutral-950 text-sm px-6">
        <Line n={active ? 9 : 6}>
          <Punct>{"</"}</Punct>
          <Tag>AgentProvider</Tag>
          <Punct>{">"}</Punct>
        </Line>
      </div>
    </AnimatePresence>
  )
}

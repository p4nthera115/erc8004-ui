import { createFileRoute } from "@tanstack/react-router"
import { SectionHeading } from "@/docs/DocPageLayout"

export const Route = createFileRoute("/docs/theming")({
  component: Theming,
})

function Theming() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-white">
          Theming &amp; Customisation
        </h1>
        <p className="text-base text-white/60 leading-relaxed max-w-prose">
          What you can and can't customise right now.
        </p>
      </div>

      {/* Current state */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Current Customisation</SectionHeading>
        <p className="text-sm text-white/60 leading-relaxed max-w-prose">
          Components currently ship with a fixed visual design. They do not
          accept a{" "}
          <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
            className
          </code>{" "}
          prop and do not expose CSS variables for colour or spacing overrides.
        </p>
        <p className="text-sm text-white/60 leading-relaxed max-w-prose">
          This is intentional for now. ERC-8004 components function as trust
          signals — if the same component rendered differently on every site,
          users would lose the visual consistency that makes it recognisable.
          Locking the design is a deliberate tradeoff in favour of trustworthiness
          over flexibility.
        </p>
      </section>

      {/* What you can do */}
      <section className="flex flex-col gap-4">
        <SectionHeading>What You Can Do Today</SectionHeading>
        <div className="border border-white/10 divide-y divide-white/10">
          <div className="px-5 py-4 flex flex-col gap-1">
            <span className="font-mono text-sm text-white/90">Layout</span>
            <p className="text-sm text-white/60 leading-relaxed">
              Wrap components in your own container elements and apply any
              layout, spacing, or positioning you need. Components size to their
              content.
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <span className="font-mono text-sm text-white/90">Composition</span>
            <p className="text-sm text-white/60 leading-relaxed">
              Mix and match atomic components instead of using composed ones.
              For example, use{" "}
              <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
                AgentName
              </code>{" "}
              +{" "}
              <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
                ReputationScore
              </code>{" "}
              without the full{" "}
              <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
                AgentCard
              </code>
              .
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            <span className="font-mono text-sm text-white/90">
              FingerprintBadge size
            </span>
            <p className="text-sm text-white/60 leading-relaxed">
              <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
                FingerprintBadge
              </code>{" "}
              accepts a{" "}
              <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
                size
              </code>{" "}
              prop to control its rendered dimensions.
            </p>
          </div>
        </div>
      </section>

      {/* Planned */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Planned</SectionHeading>
        <p className="text-sm text-white/60 leading-relaxed max-w-prose">
          More customisation options are on the roadmap, including{" "}
          <code className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]">
            className
          </code>{" "}
          passthrough on wrapper elements and CSS variable overrides for
          colour tokens. These will be additive — existing components will
          continue to work without changes.
        </p>
      </section>
    </div>
  )
}

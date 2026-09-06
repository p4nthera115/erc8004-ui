import { createFileRoute } from "@tanstack/react-router"
import { SectionHeading } from "@/components/docs/DocPageLayout"
import { CodeBlock } from "@/components/docs/CodeBlock"
import { Callout } from "@/components/docs/Callout"

export const Route = createFileRoute("/docs/accessibility")({
  component: Accessibility,
})

const CODE = "font-mono text-neutral-700 dark:text-white/80 bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[0.85em]"
const BODY = "text-sm text-neutral-700 dark:text-white/80 leading-relaxed"
const LEAD = "text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose"

const HANDLED: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "Graphics carry names",
    body: (
      <>
        Every SVG that means something — the FingerprintBadge, the
        ReputationTimeline chart — is <code className={CODE}>role="img"</code>{" "}
        with a descriptive <code className={CODE}>aria-label</code>. Decorative
        marks (status dots, separators, icon glyphs beside their own text) are{" "}
        <code className={CODE}>aria-hidden</code>, so nothing is announced
        twice.
      </>
    ),
  },
  {
    title: "Nothing depends on colour alone",
    body: (
      <>
        Score bands, validation status and endpoint health are colour-coded
        visually, and every one of them also carries text. An unreachable
        endpoint reads as “Endpoint unreachable”, not just a red dot.
      </>
    ),
  },
  {
    title: "Charts have text alternatives",
    body: (
      <>
        ReputationTimeline’s tooltip follows the pointer, so the same readings
        are also emitted as a visually hidden list — one entry per data point,
        with its date and score. ReputationDistribution does the same for its
        buckets.
      </>
    ),
  },
  {
    title: "Truncated values keep their full form",
    body: (
      <>
        Addresses and URLs are shortened for display, so the complete value is
        exposed to assistive tech rather than stranded in a{" "}
        <code className={CODE}>title</code> attribute that only a mouse can
        reach.
      </>
    ),
  },
  {
    title: "Controls are real controls",
    body: (
      <>
        Pagination and copy-to-clipboard are <code className={CODE}>button</code>{" "}
        elements with labels, reachable by Tab and activated by Enter or Space.
        Scrollable regions are focusable, so they can be scrolled without a
        pointer.
      </>
    ),
  },
  {
    title: "State changes are announced",
    body: (
      <>
        Loading regions set <code className={CODE}>aria-busy</code> and announce
        once — not once per skeleton. Errors are{" "}
        <code className={CODE}>role="alert"</code>, empty states{" "}
        <code className={CODE}>role="status"</code>, and paging announces the
        page you landed on.
      </>
    ),
  },
  {
    title: "Motion respects the system setting",
    body: (
      <>
        Under <code className={CODE}>prefers-reduced-motion: reduce</code>, every
        animation and transition is disabled — skeleton pulses, bar fills, chart
        tooltips. It ships in the stylesheet, so it applies whether you use the
        prebuilt CSS or run Tailwind yourself.
      </>
    ),
  },
]

const YOURS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "Colour contrast against your background",
    body: (
      <>
        The default tokens are checked, but retheming can push text under 4.5:1.
        Re-check after you change <code className={CODE}>--erc8004-muted-fg</code>{" "}
        or the surface colours.
      </>
    ),
  },
  {
    title: "Heading order",
    body: <>Components emit the level you ask for. Only you know what surrounds them.</>,
  },
  {
    title: "Landmarks and page structure",
    body: (
      <>
        Wrap the components in your own <code className={CODE}>main</code>,{" "}
        <code className={CODE}>nav</code> and headings.
      </>
    ),
  },
]

function Accessibility() {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
          Accessibility
        </h1>
        <p className={LEAD}>
          Every component ships accessible by default. There is nothing to
          switch on and no <code className={CODE}>a11y</code> prop — the markup,
          labelling and keyboard behaviour below are what you get from a plain
          import.
        </p>
        <p className={LEAD}>
          This matters more than usual here, because most of what these
          components render is not text. A fingerprint is an SVG. A reputation
          trend is a line chart. A verification tier is a coloured dot. Left
          alone, all of that is invisible to a screen reader and unreachable
          from a keyboard.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading>What Every Component Does</SectionHeading>
        <ul className="flex flex-col gap-4">
          {HANDLED.map((item) => (
            <li key={item.title} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {item.title}
              </span>
              <span className={BODY}>{item.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Headings Fit Your Page</SectionHeading>
        <p className={BODY}>
          Components that render their own title take a{" "}
          <code className={CODE}>headingLevel</code> prop. The defaults are the
          levels these titles have always used — <code className={CODE}>2</code>{" "}
          for the agent name in AgentCard, <code className={CODE}>3</code> for
          card titles like “Feedback” or “Score Timeline” — so leaving it alone
          changes nothing.
        </p>
        <p className={BODY}>
          Set it when the default would break your document outline. A card in a
          grid under an <code className={CODE}>h1</code> usually wants its
          titles a level deeper:
        </p>
        <CodeBlock
          code={`<AgentCard agentRegistry={registry} agentId={id} headingLevel={3} />
<FeedbackList agentRegistry={registry} agentId={id} headingLevel={4} />`}
        />
        <p className={BODY}>
          Accepted by AgentCard, EndpointStatus, FeedbackList, TagCloud,
          ReputationTimeline, ReputationDistribution, ValidationScore,
          ValidationList and ActivityLog.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Avatars: Labelled or Decorative</SectionHeading>
        <p className={BODY}>
          <code className={CODE}>AgentImage</code> names the agent it shows,
          because on its own the avatar is the only thing identifying it. Inside{" "}
          <code className={CODE}>AgentCard</code>, the same avatar is hidden from
          assistive tech instead — the name is already rendered right beside it,
          and announcing it twice is noise. You get the correct behaviour in both
          cases without configuring anything.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>What Is Still On You</SectionHeading>
        <p className={BODY}>
          The library controls its own markup, not your page. Three things remain
          yours:
        </p>
        <ul className="flex flex-col gap-4">
          {YOURS.map((item) => (
            <li key={item.title} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {item.title}
              </span>
              <span className={BODY}>{item.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Known Gaps</SectionHeading>
        <Callout variant="warning" title="Stated rather than left to discover">
          <div className="flex flex-col gap-3">
            <p>
              <strong className="font-medium">
                TagCloud’s least-frequent tags measure 3.63:1
              </strong>{" "}
              against the pill background, under the 4.5:1 WCAG AA wants for text
              that size. The fade is what communicates frequency; removing it
              fixes contrast but flattens the visual. Raise{" "}
              <code className={CODE}>--erc8004-muted-fg</code> in your theme if
              you need AA here.
            </p>
            <p>
              <strong className="font-medium">
                ReputationTimeline’s hover tooltip is pointer-only.
              </strong>{" "}
              The underlying readings are fully available as text, but there is
              no keyboard focus ring that walks the data points.
            </p>
          </div>
        </Callout>
      </section>
    </div>
  )
}

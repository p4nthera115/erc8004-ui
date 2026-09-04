import { RULE, Section } from "./section"

const FEATURES = [
  {
    title: "Trustless by construction",
    body: "Components accept identifiers, never display data. There is no prop that lets you put a score on screen that isn't on-chain.",
  },
  {
    title: "Two props, or none",
    body: "Pass agentRegistry and agentId, or wrap a subtree in AgentProvider once and let every component inside resolve its own identity.",
  },
  {
    title: "Queries stay small",
    body: "Each component asks for only the fields it renders — ReputationScore requests two, not the twenty FeedbackList needs.",
  },
  {
    title: "Four states, always",
    body: "Loading, error, empty and not-found are handled inside every component. An agent with no feedback renders an empty state, not a crash.",
  },
  {
    title: "Themed with CSS variables",
    body: "One block of custom properties retunes surfaces, accents, radii and the chart palette. Dark mode is a class, not a second stylesheet.",
  },
  {
    title: "Cached, not re-fetched",
    body: "TanStack Query backs every component, so duplicate queries collapse into one request and repeat renders come from cache.",
  },
]

export function Features() {
  return (
    <Section
      label="How it works"
      title="Self-contained components, not a data layer you have to learn."
      intro="There is no store to configure and no agent object to thread through your tree. Drop a component in, give it an identity, and it takes care of the rest."
    >
      <div className={`grid border-t border-l ${RULE} md:grid-cols-2 lg:grid-cols-3`}>
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={`flex flex-col gap-3 border-r border-b p-6 md:p-8 ${RULE}`}
          >
            <h3 className="text-sm">{feature.title}</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

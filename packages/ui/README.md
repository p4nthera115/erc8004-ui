# @p4n/erc8004-ui

Drop-in React components for displaying verified AI agent identity, reputation,
and validation data from the [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
standard.

You pass an agent's on-chain identifier. The component fetches and renders the
verified data itself. Components never accept display data as props, so what you
see is always what the chain says.

> **Unofficial library.** This is an independent, community-built project.
> It is not affiliated with, maintained by, or endorsed by the authors of
> ERC-8004. It renders the standard's on-chain data through public
> subgraphs; it does not speak for the standard.

Documentation: **https://erc8004-ui.vercel.app**

## Install

```bash
npm install @p4n/erc8004-ui react react-dom @tanstack/react-query
```

`react` (18 or 19), `react-dom` and `@tanstack/react-query` (v5) are peer
dependencies. If your app already has React, you only need to add
`@tanstack/react-query` — it handles caching and deduplication so several
components pointed at the same agent share one request.

## Quick start

```tsx
import { ERC8004Provider, AgentCard } from "@p4n/erc8004-ui"
import "@p4n/erc8004-ui/styles.css"

function App() {
  return (
    <ERC8004Provider apiKey="your-graph-api-key">
      <AgentCard
        agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        agentId={888}
      />
    </ERC8004Provider>
  )
}
```

Get a free Graph API key at [thegraph.com/studio](https://thegraph.com/studio/).
It's a read-only query key, safe to ship in frontend code.

`ERC8004Provider` creates a TanStack Query client if your app doesn't already
have one, and reuses yours if it does.

Rendering several components for the same agent? Wrap them in `AgentProvider` to
set the identifiers once:

```tsx
<AgentProvider agentRegistry="eip155:8453:0x8004…a432" agentId={888}>
  <AgentName />
  <ReputationScore />
  <FeedbackList />
</AgentProvider>
```

## Components

| Group | Components |
| --- | --- |
| Providers | `ERC8004Provider`, `AgentProvider` |
| Identity | `AgentName`, `AgentImage`, `AgentDescription`, `AgentCard`, `EndpointStatus`, `FingerprintBadge` |
| Reputation | `ReputationScore`, `ReputationTimeline`, `ReputationDistribution`, `FeedbackList`, `TagCloud` |
| Validation | `VerificationBadge`, `ValidationScore`, `ValidationList`, `ValidationDisplay` |
| Activity | `LastActivity`, `ActivityLog` |

Every component handles its own loading, error, empty, and not-found states.

Full docs, live previews and props tables:
**https://erc8004-ui.vercel.app/docs/introduction**

## Styling

Import `@p4n/erc8004-ui/styles.css` and you're done — it carries the design tokens
and only the utilities these components use. It deliberately does **not**
include Tailwind's preflight, so it won't reset your page; the few base rules it
does ship are scoped to the `.erc8004` wrapper the provider renders.

Every colour and radius is a CSS custom property under that same `.erc8004`
scope, so retheming the whole library is a handful of variable overrides:

```css
.erc8004 {
  --erc8004-accent: 0.55 0.25 300; /* OKLCH: lightness chroma hue */
  --erc8004-radius: 0.75rem;
}
```

Dark and light mode follow a `.dark` or `.light` class on any ancestor, or pass
one to the provider: `<ERC8004Provider apiKey="…" className="dark">`.

**Already using Tailwind v4?** Skip the stylesheet and pull the source into your
own build instead, so the utilities merge with the rest of your CSS:

```css
@import "tailwindcss";
@import "@p4n/erc8004-ui/tokens.css";
@source "../node_modules/@p4n/erc8004-ui/dist";
```

See [docs/theming](https://erc8004-ui.vercel.app/docs/theming) for the full
token list and an interactive playground.

## Accessibility

Accessible by default — there is no `a11y` prop and nothing to switch on. This
matters more than usual here, because most of what these components render
isn't text: a fingerprint is an SVG, a reputation trend is a line chart, a
verification tier is a coloured dot.

- Meaningful SVGs are `role="img"` with a label; decorative marks are
  `aria-hidden`, so nothing is announced twice.
- Nothing depends on colour alone — score bands, validation status and endpoint
  health all carry text as well.
- The charts emit their readings as visually hidden text, since the
  ReputationTimeline tooltip is pointer-driven.
- Truncated addresses and URLs expose the full value to assistive tech rather
  than hiding it in a `title`.
- Pagination and copy are real `<button>`s with labels; scrollable regions are
  focusable.
- Loading sets `aria-busy` and announces once, errors are `role="alert"`, empty
  states `role="status"`.
- `prefers-reduced-motion: reduce` disables every animation and transition, in
  both the prebuilt stylesheet and the Tailwind-source path.

Components that render their own title take `headingLevel`, defaulting to the
level they already used, so your document outline stays yours:

```tsx
<AgentCard agentRegistry={registry} agentId={id} headingLevel={3} />
```

Two known gaps are documented rather than papered over: TagCloud's faintest
tags measure 3.63:1 against the pill (AA wants 4.5:1), and the timeline tooltip
has no keyboard equivalent — though its data is fully available as text. See
[docs/accessibility](https://erc8004-ui.vercel.app/docs/accessibility).

## Server components

Every export is a client component — the bundle ships with a `"use client"`
directive, so importing it from a Next.js App Router server component works
without a wrapper file.

## Chain support

Ethereum (1), Base (8453), Polygon (137), BNB Smart Chain (56), Monad (143),
Base Sepolia (84532), BNB Chapel (97), Monad Testnet (10143).

The Validation Registry isn't deployed on any chain yet — the subgraph records
it at the zero address everywhere, testnets included — so the four validation
components render their empty state. The queries succeed; there is nothing to
return.

## For AI coding agents

The docs are published as [`/llms.txt`](https://erc8004-ui.vercel.app/llms.txt),
[`/llms-full.txt`](https://erc8004-ui.vercel.app/llms-full.txt),
[`/agents.md`](https://erc8004-ui.vercel.app/agents.md), a JSON API at
[`/api`](https://erc8004-ui.vercel.app/api), and an MCP endpoint at
[`/api/mcp`](https://erc8004-ui.vercel.app/api/mcp). A stdio MCP server with two
extra live tools is on npm as `@p4n/erc8004-ui-mcp`.

## Source

Developed at
[github.com/p4nthera115/erc8004-ui](https://github.com/p4nthera115/erc8004-ui)
(this package lives in `packages/ui`).

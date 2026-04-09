# Theming & Customization — Implementation Guide

## Context

This document specifies how theming and styling customization works across the `@erc8004/ui` component library. Follow this exactly when building any component.

This library is an **npm package** that consumers install into their own apps. That constraint drives every decision here — our styles must never leak into or conflict with the consumer's styles. We achieve this through **namespaced CSS custom properties** (scoped to `.erc8004`) and a **`className` prop** on every component (merged with `tailwind-merge` so consumer overrides reliably win).

---

## Overview: Three Layers of Customization

Consumers of this library get three levels of control, from broadest to most specific:

1. **CSS variable overrides** — retheme the entire library at once by changing a few CSS variables. Changes every component globally.
2. **`className` prop** — customize one specific component instance using standard Tailwind classes. Overrides that component's default spacing, sizing, borders, shadows, etc.
3. **`theme` prop on `ERC8004Provider`** — a JavaScript-based convenience layer for consumers who prefer not to write CSS. Sets the same CSS variables under the hood via inline styles.

These three layers compose naturally. A consumer can retheme the whole library via CSS variables, then tweak individual instances via `className`. No conflicts.

---

## Dependencies

### Required: `tailwind-merge`

Add `tailwind-merge` as a **runtime dependency** (not peer, not dev — it ships with the library):

```bash
pnpm add tailwind-merge
```

This is approximately 3KB gzipped. It is the only styling-related dependency the library adds. It resolves Tailwind class conflicts so that when a consumer passes `className="p-6"` and the component has a default `p-3`, the consumer's `p-6` wins instead of both classes fighting.

### NOT a dependency: shadcn/ui, Radix, or any UI component library

This library does not use shadcn, Radix, Headless UI, or any other component abstraction. All components are built with plain HTML elements, Tailwind classes, and the library's own CSS variable tokens. The interactive complexity (pagination buttons, scrollable lists) does not justify the dependency weight of a headless UI library. Accessibility is handled with native HTML semantics and ARIA attributes directly.

---

## File Structure

The theming system adds these files to the project:

```
src/
├── lib/
│   ├── cn.ts                    # className merge utility
│   ├── ...existing files...
├── styles/
│   └── tokens.css               # CSS variable definitions (ships with package)
├── provider/
│   └── ERC8004Provider.tsx       # wraps children in .erc8004 scope, applies theme overrides
```

The `styles/tokens.css` file must be included in the package build output so consumers can import it. The `tsup` (or Rollup) config must copy/include this CSS file. More on that in the build section below.

---

## File 1: `src/lib/cn.ts` — Class Merge Utility

This is a small helper that every component imports. It filters out falsy values (so you can do conditional classes) and runs everything through `tailwind-merge` for conflict resolution.

```ts
// src/lib/cn.ts
import { twMerge } from "tailwind-merge"

/**
 * Merges class names with Tailwind conflict resolution.
 * Consumer classes (passed via className prop) override library defaults
 * when they target the same CSS property.
 *
 * Usage inside components:
 *   cn("p-3 bg-erc8004-bg", isActive && "ring-2", className)
 */
export function cn(...inputs: (string | undefined | false | null)[]): string {
  return twMerge(inputs.filter(Boolean).join(" "))
}
```

### Why this exists

If you concatenate Tailwind classes naively (`"p-3 " + "p-6"`), both classes end up in the HTML. Which one wins depends on their order in the compiled CSS stylesheet — not their order in the `class` attribute. This is unpredictable. `tailwind-merge` understands Tailwind's class structure and removes `p-3` when `p-6` is present, because they target the same CSS property (padding).

Every component in this library uses `cn()` to merge its default classes with the consumer's `className`. This guarantees consumer overrides work reliably.

---

## File 2: `src/styles/tokens.css` — Design Tokens

This is the single source of truth for the library's visual identity. Every color, radius, and spacing token is defined here as a CSS custom property. Components never use hardcoded colors — they always reference these tokens through Tailwind utility classes.

### Naming convention

All tokens are prefixed with `--erc8004-` to avoid conflicts with the consumer's own CSS variables. They follow the shadcn convention of semantic **background / foreground pairs**: the base token (e.g., `--erc8004-card`) controls the surface color, and the `-fg` suffixed token (e.g., `--erc8004-card-fg`) controls the text/icon color that sits on that surface.

### Color format

All colors use the **OKLCH** color space, written as raw values without the `oklch()` wrapper: `0.97 0.005 260`. The `oklch()` wrapper is applied in the `@theme inline` block where Tailwind picks them up. This follows the same pattern shadcn uses (they store raw values, then wrap in the utility layer).

OKLCH was chosen over HSL because it is perceptually uniform — two colors with the same lightness value in OKLCH actually look equally bright to the human eye, which makes the theming system more predictable when consumers swap colors. It is also what shadcn has moved to in its latest version.

### Scoping

All variables are defined under the `.erc8004` selector, NOT `:root`. This is critical. The `ERC8004Provider` renders a wrapper `<div className="erc8004">`, which means these variables only exist inside the library's components. They cannot leak into or conflict with the consumer's app.

### The file

```css
/* src/styles/tokens.css */

/*
 * ERC-8004 UI — Design Tokens
 *
 * All component styling flows through these CSS custom properties.
 * Override them under the .erc8004 selector to retheme the entire library.
 *
 * Example (in your app's CSS):
 *   .erc8004 {
 *     --erc8004-accent: 0.55 0.2 260;
 *   }
 *
 * Colors are raw OKLCH values (lightness, chroma, hue).
 * The oklch() wrapper is applied in the @theme block below.
 */

/* ============================================
   Light theme (default)
   ============================================ */
.erc8004 {
  /* --- Base surfaces --- */
  --erc8004-bg: 1 0 0; /* page/component background — white */
  --erc8004-fg: 0.145 0 0; /* default text — near-black */

  /* --- Card / elevated surfaces --- */
  --erc8004-card: 1 0 0; /* card background */
  --erc8004-card-fg: 0.145 0 0; /* card text */

  /* --- Muted / subdued content --- */
  --erc8004-muted: 0.97 0 0; /* subtle background (empty states, secondary surfaces) */
  --erc8004-muted-fg: 0.556 0 0; /* secondary text (descriptions, timestamps, helper text) */

  /* --- Accent / brand color --- */
  --erc8004-accent: 0.55 0.2 260; /* primary accent — blue */
  --erc8004-accent-fg: 0.985 0 0; /* text on accent surfaces — white */

  /* --- Semantic: positive/negative --- */
  --erc8004-positive: 0.55 0.17 145; /* success, positive scores — green */
  --erc8004-positive-fg: 0.985 0 0; /* text on positive surfaces */
  --erc8004-negative: 0.55 0.2 25; /* error, negative scores — red */
  --erc8004-negative-fg: 0.985 0 0; /* text on negative surfaces */

  /* --- Borders & dividers --- */
  --erc8004-border: 0.922 0 0; /* default border color */

  /* --- Focus rings --- */
  --erc8004-ring: 0.55 0.2 260; /* focus ring color — matches accent */

  /* --- Chart palette (for ReputationChart, etc.) --- */
  --erc8004-chart-1: 0.55 0.2 260; /* blue */
  --erc8004-chart-2: 0.6 0.18 145; /* green */
  --erc8004-chart-3: 0.6 0.2 25; /* red-orange */
  --erc8004-chart-4: 0.65 0.2 310; /* purple */
  --erc8004-chart-5: 0.7 0.15 70; /* gold */

  /* --- Radius scale --- */
  --erc8004-radius: 0.5rem; /* base radius — all others derive from this */
}

/* ============================================
   Dark theme
   Activated when .erc8004 is inside a .dark ancestor,
   OR when .erc8004 itself has the .dark class.
   ============================================ */
.dark .erc8004,
.erc8004.dark {
  --erc8004-bg: 0.145 0 0;
  --erc8004-fg: 0.985 0 0;

  --erc8004-card: 0.205 0 0;
  --erc8004-card-fg: 0.985 0 0;

  --erc8004-muted: 0.269 0 0;
  --erc8004-muted-fg: 0.708 0 0;

  --erc8004-accent: 0.6 0.2 260;
  --erc8004-accent-fg: 0.985 0 0;

  --erc8004-positive: 0.6 0.17 145;
  --erc8004-positive-fg: 0.985 0 0;
  --erc8004-negative: 0.6 0.2 25;
  --erc8004-negative-fg: 0.985 0 0;

  --erc8004-border: 0.3 0 0;

  --erc8004-ring: 0.6 0.2 260;

  --erc8004-chart-1: 0.6 0.2 260;
  --erc8004-chart-2: 0.65 0.18 145;
  --erc8004-chart-3: 0.65 0.2 25;
  --erc8004-chart-4: 0.7 0.2 310;
  --erc8004-chart-5: 0.75 0.15 70;
}

/* ============================================
   Tailwind v4 theme registration
   Maps CSS variables → Tailwind utility classes.
   After this block, classes like bg-erc8004-bg,
   text-erc8004-fg, border-erc8004-border, etc. work.
   ============================================ */
@theme inline {
  /* Surfaces */
  --color-erc8004-bg: oklch(var(--erc8004-bg));
  --color-erc8004-fg: oklch(var(--erc8004-fg));
  --color-erc8004-card: oklch(var(--erc8004-card));
  --color-erc8004-card-fg: oklch(var(--erc8004-card-fg));
  --color-erc8004-muted: oklch(var(--erc8004-muted));
  --color-erc8004-muted-fg: oklch(var(--erc8004-muted-fg));

  /* Accent */
  --color-erc8004-accent: oklch(var(--erc8004-accent));
  --color-erc8004-accent-fg: oklch(var(--erc8004-accent-fg));

  /* Semantic */
  --color-erc8004-positive: oklch(var(--erc8004-positive));
  --color-erc8004-positive-fg: oklch(var(--erc8004-positive-fg));
  --color-erc8004-negative: oklch(var(--erc8004-negative));
  --color-erc8004-negative-fg: oklch(var(--erc8004-negative-fg));

  /* Borders */
  --color-erc8004-border: oklch(var(--erc8004-border));

  /* Focus rings */
  --color-erc8004-ring: oklch(var(--erc8004-ring));

  /* Chart palette */
  --color-erc8004-chart-1: oklch(var(--erc8004-chart-1));
  --color-erc8004-chart-2: oklch(var(--erc8004-chart-2));
  --color-erc8004-chart-3: oklch(var(--erc8004-chart-3));
  --color-erc8004-chart-4: oklch(var(--erc8004-chart-4));
  --color-erc8004-chart-5: oklch(var(--erc8004-chart-5));

  /* Radius scale (derived from base) */
  --radius-erc8004-sm: calc(var(--erc8004-radius) * 0.6);
  --radius-erc8004-md: calc(var(--erc8004-radius) * 0.8);
  --radius-erc8004-lg: var(--erc8004-radius);
  --radius-erc8004-xl: calc(var(--erc8004-radius) * 1.4);
  --radius-erc8004-2xl: calc(var(--erc8004-radius) * 1.8);
}
```

### Token reference table

When building components, use these Tailwind classes:

| Purpose                 | Background class        | Text class               | Notes                                                           |
| ----------------------- | ----------------------- | ------------------------ | --------------------------------------------------------------- |
| Default surface         | `bg-erc8004-bg`         | `text-erc8004-fg`        | The base — most components use this                             |
| Card / elevated surface | `bg-erc8004-card`       | `text-erc8004-card-fg`   | AgentCard, composed views, panels                               |
| Secondary text          | —                       | `text-erc8004-muted-fg`  | Timestamps, descriptions, helper text                           |
| Subtle background       | `bg-erc8004-muted`      | `text-erc8004-muted-fg`  | Tag pills, empty states, skeletons                              |
| Brand / primary action  | `bg-erc8004-accent`     | `text-erc8004-accent-fg` | Active states, primary badges                                   |
| Accent as text color    | —                       | `text-erc8004-accent`    | Links, score highlights, interactive text                       |
| Positive score          | `bg-erc8004-positive`   | `text-erc8004-positive`  | Positive feedback values, success states                        |
| Negative score          | `bg-erc8004-negative`   | `text-erc8004-negative`  | Negative feedback values, error states                          |
| Borders                 | `border-erc8004-border` | —                        | All borders and dividers                                        |
| Focus ring              | `ring-erc8004-ring`     | —                        | Focus states on interactive elements                            |
| Corner radius (default) | `rounded-erc8004-lg`    | —                        | The "base" radius. Use `-sm`, `-md`, `-xl`, `-2xl` for variants |

### Rules for using tokens in components

1. **Never hardcode a color.** No `bg-blue-500`, no `text-gray-400`, no `border-slate-200`. Always use a token class like `bg-erc8004-accent` or `text-erc8004-muted-fg`. If you need a color that doesn't exist in the token list, add a new token — don't use a raw Tailwind color.

2. **Never hardcode a border radius.** Use `rounded-erc8004-lg` (or `-sm`, `-md`, `-xl`, `-2xl`). This ensures the consumer can change the radius scale globally by overriding `--erc8004-radius`.

3. **Spacing, sizing, and layout classes are fine as hardcoded Tailwind.** Things like `p-3`, `gap-2`, `w-full`, `flex`, `grid` — these are structural and not part of the theming system. Consumers override these per-instance via `className` if needed.

4. **Opacity modifiers are fine.** `bg-erc8004-accent/10` (10% opacity accent) is a valid pattern for subtle hover backgrounds.

---

## File 3: `src/provider/ERC8004Provider.tsx` — Theming Integration

The provider has two theming responsibilities:

1. Render a wrapper `<div>` with the `erc8004` class, which activates the CSS variable scope.
2. Accept an optional `theme` prop and convert it to inline CSS variable overrides on that wrapper div.

### Theme prop type

```ts
// Add to src/types.ts

/**
 * Optional theme overrides passed to ERC8004Provider.
 * Each value is a raw OKLCH color string: "lightness chroma hue"
 * Example: { accent: "0.55 0.25 300" } → purple accent
 */
export interface ERC8004Theme {
  bg?: string
  fg?: string
  card?: string
  cardFg?: string
  muted?: string
  mutedFg?: string
  accent?: string
  accentFg?: string
  positive?: string
  positiveFg?: string
  negative?: string
  negativeFg?: string
  border?: string
  ring?: string
  radius?: string // CSS length, e.g. "0.75rem" or "8px"
}
```

### Provider implementation

```tsx
// src/provider/ERC8004Provider.tsx
import { createContext, useContext, useMemo } from "react"
import type { ERC8004Theme } from "../types"

interface ERC8004Config {
  apiKey: string
  subgraphOverrides?: Record<number, string>
}

const ERC8004Context = createContext<ERC8004Config | null>(null)

export function useERC8004() {
  const ctx = useContext(ERC8004Context)
  if (!ctx) {
    throw new Error(
      "ERC8004 components must be wrapped in <ERC8004Provider>. " +
        "See: https://docs.erc8004.ui/setup"
    )
  }
  return ctx
}

interface ERC8004ProviderProps {
  apiKey: string
  subgraphOverrides?: Record<number, string>
  theme?: ERC8004Theme
  children: React.ReactNode
}

/**
 * Maps camelCase theme keys to their CSS custom property names.
 * Example: { accent: "0.55 0.2 300" } → { "--erc8004-accent": "0.55 0.2 300" }
 */
const THEME_KEY_MAP: Record<keyof ERC8004Theme, string> = {
  bg: "--erc8004-bg",
  fg: "--erc8004-fg",
  card: "--erc8004-card",
  cardFg: "--erc8004-card-fg",
  muted: "--erc8004-muted",
  mutedFg: "--erc8004-muted-fg",
  accent: "--erc8004-accent",
  accentFg: "--erc8004-accent-fg",
  positive: "--erc8004-positive",
  positiveFg: "--erc8004-positive-fg",
  negative: "--erc8004-negative",
  negativeFg: "--erc8004-negative-fg",
  border: "--erc8004-border",
  ring: "--erc8004-ring",
  radius: "--erc8004-radius",
}

function themeToStyleOverrides(
  theme: ERC8004Theme | undefined
): React.CSSProperties | undefined {
  if (!theme) return undefined

  const styles: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      const cssVar = THEME_KEY_MAP[key as keyof ERC8004Theme]
      if (cssVar) styles[cssVar] = value
    }
  }

  return Object.keys(styles).length > 0
    ? (styles as unknown as React.CSSProperties)
    : undefined
}

export function ERC8004Provider({
  apiKey,
  subgraphOverrides,
  theme,
  children,
}: ERC8004ProviderProps) {
  const config = useMemo(
    () => ({ apiKey, subgraphOverrides }),
    [apiKey, subgraphOverrides]
  )

  const styleOverrides = useMemo(() => themeToStyleOverrides(theme), [theme])

  return (
    <ERC8004Context.Provider value={config}>
      <div className="erc8004" style={styleOverrides}>
        {children}
      </div>
    </ERC8004Context.Provider>
  )
}
```

### How `theme` prop overrides work

The provider renders `<div className="erc8004" style={{ "--erc8004-accent": "0.55 0.25 300" }}>`. Inline styles on an element have higher specificity than class-based styles, so the inline `--erc8004-accent` value overrides the one defined in `tokens.css` under `.erc8004`. All components inside the provider that use `bg-erc8004-accent` automatically pick up the new value.

This is a convenience for consumers who don't want to write CSS. It produces the same result as overriding the variables in a stylesheet.

---

## How Every Component Uses the System

Every component in the library MUST follow this pattern:

### 1. Accept `className` as an optional prop

```ts
interface ReputationScoreProps {
  agentRegistry: string
  agentId: number
  className?: string // <-- always include this
}
```

### 2. Import and use `cn()` on the outermost element

```tsx
import { cn } from "../../lib/cn"

export function ReputationScore({
  agentRegistry,
  agentId,
  className,
}: ReputationScoreProps) {
  // ... data fetching ...

  return (
    <div
      className={cn(
        // Library defaults first:
        "flex items-center gap-2 rounded-erc8004-lg border border-erc8004-border bg-erc8004-card p-3",
        // Consumer override last (wins on conflict):
        className
      )}
    >
      {/* inner content */}
    </div>
  )
}
```

### 3. Use ONLY token classes for colors and radius

```tsx
// CORRECT — uses tokens
<span className="text-erc8004-muted-fg text-sm">3 days ago</span>
<div className="bg-erc8004-muted rounded-erc8004-sm px-2 py-0.5">tag</div>
<div className="border-b border-erc8004-border" />

// WRONG — hardcoded colors
<span className="text-gray-500 text-sm">3 days ago</span>
<div className="bg-gray-100 rounded-md px-2 py-0.5">tag</div>
<div className="border-b border-gray-200" />
```

### 4. Use hardcoded Tailwind for layout and spacing (this is fine)

```tsx
// These are structural, not thematic — no need for tokens
<div className="flex items-center gap-2 p-3">
<div className="grid grid-cols-2 gap-4">
<span className="text-sm font-medium">
<div className="w-full max-w-md">
```

### 5. Apply `cn()` ONLY to the outermost element

The `className` prop only targets the root wrapper. Inner elements use regular static Tailwind classes. Do NOT pass `className` down to inner elements or use `cn()` on them — it adds complexity and the consumer doesn't need that granularity for v1.

```tsx
// CORRECT
export function ReputationScore({ className, ...props }) {
  return (
    <div className={cn("flex items-center gap-2 p-3 ...", className)}>
      {/* inner elements use plain classes, no cn() */}
      <span className="text-erc8004-fg font-semibold text-lg">{score}</span>
      <span className="text-erc8004-muted-fg text-sm">{count} reviews</span>
    </div>
  )
}

// WRONG — don't use cn() on inner elements
export function ReputationScore({ className, ...props }) {
  return (
    <div className={cn("...", className)}>
      <span className={cn("...", className)}>{score}</span> // NO
    </div>
  )
}
```

---

## Loading, Error, and Empty States

These states are part of the theming system too. They must use the token classes so they look consistent with the rest of the component and respond to theme changes.

### Loading skeleton

```tsx
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-24 rounded-erc8004-sm bg-erc8004-muted" />
      <div className="h-3 w-16 rounded-erc8004-sm bg-erc8004-muted" />
    </div>
  )
}
```

### Error state

```tsx
function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="text-sm text-erc8004-negative">
      Failed to load data.{" "}
      <button
        onClick={retry}
        className="underline hover:text-erc8004-negative/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring"
      >
        Retry
      </button>
    </div>
  )
}
```

### Empty state

```tsx
function EmptyState({ message }: { message: string }) {
  return <div className="text-sm text-erc8004-muted-fg">{message}</div>
}
```

These are inline to each component (not shared components). Each component defines its own loading/error/empty state that makes visual sense for its layout.

---

## Accessibility Requirements

Since we're not using Radix or shadcn, we handle accessibility directly. The requirements for this library are minimal because almost all components are read-only displays.

### Interactive elements (pagination buttons, retry buttons)

```tsx
<button
  onClick={handleNextPage}
  disabled={!hasNextPage}
  aria-label="Next page"
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
```

Rules:

- Always use native `<button>` elements (not `<div onClick>`). They are keyboard-accessible by default.
- Always include `aria-label` when the button text is not self-explanatory (e.g., an icon-only button).
- Always use `focus-visible` (not `focus`) for focus rings — `focus-visible` only shows the ring for keyboard navigation, not mouse clicks.
- Always use `ring-erc8004-ring` for focus ring color so it follows the theme.
- Always include `disabled` styling when applicable.

### Loading states

```tsx
<div aria-busy="true" aria-live="polite">
  <LoadingSkeleton />
</div>
```

- `aria-busy="true"` tells screen readers the content is loading.
- `aria-live="polite"` means the screen reader will announce when the content changes (i.e., when loading finishes) without interrupting whatever it's currently saying.

### Lists (FeedbackList, ValidationList)

Use native HTML list elements:

```tsx
<ul role="list" className="divide-y divide-erc8004-border">
  {items.map((item) => (
    <li key={item.id} className="py-3">
      {/* item content */}
    </li>
  ))}
</ul>
```

### Truncated addresses

Use the `title` attribute for hover-to-reveal of the full address:

```tsx
<span title={fullAddress} className="text-erc8004-muted-fg">
  {truncateAddress(fullAddress)}
</span>
```

This works for mouse users (tooltip on hover) and screen readers (reads the full address from `title`). If fancier tooltips are needed later, `@radix-ui/react-tooltip` can be added as a single targeted dependency — but `title` is sufficient for v1.

---

## Build Configuration: Shipping CSS with the Package

The `tokens.css` file must be included in the package output so consumers can import it. There are two approaches — pick one:

### Approach A: Consumer imports the CSS file (explicit)

The consumer adds one import to their app:

```tsx
// In the consumer's app entry point
import "@erc8004/ui/styles.css"
```

This is the most common pattern for component libraries. It gives the consumer control over CSS load order.

In `tsup.config.ts`, ensure CSS is copied to the output:

```ts
// tsup.config.ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "@tanstack/react-query"],
  // Copy the tokens CSS to the output directory
  onSuccess: "cp src/styles/tokens.css dist/styles.css",
})
```

In `package.json`, expose the CSS file:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  }
}
```

### Approach B: Inject CSS at the top of the JS bundle (automatic)

No separate import needed — the CSS is injected when the library is imported:

```ts
// At the top of src/index.ts
import "./styles/tokens.css"
```

With `tsup`, set `injectStyle: true` or handle CSS injection. This is more convenient for the consumer but less flexible — they can't control CSS load order or split the CSS into a separate request.

### Recommendation

Go with **Approach A** (explicit import). It is the industry standard, gives consumers more control, and is what shadcn, Radix Themes, and most other libraries do. The setup instructions in the library's README will tell consumers to add the import.

---

## Consumer Documentation: Setup and Customization

This is what goes in the library's README and docs site. Write it exactly like this — it's the developer-facing documentation.

### Basic Setup

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ERC8004Provider, ReputationScore } from "@erc8004/ui"
import "@erc8004/ui/styles.css"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey="your-graph-api-key">
        <ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />
      </ERC8004Provider>
    </QueryClientProvider>
  )
}
```

### Customizing Individual Components

Every component accepts a `className` prop for Tailwind overrides:

```tsx
<ReputationScore
  agentRegistry="eip155:1:0x742..."
  agentId={374}
  className="shadow-lg rounded-2xl p-6"
/>
```

Your classes override the component's defaults when they target the same property. For example, `p-6` replaces the default `p-3`, and `rounded-2xl` replaces the default corner radius.

### Theming the Entire Library (CSS)

Override the CSS variables in your own stylesheet. This changes every component at once:

```css
/* your-app.css */
.erc8004 {
  --erc8004-accent: 0.55 0.25 300; /* purple accent instead of blue */
  --erc8004-radius: 0.75rem; /* rounder corners */
}
```

### Dark Mode

The library automatically adapts to dark mode when its components are inside an ancestor with the `.dark` class — which is the standard Tailwind dark mode pattern.

```html
<!-- Dark mode: add .dark to body or a parent element -->
<body class="dark">
  <ERC8004Provider apiKey="...">
    <!-- Components automatically use dark theme tokens -->
  </ERC8004Provider>
</body>
```

To override specific dark mode colors:

```css
.dark .erc8004 {
  --erc8004-accent: 0.7 0.2 260; /* brighter blue in dark mode */
}
```

### Theming via Provider (JavaScript)

For consumers who prefer not to write CSS, pass a `theme` prop:

```tsx
<ERC8004Provider
  apiKey="your-graph-api-key"
  theme={{
    accent: "0.55 0.25 300",   // purple
    radius: "0.75rem",          // rounder corners
  }}
>
```

This sets the same CSS variables via inline styles. It produces the same result as the CSS approach.

### Token Reference

| Token               | CSS Variable            | What it controls                                |
| ------------------- | ----------------------- | ----------------------------------------------- |
| Background          | `--erc8004-bg`          | Default component background                    |
| Foreground          | `--erc8004-fg`          | Default text color                              |
| Card                | `--erc8004-card`        | Elevated surface background                     |
| Card foreground     | `--erc8004-card-fg`     | Text on elevated surfaces                       |
| Muted               | `--erc8004-muted`       | Subtle / secondary backgrounds                  |
| Muted foreground    | `--erc8004-muted-fg`    | Secondary text (timestamps, descriptions)       |
| Accent              | `--erc8004-accent`      | Brand / primary action color                    |
| Accent foreground   | `--erc8004-accent-fg`   | Text on accent surfaces                         |
| Positive            | `--erc8004-positive`    | Positive scores, success states                 |
| Positive foreground | `--erc8004-positive-fg` | Text on positive surfaces                       |
| Negative            | `--erc8004-negative`    | Negative scores, error states                   |
| Negative foreground | `--erc8004-negative-fg` | Text on negative surfaces                       |
| Border              | `--erc8004-border`      | All borders and dividers                        |
| Ring                | `--erc8004-ring`        | Focus ring color                                |
| Chart 1-5           | `--erc8004-chart-{1-5}` | Chart color palette                             |
| Radius              | `--erc8004-radius`      | Base corner radius (all sizes derive from this) |

All color values are raw OKLCH: `lightness chroma hue` (e.g., `0.55 0.2 260`).

---

## Checklist: Before Building Any Component

Before writing a new component, verify:

- [ ] It accepts `className?: string` as an optional prop
- [ ] The outermost element uses `cn("...defaults...", className)`
- [ ] All colors use `erc8004-*` token classes (no hardcoded Tailwind colors)
- [ ] All border-radius uses `rounded-erc8004-*` classes
- [ ] Loading state uses `bg-erc8004-muted` for skeleton bars and `aria-busy="true"`
- [ ] Error state uses `text-erc8004-negative` and a retry button
- [ ] Interactive elements have `focus-visible:ring-2 ring-erc8004-ring`
- [ ] Buttons use native `<button>` elements with `aria-label` where needed
- [ ] Lists use `<ul>`/`<li>` with `role="list"` / `role="listitem"`
- [ ] Truncated text uses `title` attribute for full value
- [ ] No inner elements use `cn()` — only the outermost wrapper

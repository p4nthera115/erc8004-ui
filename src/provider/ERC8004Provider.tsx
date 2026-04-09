import { createContext, useContext, useState, useMemo, type ReactNode } from "react"
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query"
import type { ERC8004Theme } from "../types"

// ─── Config Context ──────────────────────────────────────────────
// This is the "config bag" that every hook in the library reads from.
// It holds the developer's Graph API key and any custom subgraph URLs.
// It does NOT hold agent data — each hook fetches its own data.

interface ERC8004Config {
  apiKey: string
  subgraphOverrides?: Record<number, string>
}

const ERC8004Context = createContext<ERC8004Config | null>(null)

/**
 * Hook used internally by every data hook (useAgent, useReputation, etc.)
 * to read the API key and subgraph config. Not intended for external use.
 *
 * Throws a clear error if the developer forgot to add <ERC8004Provider>.
 */
export function useERC8004Config(): ERC8004Config {
  const ctx = useContext(ERC8004Context)
  if (!ctx) {
    throw new Error(
      "useERC8004Config must be used within <ERC8004Provider>. " +
        "Wrap your app (or the part that uses @erc8004/ui components) " +
        'in <ERC8004Provider apiKey="your-graph-api-key">.'
    )
  }
  return ctx
}

// ─── Theme Utilities ─────────────────────────────────────────────

/**
 * Maps camelCase theme keys to their CSS custom property names.
 * Example: { accent: "0.55 0.2 300" } → { "--erc8004-accent": "0.55 0.2 300" }
 */
const THEME_KEY_MAP: Record<keyof ERC8004Theme, string> = {
  bg:         "--erc8004-bg",
  fg:         "--erc8004-fg",
  card:       "--erc8004-card",
  cardFg:     "--erc8004-card-fg",
  muted:      "--erc8004-muted",
  mutedFg:    "--erc8004-muted-fg",
  accent:     "--erc8004-accent",
  accentFg:   "--erc8004-accent-fg",
  positive:   "--erc8004-positive",
  positiveFg: "--erc8004-positive-fg",
  negative:   "--erc8004-negative",
  negativeFg: "--erc8004-negative-fg",
  border:     "--erc8004-border",
  ring:       "--erc8004-ring",
  radius:     "--erc8004-radius",
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

// ─── QueryClient Auto-Detection ──────────────────────────────────
// This is the key pattern that makes the library "just work" whether
// or not the developer has TanStack Query set up in their app.
//
// How it works:
//   1. We render a tiny inner component that tries to grab the
//      existing QueryClient from the React tree above it.
//   2. If one exists → great, we use it. The developer already has
//      TanStack Query set up, and our hooks will share their cache.
//   3. If none exists → we create our own QueryClient internally
//      and wrap the children in a QueryClientProvider. The developer
//      never needs to know TanStack Query is involved.
//
// Why not just always create our own?
//   If the developer DOES have TanStack Query, we'd end up with two
//   separate caches. Our components couldn't share cached data with
//   theirs, deduplication would break, and React Query Devtools would
//   only see one of the two clients. That's confusing and wasteful.

/**
 * Inner component that detects whether a QueryClientProvider already
 * exists in the React tree. If not, it creates and provides one.
 *
 * We have to do this detection inside a component (not at module level)
 * because React hooks can only run inside components.
 */
function QueryClientGate({ children }: { children: ReactNode }) {
  // Try to grab an existing QueryClient from the tree above us.
  // In TanStack Query v5, useQueryClient() throws an error if no
  // QueryClientProvider exists above it. We catch that error to
  // detect the "no provider" case.
  let hasExistingClient = false
  try {
    useQueryClient()
    // If we get here without throwing, a QueryClient exists above us
    hasExistingClient = true
  } catch {
    // No QueryClientProvider found — we'll create our own
  }

  // Create a fallback QueryClient that lives for the lifetime of this
  // component. useState with an initializer function ensures we only
  // create ONE instance, even if the component re-renders many times.
  //
  // The config here sets sensible defaults for blockchain data:
  //   - staleTime (5 min): data is considered "fresh" for 5 minutes.
  //     During this time, TanStack Query won't refetch even if the
  //     component re-mounts. Good for on-chain data that doesn't
  //     change every second.
  //   - gcTime (30 min): "garbage collection time" — how long unused
  //     data stays in cache after the last component using it unmounts.
  //     If the user navigates away and comes back within 30 min,
  //     they see the cached data instantly (while a background refetch
  //     happens if it's stale).
  const [fallbackClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 2, // retry failed requests twice
            refetchOnWindowFocus: false, // don't spam the Subgraph
          },
        },
      })
  )

  // If the developer already has TanStack Query set up, just pass
  // children through — don't wrap in another provider.
  if (hasExistingClient) {
    return <>{children}</>
  }

  // Otherwise, wrap children in our own QueryClientProvider so the
  // hooks have a cache to work with.
  return (
    <QueryClientProvider client={fallbackClient}>
      {children}
    </QueryClientProvider>
  )
}

// ─── Public Provider ─────────────────────────────────────────────

interface ERC8004ProviderProps {
  /** Your API key for The Graph. Required for all Subgraph queries.
   *  This is a read-only key used for usage tracking — safe in frontend code. */
  apiKey: string

  /** Optional: override the default Subgraph URL for specific chains.
   *  Key is the chain ID (e.g., 1 for Ethereum, 8453 for Base).
   *  Value is the full Subgraph URL including your API key. */
  subgraphOverrides?: Record<number, string>

  /** Optional: JavaScript-based theme overrides. Sets CSS variables via inline
   *  styles on the .erc8004 wrapper. Equivalent to overriding variables in CSS.
   *  Each color value is a raw OKLCH string: "lightness chroma hue" */
  theme?: ERC8004Theme

  children: ReactNode
}

/**
 * Top-level provider for @erc8004/ui components.
 *
 * This is the only setup the developer needs. It handles:
 *   1. Storing the Graph API key so every hook can access it
 *   2. Auto-detecting TanStack Query (creates a QueryClient if needed)
 *   3. Wrapping children in the .erc8004 CSS scope for design tokens
 *   4. Applying optional theme overrides via inline CSS variables
 *
 * Usage (minimal — no TanStack Query knowledge needed):
 * ```tsx
 * <ERC8004Provider apiKey="your-graph-api-key">
 *   <ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />
 * </ERC8004Provider>
 * ```
 *
 * Usage (with theme overrides):
 * ```tsx
 * <ERC8004Provider apiKey="your-graph-api-key" theme={{ accent: "0.55 0.25 300" }}>
 *   <ReputationScore agentRegistry="eip155:1:0x742..." agentId={374} />
 * </ERC8004Provider>
 * ```
 */
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

  const styleOverrides = useMemo(
    () => themeToStyleOverrides(theme),
    [theme]
  )

  return (
    <ERC8004Context.Provider value={config}>
      <QueryClientGate>
        <div className="erc8004" style={styleOverrides}>
          {children}
        </div>
      </QueryClientGate>
    </ERC8004Context.Provider>
  )
}

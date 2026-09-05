import { cn } from "../../lib/cn"

/**
 * FNV-1a over the agent's identity. Deterministic, so an agent keeps the same
 * avatar colour across every page, every component, and every reload.
 */
function hashIdentity(agentRegistry: string, agentId: number): number {
  const key = `${agentRegistry.toLowerCase()}-${agentId.toString()}`

  let n = 2166136261
  for (let i = 0; i < key.length; i++) {
    n ^= key.charCodeAt(i)
    n = Math.imul(n, 16777619) >>> 0
  }
  return n
}

/**
 * Fixed OKLCH lightness and chroma across the palette, so every avatar reads
 * with the same weight and carries light text at large-text contrast — in both
 * themes, since the colour deliberately does not follow the theme.
 */
const AVATAR_HUES = [15, 45, 75, 110, 150, 185, 215, 250, 285, 320]

/** Deterministic avatar background for an agent. */
export function avatarColor(agentRegistry: string, agentId: number): string {
  const hue =
    AVATAR_HUES[hashIdentity(agentRegistry, agentId) % AVATAR_HUES.length]
  return `oklch(0.55 0.15 ${hue})`
}

/**
 * Initials for an agent name: both leading letters when the name has two or
 * more words, otherwise a single letter. Returns null when the name carries
 * nothing usable — callers fall back to the FingerprintBadge there.
 */
export function agentInitials(name: string | null | undefined): string | null {
  if (!name) return null

  const words = name
    .trim()
    .split(/[\s_/|·—–-]+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter((word) => /^\p{L}/u.test(word))

  if (words.length === 0) return null

  return words
    .slice(0, 2)
    .map((word) => [...word][0])
    .join("")
    .toUpperCase()
}

export interface AgentAvatarProps {
  agentRegistry: string
  agentId: number
  /** Initials to render — from `agentInitials(name)`. */
  initials: string
  /** Rendered size in pixels; drives the letter size. */
  size: number
  className?: string
}

/** Initials avatar shown when an agent has a name but no registered image. */
export function AgentAvatar({
  agentRegistry,
  agentId,
  initials,
  size,
  className,
}: AgentAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-full w-full select-none items-center justify-center font-medium leading-none",
        className
      )}
      style={{
        backgroundColor: avatarColor(agentRegistry, agentId),
        color: "oklch(0.985 0 0)",
        fontSize: Math.round(size * (initials.length > 1 ? 0.34 : 0.42)),
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  )
}

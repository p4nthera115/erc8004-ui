import { useState } from "react"
import { cn } from "../../lib/cn"
import { FingerprintBadge } from "./FingerprintBadge"

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
function avatarColor(agentRegistry: string, agentId: number): string {
  const hue =
    AVATAR_HUES[hashIdentity(agentRegistry, agentId) % AVATAR_HUES.length]
  return `oklch(0.55 0.15 ${hue})`
}

/**
 * Initials for an agent name: both leading letters when the name has two or
 * more words, otherwise a single letter. Null when the name carries nothing
 * usable — the fingerprint covers that case.
 */
function agentInitials(name: string | null | undefined): string | null {
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

/** Registered image URIs are IPFS, HTTPS, or base64 data URIs. */
function resolveImageUrl(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/")
  }
  return uri
}

export interface AgentAvatarProps {
  agentRegistry: string
  agentId: number
  /** The agent's registered name, if it has one. Drives the initials. */
  name: string | null | undefined
  /** The agent's registered image URI, if it has one. */
  image: string | null | undefined
  /** Rendered size in pixels; drives the letter size and fingerprint size. */
  size: number
  /**
   * Hide the avatar from assistive tech. Set this when the caller already
   * renders the agent's name next to it — AgentCard and IdentityDisplay both
   * do — so the name isn't announced twice. Standalone AgentImage leaves it
   * off, since the avatar is then the only thing identifying the agent.
   */
  decorative?: boolean
  className?: string
}

/**
 * The agent's visual identity, in descending order of fidelity: the registered
 * image, the initials of the registered name on a colour derived from the
 * agent's identity, then the deterministic fingerprint.
 *
 * A registered image that fails to load — a dead host, an unreachable IPFS
 * gateway, a 404 — falls through to the same chain rather than leaving the
 * browser's broken-image glyph in the card. Tracking the URL that failed
 * (rather than a boolean) means a later image resets the state on its own.
 */
export function AgentAvatar({
  agentRegistry,
  agentId,
  name,
  image,
  size,
  decorative = false,
  className,
}: AgentAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  const imageUrl = image ? resolveImageUrl(image) : null
  const alt = name ?? `Agent #${agentId}`

  // One shape for all three branches: either the avatar names the agent, or
  // it drops out of the accessibility tree entirely. Never an unlabelled node.
  const labelProps = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": alt } as const)

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <img
        src={imageUrl}
        alt={decorative ? "" : alt}
        // Intrinsic dimensions so the browser reserves the box before the
        // image lands; a grid of avatars otherwise reflows as each resolves.
        width={size}
        height={size}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
        onError={() => setFailedUrl(imageUrl)}
      />
    )
  }

  const initials = agentInitials(name)

  if (!initials) {
    return (
      // The badge is the agent's only visual identity in this branch, so the
      // wrapper carries the label — the bare <svg> underneath has none.
      <span {...labelProps} className="block h-full w-full">
        {/* No className here: FingerprintBadge defaults it to "w-full h-full",
            which is what fills the caller's frame. */}
        <FingerprintBadge
          agentRegistry={agentRegistry}
          agentId={agentId}
          size={size}
        />
      </span>
    )
  }

  return (
    <div
      {...labelProps}
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

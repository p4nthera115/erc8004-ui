import { useState, useCallback } from "react"
import { cn } from "../../lib/cn"
import { truncateAddress } from "../../lib/utils"

interface AddressProps {
  address: string
  copyable?: boolean
  className?: string
}

/**
 * A blockchain address, shortened for display.
 *
 * The visible text is truncated, so the full address lives in an `aria-label`
 * (copyable) or an `sr-only` span (static) rather than only in `title` — a
 * native tooltip is a mouse affordance and reaches neither keyboard nor
 * assistive tech.
 *
 * When `copyable`, this is a real `<button>`: the previous `<span onClick>`
 * could not be tabbed to or activated from the keyboard at all.
 */
export function Address({ address, copyable, className }: AddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [address])

  if (!copyable) {
    return (
      <span className={cn("font-mono text-xs text-erc8004-muted-fg", className)}>
        <span aria-hidden="true" title={address}>
          {truncateAddress(address)}
        </span>
        <span className="sr-only">{address}</span>
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy address ${address}`}
        title={address}
        className={cn(
          "font-mono text-xs text-erc8004-muted-fg cursor-pointer hover:text-erc8004-card-fg",
          "rounded-erc8004-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring",
          className
        )}
      >
        <span aria-hidden="true">
          {copied ? "Copied" : truncateAddress(address)}
        </span>
      </button>
      {/* Sibling rather than a child: the button's name comes from its
          aria-label, and a live region nested under that is unreliable.
          Kept mounted and emptied between copies — a region added to the DOM
          at the same moment its text appears is usually missed. It is
          absolutely positioned, so it takes no space in either layout. */}
      <span className="sr-only" role="status">
        {copied ? "Address copied to clipboard" : ""}
      </span>
    </>
  )
}

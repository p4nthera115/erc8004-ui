import { useState, useCallback } from "react"
import { cn } from "@/lib/cn"
import { truncateAddress } from "@/lib/utils"

interface AddressProps {
  address: string
  copyable?: boolean
  className?: string
}

export function Address({ address, copyable, className }: AddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!copyable) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [address, copyable])

  return (
    <span
      className={cn(
        "font-mono text-xs text-erc8004-muted-fg",
        copyable && "cursor-pointer hover:text-erc8004-card-fg",
        className
      )}
      title={address}
      onClick={handleCopy}
    >
      {copied ? "Copied" : truncateAddress(address)}
    </span>
  )
}

import type React from "react"

export type CalloutVariant = "info" | "warning"

const VARIANTS: Record<
  CalloutVariant,
  { container: string; label: string; defaultLabel: string }
> = {
  info: {
    container:
      "border-black/20 dark:border-white/15 bg-neutral-100 dark:bg-neutral-900",
    label: "text-neutral-500 dark:text-white/40",
    defaultLabel: "Note",
  },
  warning: {
    container:
      "border-amber-700/40 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/30",
    label: "text-amber-700 dark:text-amber-300/80",
    defaultLabel: "Warning",
  },
}

type CalloutProps = {
  variant?: CalloutVariant
  title?: string
  children: React.ReactNode
}

export function Callout({
  variant = "info",
  title,
  children,
}: CalloutProps) {
  const v = VARIANTS[variant]
  return (
    <div
      role="note"
      className={`flex flex-col gap-1.5 border p-5 ${v.container}`}
    >
      <span
        className={`font-mono text-[10px] uppercase tracking-widest ${v.label}`}
      >
        {title ?? v.defaultLabel}
      </span>
      <div className="text-sm text-neutral-700 dark:text-white/80 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

const STATUS_CONFIG = {
  live: { label: 'Live', className: 'text-green bg-green/10' },
  next: { label: 'Up next', className: 'text-amber bg-amber/10' },
  planned: { label: 'Planned', className: 'text-text-muted bg-surface-overlay' },
}

interface PlaceholderDocsProps {
  name: string
  description: string
  status: 'live' | 'next' | 'planned'
}

export function PlaceholderDocs({ name, description, status }: PlaceholderDocsProps) {
  const s = STATUS_CONFIG[status]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-text-primary">{name}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded ${s.className}`}>
            {s.label}
          </span>
        </div>
        <p className="text-text-secondary leading-relaxed">{description}</p>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-raised p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-overlay flex items-center justify-center">
          <span className="text-text-muted text-xl">⏳</span>
        </div>
        <p className="text-text-secondary text-sm">
          This component is{' '}
          <span className="text-text-primary font-medium">{s.label.toLowerCase()}</span>.
          Docs will appear here once it's built.
        </p>
      </div>
    </div>
  )
}

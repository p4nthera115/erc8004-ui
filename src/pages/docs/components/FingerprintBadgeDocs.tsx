import { useState } from 'react'
import { FingerprintBadge } from '../../../components/fingerprint/FingerprintBadge'

const DEMO_AGENTS = [
  { registry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e', id: 1 },
  { registry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e', id: 22 },
  { registry: 'eip155:137:0x8Ba1f109551bD432803012645Ac136ddd64DBA72', id: 7 },
  { registry: 'eip155:8453:0xdAC17F958D2ee523a2206206994597C13D831ec7', id: 100 },
]

const PROPS = [
  { name: 'agentRegistry', type: 'string', required: true, default: '—', description: 'Agent registry in eip155:{chainId}:{address} format' },
  { name: 'agentId', type: 'number', required: true, default: '—', description: 'The agent\'s ID within the registry contract' },
  { name: 'size', type: 'number', required: false, default: '200', description: 'Width and height of the badge in pixels' },
  { name: 'className', type: 'string', required: false, default: "''", description: 'Additional CSS classes applied to the wrapper div' },
]

const SOURCE_SNIPPET = `import { useMemo, useEffect } from 'react'
import { deriveVisualConfig } from './visual-config'

interface FingerprintBadgeProps {
  agentRegistry: string
  agentId: number
  size?: number
  className?: string
}

export function FingerprintBadge({
  agentRegistry,
  agentId,
  size,
  className = 'w-full h-full',
}: FingerprintBadgeProps) {
  const config = useMemo(
    () => deriveVisualConfig(agentRegistry, agentId),
    [agentRegistry, agentId],
  )
  // ... SVG dithering render
}`

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green/60" />
            <span className="ml-2 text-xs text-text-muted font-mono">{filename}</span>
          </div>
          <button
            onClick={copy}
            className="text-xs text-text-muted hover:text-text-primary transition-colors font-mono"
          >
            {copied ? 'copied!' : 'copy'}
          </button>
        </div>
      )}
      <pre className="px-5 py-4 text-sm font-mono overflow-x-auto text-text-secondary leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function FingerprintBadgeDocs() {
  const [activeAgent, setActiveAgent] = useState(DEMO_AGENTS[0])
  const [size, setSize] = useState(160)

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-8 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-text-primary">Fingerprint Badge</h1>
          <span className="text-xs font-medium text-green bg-green/10 px-2 py-1 rounded">Live</span>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Deterministic visual identity generated from an agent's on-chain identifier.
          A FNV-1a hash of <code className="text-accent font-mono text-sm">agentRegistry + agentId</code> drives
          SVG dithering parameters — every agent gets a unique, unreplicable visual fingerprint.
        </p>
      </div>

      {/* Interactive preview */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Preview</h2>
        <div className="rounded-xl border border-border-subtle bg-surface-raised overflow-hidden">
          {/* Preview area */}
          <div className="flex items-center justify-center py-16 bg-surface-raised">
            <div className="fingerprint-glow">
              <FingerprintBadge
                agentRegistry={activeAgent.registry}
                agentId={activeAgent.id}
                size={size}
              />
            </div>
          </div>
          {/* Controls */}
          <div className="border-t border-border-subtle px-5 py-4 flex flex-col sm:flex-row gap-4 bg-surface">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs text-text-muted font-mono">agentRegistry + agentId</label>
              <div className="flex flex-wrap gap-2">
                {DEMO_AGENTS.map((a) => {
                  const isActive = a.registry === activeAgent.registry && a.id === activeAgent.id
                  return (
                    <button
                      key={`${a.registry}:${a.id}`}
                      onClick={() => setActiveAgent(a)}
                      className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                        isActive
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary'
                      }`}
                    >
                      chain:{a.registry.split(':')[1]} · #{a.id}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted font-mono">size: {size}px</label>
              <input
                type="range"
                min={80}
                max={240}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="accent-accent w-32"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Usage</h2>
        <CodeBlock
          filename="example.tsx"
          code={`import { FingerprintBadge } from '@erc8004/ui'

<FingerprintBadge
  agentRegistry="${activeAgent.registry}"
  agentId={${activeAgent.id}}
  size={${size}}
/>`}
        />
      </div>

      {/* Props */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Props</h2>
        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Prop</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Default</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {PROPS.map((prop) => (
                <tr key={prop.name} className="bg-surface-raised">
                  <td className="px-4 py-3">
                    <code className="text-accent font-mono text-xs">{prop.name}</code>
                    {prop.required && (
                      <span className="ml-1.5 text-[10px] text-red font-medium">required</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-amber font-mono text-xs">{prop.type}</code>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-text-muted font-mono text-xs">{prop.default}</code>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Source</h2>
        <p className="text-sm text-text-secondary">
          Exported from <code className="text-accent font-mono">@erc8004/ui</code>.
          Pure SVG — no canvas, no WebGL, no extra dependencies.
        </p>
        <CodeBlock filename="FingerprintBadge.tsx" code={SOURCE_SNIPPET} />
      </div>

      {/* How it works */}
      <div className="flex flex-col gap-4 pb-8">
        <h2 className="text-lg font-semibold text-text-primary">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Hash',
              body: 'agentRegistry + agentId is hashed with a simple LCG into 6 float seeds [0–1].',
            },
            {
              step: '02',
              title: 'Dither',
              body: 'Seeds drive wave interference parameters: frequency, warp offset, hue, fBm domain warp. Blue noise dithering renders the pattern as SVG rects.',
            },
            {
              step: '03',
              title: 'Shimmer',
              body: 'CSS keyframe animation on SVG groups creates a living, breathing fingerprint — never static, always unique.',
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-border-subtle bg-surface-raised p-5 flex flex-col gap-2">
              <span className="text-xs font-mono text-text-muted">{item.step}</span>
              <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

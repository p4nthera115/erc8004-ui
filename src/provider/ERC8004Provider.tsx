import { createContext, useContext, type ReactNode } from 'react'

interface ERC8004Config {
  apiKey: string
  subgraphOverrides?: Record<number, string>
}

const ERC8004Context = createContext<ERC8004Config | null>(null)

export function ERC8004Provider({
  apiKey,
  subgraphOverrides,
  children,
}: ERC8004Config & { children: ReactNode }) {
  return (
    <ERC8004Context value={{ apiKey, subgraphOverrides }}>
      {children}
    </ERC8004Context>
  )
}

export function useERC8004Config(): ERC8004Config {
  const ctx = useContext(ERC8004Context)
  if (!ctx) throw new Error('useERC8004Config must be used within ERC8004Provider')
  return ctx
}

export interface ParsedRegistry {
  namespace: string
  chainId: number
  contractAddress: string
}

/**
 * Parses an agentRegistry string into its components.
 * Format: `{namespace}:{chainId}:{contractAddress}` e.g. `eip155:1:0x742...`
 */
export function parseAgentRegistry(registry: string): ParsedRegistry {
  const parts = registry.split(':')
  if (parts.length !== 3) {
    throw new Error(`Invalid agentRegistry format: "${registry}"`)
  }
  const [namespace, chainIdStr, contractAddress] = parts
  const chainId = parseInt(chainIdStr, 10)
  if (isNaN(chainId)) {
    throw new Error(`Invalid chainId in agentRegistry: "${chainIdStr}"`)
  }
  return { namespace, chainId, contractAddress }
}

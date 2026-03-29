import { useState, useEffect } from 'react'
import { fetchIdentity } from '../lib/fetchers/identity'
import type { RegistrationFile } from '../lib/types'

interface UseAgentResult {
  data: RegistrationFile | null
  loading: boolean
  error: Error | null
}

export function useAgent(
  agentRegistry: string,
  agentId: number,
): UseAgentResult {
  const [data, setData] = useState<RegistrationFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchIdentity({ agentRegistry, agentId })
      .then(result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [agentRegistry, agentId])

  return { data, loading, error }
}

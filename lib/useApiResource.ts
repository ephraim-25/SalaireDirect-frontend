'use client'

import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '@/lib/utils'

interface ResourceState<T> {
  fetcher: unknown
  token: number
  data?: T
  error?: string
}

/**
 * Charge une ressource asynchrone sans setState synchrone dans un effet.
 * `fetcher` doit être stable (useCallback) : un changement relance le chargement.
 * Les anciennes données restent affichées pendant un rechargement.
 */
export function useApiResource<T>(fetcher: () => Promise<T>) {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<ResourceState<T> | null>(null)

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => {
        if (active) setState({ fetcher, token: reloadToken, data })
      })
      .catch((error: unknown) => {
        if (active) setState((prev) => ({ fetcher, token: reloadToken, data: prev?.data, error: errorMessage(error) }))
      })
    return () => {
      active = false
    }
  }, [fetcher, reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])
  const isLoading = !state || state.fetcher !== fetcher || state.token !== reloadToken

  return {
    data: state?.data,
    error: isLoading ? undefined : state?.error,
    isLoading,
    reload,
  }
}

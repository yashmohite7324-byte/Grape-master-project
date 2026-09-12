'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Runs an async fetcher on mount (and whenever `deps` change) and exposes
 * loading/error state plus a manual `refetch`.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcher()
      setState({ data, loading: false, error: null })
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Something went wrong'
      setState({ data: null, loading: false, error: message })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { ...state, refetch: run }
}

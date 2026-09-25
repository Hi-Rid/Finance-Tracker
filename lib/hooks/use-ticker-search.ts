'use client'

import { useState, useEffect, useRef } from 'react'
import type { SearchSuggestion } from '@/lib/investments/types'

type UseTickerSearchOptions = {
    assetType: 'stock' | 'crypto' | 'mutual_fund'
    debounceMs?: number
    minLength?: number
}

type UseTickerSearchReturn = {
    query: string
    setQuery: (q: string) => void
    results: SearchSuggestion[]
    loading: boolean
    error: string | null
    clear: () => void
}

export function useTickerSearch({
    assetType,
    debounceMs = 300,
    minLength = 1,
}: UseTickerSearchOptions): UseTickerSearchReturn {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        const trimmed = query.trim()

        if (trimmed.length < minLength) {
            setResults([])
            setLoading(false)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)

        const timer = setTimeout(async () => {
            abortRef.current?.abort()
            const controller = new AbortController()
            abortRef.current = controller

            try {
                const res = await fetch(
                    `/api/investments/search?q=${encodeURIComponent(trimmed)}&type=${assetType}`,
                    { signal: controller.signal }
                )

                if (!res.ok) {
                    setError('Gagal mencari. Coba lagi.')
                    setResults([])
                    return
                }

                const data = await res.json()
                setResults(data.results || [])
            } catch (err: any) {
                if (err?.name === 'AbortError') return
                setError('Gagal mencari. Coba lagi.')
                setResults([])
            } finally {
                setLoading(false)
            }
        }, debounceMs)

        return () => {
            clearTimeout(timer)
        }
    }, [query, assetType, debounceMs, minLength])

    function clear() {
        setQuery('')
        setResults([])
        setError(null)
        setLoading(false)
        abortRef.current?.abort()
    }

    return { query, setQuery, results, loading, error, clear }
}
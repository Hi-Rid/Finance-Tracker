'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, Building2, Bitcoin, LineChart, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTickerSearch } from '@/lib/hooks/use-ticker-search'
import type { SearchSuggestion } from '@/lib/investments/types'

type TickerSearchProps = {
    assetType: 'stock' | 'crypto' | 'mutual_fund'
    value: SearchSuggestion | null
    onChange: (suggestion: SearchSuggestion | null) => void
    disabled?: boolean
}

export function TickerSearch({
    assetType,
    value,
    onChange,
    disabled = false,
}: TickerSearchProps) {
    const { query, setQuery, results, loading, error, clear } = useTickerSearch({
        assetType,
    })

    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close dropdown kalau klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Auto-open saat ada hasil
    useEffect(() => {
        if (results.length > 0 && query.length >= 1) {
            setOpen(true)
            setHighlighted(0)
        }
    }, [results, query])

    // Reset kalau asset type berubah
    useEffect(() => {
        onChange(null)
        clear()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assetType])

    function handleSelect(suggestion: SearchSuggestion) {
        onChange(suggestion)
        clear()
        setOpen(false)
    }

    function handleClear() {
        onChange(null)
        clear()
        setOpen(false)
        inputRef.current?.focus()
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted((h) => Math.min(h + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted((h) => Math.max(h - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (results[highlighted]) {
                handleSelect(results[highlighted])
            }
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    // ============ SELECTED ============
    if (value) {
        const Icon = assetType === 'stock' ? Building2 : assetType === 'crypto' ? Bitcoin : LineChart

        return (
            <div
        className= {
                cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all',
          'bg-brand/5 border-brand/30'
                )
            }
            >
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0" >
                <Icon className="w-5 h-5 text-brand" />
                    </div>

                    < div className = "flex-1 min-w-0" >
                        <div className="flex items-center gap-2 mb-0.5" >
                            <p className="text-sm font-bold tracking-tight truncate" >
                                { value.ticker }
                                </p>
        {
            value.exchange && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-medium shrink-0" >
                    { value.exchange }
                    </span>
            )
        }
        </div>
            < p className = "text-xs text-muted-foreground truncate" > { value.name } </p>
                </div>

                < button
        type = "button"
        onClick = { handleClear }
        disabled = { disabled }
        className = "shrink-0 w-8 h-8 rounded-lg hover:bg-brand/10 flex items-center justify-center text-brand transition-colors cursor-pointer disabled:opacity-50"
            >
            <X className="w-4 h-4" />
                </button>
                </div>
    )
    }

    // ============ SEARCH ============
    return (
        <div ref= { containerRef } className = "relative" >
            <div className="relative" >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
          ref={ inputRef }
    type = "text"
    value = { query }
    onChange = {(e) => setQuery(e.target.value.toUpperCase())
}
onFocus = {() => results.length > 0 && setOpen(true)}
onKeyDown = { handleKeyDown }
disabled = { disabled }
placeholder = {
    assetType === 'stock'
    ? 'Cari saham... (contoh: BBCA)'
    : assetType === 'crypto'
        ? 'Cari crypto... (contoh: BTC)'
        : 'Cari reksadana...'
          }
className = {
    cn(
            'w-full h-12 pl-10 pr-10 rounded-xl border-2 transition-all outline-none',
            'bg-white dark:bg-white/5',
            'border-slate-200 dark:border-white/15',
            'text-sm font-medium',
            'focus:border-brand focus:ring-2 focus:ring-brand/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
    )
}
    />
    { loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand animate-spin" />
        )}
</div>

{
    open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0A1A40] shadow-xl overflow-hidden max-h-[320px] overflow-y-auto" >
            { loading && results.length === 0 && (
                <div className="px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground" >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Mencari & quot; { query }& quot;...
    </div>
          )
}

{
    error && !loading && (
        <div className="px-4 py-3 text-xs text-red-600 dark:text-red-400" >
            { error }
            </div>
          )
}

{
    !loading && !error && results.length === 0 && query.length >= 1 && (
        <div className="px-4 py-6 text-center" >
            <p className="text-sm font-medium mb-0.5" > Gak ada hasil </p>
                < p className = "text-xs text-muted-foreground" >
                    Coba kata kunci lain.
              </p>
                        </div>
          )
}

{
    results.length > 0 && (
        <div className="py-1.5" >
        {
            results.map((r, idx) => {
                const Icon =
                    r.type === 'stock'
                        ? Building2
                        : r.type === 'crypto'
                            ? Bitcoin
                            : LineChart
                const isHighlighted = idx === highlighted

                return (
                    <button
                    key= {`${r.symbol}-${idx}`
            }
                    type = "button"
                    onMouseEnter = {() => setHighlighted(idx)}
    onClick = {() => handleSelect(r)
}
className = {
    cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer',
        isHighlighted
            ? 'bg-slate-100 dark:bg-white/10'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
    )
}
    >
    <div
                      className={
    cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        isHighlighted
            ? 'bg-brand/15'
            : 'bg-slate-100 dark:bg-white/5'
    )
}
                    >
    <Icon
                        className={
    cn(
        'w-4 h-4',
        isHighlighted
            ? 'text-brand'
            : 'text-slate-500 dark:text-slate-400'
    )
}
                      />
    </div>

    < div className = "flex-1 min-w-0" >
        <div className="flex items-center gap-2 mb-0.5" >
            <p className="text-sm font-semibold truncate" >
                { r.ticker }
                </p>
{
    r.exchange && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-medium shrink-0" >
            { r.exchange }
            </span>
                        )
}
</div>
    < p className = "text-xs text-muted-foreground truncate" >
        { r.extra ? `${r.name} · ${r.extra}` : r.name }
        </p>
        </div>

{
    isHighlighted && (
        <Check className="w-4 h-4 text-brand shrink-0" />
                    )
}
</button>
                )
              })}
</div>
          )}
</div>
      )}
</div>
  )
}
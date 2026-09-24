'use client'

import { useState, useMemo, useEffect } from 'react'

export type PaginationResult<T> = {
    page: number
    perPage: number
    totalItems: number
    totalPages: number
    paginatedItems: T[]
    setPage: (page: number) => void
    setPerPage: (perPage: number) => void
    nextPage: () => void
    prevPage: () => void
    canNext: boolean
    canPrev: boolean
    from: number
    to: number
    reset: () => void
}

export function usePagination<T>(
    items: T[],
    defaultPerPage = 20
): PaginationResult<T> {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(defaultPerPage)

    const totalItems = items.length
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

    // Auto reset kalau page kelewat totalPages (misal setelah delete)
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * perPage
        return items.slice(start, start + perPage)
    }, [items, page, perPage])

    const from = totalItems === 0 ? 0 : (page - 1) * perPage + 1
    const to = Math.min(page * perPage, totalItems)

    return {
        page,
        perPage,
        totalItems,
        totalPages,
        paginatedItems,
        setPage,
        setPerPage,
        nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
        prevPage: () => setPage((p) => Math.max(p - 1, 1)),
        canNext: page < totalPages,
        canPrev: page > 1,
        from,
        to,
        reset: () => setPage(1),
    }
}
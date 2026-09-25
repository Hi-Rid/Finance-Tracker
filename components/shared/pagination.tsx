'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type PaginationProps = {
    page: number
    perPage: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
    onPerPageChange: (perPage: number) => void
    className?: string
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100]

export function Pagination({
    page,
    perPage,
    totalItems,
    totalPages,
    onPageChange,
    onPerPageChange,
    className,
}: PaginationProps) {
    if (totalItems === 0) return null

    const from = (page - 1) * perPage + 1
    const to = Math.min(page * perPage, totalItems)

    // Generate page numbers with ellipsis
    function getPageNumbers(): (number | '...')[] {
        const pages: (number | '...')[] = []
        const delta = 1

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
            return pages
        }

        pages.push(1)

        if (page - delta > 2) pages.push('...')

        const start = Math.max(2, page - delta)
        const end = Math.min(totalPages - 1, page + delta)

        for (let i = start; i <= end; i++) pages.push(i)

        if (page + delta < totalPages - 1) pages.push('...')

        pages.push(totalPages)

        return pages
    }

    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-white/10',
                className
            )}
        >
            {/* Info + per page */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground order-2 sm:order-1">
                <span className="whitespace-nowrap">
                    {from}–{to} dari <strong className="text-slate-900 dark:text-white">{totalItems}</strong>
                </span>
                <div className="hidden sm:flex items-center gap-2">
                    <span className="whitespace-nowrap">Per page:</span>
                    <Select
                        value={String(perPage)}
                        onValueChange={(v) => {
                            onPerPageChange(Number(v))
                            onPageChange(1)
                        }}
                    >
                        <SelectTrigger className="h-8 w-16 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PER_PAGE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={String(opt)}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={page === 1}
                    onClick={() => onPageChange(1)}
                    className="hidden sm:inline-flex"
                >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers().map((p, i) =>
                        p === '...' ? (
                            <span
                                key={`ellipsis-${i}`}
                                className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground"
                            >
                                ...
                            </span>
                        ) : (
                            <Button
                                key={p}
                                variant={p === page ? 'primary' : 'outline'}
                                size="icon-sm"
                                onClick={() => onPageChange(p)}
                                className={cn(
                                    'min-w-8 h-8',
                                    p === page && 'pointer-events-none'
                                )}
                            >
                                {p}
                            </Button>
                        )
                    )}
                </div>

                <div className="sm:hidden px-2 text-xs font-medium tabular-nums">
                    {page} / {totalPages}
                </div>

                <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="hidden sm:inline-flex"
                >
                    <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
}
'use client'

import Link from 'next/link'
import { Users, Plus, Receipt, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { formatDateShortWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { EventListItem } from '@/lib/split-bill/actions'

type EventsListProps = {
    events: EventListItem[]
}

export function EventsList({ events }: EventsListProps) {
    return (
        <>
        {/* Header with button */ }
        < div className = "flex items-center justify-between gap-3 mb-5" >
            <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1" >
                Total Events
                    </p>
                    < p className = "text-2xl font-bold tabular-nums" > { events.length } </p>
                        </div>

                        < div className = "flex items-center gap-1.5 shrink-0" >
                            <HideAmountsButton size="icon-sm" />
                                <Button variant="primary" size = "sm" asChild >
                                    <Link href="/split-bill/new" >
                                        <Plus className="w-4 h-4" />
                                            <span className="hidden sm:inline" > Event Baru </span>
                                                < span className = "sm:hidden" > Baru </span>
                                                    </Link>
                                                    </Button>
                                                    </div>
                                                    </div>

    {/* List */ }
    {
        events.length === 0 ? (
            <Card>
            <CardContent>
            <EmptyState
              icon= { Users }
              title = "Belum ada split bill"
        description = "Bikin event pertama lu — makan bareng, patungan kado, dll."
        action = {
                < Button variant = "primary" asChild >
            <Link href="/split-bill/new" >
                <Plus className="w-4 h-4" />
                    Bikin Event
                        </Link>
                        </Button>
    }
            />
        </CardContent>
        </Card>
      ) : (
        <div className= "space-y-3" >
        {
            events.map((event) => {
                const isSettled = event.unpaid_count === 0
                const hasUnpaid = event.unpaid_count > 0

                return (
                    <Link
                key= { event.id }
                href = {`/split-bill/${event.id}`
            }
                className = {
                    cn(
                  'group relative block rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden transition-all',
                  'hover:shadow-md hover:border-brand/40 hover:-translate-y-0.5'
                    )
                }
                >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />

            <div className="p-4 pl-5 flex items-start gap-3" >
            <div
                    className={
                cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                    isSettled
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                )
            }
            >
            {
                isSettled?(
                      <CheckCircle2 className = "w-5 h-5" />
                    ): (
                        <Clock className = "w-5 h-5" />
                    )
        }
        </div>

        < div className = "flex-1 min-w-0" >
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1" >
                <div className="min-w-0" >
                    <h3 className="text-sm md:text-base font-bold truncate" >
                        { event.name }
                        </h3>
                        < p className = "text-[11px] text-muted-foreground mt-0.5" >
                            { formatDateShortWIB(event.date) } ·{ ' ' }
    { event.participants_count } orang
        </p>
        </div>
        < Badge
    variant = { isSettled? 'success': 'warning' }
    className = "shrink-0 text-[10px]"
        >
    {
        isSettled
        ? 'Settled'
            : `${event.unpaid_count} belum bayar`
    }
        </Badge>
        </div>

        < div className = "flex items-end justify-between gap-3 mt-2" >
            <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" >
                Grand Total
                    </p>
                    < Amount
    value = { event.grand_total }
    className = "text-base font-bold text-slate-900 dark:text-white"
        />
        </div>

        < div className = "text-right" >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" >
                Share Lu
                    </p>
                    < Amount
    value = { event.user_share }
    className = "text-sm font-bold text-violet-600 dark:text-violet-400"
        />
        </div>
        </div>
        </div>
        </div>
        </Link>
            )
})}
</div>
      )}
</>
  )
}
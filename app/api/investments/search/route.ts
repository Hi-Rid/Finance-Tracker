import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchYahooTickers } from '@/lib/investments/yahoo'
import { searchCryptoTickers } from '@/lib/investments/curated-crypto'
import { searchMutualFunds } from '@/lib/investments/curated-mutual-funds'

export const runtime = 'nodejs'

export type SearchSuggestion = {
    ticker: string
    symbol: string
    name: string
    exchange: string
    currency: string
    type: 'stock' | 'crypto' | 'mutual_fund'
    source: 'yahoo' | 'curated'
    extra?: string
}

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''
    const type = searchParams.get('type') || 'stock'

    let results: SearchSuggestion[] = []

    if (type === 'stock') {
        const yahooResults = await searchYahooTickers(q)
        results = yahooResults.map((r) => ({
            ticker: r.ticker,
            symbol: r.symbol,
            name: r.name,
            exchange: r.exchange,
            currency: r.currency,
            type: 'stock' as const,
            source: 'yahoo' as const,
        }))
    } else if (type === 'crypto') {
        const cryptoResults = searchCryptoTickers(q)
        results = cryptoResults.map((c) => ({
            ticker: c.ticker,
            symbol: c.ticker,
            name: c.name,
            exchange: 'Crypto',
            currency: 'IDR',
            type: 'crypto' as const,
            source: 'curated' as const,
        }))
    } else if (type === 'mutual_fund') {
        const fundResults = searchMutualFunds(q)
        results = fundResults.map((f) => ({
            ticker: f.ticker,
            symbol: f.ticker,
            name: f.name,
            exchange: 'Reksadana',
            currency: 'IDR',
            type: 'mutual_fund' as const,
            source: 'curated' as const,
            extra: f.manager,
        }))
    }

    return NextResponse.json({ results })
}
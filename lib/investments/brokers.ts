export type BrokerOption = {
    value: string
    label: string
    appliesTo: Array<'stock' | 'crypto' | 'mutual_fund' | 'gold'>
}

export const BROKERS: BrokerOption[] = [
    // ============ SAHAM IDX ============
    { value: 'Stockbit', label: 'Stockbit', appliesTo: ['stock'] },
    { value: 'Mirae Asset', label: 'Mirae Asset', appliesTo: ['stock'] },
    { value: 'Indo Premier (IPOT)', label: 'Indo Premier (IPOT)', appliesTo: ['stock'] },
    { value: 'BNI Sekuritas', label: 'BNI Sekuritas', appliesTo: ['stock'] },
    { value: 'Mandiri Sekuritas', label: 'Mandiri Sekuritas', appliesTo: ['stock'] },
    { value: 'BCA Sekuritas', label: 'BCA Sekuritas', appliesTo: ['stock'] },
    { value: 'Phillip Sekuritas', label: 'Phillip Sekuritas', appliesTo: ['stock'] },
    { value: 'Sinarmas Sekuritas', label: 'Sinarmas Sekuritas', appliesTo: ['stock'] },
    { value: 'MNC Sekuritas', label: 'MNC Sekuritas', appliesTo: ['stock'] },
    { value: 'Samuel Sekuritas', label: 'Samuel Sekuritas', appliesTo: ['stock'] },
    { value: 'Trimegah Sekuritas', label: 'Trimegah Sekuritas', appliesTo: ['stock'] },

    // ============ SAHAM US ============
    { value: 'Gotrade', label: 'Gotrade', appliesTo: ['stock'] },
    { value: 'Interactive Brokers', label: 'Interactive Brokers', appliesTo: ['stock'] },
    { value: 'Charles Schwab', label: 'Charles Schwab', appliesTo: ['stock'] },

    // ============ CRYPTO ============
    { value: 'Binance', label: 'Binance', appliesTo: ['crypto'] },
    { value: 'Tokocrypto', label: 'Tokocrypto', appliesTo: ['crypto'] },
    { value: 'Indodax', label: 'Indodax', appliesTo: ['crypto'] },
    { value: 'Pintu', label: 'Pintu', appliesTo: ['crypto'] },
    { value: 'Pluang', label: 'Pluang', appliesTo: ['crypto'] },
    { value: 'Coinbase', label: 'Coinbase', appliesTo: ['crypto'] },
    { value: 'Kraken', label: 'Kraken', appliesTo: ['crypto'] },
    { value: 'Bybit', label: 'Bybit', appliesTo: ['crypto'] },
    { value: 'OKX', label: 'OKX', appliesTo: ['crypto'] },
    { value: 'Reku', label: 'Reku', appliesTo: ['crypto'] },

    // ============ REKSADANA ============
    { value: 'Bibit', label: 'Bibit', appliesTo: ['mutual_fund'] },
    { value: 'Bareksa', label: 'Bareksa', appliesTo: ['mutual_fund'] },
    { value: 'Ajaib', label: 'Ajaib', appliesTo: ['mutual_fund'] },
    { value: 'Pluang', label: 'Pluang', appliesTo: ['mutual_fund'] },
    { value: 'Nanovest', label: 'Nanovest', appliesTo: ['mutual_fund'] },
    { value: 'Fundtastic', label: 'Fundtastic', appliesTo: ['mutual_fund'] },
    { value: 'Tanamduit', label: 'Tanamduit', appliesTo: ['mutual_fund'] },

    // ============ EMAS ============
    { value: 'Antam', label: 'Antam (Logam Mulia)', appliesTo: ['gold'] },
    { value: 'UBS', label: 'UBS', appliesTo: ['gold'] },
    { value: 'Pegadaian', label: 'Pegadaian', appliesTo: ['gold'] },
    { value: 'Logam Mulia Digital', label: 'Logam Mulia Digital', appliesTo: ['gold'] },
    { value: 'Treasury (Pluang)', label: 'Treasury (Pluang)', appliesTo: ['gold'] },
    { value: 'Toko Emas Lokal', label: 'Toko Emas Lokal', appliesTo: ['gold'] },
    { value: 'Lainnya', label: 'Lainnya', appliesTo: ['gold'] },
]

export function getBrokersFor(
    type: 'stock' | 'crypto' | 'mutual_fund' | 'gold'
): BrokerOption[] {
    return BROKERS.filter((b) => b.appliesTo.includes(type))
}
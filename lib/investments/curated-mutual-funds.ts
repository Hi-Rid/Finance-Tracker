/**
 * Curated list reksadana populer di Indonesia.
 * Sumber: Bibit, Bareksa, Ajaib (top funds).
 */
export type MutualFundSuggestion = {
    ticker: string
    name: string
    manager: string
    category: 'money_market' | 'fixed_income' | 'equity' | 'mixed'
}

export const CURATED_MUTUAL_FUNDS: MutualFundSuggestion[] = [
    // ============ PASAR UANG ============
    { ticker: 'SUCORINV', name: 'Sucorinvest Money Market Fund', manager: 'Sucorinvest AM', category: 'money_market' },
    { ticker: 'BNPU', name: 'Bahana Money Market Fund', manager: 'Bahana TCW', category: 'money_market' },
    { ticker: 'MIPT', name: 'Mandiri Investa Pasar Uang', manager: 'Mandiri Manajemen Investasi', category: 'money_market' },
    { ticker: 'SMMF', name: 'Syailendra Dana Likuid', manager: 'Syailendra Capital', category: 'money_market' },
    { ticker: 'CIMBMMF', name: 'CIMB Niaga Money Market Fund', manager: 'CIMB Principal', category: 'money_market' },
    { ticker: 'PNM MMF', name: 'PNM Money Market Fund', manager: 'PNM Investment Management', category: 'money_market' },

    // ============ PENDAPATAN TETAP ============
    { ticker: 'SDF', name: 'Schroder Dana Prestasi', manager: 'Schroder Investment', category: 'fixed_income' },
    { ticker: 'BNPF', name: 'Bahana Pendapatan Tetap Utama', manager: 'Bahana TCW', category: 'fixed_income' },
    { ticker: 'MIF', name: 'Mandiri Investa Dana Utama', manager: 'Mandiri Manajemen Investasi', category: 'fixed_income' },
    { ticker: 'BSPF', name: 'BNI Dana Obligasi', manager: 'BNI AM', category: 'fixed_income' },
    { ticker: 'TRAM', name: 'Trimegah Dana Tetap', manager: 'Trimegah AM', category: 'fixed_income' },
    { ticker: 'BATAVIA', name: 'Batavia Dana Obligasi', manager: 'Batavia Prosperindo', category: 'fixed_income' },

    // ============ SAHAM ============
    { ticker: 'BIG', name: 'Bima Sakti Investama', manager: 'Bima Sakti', category: 'equity' },
    { ticker: 'SCHRODER', name: 'Schroder Dana Prestasi Plus', manager: 'Schroder Investment', category: 'equity' },
    { ticker: 'BNIS', name: 'BNI Dana Saham', manager: 'BNI AM', category: 'equity' },
    { ticker: 'RDS', name: 'Reksa Dana Saham BNI', manager: 'BNI AM', category: 'equity' },
    { ticker: 'MANULIFE', name: 'Manulife Dana Saham', manager: 'Manulife AM', category: 'equity' },
    { ticker: 'MDS', name: 'Mandiri Saham Atraktif', manager: 'Mandiri Manajemen Investasi', category: 'equity' },
    { ticker: 'AXA', name: 'AXA Mandiri Saham', manager: 'AXA Mandiri', category: 'equity' },
    { ticker: 'HPAM', name: 'Henan Putihrai Saham', manager: 'Henan Putihrai', category: 'equity' },
    { ticker: 'TRIM', name: 'Trim Kas', manager: 'Trimegah AM', category: 'equity' },
    { ticker: 'SIMAS', name: 'Simas Satu', manager: 'Sinarmas AM', category: 'equity' },

    // ============ CAMPURAN ============
    { ticker: 'MIXED', name: 'Schroder Dana Terpadu II', manager: 'Schroder Investment', category: 'mixed' },
    { ticker: 'BALANCED', name: 'Mandiri Investa Atraktif', manager: 'Mandiri Manajemen Investasi', category: 'mixed' },
    { ticker: 'BNPB', name: 'Bahana Dana Sejahtera', manager: 'Bahana TCW', category: 'mixed' },
    { ticker: 'CAMPUR', name: 'CIMB Niaga Campuran', manager: 'CIMB Principal', category: 'mixed' },
]

const CATEGORY_LABEL: Record<string, string> = {
    money_market: 'Pasar Uang',
    fixed_income: 'Pendapatan Tetap',
    equity: 'Saham',
    mixed: 'Campuran',
}

export function getMutualFundCategoryLabel(cat: string): string {
    return CATEGORY_LABEL[cat] || cat
}

export function searchMutualFunds(query: string): MutualFundSuggestion[] {
    const q = query.trim().toUpperCase()
    if (!q) return CURATED_MUTUAL_FUNDS.slice(0, 10)

    return CURATED_MUTUAL_FUNDS.filter(
        (f) =>
            f.ticker.includes(q) ||
            f.name.toUpperCase().includes(q) ||
            f.manager.toUpperCase().includes(q)
    ).slice(0, 15)
}
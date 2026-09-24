export type DateRangePreset =
    | 'all'
    | 'today'
    | '7days'
    | '30days'
    | 'thisMonth'
    | 'lastMonth'
    | 'custom'

export type DateRange = {
    preset: DateRangePreset
    from: Date | null
    to: Date | null
}

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    switch (preset) {
        case 'all':
            return { preset, from: null, to: null }
        case 'today':
            return { preset, from: today, to: endOfToday }
        case '7days': {
            const from = new Date(today)
            from.setDate(from.getDate() - 6)
            return { preset, from, to: endOfToday }
        }
        case '30days': {
            const from = new Date(today)
            from.setDate(from.getDate() - 29)
            return { preset, from, to: endOfToday }
        }
        case 'thisMonth': {
            const from = new Date(now.getFullYear(), now.getMonth(), 1)
            return { preset, from, to: endOfToday }
        }
        case 'lastMonth': {
            const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const to = new Date(now.getFullYear(), now.getMonth(), 0)
            to.setHours(23, 59, 59, 999)
            return { preset, from, to }
        }
        default:
            return { preset, from: null, to: null }
    }
}

export function isDateInRange(
    date: Date | string,
    range: DateRange
): boolean {
    if (range.preset === 'all') return true
    if (!range.from && !range.to) return true

    const d = typeof date === 'string' ? new Date(date) : date

    if (range.from && d < range.from) return false
    if (range.to && d > range.to) return false

    return true
}

export const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
    { value: 'all', label: 'Semua tanggal' },
    { value: 'today', label: 'Hari ini' },
    { value: '7days', label: '7 hari terakhir' },
    { value: '30days', label: '30 hari terakhir' },
    { value: 'thisMonth', label: 'Bulan ini' },
    { value: 'lastMonth', label: 'Bulan lalu' },
    { value: 'custom', label: 'Custom range' },
]

export const EMPTY_DATE_RANGE: DateRange = {
    preset: 'all',
    from: null,
    to: null,
}
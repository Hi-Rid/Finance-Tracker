/**
 * Utility untuk operasi bulan (format: YYYY-MM)
 */

export function getCurrentMonth(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthDisplay(month: string): string {
    const [year, m] = month.split('-').map(Number)
    const d = new Date(year, m - 1, 1)
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export function formatMonthShort(month: string): string {
    const [year, m] = month.split('-').map(Number)
    const d = new Date(year, m - 1, 1)
    return d.toLocaleDateString('id-ID', { month: 'short' })
}

export function addMonths(month: string, delta: number): string {
    const [year, m] = month.split('-').map(Number)
    const d = new Date(year, m - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getDaysInMonth(month: string): number {
    const [year, m] = month.split('-').map(Number)
    return new Date(year, m, 0).getDate()
}

export function getRemainingDays(month: string): number {
    const current = getCurrentMonth()
    if (month !== current) {
        // Kalau bulan lain, return full days
        return getDaysInMonth(month)
    }
    const today = new Date()
    const daysInMonth = getDaysInMonth(month)
    return Math.max(1, daysInMonth - today.getDate() + 1)
}

export function getMonthRange(month: string): { start: string; end: string } {
    const [year, m] = month.split('-').map(Number)
    const start = new Date(year, m - 1, 1)
    const end = new Date(year, m, 0)
    end.setHours(23, 59, 59, 999)
    return {
        start: start.toISOString(),
        end: end.toISOString(),
    }
}

export function isMonthSame(a: string, b: string): boolean {
    return a === b
}
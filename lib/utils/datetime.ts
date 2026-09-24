/**
 * Format datetime selalu dalam timezone WIB (Asia/Jakarta).
 * Amankan dari server (UTC) vs client (WIB) mismatch.
 */

export function formatTimeWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    })
}

export function formatDateWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    })
}

export function formatDateShortWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    })
}

export function formatDateLongWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    })
}

export function formatDateTimeWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    })
}

export function formatDateGroupWIB(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()

    const dWIB = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const todayWIB = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayWIB = yesterday.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    })

    if (dWIB === todayWIB) return 'Hari ini'
    if (dWIB === yesterdayWIB) return 'Kemarin'

    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        timeZone: 'Asia/Jakarta',
    })
}

export function getDateKeyWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    })
}
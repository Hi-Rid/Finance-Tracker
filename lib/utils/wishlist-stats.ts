import type { Database } from '@/types/database'
import { DECISION_QUESTIONS, type DecisionInput } from '@/lib/validators/wishlist'

type Wishlist = Database['public']['Tables']['wishlists']['Row']

export type PeriodFilter = '3m' | '6m' | '1y' | 'all'

export type SummaryStats = {
    total: number
    purchased: number
    cancelled: number
    active: number
    purchasedPercent: number
    cancelledPercent: number
    activePercent: number
    totalHeld: number // "berhasil ditahan"
    totalSpent: number // total dibeli
}

export type TrendPoint = {
    month: string // 'YYYY-MM'
    label: string // 'Okt'
    masuk: number
    dibeli: number
    cancelled: number
}

export type MoodStat = {
    mood: string
    label: string
    emoji: string
    purchased: number
    cancelled: number
    active: number
    total: number
    cancelRate: number
}

export type DecisionStats = {
    hasData: boolean
    totalWithDecision: number
    avgScore: number
    worthIt: { purchased: number; cancelled: number; active: number }
    consider: { purchased: number; cancelled: number; active: number }
    skip: { purchased: number; cancelled: number; active: number }
    accuracy: number // % wishlist skor tinggi yang akhirnya dibeli
    ignoreRate: number // % wishlist skor rendah yang tetap dibeli
}

export type CoolingOffStats = {
    hasData: boolean
    avgDays: number
    buckets: { label: string; count: number; percent: number }[]
    speedup: number // % cancel dalam < 3 hari
}

export type CategoryStat = {
    category: string
    label: string
    cancelled: number
    purchased: number
    total: number
    cancelRate: number
}

export type HourStat = {
    hour: number
    count: number
    isNight: boolean
}

export type TopWin = {
    id: string
    name: string
    target_price: number
    image_url: string | null
    category: string | null
}

// ============================================================
// FILTER
// ============================================================

export function getPeriodStart(period: PeriodFilter): Date | null {
    if (period === 'all') return null
    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
    const d = new Date()
    d.setMonth(d.getMonth() - months)
    d.setHours(0, 0, 0, 0)
    return d
}

export function filterByPeriod(
    wishlists: Wishlist[],
    period: PeriodFilter
): Wishlist[] {
    const start = getPeriodStart(period)
    if (!start) return wishlists
    return wishlists.filter((w) => new Date(w.created_at) >= start)
}

// ============================================================
// SUMMARY
// ============================================================

export function computeSummary(wishlists: Wishlist[]): SummaryStats {
    const total = wishlists.length
    const purchased = wishlists.filter((w) => w.status === 'purchased')
    const cancelled = wishlists.filter((w) => w.status === 'cancelled')
    const active = wishlists.filter(
        (w) => !['purchased', 'cancelled'].includes(w.status)
    )

    // "Berhasil ditahan" = uang yang GAK keluar karena cancel
    // (wishlist cancelled yang pernah cooling-off)
    const totalHeld = cancelled
        .filter((w) => w.cooling_off_until !== null)
        .reduce((sum, w) => sum + Number(w.target_price), 0)

    const totalSpent = purchased.reduce(
        (sum, w) => sum + Number(w.target_price),
        0
    )

    return {
        total,
        purchased: purchased.length,
        cancelled: cancelled.length,
        active: active.length,
        purchasedPercent: total > 0 ? (purchased.length / total) * 100 : 0,
        cancelledPercent: total > 0 ? (cancelled.length / total) * 100 : 0,
        activePercent: total > 0 ? (active.length / total) * 100 : 0,
        totalHeld,
        totalSpent,
    }
}

// ============================================================
// TREND
// ============================================================

export function computeTrend(
    wishlists: Wishlist[],
    months = 6
): TrendPoint[] {
    const now = new Date()
    const buckets = new Map<string, TrendPoint>()

    // Init semua bulan
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString('id-ID', { month: 'short' })
        buckets.set(key, {
            month: key,
            label,
            masuk: 0,
            dibeli: 0,
            cancelled: 0,
        })
    }

    for (const w of wishlists) {
        const createdKey = new Date(w.created_at).toLocaleDateString('en-CA', {
            timeZone: 'Asia/Jakarta',
        }).slice(0, 7)

        if (buckets.has(createdKey)) {
            buckets.get(createdKey)!.masuk++
        }

        if (w.purchased_at) {
            const purchasedKey = new Date(w.purchased_at).toLocaleDateString(
                'en-CA',
                { timeZone: 'Asia/Jakarta' }
            ).slice(0, 7)
            if (buckets.has(purchasedKey)) {
                buckets.get(purchasedKey)!.dibeli++
            }
        }

        // Cancelled pakai updated_at (asumsi status berubah)
        if (w.status === 'cancelled') {
            const cancelKey = new Date(w.updated_at).toLocaleDateString(
                'en-CA',
                { timeZone: 'Asia/Jakarta' }
            ).slice(0, 7)
            if (buckets.has(cancelKey)) {
                buckets.get(cancelKey)!.cancelled++
            }
        }
    }

    return Array.from(buckets.values())
}

// ============================================================
// MOOD
// ============================================================

const MOOD_META: Record<
    string,
    { label: string; emoji: string }
> = {
    happy: { label: 'Senang', emoji: '😊' },
    sad: { label: 'Sedih', emoji: '😢' },
    bored: { label: 'Bosan', emoji: '😑' },
    stressed: { label: 'Stress', emoji: '😰' },
    excited: { label: 'Excited', emoji: '🤩' },
    neutral: { label: 'Biasa', emoji: '😐' },
}

export function computeMoodPattern(wishlists: Wishlist[]): MoodStat[] {
    const map = new Map<string, MoodStat>()

    for (const w of wishlists) {
        if (!w.mood) continue
        const meta = MOOD_META[w.mood]
        if (!meta) continue

        if (!map.has(w.mood)) {
            map.set(w.mood, {
                mood: w.mood,
                label: meta.label,
                emoji: meta.emoji,
                purchased: 0,
                cancelled: 0,
                active: 0,
                total: 0,
                cancelRate: 0,
            })
        }
        const stat = map.get(w.mood)!
        stat.total++
        if (w.status === 'purchased') stat.purchased++
        else if (w.status === 'cancelled') stat.cancelled++
        else stat.active++
    }

    const result = Array.from(map.values())
    for (const s of result) {
        const decided = s.purchased + s.cancelled
        s.cancelRate = decided > 0 ? (s.cancelled / decided) * 100 : 0
    }

    return result.sort((a, b) => b.total - a.total)
}

// ============================================================
// DECISION CHECK EFFECTIVENESS
// ============================================================

export function computeDecisionStats(wishlists: Wishlist[]): DecisionStats {
    const withDecision = wishlists.filter(
        (w) => w.decision_score !== null && w.decision_score !== undefined
    )

    if (withDecision.length === 0) {
        return {
            hasData: false,
            totalWithDecision: 0,
            avgScore: 0,
            worthIt: { purchased: 0, cancelled: 0, active: 0 },
            consider: { purchased: 0, cancelled: 0, active: 0 },
            skip: { purchased: 0, cancelled: 0, active: 0 },
            accuracy: 0,
            ignoreRate: 0,
        }
    }

    let sum = 0
    const worthIt = { purchased: 0, cancelled: 0, active: 0 }
    const consider = { purchased: 0, cancelled: 0, active: 0 }
    const skip = { purchased: 0, cancelled: 0, active: 0 }

    for (const w of withDecision) {
        const score = Number(w.decision_score)
        sum += score

        let bucket: typeof worthIt
        if (score >= 24) bucket = worthIt
        else if (score >= 18) bucket = consider
        else bucket = skip

        if (w.status === 'purchased') bucket.purchased++
        else if (w.status === 'cancelled') bucket.cancelled++
        else bucket.active++
    }

    const avgScore = sum / withDecision.length

    // Accuracy: dari yang worth it, berapa % dibeli
    const worthItDecided = worthIt.purchased + worthIt.cancelled
    const accuracy =
        worthItDecided > 0 ? (worthIt.purchased / worthItDecided) * 100 : 0

    // Ignore rate: dari yang skip, berapa % tetap dibeli
    const skipDecided = skip.purchased + skip.cancelled
    const ignoreRate =
        skipDecided > 0 ? (skip.purchased / skipDecided) * 100 : 0

    return {
        hasData: true,
        totalWithDecision: withDecision.length,
        avgScore,
        worthIt,
        consider,
        skip,
        accuracy,
        ignoreRate,
    }
}

// ============================================================
// COOLING-OFF EFFECTIVENESS
// ============================================================

export function computeCoolingOffStats(
    wishlists: Wishlist[]
): CoolingOffStats {
    // Cuma hitung wishlist yang pernah cooling-off dan udah decided
    const relevant = wishlists.filter(
        (w) =>
            w.cooling_off_until !== null &&
            ['purchased', 'cancelled'].includes(w.status)
    )

    if (relevant.length === 0) {
        return {
            hasData: false,
            avgDays: 0,
            buckets: [],
            speedup: 0,
        }
    }

    // Durasi = (keputusan - created_at) dalam hari
    const durations: number[] = []
    let fastCancels = 0
    let totalCancels = 0

    for (const w of relevant) {
        const created = new Date(w.created_at).getTime()
        const decided = w.purchased_at
            ? new Date(w.purchased_at).getTime()
            : new Date(w.updated_at).getTime()
        const days = (decided - created) / (1000 * 60 * 60 * 24)

        if (days >= 0 && days < 365) {
            durations.push(days)

            if (w.status === 'cancelled') {
                totalCancels++
                if (days <= 3) fastCancels++
            }
        }
    }

    const avgDays =
        durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0

    // Buckets
    const bucketDefs = [
        { label: '< 3 hari', min: 0, max: 3 },
        { label: '3-7 hari', min: 3, max: 7 },
        { label: '1-2 minggu', min: 7, max: 14 },
        { label: '> 2 minggu', min: 14, max: Infinity },
    ]

    const buckets = bucketDefs.map((b) => {
        const count = durations.filter((d) => d >= b.min && d < b.max).length
        return {
            label: b.label,
            count,
            percent: durations.length > 0 ? (count / durations.length) * 100 : 0,
        }
    })

    const speedup =
        totalCancels > 0 ? (fastCancels / totalCancels) * 100 : 0

    return {
        hasData: true,
        avgDays,
        buckets,
        speedup,
    }
}

// ============================================================
// CATEGORY INSIGHT
// ============================================================

const CATEGORY_LABELS: Record<string, string> = {
    electronics: 'Elektronik',
    fashion: 'Fashion',
    hobbies: 'Hobbies',
    home_decor: 'Home & Decor',
    health: 'Kesehatan',
    automotive: 'Otomotif',
    gaming: 'Gaming',
    books: 'Buku',
    travel: 'Travel',
    collectible: 'Koleksi',
    other: 'Lainnya',
}

export function computeCategoryStats(wishlists: Wishlist[]): CategoryStat[] {
    const map = new Map<string, CategoryStat>()

    for (const w of wishlists) {
        if (!w.category) continue
        if (!map.has(w.category)) {
            map.set(w.category, {
                category: w.category,
                label: CATEGORY_LABELS[w.category] || w.category,
                cancelled: 0,
                purchased: 0,
                total: 0,
                cancelRate: 0,
            })
        }
        const s = map.get(w.category)!
        s.total++
        if (w.status === 'cancelled') s.cancelled++
        else if (w.status === 'purchased') s.purchased++
    }

    const result = Array.from(map.values())
    for (const s of result) {
        const decided = s.purchased + s.cancelled
        s.cancelRate = decided > 0 ? (s.cancelled / decided) * 100 : 0
    }

    return result.sort((a, b) => b.cancelRate - a.cancelRate).filter((s) => s.total >= 2)
}

// ============================================================
// HOUR PATTERN
// ============================================================

export function computeHourPattern(wishlists: Wishlist[]): HourStat[] {
    const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
        isNight: i >= 22 || i <= 4,
    }))

    for (const w of wishlists) {
        const h = Number(
            new Date(w.created_at).toLocaleString('en-US', {
                hour: 'numeric',
                hour12: false,
                timeZone: 'Asia/Jakarta',
            })
        )
        if (h >= 0 && h < 24) hours[h].count++
    }

    return hours
}

// ============================================================
// TOP WINS
// ============================================================

export function computeTopWins(
    wishlists: Wishlist[],
    limit = 5
): TopWin[] {
    return wishlists
        .filter(
            (w) => w.status === 'cancelled' && w.cooling_off_until !== null
        )
        .sort((a, b) => Number(b.target_price) - Number(a.target_price))
        .slice(0, limit)
        .map((w) => ({
            id: w.id,
            name: w.name,
            target_price: Number(w.target_price),
            image_url: w.image_url,
            category: w.category,
        }))
}

// ============================================================
// HELPER: Insight text
// ============================================================

export function getMoodInsight(moodStats: MoodStat[]): string | null {
    if (moodStats.length < 3) return null

    const badMoods = moodStats.filter((m) =>
        ['sad', 'bored', 'stressed'].includes(m.mood)
    )
    const goodMoods = moodStats.filter((m) =>
        ['happy', 'excited', 'neutral'].includes(m.mood)
    )

    if (badMoods.length === 0 || goodMoods.length === 0) return null

    const badCancel =
        badMoods.reduce((s, m) => s + m.cancelled, 0) /
        Math.max(
            1,
            badMoods.reduce((s, m) => s + m.cancelled + m.purchased, 0)
        )
    const goodCancel =
        goodMoods.reduce((s, m) => s + m.cancelled, 0) /
        Math.max(
            1,
            goodMoods.reduce((s, m) => s + m.cancelled + m.purchased, 0)
        )

    const diff = Math.round((badCancel - goodCancel) * 100)

    if (diff > 10) {
        return `Kamu ${diff}% lebih sering batalkan wishlist saat mood jelek (sedih, bosan, stress).`
    }
    return null
}
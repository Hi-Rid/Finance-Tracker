/**
 * Financial Freedom - computation utilities.
 *
 * Semua function di sini PURE (gak ada I/O, gak ada state).
 * Hook / component yang handle data fetch & persist.
 *
 * Konvensi:
 * - `expectedReturnRate` & `inflationRate` dalam DECIMAL (0.10, bukan 10).
 *   Hook yang convert dari UI (%) sebelum simpan ke DB.
 * - Semua angka uang dalam IDR (sudah IDR-equivalent).
 * - Return `null` kalau komputasi gak feasible (edge case).
 */

import type { FiType, MilestoneType } from '@/lib/validators/financial-freedom'
import {
    MILESTONE_LABELS,
    MILESTONE_EMOJI,
    MILESTONE_DESCRIPTIONS,
} from '@/lib/validators/financial-freedom'

const MONTHS_PER_YEAR = 12
const MAX_PROJECTION_YEARS = 50
const EPSILON = 1e-9

// ============================================================
// BASIC CALCULATORS
// ============================================================

/**
 * FI Number = multiplier × annual expense.
 *
 * Multiplier standar:
 * - lean    = 20  (5% SWR)
 * - regular = 25  (4% SWR, default)
 * - fat     = 33  (3% SWR)
 */
export function computeFiNumber(
    monthlyExpense: number,
    multiplier: number
): number {
    if (monthlyExpense <= 0 || multiplier <= 0) return 0
    return monthlyExpense * MONTHS_PER_YEAR * multiplier
}

/**
 * Coast FI Number = FI Number / (1 + realReturn)^yearsToRetire.
 *
 * Berapa net worth minimum SEKARANG biar lu bisa berhenti nabung
 * dan biarin compound growth ngejar target sampai retire age.
 *
 * Return null kalau:
 * - current_age / target_retire_age gak diisi
 * - target_retire_age <= current_age
 * - real return <= 0 (Coast FI gak make sense)
 */
export function computeCoastFiNumber(params: {
    fiNumber: number
    expectedReturnRate: number
    inflationRate: number
    currentAge: number | null
    targetRetireAge: number | null
}): number | null {
    const {
        fiNumber,
        expectedReturnRate,
        inflationRate,
        currentAge,
        targetRetireAge,
    } = params

    if (
        fiNumber <= 0 ||
        currentAge === null ||
        targetRetireAge === null ||
        targetRetireAge <= currentAge
    ) {
        return null
    }

    const realReturn = expectedReturnRate - inflationRate
    if (realReturn <= 0) return null

    const yearsToRetire = targetRetireAge - currentAge
    return fiNumber / Math.pow(1 + realReturn, yearsToRetire)
}

/** Savings rate dalam % (0-100). */
export function computeSavingsRate(
    monthlyIncome: number,
    monthlyExpense: number
): number {
    if (monthlyIncome <= 0) return 0
    const saving = monthlyIncome - monthlyExpense
    return Math.max(0, (saving / monthlyIncome) * 100)
}

/** Real return = expected - inflation. */
export function computeRealReturn(
    expectedReturnRate: number,
    inflationRate: number
): number {
    return expectedReturnRate - inflationRate
}

// ============================================================
// PROGRESS
// ============================================================

/** Progress FI dalam % (bisa > 100 kalau udah lewat target). */
export function computeFiProgress(
    netWorth: number,
    fiNumber: number
): number {
    if (fiNumber <= 0) return 0
    return Math.max(0, (netWorth / fiNumber) * 100)
}

/** Progress Coast FI dalam % (null kalau Coast FI disabled). */
export function computeCoastFiProgress(
    netWorth: number,
    coastFiNumber: number | null
): number | null {
    if (coastFiNumber === null || coastFiNumber <= 0) return null
    return Math.max(0, (netWorth / coastFiNumber) * 100)
}

// ============================================================
// YEARS TO FI
// ============================================================

/**
 * Hitung berapa bulan sampai FI.
 *
 * Asumsi:
 * - Net worth sekarang = PV
 * - Monthly saving = PMT (konstan)
 * - Monthly real return = r_m = (1 + annual_real)^(1/12) - 1
 *
 * Rumus:
 *   FV = PV × (1 + r_m)^n + PMT × ((1 + r_m)^n - 1) / r_m
 *
 * Solve untuk n:
 *   n = ln((FV + PMT/r_m) / (PV + PMT/r_m)) / ln(1 + r_m)
 *
 * Edge cases:
 * - PV >= FV → 0 bulan (udah FI)
 * - PMT <= 0 & PV < FV → null (gak akan pernah FI)
 * - r_m ≈ 0 → linear: n = (FV - PV) / PMT
 * - r_m < 0 & |PV × r_m| >= PMT → null (aset menyusut lebih cepat)
 */
export function computeMonthsToFi(params: {
    currentNetWorth: number
    fiNumber: number
    monthlySaving: number
    annualRealReturn: number
}): number | null {
    const { currentNetWorth, fiNumber, monthlySaving, annualRealReturn } = params

    if (fiNumber <= 0) return 0
    if (currentNetWorth >= fiNumber) return 0
    if (monthlySaving <= 0) return null

    const r = Math.pow(1 + annualRealReturn, 1 / MONTHS_PER_YEAR) - 1

    // Linear case: real return ≈ 0
    if (Math.abs(r) < EPSILON) {
        return (fiNumber - currentNetWorth) / monthlySaving
    }

    // Negative real return: cek kalau saving bisa ngejar penyusutan
    if (r < 0 && currentNetWorth * r + monthlySaving < 0) {
        return null
    }

    const a = fiNumber + monthlySaving / r
    const b = currentNetWorth + monthlySaving / r

    // Guard: ratio harus positif
    if (a <= 0 || b <= 0) return null

    const n = Math.log(a / b) / Math.log(1 + r)

    return n > 0 && isFinite(n) ? n : null
}

/** Convert bulan → Date (dari sekarang). */
export function computeFiDate(monthsToFi: number | null): Date | null {
    if (monthsToFi === null || !isFinite(monthsToFi)) return null
    if (monthsToFi <= 0) return new Date()

    const d = new Date()
    d.setMonth(d.getMonth() + Math.ceil(monthsToFi))
    return d
}

// ============================================================
// PROJECTION (untuk chart)
// ============================================================

export type ProjectionPoint = {
    year: number      // 0, 1, 2, ...
    label: string     // '2026', '2027', ...
    value: number     // net worth
    fiNumber: number  // reference line
}

/**
 * Project net worth per tahun sampai FI tercapai atau maxYears.
 *
 * Simulasi bulanan (bukan formula tertutup) supaya lebih akurat,
 * sample per tahun untuk chart.
 *
 * Return array selalu mulai dari tahun 0 (current).
 */
export function projectNetWorthPath(params: {
    startNetWorth: number
    monthlySaving: number
    annualRealReturn: number
    fiNumber: number
    maxYears?: number
}): ProjectionPoint[] {
    const {
        startNetWorth,
        monthlySaving,
        annualRealReturn,
        fiNumber,
        maxYears = MAX_PROJECTION_YEARS,
    } = params

    const r = Math.pow(1 + annualRealReturn, 1 / MONTHS_PER_YEAR) - 1
    const startYear = new Date().getFullYear()

    const points: ProjectionPoint[] = [
        {
            year: 0,
            label: String(startYear),
            value: startNetWorth,
            fiNumber,
        },
    ]

    let current = startNetWorth
    let lastSampleMonth = 0

    for (let m = 1; m <= maxYears * MONTHS_PER_YEAR; m++) {
        current = current * (1 + r) + monthlySaving

        // Sample per tahun
        if (m % MONTHS_PER_YEAR === 0) {
            const year = m / MONTHS_PER_YEAR
            points.push({
                year,
                label: String(startYear + year),
                value: current,
                fiNumber,
            })
            lastSampleMonth = m

            if (current >= fiNumber) break
        }
    }

    // Kalau FI tercapai di tengah tahun, tambah titik penutup
    const last = points[points.length - 1]
    if (last.value < fiNumber && current >= fiNumber && lastSampleMonth < maxYears * MONTHS_PER_YEAR) {
        const year = lastSampleMonth / MONTHS_PER_YEAR + 1
        points.push({
            year,
            label: String(startYear + year),
            value: current,
            fiNumber,
        })
    }

    return points
}

// ============================================================
// SCENARIO SIMULATOR
// ============================================================

export type FiScenario = {
    savingsRate: number       // %
    monthlySaving: number
    monthlyExpense: number    // expense yang diasumsikan di skenario ini
    fiNumber: number          // FI number di skenario ini (berubah karena expense berubah)
    monthsToFi: number | null
    yearsToFi: number | null
    fiDate: Date | null
    isCurrent: boolean
}

/**
 * Generate scenario "kalau saving rate naik X%".
 *
 * Asumsi:
 * - Income KONSTAN
 * - Kalau saving rate naik → expense TURUN (sisa income di-save semua)
 * - FI Number ikut berubah karena expense berubah
 *
 * Contoh: income 10jt, expense 8jt (saving rate 20%).
 *   Skenario 30%:
 *     - New expense = 10jt × (1 - 0.30) = 7jt
 *     - New saving  = 3jt
 *     - New FI Number = 7jt × 12 × multiplier (LEBIH KECIL)
 *   Skenario ini realistis karena FI Number turun = target lebih deket.
 *
 * Rate candidates: current, +10, +20, +30 (capped di 100%, deduped).
 */
const MAX_REASONABLE_SAVINGS_RATE = 80

export function computeAllScenarios(params: {
    currentSavingsRate: number
    monthlyIncome: number
    currentNetWorth: number
    fiMultiplier: number
    annualRealReturn: number
}): FiScenario[] {
    const {
        currentSavingsRate,
        monthlyIncome,
        currentNetWorth,
        fiMultiplier,
        annualRealReturn,
    } = params

    if (monthlyIncome <= 0 || fiMultiplier <= 0) return []

    // Cap di 80% karena minimal expense 20% buat hidup
    const candidates = [
        Math.min(currentSavingsRate, MAX_REASONABLE_SAVINGS_RATE),
        Math.min(currentSavingsRate + 10, MAX_REASONABLE_SAVINGS_RATE),
        Math.min(currentSavingsRate + 20, MAX_REASONABLE_SAVINGS_RATE),
        Math.min(currentSavingsRate + 30, MAX_REASONABLE_SAVINGS_RATE),
    ]
        .filter((r) => r >= 0 && r <= MAX_REASONABLE_SAVINGS_RATE)
        .map((r) => Math.round(r))

    const rates = Array.from(new Set(candidates)).sort((a, b) => a - b)
    const currentRounded = Math.round(
        Math.min(currentSavingsRate, MAX_REASONABLE_SAVINGS_RATE)
    )

    return rates.map((rate) => {
        const savingsRateDec = rate / 100
        const newMonthlyExpense = monthlyIncome * (1 - savingsRateDec)
        const newMonthlySaving = monthlyIncome * savingsRateDec
        const newFiNumber = newMonthlyExpense * MONTHS_PER_YEAR * fiMultiplier

        const months = computeMonthsToFi({
            currentNetWorth,
            fiNumber: newFiNumber,
            monthlySaving: newMonthlySaving,
            annualRealReturn,
        })

        return {
            savingsRate: rate,
            monthlySaving: newMonthlySaving,
            monthlyExpense: newMonthlyExpense,
            fiNumber: newFiNumber,
            monthsToFi: months,
            yearsToFi: months !== null ? months / MONTHS_PER_YEAR : null,
            fiDate: computeFiDate(months),
            isCurrent: rate === currentRounded,
        }
    })
}

// ============================================================
// MILESTONES
// ============================================================

export type MilestoneTarget = {
    type: MilestoneType
    label: string
    emoji: string
    description: string
    target_amount: number
}

/**
 * Build daftar milestone target dari FI Number.
 * Coast FI cuma dimasukin kalau coastFiNumber tersedia (age terisi).
 *
 * Urutan: 10% → 25% → 50% → 75% → [Coast FI] → 100%
 */
export function buildMilestoneTargets(params: {
    fiNumber: number
    coastFiNumber: number | null
}): MilestoneTarget[] {
    const { fiNumber, coastFiNumber } = params

    if (fiNumber <= 0) return []

    const entries: Array<{ type: MilestoneType; amount: number }> = [
        { type: 'fi_10', amount: fiNumber * 0.1 },
        { type: 'fi_25', amount: fiNumber * 0.25 },
        { type: 'fi_50', amount: fiNumber * 0.5 },
        { type: 'fi_75', amount: fiNumber * 0.75 },
    ]

    if (coastFiNumber !== null && coastFiNumber > 0) {
        entries.push({ type: 'coast_fi', amount: coastFiNumber })
    }

    entries.push({ type: 'fi_100', amount: fiNumber })

    return entries.map((e) => ({
        type: e.type,
        label: MILESTONE_LABELS[e.type],
        emoji: MILESTONE_EMOJI[e.type],
        description: MILESTONE_DESCRIPTIONS[e.type],
        target_amount: Math.round(e.amount),
    }))
}

/** Milestone berikutnya yang belum tercapai (sorted by target). */
export function getNextMilestone(
    netWorth: number,
    targets: MilestoneTarget[]
): MilestoneTarget | null {
    const sorted = [...targets].sort((a, b) => a.target_amount - b.target_amount)
    for (const t of sorted) {
        if (netWorth < t.target_amount) return t
    }
    return null
}

/** Cek milestone udah tercapai (net worth >= target). */
export function isMilestoneAchieved(
    netWorth: number,
    target: MilestoneTarget
): boolean {
    return netWorth >= target.target_amount
}

/** Return list milestone baru yang baru tercapai (buat notif). */
export function findNewlyAchieved(
    netWorth: number,
    targets: MilestoneTarget[],
    alreadyAchievedTypes: Set<MilestoneType>
): MilestoneTarget[] {
    return targets.filter(
        (t) =>
            !alreadyAchievedTypes.has(t.type) && netWorth >= t.target_amount
    )
}

// ============================================================
// FORMATTERS
// ============================================================

/** Format bulan → "5 tahun 3 bulan", "8 bulan", "-". */
export function formatYearsMonths(months: number | null): string {
    if (months === null || !isFinite(months)) return '-'
    if (months <= 0) return 'Sekarang'

    const years = Math.floor(months / MONTHS_PER_YEAR)
    const rem = Math.round(months % MONTHS_PER_YEAR)

    if (years === 0) return `${rem} bulan`
    if (rem === 0) return `${years} tahun`
    return `${years} thn ${rem} bln`
}

/** Format tanggal FI → "Okt 2032". */
export function formatFiDate(date: Date | null): string {
    if (!date) return '-'
    return date.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    })
}

// ============================================================
// RESOLVE PARAMS (composite helper untuk hook)
// ============================================================

export type ResolvedFiParams = {
    // Input (echo)
    monthlyExpense: number
    monthlyIncome: number
    fiType: FiType
    fiMultiplier: number
    expectedReturnRate: number
    inflationRate: number
    currentAge: number | null
    targetRetireAge: number | null
    currentNetWorth: number

    // Computed
    annualExpense: number
    annualIncome: number
    monthlySaving: number
    savingsRate: number
    annualSaving: number
    realReturn: number

    fiNumber: number
    coastFiNumber: number | null

    fiProgress: number
    coastFiProgress: number | null

    monthsToFi: number | null
    yearsToFi: number | null
    fiDate: Date | null

    allMilestones: MilestoneTarget[]
    nextMilestone: MilestoneTarget | null
}

/**
 * Composite helper - resolve semua parameter FI dalam 1 panggilan.
 * Dipakai di hook & page biar gak duplikasi compute logic.
 *
 * Rate dalam DECIMAL (0.10), bukan persen.
 */
export function resolveFiParams(input: {
    monthlyExpense: number
    monthlyIncome: number
    fiType: FiType
    fiMultiplier: number
    expectedReturnRate: number
    inflationRate: number
    currentAge: number | null
    targetRetireAge: number | null
    currentNetWorth: number
}): ResolvedFiParams {
    const {
        monthlyExpense,
        monthlyIncome,
        fiType,
        fiMultiplier,
        expectedReturnRate,
        inflationRate,
        currentAge,
        targetRetireAge,
        currentNetWorth,
    } = input

    const monthlySaving = Math.max(0, monthlyIncome - monthlyExpense)
    const realReturn = computeRealReturn(expectedReturnRate, inflationRate)

    const fiNumber = computeFiNumber(monthlyExpense, fiMultiplier)
    const coastFiNumber = computeCoastFiNumber({
        fiNumber,
        expectedReturnRate,
        inflationRate,
        currentAge,
        targetRetireAge,
    })

    const fiProgress = computeFiProgress(currentNetWorth, fiNumber)
    const coastFiProgress = computeCoastFiProgress(currentNetWorth, coastFiNumber)

    const monthsToFi = computeMonthsToFi({
        currentNetWorth,
        fiNumber,
        monthlySaving,
        annualRealReturn: realReturn,
    })

    const allMilestones = buildMilestoneTargets({ fiNumber, coastFiNumber })
    const nextMilestone = getNextMilestone(currentNetWorth, allMilestones)

    const monthlySavingRounded = Math.round(monthlySaving)
    const fiNumberRounded = Math.round(fiNumber)
    const coastFiNumberRounded =
        coastFiNumber !== null ? Math.round(coastFiNumber) : null

    return {
        monthlyExpense,
        monthlyIncome,
        fiType,
        fiMultiplier,
        expectedReturnRate,
        inflationRate,
        currentAge,
        targetRetireAge,
        currentNetWorth: Math.round(currentNetWorth),

        annualExpense: monthlyExpense * MONTHS_PER_YEAR,
        annualIncome: monthlyIncome * MONTHS_PER_YEAR,
        monthlySaving: monthlySavingRounded,
        savingsRate: computeSavingsRate(monthlyIncome, monthlyExpense),
        annualSaving: monthlySavingRounded * MONTHS_PER_YEAR,
        realReturn,

        fiNumber: fiNumberRounded,
        coastFiNumber: coastFiNumberRounded,

        fiProgress,
        coastFiProgress,

        monthsToFi,
        yearsToFi: monthsToFi !== null ? monthsToFi / MONTHS_PER_YEAR : null,
        fiDate: computeFiDate(monthsToFi),

        allMilestones,
        nextMilestone,
    }
}
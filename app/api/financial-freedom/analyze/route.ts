import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { aiAnalysisSchema } from '@/lib/validators/financial-freedom'
import { resolveFiParams } from '@/lib/utils/financial-freedom'
import { fetchFinancialFreedomServerData } from '@/lib/financial-freedom/server-compute'
import { getCurrentMonth, formatMonthDisplay } from '@/lib/utils/month'
import { formatRupiah } from '@/lib/normalize'
import type { FiType } from '@/lib/validators/financial-freedom'

export const runtime = 'nodejs'
export const maxDuration = 60

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ============================================================
// HELPERS
// ============================================================

// Sanitize nama profile: kalau masih default "Personal"/"Business", jangan dipakai
function sanitizeProfileName(name: string | null | undefined): string | null {
    if (!name) return null
    const trimmed = name.trim()
    if (!trimmed) return null
    const lower = trimmed.toLowerCase()
    if (lower === 'personal' || lower === 'business') return null
    return trimmed
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function POST() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
            { error: 'GROQ_API_KEY belum di-set di .env.local' },
            { status: 500 }
        )
    }

    // ============ FETCH PROFILE ============
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

    const profile = profiles?.[0]
    if (!profile) {
        return NextResponse.json(
            { error: 'Profile tidak ditemukan' },
            { status: 404 }
        )
    }

    // ============ FETCH SETTINGS ============
    const { data: settings } = await supabase
        .from('financial_freedom_settings' as any)
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

    if (!settings) {
        return NextResponse.json(
            { error: 'Setup Financial Freedom dulu' },
            { status: 400 }
        )
    }

    // ============ FETCH DATA + COMPUTE ============
    const serverData = await fetchFinancialFreedomServerData({
        profileId: profile.id,
        userId: user.id,
    })

    const monthlyExpense =
        settings.monthly_expense_override !== null
            ? Number(settings.monthly_expense_override)
            : serverData.avgExpense

    const monthlyIncome =
        settings.monthly_income_override !== null
            ? Number(settings.monthly_income_override)
            : serverData.income.value

    if (monthlyExpense <= 0) {
        return NextResponse.json(
            {
                error: 'Pengeluaran belum ada data',
                detail:
                    'Isi manual di Section Parameter atau catat transaksi expense dulu.',
            },
            { status: 400 }
        )
    }

    if (monthlyIncome <= 0) {
        return NextResponse.json(
            { error: 'Pendapatan belum ada data. Isi manual di parameter.' },
            { status: 400 }
        )
    }

    const resolved = resolveFiParams({
        monthlyExpense,
        monthlyIncome,
        fiType: settings.fi_type as FiType,
        fiMultiplier: Number(settings.fi_multiplier),
        expectedReturnRate: Number(settings.expected_return_rate),
        inflationRate: Number(settings.inflation_rate),
        currentAge: settings.current_age,
        targetRetireAge: settings.target_retire_age,
        currentNetWorth: serverData.netWorth.total,
    })

    // ============ BENCHMARK (growth mode) ============
    const benchmark =
        resolved.savingsRate >= 50
            ? 'elite (>50%)'
            : resolved.savingsRate >= 30
                ? 'excellent (30-50%)'
                : resolved.savingsRate >= 20
                    ? 'bagus (20-30%)'
                    : resolved.savingsRate >= 10
                        ? 'kurang (10-20%)'
                        : 'rendah (<10%)'

    // ============ BRANCH MODE ============
    const isFiAchieved = resolved.fiProgress >= 100 && resolved.fiNumber > 0

    const currentMonth = getCurrentMonth()
    const monthLabel = formatMonthDisplay(currentMonth)

    const sanitizedName = sanitizeProfileName(profile.name)

    const prompt = isFiAchieved
        ? buildMaintenancePrompt({
            profileName: sanitizedName,
            monthLabel,
            resolved,
            topCategories: serverData.topCategories,
        })
        : buildGrowthPrompt({
            profileName: sanitizedName,
            monthLabel,
            resolved,
            fiType: settings.fi_type as string,
            topCategories: serverData.topCategories,
            benchmark,
        })

    // ============ CALL GROQ ============
    try {
        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                {
                    role: 'system',
                    content:
                        'You output only valid JSON. Never wrap in markdown. Never add explanation.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0]?.message?.content?.trim() || ''
        const cleaned = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()

        const parsed = JSON.parse(cleaned)
        const validated = aiAnalysisSchema.parse(parsed)

        return NextResponse.json({
            success: true,
            analysis: validated,
            mode: isFiAchieved ? 'maintenance' : 'growth',
            meta: {
                resolved,
                monthlyExpense,
                monthlyIncome,
                expenseSource:
                    settings.monthly_expense_override !== null ? 'override' : 'auto',
                incomeSource:
                    settings.monthly_income_override !== null
                        ? 'override'
                        : serverData.income.source,
                topCategories: serverData.topCategories,
            },
        })
    } catch (err: any) {
        console.error('[ff/analyze] failed:', err)

        if (err?.name === 'ZodError') {
            return NextResponse.json(
                {
                    error: 'AI response tidak valid',
                    detail: 'Format JSON dari AI gak sesuai. Coba refresh lagi.',
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                error: 'Gagal analisis AI. Coba lagi.',
                detail: err?.message || String(err),
            },
            { status: 500 }
        )
    }
}

// ============================================================
// PROMPT: GROWTH MODE (belum FI)
// ============================================================

function buildGrowthPrompt(params: {
    profileName: string | null
    monthLabel: string
    resolved: ReturnType<typeof resolveFiParams>
    fiType: string
    topCategories: Array<{ name: string; amount: number; percent: number }>
    benchmark: string
}): string {
    const {
        profileName,
        monthLabel,
        resolved,
        fiType,
        topCategories,
        benchmark,
    } = params

    const categoryList =
        topCategories.length > 0
            ? topCategories
                .map(
                    (c, i) =>
                        `${i + 1}. ${c.name} - ${formatRupiah(c.amount)}/bln (${c.percent.toFixed(1)}%)`
                )
                .join('\n')
            : '- belum ada data'

    const nextMilestoneLine = resolved.nextMilestone
        ? `- Target: ${resolved.nextMilestone.label} = ${formatRupiah(resolved.nextMilestone.target_amount)}
- Kurang: ${formatRupiah(resolved.nextMilestone.target_amount - resolved.currentNetWorth)}`
        : '- Semua milestone tercapai'

    const nameLine = profileName
        ? `Nama: ${profileName}`
        : `Nama: (belum diisi user, jangan pakai nama apapun. Panggil "lu" aja)`

    return `Kamu adalah financial advisor FI (Financial Independence) yang asik dan praktis. Ngomong pakai bahasa Indonesia santai, pakai "lu" bukan "Anda".

# PROFIL USER - ${monthLabel}
${nameLine}

## Angka Utama
- Umur: ${resolved.currentAge ?? '-'}${resolved.targetRetireAge ? ` menuju target retire ${resolved.targetRetireAge}` : ''}
- Pendapatan bulanan: ${formatRupiah(resolved.monthlyIncome)}
- Pengeluaran bulanan: ${formatRupiah(resolved.monthlyExpense)}
- Nabung bulanan: ${formatRupiah(resolved.monthlySaving)}
- Savings rate: ${resolved.savingsRate.toFixed(1)}% (${benchmark})

## Status FI
- Tipe FI: ${fiType} (${resolved.fiMultiplier}x pengeluaran tahunan)
- Target FI: ${formatRupiah(resolved.fiNumber)}
- Aset produktif sekarang: ${formatRupiah(resolved.currentNetWorth)}
- Progress: ${resolved.fiProgress.toFixed(1)}%
- Estimasi FI: ${resolved.fiDate
            ? resolved.fiDate.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
            })
            : 'Belum bisa dihitung (saving rate 0 atau net worth negatif)'
        }
- Return bersih asumsi: ${(resolved.realReturn * 100).toFixed(1)}% (return ${(resolved.expectedReturnRate * 100).toFixed(1)}% dikurangi inflasi ${(resolved.inflationRate * 100).toFixed(1)}%)

## Target Selanjutnya
${nextMilestoneLine}

## Top Kategori Pengeluaran (avg 3 bulan terakhir)
${categoryList}

# TUGASMU
Kasih analisis personal dan actionable. Spesifik ke data user, jangan generik. Bicara seperti coach yang kenal user.

## 1. overall_status
1-2 kalimat. Ringkas posisi user sekarang. Tone: encouragement tapi jujur. JANGAN sapa dengan nama kalau nama user kosong.

## 2. savings_rate_analysis
2-3 kalimat. Benchmark savings rate user vs standar FIRE. Kalau di bawah 20%, jelasin kenapa krusial. Kalau di atas 30%, puji dan kasih insight "tiap +10% = X tahun lebih cepet".

## 3. improvements (2-4 item)
Konkret dan spesifik ke data user. TUNJUK ANGKA, jangan generik.
- Contoh bagus: "Entertainment ${formatRupiah(topCategories[0]?.amount || 0)}/bln (${topCategories[0]?.percent.toFixed(0) || 0}% dari total). Kalau dipangkas 30%, hemat 200rb/bln = FI cepet 8 bulan."
- Contoh jelek: "Kurangi jajan"

Setiap improvement punya:
- title: max 60 char, actionable, verb di depan
- description: 1-2 kalimat, kenapa + gimana
- impact_estimate: "FI cepet X bulan" atau "Target FI turun Rp X"

## 4. next_milestone
Copy PERSIS label dari "Target Selanjutnya" di atas. Contoh: "10% FI", "Coast FI", "Financial Independence".

## 5. next_milestone_amount & next_milestone_gap
Copy angka dari atas. Angka murni integer tanpa format.

## 6. action_steps (4-5 langkah)
Plan 30-90 hari ke depan. Konkret dan bisa dieksekusi.
- Contoh bagus: "Setup auto-debit 500rb/bulan ke RDN Stockbit tanggal 25"
- Contoh jelek: "Investasi lebih giat"

Setiap step:
- title: max 60 char, verb di depan
- description: 1-2 kalimat, kenapa penting
- impact_estimate: 1 kalimat dampak konkret
- sort_order: 0, 1, 2, ...

# OUTPUT FORMAT (STRICT JSON)
{
  "overall_status": "...",
  "savings_rate_analysis": "...",
  "improvements": [
    { "title": "...", "description": "...", "impact_estimate": "..." }
  ],
  "next_milestone": "...",
  "next_milestone_amount": 300000000,
  "next_milestone_gap": 50000000,
  "action_steps": [
    { "title": "...", "description": "...", "impact_estimate": "...", "sort_order": 0 }
  ]
}

# ATURAN KRITIS
1. Output HANYA JSON valid, tanpa markdown, tanpa penjelasan
2. Angka amount integer tanpa titik/koma
3. Bahasa Indonesia santai, pakai "lu"
4. improvements: 2-4 item
5. action_steps: 4-5 item
6. Kalau ada data aneh (misal expense > income), tandai di overall_status
7. JANGAN panggil user dengan nama "Personal" atau "Business" - itu nama default sistem. Kalau gak ada nama, langsung aja tanpa sapa.

Sekarang generate JSON-nya.`
}

// ============================================================
// PROMPT: MAINTENANCE MODE (udah FI achieved)
// ============================================================

function buildMaintenancePrompt(params: {
    profileName: string | null
    monthLabel: string
    resolved: ReturnType<typeof resolveFiParams>
    topCategories: Array<{ name: string; amount: number; percent: number }>
}): string {
    const { profileName, monthLabel, resolved, topCategories } = params

    const categoryList =
        topCategories.length > 0
            ? topCategories
                .map(
                    (c, i) =>
                        `${i + 1}. ${c.name} - ${formatRupiah(c.amount)}/bln (${c.percent.toFixed(1)}%)`
                )
                .join('\n')
            : '- belum ada data'

    const surplus = resolved.currentNetWorth - resolved.fiNumber
    const withdraw4Percent = resolved.fiNumber * 0.04
    const monthlyWithdraw = withdraw4Percent / 12

    const nameLine = profileName
        ? `Nama: ${profileName}`
        : `Nama: (belum diisi user, jangan pakai nama apapun. Panggil "lu" aja)`

    return `Kamu adalah financial advisor untuk orang yang SUDAH MENCAPAI Financial Independence (FI). User ini bukan lagi ngejar target, tapi FOKUS MEMPERTAHANKAN dan MENIKMATI kebebasan finansial.

# PROFIL USER - ${monthLabel}
${nameLine}

## Angka Utama
- Umur: ${resolved.currentAge ?? '-'}${resolved.targetRetireAge ? `, target retire ${resolved.targetRetireAge}` : ''}
- Pendapatan bulanan: ${formatRupiah(resolved.monthlyIncome)}
- Pengeluaran bulanan: ${formatRupiah(resolved.monthlyExpense)}

## Status FI
- Target FI: ${formatRupiah(resolved.fiNumber)}
- Aset produktif: ${formatRupiah(resolved.currentNetWorth)}
- Progress: ${resolved.fiProgress.toFixed(1)}% (SUDAH LEWAT TARGET)
- Surplus di atas target: ${formatRupiah(surplus)}
- Safe withdrawal 4%/tahun: ${formatRupiah(withdraw4Percent)} atau ${formatRupiah(monthlyWithdraw)}/bulan

## Top Kategori Pengeluaran (avg 3 bulan)
${categoryList}

# KONTEKS PENTING
User ini udah "menang". Tugasmu BUKAN nyuruh mereka hemat lagi atau naikin savings rate. Tugasmu:
1. Rayakan pencapaian
2. Kasih strategi mempertahankan kekayaan
3. Optimasi withdrawal & diversifikasi
4. Jaga dari lifestyle creep
5. Saran apa yang bisa dilakukan dengan kebebasan finansial ini

# TUGASMU

## 1. overall_status
1-2 kalimat. Rayakan pencapaian tapi ingetin FI bukan garis akhir, ini awal dari babak baru. Tone: hangat, apresiatif, forward-looking. JANGAN sapa dengan nama kalau nama user kosong.

## 2. savings_rate_analysis
JANGAN bahas savings rate sebagai metrik target yang harus dikejar. Ganti konteksnya: sekarang lu punya FLEKSIBILITAS. Bisa kerja karena mau (bukan karena harus), bisa ambil proyek yang lebih meaningful, bisa kurangi jam kerja, atau rehat total. Framing ini yang penting.

## 3. improvements (2-4 item)
Fokus ke strategi MAINTENANCE, bukan akumulasi. Contoh topik:
- Strategi withdrawal aman (4% rule, dynamic withdrawal, bucket strategy)
- Diversifikasi aset: jangan taruh di 1 instrumen, sebar ke saham-obligasi-emas-deposito
- Tax optimization (kalau ada instrumen kena pajak)
- Cash buffer & emergency fund setidaknya 12 bulan
- Hindari lifestyle creep: income/aset naik bukan berarti expense naik
- Insurance review & estate planning
- Legacy atau charity planning

Setiap improvement:
- title: max 60 char, actionable
- description: 1-2 kalimat, kenapa + gimana. Bisa referensi angka user
- impact_estimate: "Risiko turun X%" atau "Withdrawal aman Rp X/bln" atau "Preservasi modal lebih kuat"

## 4. next_milestone
Isi PERSIS dengan "-" (strip tunggal). Gak ada milestone lagi.

## 5. next_milestone_amount & next_milestone_gap
Isi 0 dan 0.

## 6. action_steps (4-5 langkah)
Plan maintenance 30-90 hari ke depan. Contoh:
- Review & rebalance portofolio (pastikan sesuai risk profile)
- Setup withdrawal plan: berapa banyak, dari instrumen mana, kapan
- Isi cash buffer 12 bulan pengeluaran buat dana darurat
- Tax planning check (apa aja yang bisa dioptimasi)
- Refleksi: after FI, what's next? Hobi, proyek, bisnis sosial?

Setiap step:
- title: max 60 char, verb di depan
- description: 1-2 kalimat, kenapa penting
- impact_estimate: 1 kalimat dampak konkret
- sort_order: 0, 1, 2, ...

# OUTPUT FORMAT (STRICT JSON)
{
  "overall_status": "...",
  "savings_rate_analysis": "...",
  "improvements": [
    { "title": "...", "description": "...", "impact_estimate": "..." }
  ],
  "next_milestone": "-",
  "next_milestone_amount": 0,
  "next_milestone_gap": 0,
  "action_steps": [
    { "title": "...", "description": "...", "impact_estimate": "...", "sort_order": 0 }
  ]
}

# ATURAN KRITIS
1. Output HANYA JSON valid, tanpa markdown, tanpa penjelasan
2. Angka integer tanpa titik/koma
3. Bahasa Indonesia santai, pakai "lu"
4. improvements: 2-4 item
5. action_steps: 4-5 item
6. TONE: bukan "kejar target", tapi "pertahankan & nikmati"
7. JANGAN suruh hemat lebih banyak atau naikin savings rate
8. JANGAN panggil user dengan nama "Personal" atau "Business" - itu nama default sistem. Kalau gak ada nama, langsung aja tanpa sapa.

Sekarang generate JSON-nya.`
}
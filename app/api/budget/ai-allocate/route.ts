import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

let groqClient: Groq | null = null

function getGroq(): Groq {
    if (!groqClient) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY belum di-set')
        }
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        })
    }
    return groqClient
}

type ExpenseInput = { name: string; amount: number }
type RequestBody = { income: number; expenses: ExpenseInput[] }
type Bucket = 'needs' | 'wants' | 'savings'
type ExpenseType = 'fixed' | 'variable'

type ExpenseResult = {
    original_name: string
    category_id: string
    category_name: string
    bucket: Bucket
    type: ExpenseType
    original_amount: number
    final_amount: number
    adjusted: boolean
    move_reason: string | null
    adjust_reason: string | null
}

type AIResult = {
    expenses: ExpenseResult[]
    rebalance_notes: string[]
    blocked: boolean
    block_reason: string | null
}

type RebalancedBuckets = {
    needs: number
    wants: number
    savings: number
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: RequestBody
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { error: 'Format request tidak valid' },
            { status: 400 }
        )
    }

    const { income, expenses } = body

    if (!income || income <= 0) {
        return NextResponse.json(
            { error: 'Income wajib diisi' },
            { status: 400 }
        )
    }

    if (!Array.isArray(expenses) || expenses.length === 0) {
        return NextResponse.json(
            { error: 'Minimal 1 pengeluaran harus diisi' },
            { status: 400 }
        )
    }

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
            {
                error: 'GROQ_API_KEY belum di-set',
                detail: 'Tambahin GROQ_API_KEY ke .env.local lalu restart dev server',
            },
            { status: 500 }
        )
    }

    // ============ FETCH CATEGORIES ============
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, group_name, type')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .eq('is_archived', false)
        .order('sort_order')
        .order('name')

    if (!categories || categories.length === 0) {
        return NextResponse.json(
            {
                error: 'Belum ada kategori expense',
                detail: 'Bikin kategori dulu di Settings → Kategori',
            },
            { status: 400 }
        )
    }

    // ============ BASELINE ============
    const needs50 = Math.round(income * 0.5)
    const wants30 = Math.round(income * 0.3)
    const savings20 = Math.round(income * 0.2)

    const totalInput = expenses.reduce((s, e) => s + e.amount, 0)

    // ============ BUILD PROMPT ============
    const expenseList = expenses
        .map((e, i) => {
            if (e.amount === 0) {
                return `${i + 1}. ${e.name} - (BELUM ADA NOMINAL, kamu yang tentuin)`
            }
            return `${i + 1}. ${e.name} - Rp ${e.amount.toLocaleString('id-ID')}`
        })
        .join('\n')

    const categoryList = categories
        .map((c) => `- ${c.id} | ${c.name} | group: ${c.group_name}`)
        .join('\n')

    const prompt = `Kamu adalah financial advisor ahli aturan 50/30/20 untuk pengguna Indonesia.

# KONTEKS
Income bulanan: Rp ${income.toLocaleString('id-ID')}

Baseline 50/30/20:
- Needs (50%): Rp ${needs50.toLocaleString('id-ID')}
- Wants (30%): Rp ${wants30.toLocaleString('id-ID')}
- Savings (20%): Rp ${savings20.toLocaleString('id-ID')}

Total pengeluaran yang user input: Rp ${totalInput.toLocaleString('id-ID')}

# PENGELUARAN USER:
${expenseList}

CATATAN PENTING:
- Pengeluaran dengan nominal > 0 = user udah kasih nominal PASTI. JANGAN diubah kecuali untuk rebalance Step B.
- Pengeluaran dengan tanda "(BELUM ADA NOMINAL)" = user belum tau berapa, KAMU YANG TENTUIN berdasarkan bucket & sisa budget yang tersedia.

# KATEGORI TERSEDIA (id | nama | group):
${categoryList}

# TUGASMU

## Task 1 - Klasifikasi Setiap Pengeluaran
Assign tiap pengeluaran ke SATU bucket: "needs", "wants", atau "savings".

ATURAN KLASIFIKASI:
- **needs**: kost/rent, utilities (listrik/air/wifi), groceries, transport umum (bensin/ojek/bus), asuransi, pajak, zakat, HP/pulsa, kesehatan
- **wants**: entertainment, jajan/dining out, coffee, hobi, subscription (Netflix/Spotify), pacaran, gaming, shopping, fashion, kendaraan pribadi (cicilan motor/mobil PRIBADI)
- **savings**: investasi (saham/crypto/reksadana/emas), dana darurat, tabungan, UKT/kuliah (investasi pendidikan)

NUANSA PENTING:
- Cicilan motor/mobil PRIBADI → **wants** (kendaraan = lifestyle, bukan kebutuhan pokok)
- Transport umum (bensin, ojek, bus) → **needs**
- UKT/kuliah → **savings** (investasi pendidikan)
- Asuransi → **needs** (proteksi wajib)

## Task 2 - Tentukan Fixed atau Variable
Untuk SETIAP pengeluaran, tandai:
- **"fixed"**: nominal PASTI (kost, cicilan, UKT, asuransi, langganan bulanan) ATAU user udah kasih nominal & nature-nya gak bisa diubah
- **"variable"**: nominal BISA disesuaikan (makan, jajan, transport, hobi) ATAU user belum kasih nominal (tanda "BELUM ADA NOMINAL")

RULES KHUSUS untuk amount = 0:
- Kalau user gak kasih nominal, otomatis "variable"
- Kamu yang tentuin nominalnya berdasarkan bucket + sisa budget

## Task 3 - Match ke Category Existing
Match setiap pengeluaran ke category_id TERBAIK dari list yang disediakan. Gunakan fuzzy matching:
- "Kost" / "Sewa" → "Rent" atau "Housing"
- "Makan" → "Meals"
- "Jajan" → "Snacks" atau "Entertainment"
- "Cicilan Motor" → "Paylater" atau "Loan" atau "Transport"
- "Invest" / "Nabung" → "Stocks" / "Mutual Fund" / "Gold"
- "Netflix" → "Entertainment"
- "UKT Kuliah" → paling dekat dengan group education atau invest

## Task 4 - Rebalance Kalau Over Budget
Hitung total per bucket. Bandingkan dengan baseline.

JIKA ada bucket yang MELEBIHI baseline, lakukan rebalance BERTAHAP:

### STEP A - Pindah Pengeluaran Fleksibel
- Cari pengeluaran di bucket yang over yang SECARA LOGIS bisa masuk bucket lain
- Contoh: "Cicilan Motor" di Needs → pindah ke Wants (motor = lifestyle)
- Contoh: "UKT Kuliah" di Needs → pindah ke Savings (investasi pendidikan)
- Cuma pindah kalau nature-nya mendukung

### STEP B - Kurangi Variable Expenses
- Setelah Step A, kalau bucket MASIH over, kurangi "variable" expenses di bucket itu
- Prioritas: kurangi yang PALING GAK ESENSIAL dulu (jajan > makan > transport)
- Contoh: "Makan Rp 1.000.000" → "Makan Rp 800.000" (kurangi Rp 200.000)

### STEP C - Block Jika Gak Bisa Diselesaikan
- Kalau SETELAH Step B masih over (semua pengeluaran sisa fixed) → set "blocked": true
- Isi "block_reason" dengan penjelasan singkat

## Task 5 - WAJIB HABISKAN BUDGET
Setelah semua klasifikasi & rebalance, PASTIKAN total per bucket PAS dengan baseline.
Kalau ada sisa (total < baseline), tambahkan ke pengeluaran "variable" di bucket tersebut
secara proporsional. JANGAN biarkan ada sisa.

# OUTPUT FORMAT (STRICT JSON)
{
  "expenses": [
    {
      "original_name": "Kost",
      "category_id": "uuid-di-sini",
      "category_name": "Rent",
      "bucket": "needs",
      "type": "fixed",
      "original_amount": 1500000,
      "final_amount": 1500000,
      "adjusted": false,
      "move_reason": null,
      "adjust_reason": "Tempat tinggal wajib, nominal tetap"
    },
    {
      "original_name": "Makan",
      "category_id": "uuid-di-sini",
      "category_name": "Meals",
      "bucket": "needs",
      "type": "variable",
      "original_amount": 0,
      "final_amount": 1000000,
      "adjusted": true,
      "move_reason": null,
      "adjust_reason": "User belum kasih nominal, AI alokasi dari budget Needs"
    },
    {
      "original_name": "Cicilan Motor",
      "category_id": "uuid-di-sini",
      "category_name": "Paylater",
      "bucket": "wants",
      "type": "fixed",
      "original_amount": 700000,
      "final_amount": 700000,
      "adjusted": false,
      "move_reason": "Motor pribadi = lifestyle, masuk Wants",
      "adjust_reason": null
    }
  ],
  "rebalance_notes": [
    "Cicilan Motor dipindah dari Needs ke Wants (kendaraan pribadi = lifestyle)."
  ],
  "blocked": false,
  "block_reason": null
}

# ATURAN KRITIS
1. Output HANYA JSON valid, tanpa markdown, tanpa penjelasan
2. Semua amount integer (tanpa desimal, tanpa titik/koma)
3. Sum final_amount per bucket HARUS PAS dengan baseline (kalau blocked=false)
4. category_id HARUS salah satu dari list yang disediakan (uuid persis)
5. SETIAP pengeluaran input HARUS muncul di output expenses array
6. Kalau blocked=true, block_reason WAJIB dijelaskan
7. move_reason diisi HANYA kalau bucket berubah dari klasifikasi awal
8. adjust_reason diisi HANYA kalau amount berubah
9. Kalau gak ada adjustment sama sekali, rebalance_notes = []

Sekarang generate JSON-nya.`

    // ============ CALL GROQ ============
    let aiResult: AIResult
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
            temperature: 0.15,
            max_tokens: 6000,
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0]?.message?.content?.trim() || ''
        const cleaned = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()

        aiResult = JSON.parse(cleaned)
    } catch (err: any) {
        console.error('[ai-allocate] Groq failed:', err)
        return NextResponse.json(
            {
                error: 'Gagal analisis AI. Coba lagi.',
                detail: err?.message || String(err),
            },
            { status: 500 }
        )
    }

    // ============ VALIDATE ============
    if (!Array.isArray(aiResult.expenses)) {
        return NextResponse.json(
            {
                error: 'AI response tidak valid. Coba lagi.',
                detail: 'Response bukan JSON yang diharapkan',
            },
            { status: 500 }
        )
    }

    const validCategoryIds = new Set(categories.map((c) => c.id))
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    aiResult.expenses = aiResult.expenses.map((e) => {
        const cat = categoryMap.get(e.category_id)
        return {
            ...e,
            category_id: validCategoryIds.has(e.category_id)
                ? e.category_id
                : categories[0].id,
            category_name: cat?.name || e.category_name,
            original_amount: Math.round(e.original_amount),
            final_amount: Math.round(e.final_amount),
            adjusted: e.final_amount !== e.original_amount,
        }
    })

    // ============ EFFECTIVE BUCKETS ============
    let effectiveBuckets: RebalancedBuckets = {
        needs: needs50,
        wants: wants30,
        savings: savings20,
    }

    let rebalanceNotes: string[] = []

    if (
        (aiResult as any).rebalanced_buckets &&
        typeof (aiResult as any).rebalanced_buckets.needs === 'number' &&
        typeof (aiResult as any).rebalanced_buckets.wants === 'number' &&
        typeof (aiResult as any).rebalanced_buckets.savings === 'number'
    ) {
        const rb = (aiResult as any).rebalanced_buckets
        const sum = rb.needs + rb.wants + rb.savings

        if (Math.abs(sum - income) < 100) {
            effectiveBuckets = rb
        }
    }

    rebalanceNotes = [...(aiResult.rebalance_notes || [])]

    // ============ AUTO-DISTRIBUTE SISA PER BUCKET ============
    const bucketKeys: Bucket[] = ['needs', 'wants', 'savings']

    for (const b of bucketKeys) {
        const bucketBudget = effectiveBuckets[b]
        const items = aiResult.expenses.filter((e) => e.bucket === b)
        const currentTotal = items.reduce((s, e) => s + e.final_amount, 0)
        const sisa = bucketBudget - currentTotal

        if (sisa < 1000) continue

        const variables = items.filter((e) => e.type === 'variable')

        if (variables.length > 0) {
            const varTotal = variables.reduce(
                (s, e) => s + e.final_amount,
                0
            )

            if (varTotal > 0) {
                let distributed = 0
                variables.forEach((v, i) => {
                    const isLast = i === variables.length - 1
                    const add = isLast
                        ? sisa - distributed
                        : Math.round(sisa * (v.final_amount / varTotal))

                    v.final_amount += add
                    v.adjusted = true
                    v.adjust_reason = v.adjust_reason
                        ? `${v.adjust_reason} Plus Rp ${add.toLocaleString('id-ID')} untuk habisin sisa budget.`
                        : `Ditambah Rp ${add.toLocaleString('id-ID')} untuk habisin sisa budget ${b}.`
                    distributed += add
                })

                rebalanceNotes.push(
                    `Sisa Rp ${sisa.toLocaleString('id-ID')} di bucket ${b} dialokasikan ke ${variables.length} pengeluaran variabel.`
                )
            } else {
                const perItem = Math.floor(sisa / variables.length)
                let distributed = 0
                variables.forEach((v, i) => {
                    const isLast = i === variables.length - 1
                    v.final_amount = isLast ? sisa - distributed : perItem
                    v.adjusted = true
                    v.adjust_reason = `Alokasi Rp ${v.final_amount.toLocaleString('id-ID')} dari sisa budget ${b}.`
                    distributed += v.final_amount
                })

                rebalanceNotes.push(
                    `Sisa Rp ${sisa.toLocaleString('id-ID')} di bucket ${b} dibagi rata ke ${variables.length} pengeluaran variabel.`
                )
            }
        } else {
            const otherCat =
                categories.find(
                    (c) =>
                        c.name.toLowerCase() === 'other' ||
                        c.name.toLowerCase() === 'lainnya'
                ) ||
                categories.find((c) => c.group_name === 'other') ||
                null

            if (otherCat) {
                aiResult.expenses.push({
                    original_name: 'Alokasi Tambahan',
                    category_id: otherCat.id,
                    category_name: otherCat.name,
                    bucket: b,
                    type: 'variable',
                    original_amount: 0,
                    final_amount: sisa,
                    adjusted: true,
                    move_reason: null,
                    adjust_reason: `Sisa budget ${b} dialokasikan ke kategori ini.`,
                })

                rebalanceNotes.push(
                    `Sisa Rp ${sisa.toLocaleString('id-ID')} di bucket ${b} dialokasikan ke kategori "${otherCat.name}".`
                )
            }
        }
    }

    // ============ TOTALS ============
    const totals = {
        needs: {
            budget: effectiveBuckets.needs,
            original: aiResult.expenses
                .filter((e) => e.bucket === 'needs')
                .reduce((s, e) => s + e.original_amount, 0),
            actual: aiResult.expenses
                .filter((e) => e.bucket === 'needs')
                .reduce((s, e) => s + e.final_amount, 0),
        },
        wants: {
            budget: effectiveBuckets.wants,
            original: aiResult.expenses
                .filter((e) => e.bucket === 'wants')
                .reduce((s, e) => s + e.original_amount, 0),
            actual: aiResult.expenses
                .filter((e) => e.bucket === 'wants')
                .reduce((s, e) => s + e.final_amount, 0),
        },
        savings: {
            budget: effectiveBuckets.savings,
            original: aiResult.expenses
                .filter((e) => e.bucket === 'savings')
                .reduce((s, e) => s + e.original_amount, 0),
            actual: aiResult.expenses
                .filter((e) => e.bucket === 'savings')
                .reduce((s, e) => s + e.final_amount, 0),
        },
    }

    const overBudget = {
        needs: totals.needs.actual > effectiveBuckets.needs + 100,
        wants: totals.wants.actual > effectiveBuckets.wants + 100,
        savings: totals.savings.actual > effectiveBuckets.savings + 100,
    }

    const hasOver =
        overBudget.needs || overBudget.wants || overBudget.savings

    const blocked = aiResult.blocked || hasOver

    return NextResponse.json({
        success: true,
        income,
        baseline: {
            needs: needs50,
            wants: wants30,
            savings: savings20,
        },
        buckets: effectiveBuckets,
        expenses: aiResult.expenses,
        totals,
        over_budget: overBudget,
        rebalance_notes: rebalanceNotes,
        blocked,
        block_reason:
            aiResult.block_reason ||
            (hasOver ? 'Ada bucket yang masih over setelah rebalance' : null),
    })
}
# Synmony - Development Context & Roadmap

> **File ini adalah sumber kebenaran project Synmony.**
> Kirim file ini + link repo GitHub setiap mulai chat baru.
> Last updated: 29 Sept 2026

---

## 1. IDENTITY

| Field | Value |
|---|---|
| **Nama** | Synmony |
| **Tagline** | Your Second Brain for Your Money |
| **Tipe** | Personal finance tracker, production-grade, siap SaaS |
| **Target user** | Diri sendiri dulu, multi-profile (personal/business) |
| **Bahasa UI** | Indonesia santai |
| **Filosofi** | Semua modul saling terkoneksi - bukan sekadar pencatat |

**Visi:** Sistem keuangan pribadi lengkap yang:
1. **Nyambungin semua** - transaksi, aset, utang, goals, investasi
2. **Bantu keputusan** - bukan cuma lapor, tapi kasih saran
3. **Sadar perilaku** - mood tracking, cooling-off, impulse buying pattern
4. **Multi-profil** - personal & bisnis dalam satu akun
5. **Financial Coach** - bantu user capai financial freedom

---

## 2. TECH STACK

**Frontend:**
- Next.js 16.3.5 (App Router, Server Components)
- React 19.2.8 + TypeScript 5
- Tailwind CSS v4 (@theme inline, no config)
- shadcn/ui (radix-nova), lucide icons
- framer-motion, recharts, sonner
- Zustand, TanStack Query, react-hook-form + Zod v4

**Backend:**
- Supabase (Postgres + Auth + RLS + Storage)
- Next.js API Routes

**External:**
- yahoo-finance2 (harga saham)
- CoinGecko (harga crypto)
- Nanonets (OCR struk)
- **Groq SDK** (AI - model `openai/gpt-oss-120b`)

**Deploy:** Vercel

---

## 3. ARSITEKTUR KUNCI

| Konsep | Implementasi |
|---|---|
| **Auth** | Supabase Auth + PIN unlock (SHA-256) |
| **Session unlock** | sessionStorage key `synmony_unlocked` |
| **Balance sync** | DB trigger `sync_transaction_balance` |
| **Soft delete** | `is_deleted`, `deleted_at` (30 hari restore) |
| **Audit log** | Auto-trigger di 23 tabel |
| **3 flag exclusion** | `exclude_from_budget`, `exclude_from_daily_budget`, `exclude_from_reports` |
| **Multi-currency** | `amount_idr` + `exchange_rate` (IDR only, siap expand) |
| **Timezone** | WIB (Asia/Jakarta) explicit |
| **RLS** | Enable di semua tabel |
| **Envelope** | Virtual account (type='envelope') untuk wishlist saving |
| **AI** | Groq + Llama/GPT-OSS via API route |

**RPC utama:**
- `get_cash_flow_history(profile_id, months)`
- `get_net_worth_history(profile_id, months)`
- `seed_default_categories(user_id)`

---

## 4. DATABASE - 21 Migrations

```
supabase/migrations/
├── 001_core.sql                       → profiles, accounts, categories, transactions, audit_logs
├── 002_events_contacts.sql            → events, participants, debts
├── 003_budget_goals.sql               → budgets, envelopes, goals, daily_budget_items
├── 004_wishlist_recurring.sql         → wishlists, recurring, subscriptions, reminders
├── 005_assets_investments.sql         → assets, investment_details, investment_transactions
├── 006_trips_extras.sql               → trips, trip_members, gifts, milestones, currencies
├── 007_seed.sql                       → seed currencies
├── 008_rls.sql                        → RLS policies
├── 009_functions_triggers.sql         → balance sync, audit, seed categories
├── 010_missing_tables.sql             → budget_periods, receipts
├── 011_asset_prices.sql               → asset_prices (cache TTL 15 menit)
├── 013_account_adjustments.sql        → kategori "Penyesuaian Saldo"
├── 014_biaya_transfer.sql             → kategori "Biaya Transfer"
├── 015_bond_update.sql                → tambah 'bond' ke assets
├── 016_split_bill_groups.sql          → groups, group_members, event_receipts
├── 017_split_bill_fixes.sql           → payer tracking
├── 018_wishlist_images.sql            → image_url, storage bucket
├── 019_wishlist_storage_and_internal_tx.sql → is_internal, envelope_id
├── 020_wishlist_envelope.sql          → envelope_account_id, linked_wishlist_id
└── 021_budget_name.sql                → kolom `name` di budgets
```

**⚠️ Migration 012 hilang** (lompat 011 → 013).

**Schema highlights:**
- `accounts.type` enum: cash, bank, ewallet, credit, paylater, investment, other, **envelope**
- `budgets.name` + `category_id` (nullable) + unique `(profile_id, name, month)`
- `transactions` punya 3 exclusion flag + `is_internal` + `internal_ref_type`

---

## 5. STATUS FITUR

### ✅ Selesai & Production-Ready

**Auth & Core:**
- Login + PIN unlock
- Dashboard (net worth, cash flow, investasi, daily budget, donut, trend)
- Transaksi (income/expense/transfer/refund/adjustment, bulk, filter, detail)
- Akun (topup, transfer, koreksi saldo, arsip) + **Envelope system**
- Kategori (CRUD + icon/color picker + grup)
- Audit Log (auto-trigger, filter, detail diff)
- Command Palette (Cmd+K)
- Hide Amounts (global toggle)

**Budget:**
- Budget Bulanan (per kategori, per bulan)
- Daily Budget (item harian)
- Income per bulan
- **AI Auto-Budgeting 50/30/20** ⭐

**Investasi:**
- Saham/Crypto/Reksadana/Emas/Obligasi
- Buy/Sell/Dividend
- Auto-fetch harga (Yahoo + CoinGecko, cache 15 menit)
- Portfolio summary + realized P/L

**Split Bill:**
- Wizard 4 step (Info → Items → Split → Review)
- Groups + multi-receipt
- Share card (1080×1920 image generator)
- Settle + debt auto-link

**Wishlist:**
- CRUD + image upload (Supabase Storage)
- Envelope integration (setor/tarik/purchase)
- Cooling-off 3 hari (urgent skip)
- Decision Framework (6 pertanyaan, skor)
- Auto-transition status
- Bell notif + drawer
- Detail page + riwayat transaksi
- **Statistics page** (trend, mood, decision, cooling-off, category, hour, top wins)

**Receipt OCR:**
- Nanonets integration
- Auto-fill transaksi (merchant, total, pajak, kategori)

**Settings:**
- Kategori CRUD
- Audit Log

### ❌ Belum Dibuat (Tabel Siap, UI Belum)

| Fitur | Tabel | Catatan |
|---|---|---|
| **Envelope** (full feature) | `envelopes` | Wishlist udah pake, tapi gak ada UI dedicated |
| **Goals** | `goals`, `goal_contributions` | |
| **Recurring** | `recurring` | |
| **Subscriptions** | `subscriptions` | |
| **Trips** | `trips`, `trip_members`, dst | **Dihide dari sidebar** - skip dulu |
| **Documents** | `documents` | |
| **Tax & Zakat** | `tax_records`, `zakat_records` | |
| **Gifts** | `gifts` | |
| **Milestones** | `milestones` | |
| **Reminders** | `reminders` | |
| **Notifications** | `notifications` | Bell udah jalan, tapi cuma cooling-off |
| **Contacts** | `contacts` | Manual entry di split bill |

### ⚠️ Placeholder

| Path | Status |
|---|---|
| `/reports` | Placeholder - pake RPC udah ada |
| `/cash-flow` | Placeholder - dashboard udah pake datanya |
| `/trips` | Placeholder - **hide dari sidebar** |
| `/settings` (profile, security, notifications, appearance, accounts, data) | Placeholder |

---

## 6. STRUKTUR FOLDER

```
app/
├── (app)/                          → authenticated
│   ├── dashboard/                  → ✅
│   ├── transactions/               → ✅
│   ├── accounts/                   → ✅
│   ├── budget/                     → ✅ + AI Auto-Budgeting
│   ├── investments/                → ✅
│   ├── split-bill/                 → ✅
│   ├── wishlist/                   → ✅
│   │   ├── statistics/             → ✅
│   │   └── [id]/                   → ✅
│   ├── receipts/                   → ✅
│   ├── settings/                   → ⚠️ partial
│   ├── cash-flow/                  → ❌ placeholder
│   ├── reports/                    → ❌ placeholder
│   ├── trips/                      → ❌ placeholder (HIDE)
│   └── financial-freedom/          → 🚧 TODO (next)
├── (auth)/                         → login, setup-pin, unlock
└── api/
    ├── investments/search/         → Yahoo + curated
    ├── ocr/scan/                   → Nanonets
    ├── ocr/file/[id]/              → proxy struk
    ├── budget/ai-allocate/         → ⭐ AI 50/30/20
    └── whishlist/fetch-og-image/   → ⚠️ typo folder

components/
├── accounts/, budget/, charts/, dashboard/, investments/
├── layout/, receipts/, settings/, shared/, split-bill/
├── transactions/, ui/, wishlist/
└── theme-provider.tsx (⚠️ pakai next-themes - ada warning React 19)

lib/
├── hooks/          → semua use-* hooks
├── investments/    → yahoo, coingecko, portfolio
├── ocr/            → nanonets, parse-receipt
├── split-bill/     → actions, calculator, use-events
├── supabase/       → client, server, middleware
├── stores/         → hide-amounts (Zustand)
├── utils/          → daily-budget, date-range, month, wishlist-stats
├── validators/     → account, auth, budget, category, investment, transaction, wishlist
└── notifications/  → actions, types
```

---

## 7. AI INTEGRATION - Groq

**Provider:** Groq SDK
**Model:** `openai/gpt-oss-120b` (paling bagus & cepet)
**API Key:** `GROQ_API_KEY` di `.env.local`

**Model alternatif (kalau perlu):**
- `openai/gpt-oss-20b` - cepet
- `qwen/qwen3.8-27b` - bagus, support multimodal
- `allam-2-7b` - kecil, cepet

**AI yang udah jalan:**
- **AI Auto-Budgeting 50/30/20** di `/budget` - classify, rebalance, distribute

**AI yang direncanakan:**
1. **AI Natural Language Query** - tanya pakai bahasa biasa, AI query DB
2. **AI Financial Advisor** - laporan naratif mingguan/bulanan
3. **AI Tips Harian** - 1 tips personal di dashboard
4. **AI Financial Freedom Coach** - bagian dari fitur Financial Freedom (below)

---

## 8. KNOWN ISSUES / TECH DEBT

- ⚠️ `next-themes` warning di React 19 (script tag) - FOUC, tapi gak ganggu
- ⚠️ Typo folder `app/api/whishlist/` → harus `wishlist`
- ⚠️ Migration 012 hilang
- ⚠️ Folder nested aneh: `supabase/migrations/supabase/config.toml`
- ⚠️ `components/ui/input.tsx` ada `style={{ color: undefined }}` - leftover
- ⚠️ `settings/security/page.tsx` judulnya salah ("Notifikasi")
- ⚠️ `use-masked-format.ts` import dobel
- ⚠️ Beberapa UI component import `cn` dari `"cn"` langsung, gak konsisten

---

## 9. NEXT FEATURE - FINANCIAL FREEDOM ⭐

### 🎯 Goal
Page yang bantu user capai **Financial Independence** - hitung, plan, action. Serasa financial coach pribadi.

### 📋 Keputusan User (Final)

| # | Aspek | Pilihan |
|---|---|---|
| 1 | **Data source expense** | **D** - Hybrid: auto-fill dari avg 3 bulan transactions, user bisa override |
| 2 | **FI Type** | **C** - Multi: Lean / Regular / Fat + Coast FI |
| 3 | **Target Retire** | **Dua-duanya** - ada target retire age DAN ability-based projection (kapan beneran bisa FI) |
| 4 | **Snapshot** | **B** - Simpan snapshot bulanan → chart progress over time |
| 5 | **Placement** | **D** - Dashboard card FI Progress + dedicated page di sidebar |
| 6 | **Nama** | **Financial Freedom** |
| 7 | **AI Advisor Update** | **C** - Manual refresh (user klik "Refresh Analysis") |
| 8 | **Coast FI** | **Ya** |

### 🏗️ Struktur Page (7 Section)

**Section 1 - Hero FI Progress**
- FI Number (Lean/Regular/Fat)
- Net Worth Now
- Progress %
- Estimated FI Date
- Progress bar visual

**Section 2 - FI Parameters (Setup)**
- Tipe FI (default: Regular 25×)
- Monthly Expense (auto dari avg 3 bulan, bisa override)
- Monthly Income (auto dari budget_periods, bisa override)
- Savings Rate (auto compute)
- Expected Return (default 10%)
- Inflation (default 3%)
- Current Age
- Target Retire Age (opsional)

**Section 3 - Compound Growth Chart**
- Line chart: Net worth path → FI date
- Legend: Current path, Projection, FI Number line

**Section 4 - Scenario Simulator**
- "Kalau savings rate naik ke X%, FI jadi kapan?"
- Multi scenario: 30%, 40%, 50%, 60%
- Visualisasi "tiap +10% savings rate = FI cepet 3-4 tahun"

**Section 5 - AI Financial Advisor** ⭐
- Pake Groq
- Analisis personal:
  - Status savings rate vs benchmark
  - Yang bisa diperbaiki (contoh: entertainment over)
  - Yang bisa ditingkatkan
  - Next milestone
- Update manual (user klik "Refresh Analysis")

**Section 6 - Milestones / Achievements**
- 10% FI → 20% → 25% → 50% → Coast FI → 100%
- Locked/unlocked state
- Kalo achieve milestone → kirim notif (via bell)

**Section 7 - Action Plan**
- 5 langkah konkret dari AI
- Progress tracker (2/5 done)
- Bisa update status per step

### 🗄️ Schema (Rencana)

**Tabel baru yang dibutuhkan:**

```sql
-- 1. financial_freedom_settings (1 row per profile)
CREATE TABLE financial_freedom_settings (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    profile_id uuid REFERENCES profiles,
    
    fi_type text DEFAULT 'regular' CHECK (fi_type IN ('lean', 'regular', 'fat', 'custom')),
    fi_multiplier numeric DEFAULT 25,  -- 20/25/33 atau custom
    
    monthly_expense_override numeric NULL,  -- null = auto dari avg 3 bulan
    monthly_income_override numeric NULL,
    
    expected_return_rate numeric DEFAULT 0.10,
    inflation_rate numeric DEFAULT 0.03,
    
    current_age int NULL,
    target_retire_age int NULL,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(profile_id)
);

-- 2. financial_freedom_snapshots (bulanan)
CREATE TABLE financial_freedom_snapshots (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    profile_id uuid REFERENCES profiles,
    
    snapshot_month text NOT NULL,  -- 'YYYY-MM'
    
    net_worth numeric NOT NULL,
    fi_number numeric NOT NULL,
    fi_progress numeric NOT NULL,  -- %
    savings_rate numeric NOT NULL,
    
    -- Untuk semua tipe FI
    lean_fi_progress numeric,
    regular_fi_progress numeric,
    fat_fi_progress numeric,
    coast_fi_progress numeric,
    
    estimated_fi_date date NULL,
    monthly_expense numeric NOT NULL,
    monthly_income numeric NOT NULL,
    
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(profile_id, snapshot_month)
);

-- 3. financial_freedom_insights (AI advisor output)
CREATE TABLE financial_freedom_insights (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    profile_id uuid REFERENCES profiles,
    
    generated_at timestamptz DEFAULT now(),
    
    -- Structured insight data
    overall_status text,
    savings_rate_analysis text,
    improvements jsonb,  -- array of {title, description, impact_estimate}
    next_milestone text,
    next_milestone_amount numeric,
    next_milestone_gap numeric,
    raw_ai_response jsonb,
    
    created_at timestamptz DEFAULT now()
);

-- 4. financial_freedom_milestones
CREATE TABLE financial_freedom_milestones (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    profile_id uuid REFERENCES profiles,
    
    milestone_type text,  -- 'fi_10', 'fi_25', 'fi_50', 'coast_fi', 'fi_100'
    milestone_label text,
    target_amount numeric NOT NULL,
    achieved_at timestamptz NULL,
    is_notified boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now()
);

-- 5. financial_freedom_action_steps
CREATE TABLE financial_freedom_action_steps (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    profile_id uuid REFERENCES profiles,
    
    title text NOT NULL,
    description text,
    impact_estimate text,  -- "FI cepet 8 bulan"
    is_done boolean DEFAULT false,
    done_at timestamptz NULL,
    sort_order int DEFAULT 0,
    
    created_at timestamptz DEFAULT now()
);
```

### 🎨 File Structure (Rencana)

```
app/(app)/financial-freedom/
└── page.tsx                          → Server page

components/financial-freedom/
├── financial-freedom-page.tsx        → Orchestrator
├── fi-hero.tsx                       → Section 1
├── fi-parameters.tsx                 → Section 2
├── fi-growth-chart.tsx               → Section 3
├── fi-scenario-simulator.tsx         → Section 4
├── fi-ai-advisor.tsx                 → Section 5
├── fi-milestones.tsx                 → Section 6
└── fi-action-plan.tsx                → Section 7

app/api/financial-freedom/
├── analyze/route.ts                  → AI Advisor (Groq)
└── snapshot/route.ts                 → Snapshot bulanan (cron)

lib/
├── validators/financial-freedom.ts
├── hooks/use-financial-freedom.ts
└── utils/financial-freedom.ts        → Compute FI number, projection, dll
```

### 🧮 Rumus FIRE

**FI Number:**
```
Lean FI     = 20 × Annual Expense
Regular FI  = 25 × Annual Expense  (default, 4% SWR)
Fat FI      = 33 × Annual Expense
```

**Coast FI Number** (udah "cukup" kalau berhenti nabung):
```
Coast FI = FI Number / (1 + return_rate)^(retire_age - current_age)
```

**Years to FI** (dengan compound):
```
Years = ln((FI × r / saving) + 1) / ln(1 + r)
where r = real return (return - inflation)
      saving = monthly savings amount
```

**Snapshot bulanan:** di-cron tanggal 1 tiap bulan (via Supabase cron / Vercel cron).

---

## 10. CARA KERJA DENGAN AI ASSISTANT

- **Bahasa:** Indonesia santai
- **Jawaban:** Langsung code + alasan singkat
- **Kalau ragu:** Tanya, jangan asumsi
- **Prioritaskan:** Solusi aman, scalable, sesuai schema
- **Mobile-first:** Banyak komponen pake `useMediaQuery`
- **Konsisten:** Ikuti konvensi yang udah ada
- **Full replace:** Kalau ganti file, kasih full content biar user tinggal paste
- **Jangan pernah paste:** secret, API key

**Flow yang user suka:**
1. Diskusi dulu (flow, schema, keputusan)
2. Baru coding (full file replace)
3. Test manual
4. Iterate

**Yang user gak suka:**
- Kode partial (harus gabungin manual)
- Asumsi tanpa tanya
- Refactor tanpa izin

---

## 11. CHANGELOG

- **2026-09-28** - Latest update. Snapshot context sebelumnya.
- **2026-09-29** - Wishlist final (Fase 1-3 + Decision Framework + Statistics). AI Auto-Budgeting 50/30/20. Migration 020, 021. Hide Trips dari sidebar. Plan Financial Freedom.

---

## 12. NEXT TASK - IMMEDIATE

**Feature:** Financial Freedom Page
**Status:** 🚧 Diskusi selesai, siap code
**Next step:** Bikin migration 022 (5 tabel), validators, hook, terus UI 7 section.

**Urutan implementasi:**
1. Migration `022_financial_freedom.sql` - 5 tabel
2. `lib/validators/financial-freedom.ts`
3. `lib/utils/financial-freedom.ts` - compute FI number, projection
4. `lib/hooks/use-financial-freedom.ts` - CRUD settings + snapshot
5. `app/api/financial-freedom/analyze/route.ts` - Groq AI advisor
6. `app/api/financial-freedom/snapshot/route.ts` - snapshot bulanan
7. UI components (7 section)
8. Dashboard card "FI Progress"
9. Sidebar menu "Financial Freedom"
10. Auto-milestone achievement check + notif

---

**EOF**
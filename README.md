# Synmony

**Second Brain for Your Money.**

Personal finance app — transaksi, budget, goals, utang, investasi, wishlist, split bill, dan Financial Freedom dalam satu sistem yang saling terhubung.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind v4, shadcn/ui
- **Backend:** Supabase (Postgres + Auth + RLS + Storage)
- **AI:** Groq (`openai/gpt-oss-120b`)
- **OCR:** Nanonets
- **Deploy:** Vercel (region `sin1`)

## Setup Lokal

### 1. Prasyarat

- Node.js 20+
- Supabase project (free tier cukup)
- Akun Groq + Nanonets (opsional, buat AI + OCR)

### 2. Install

```bash
npm install
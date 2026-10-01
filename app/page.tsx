import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Crown,
  Wallet,
  Target,
  Users,
  Heart,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Bot,
  Bell,
  ScanLine,
  LineChart,
  ShieldCheck,
  Zap,
  Check,
  Calendar,
  Trophy,
  ListChecks,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SynmonyMark } from '@/components/brand/synmony-logo'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user

  // ============================================================
  // Financial Freedom — SELLING POINT
  // ============================================================
  const ffFeatures = [
    {
      icon: Target,
      title: 'Hitung Target FI Lu',
      desc: 'Berapa uang yang lu butuhin buat berhenti kerja dan hidup dari passive income? Kami hitung dari pengeluaran bulanan lu.',
    },
    {
      icon: TrendingUp,
      title: 'Simulasi Pertumbuhan',
      desc: 'Lihat projection aset lu bertumbuh ke depan. Sampai kapan bisa FI kalau nabung segini per bulan?',
    },
    {
      icon: Bot,
      title: 'AI Financial Coach',
      desc: 'AI kasih saran personal, tunjuk mana yang bisa dihemat, dan susun langkah konkret buat lu.',
    },
    {
      icon: Trophy,
      title: 'Milestones & Progress',
      desc: 'Rayakan tiap pencapaian. 10%, 25%, 50%, sampai 100%. Ada notif otomatis tiap naik level.',
    },
    {
      icon: ListChecks,
      title: 'Action Plan 30-90 Hari',
      desc: 'Bukan cuma mimpi. AI susun 5 langkah konkret yang bisa lu eksekusi bulan ini.',
    },
    {
      icon: Sparkles,
      title: 'Coast FI',
      desc: 'Tau kapan lu bisa berhenti nabung, dan biarin compounding yang kerja buat lu.',
    },
  ]

  // ============================================================
  // Fitur user-friendly (no jargon)
  // ============================================================
  const features = [
    {
      icon: ScanLine,
      title: 'Catat Cepat, Auto dari Struk',
      desc: 'Foto struk apapun, langsung jadi transaksi lengkap dengan kategori, merchant, dan total.',
      color: '#334DAF',
    },
    {
      icon: Target,
      title: 'Budget yang Beneran Jalan',
      desc: 'AI bantu atur budget 50/30/20 sesuai gaya hidup lu. Ada tracking harian biar disiplin.',
      color: '#7096D1',
    },
    {
      icon: Users,
      title: 'Patungan Tanpa Drama',
      desc: 'Bagi bill makan, trip, atau kado. Auto-hitung share per orang, settle, dan share ke teman.',
      color: '#8b5cf6',
    },
    {
      icon: Heart,
      title: 'Beli Barang Tanpa Nyesel',
      desc: 'Wishlist dengan cooling-off 3 hari. Kalau masih pengen setelah itu, baru beli. Anti-impulse.',
      color: '#ef4444',
    },
    {
      icon: TrendingUp,
      title: 'Portofolio dalam 1 Dashboard',
      desc: 'Pantau saham, crypto, reksadana, emas, dan obligasi. Harga auto-update, gak perlu cek manual.',
      color: '#10b981',
    },
    {
      icon: Wallet,
      title: 'Semua Akun & Dompet Nyambung',
      desc: 'Dari bank, e-wallet, cash, sampai kantong nabung. Saldo auto-sync dengan transaksi.',
      color: '#f59e0b',
    },
  ]

  const highlights = [
    { icon: Sparkles, label: 'Financial Coach' },
    { icon: Bot, label: 'AI Powered' },
    { icon: ScanLine, label: 'Auto Struk' },
    { icon: Bell, label: 'Realtime Notif' },
    { icon: ShieldCheck, label: 'PIN Lock' },
    { icon: LineChart, label: 'Insight Personal' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#050F2E] dark:via-[#091F5C] dark:to-[#050F2E]">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <SynmonyMark size="md" />
            <span className="text-base font-bold tracking-tight">Synmony</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-lg bg-brand text-white text-xs md:text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                Buka Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex h-9 px-3 md:px-4 items-center text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-lg bg-brand text-white text-xs md:text-sm font-semibold hover:bg-brand-hover transition-colors"
                >
                  Coba Gratis
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand/10 blur-3xl" />
        </div>
        <div className="relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] md:text-xs font-bold uppercase tracking-widest mb-6">
            <Crown className="w-3.5 h-3.5" />
            Financial Freedom Coach
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5 md:mb-6">
            Bukan cuma catat.
            <br />
            <span className="bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
              Kami bantu lu bebas finansial.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 md:mb-10">
            Synmony itu second brain buat uang lu. Dari catat transaksi,
            atur budget, sampai rencana bebas finansial — semua dalam 1 tempat.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className={cn(
                'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl',
                'bg-gradient-to-br from-brand to-brand-hover text-white',
                'font-bold text-sm md:text-base',
                'shadow-lg shadow-brand/30 hover:shadow-xl hover:shadow-brand/40',
                'transition-all active:scale-[0.98]'
              )}
            >
              {isLoggedIn ? 'Buka Dashboard' : 'Mulai Gratis'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#financial-freedom"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border-2 border-border text-foreground font-bold text-sm md:text-base hover:bg-muted transition-colors"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              Lihat Financial Freedom
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap text-[11px] md:text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Gratis 100%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Gak perlu kartu kredit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Data aman di cloud
            </span>
          </div>
        </div>
      </section>

      {/* ============ HIGHLIGHTS STRIP ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-20">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {highlights.map((h) => {
            const Icon = h.icon
            return (
              <div
                key={h.label}
                className="rounded-xl border border-border bg-card p-3 md:p-4 flex flex-col items-center gap-2 hover:border-brand/30 transition-colors"
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                <p className="text-[10px] md:text-xs font-bold text-center leading-tight">
                  {h.label}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ FINANCIAL FREEDOM SECTION (HERO FEATURE) ============ */}
      <section
        id="financial-freedom"
        className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24 scroll-mt-20"
      >
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 via-amber-50/50 to-white dark:from-amber-500/[0.08] dark:via-amber-500/[0.03] dark:to-transparent p-6 md:p-12">
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Badge */}
            <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] md:text-xs font-bold uppercase tracking-widest">
                <Crown className="w-3.5 h-3.5" />
                Fitur Unggulan
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4">
                Perjalanan Menuju{' '}
                <span className="bg-gradient-to-r from-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
                  Merdeka Finansial
                </span>
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Kami hitung target lu, tunjukin progress, dan kasih rencana
                konkret. Bukan cuma mimpi — ada langkah nyatanya.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {ffFeatures.map((f) => {
                const Icon = f.icon
                return (
                  <div
                    key={f.title}
                    className="rounded-xl md:rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-white/70 dark:bg-white/[0.02] backdrop-blur-sm p-4 md:p-5 hover:border-amber-400/60 transition-colors flex items-start gap-3 md:gap-4"
                  >
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Icon
                        className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400"
                        strokeWidth={2.2}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm md:text-base font-bold mb-1 md:mb-1.5">
                        {f.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA in section */}
            <div className="text-center mt-8 md:mt-10">
              <Link
                href={isLoggedIn ? '/financial-freedom' : '/login'}
                className={cn(
                  'inline-flex items-center justify-center gap-2 h-11 md:h-12 px-6 rounded-xl',
                  'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
                  'font-bold text-sm md:text-base',
                  'shadow-lg shadow-amber-500/30 hover:shadow-xl',
                  'transition-all active:scale-[0.98]'
                )}
              >
                <Crown className="w-4 h-4" />
                {isLoggedIn ? 'Lihat Progress FI Lu' : 'Mulai Perjalanan FI'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ALL FEATURES ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-[11px] md:text-xs font-bold text-brand uppercase tracking-widest">
            Fitur Lengkap
          </span>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mt-2 md:mt-3 mb-3 md:mb-4">
            Semua yang Lu Butuhin, Saling Nyambung
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Bukan aplikasi terpisah-pisah. Tiap fitur connected dan bantu lu
            ngambil keputusan lebih baik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {ffFeatures.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-xl md:rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-white/70 dark:bg-white/[0.02] backdrop-blur-sm p-4 md:p-5 hover:border-amber-400/60 transition-colors"
              >
                {/* Icon + Title — sejajar */}
                <div className="flex items-center gap-3 md:gap-3.5 mb-2.5 md:mb-3">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Icon
                      className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400"
                      strokeWidth={2.2}
                    />
                  </div>
                  <h3 className="text-sm md:text-base font-bold">
                    {f.title}
                  </h3>
                </div>
                {/* Description full width */}
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-20">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-hover p-6 md:p-12 text-center shadow-xl shadow-brand/20">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-white/90 mx-auto mb-4" />
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-3 md:mb-4">
              Mulai Perjalanan Finansial Lu
            </h2>
            <p className="text-sm md:text-lg text-white/80 max-w-xl mx-auto mb-6 md:mb-8">
              Gak ada biaya. Gak ada ribet. Cuma lu, uang lu, dan masa depan
              yang lebih bebas.
            </p>
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className={cn(
                'inline-flex items-center justify-center gap-2 h-12 px-6 md:px-8 rounded-xl',
                'bg-white text-brand font-bold text-sm md:text-base',
                'shadow-lg hover:shadow-xl',
                'transition-all active:scale-[0.98]'
              )}
            >
              {isLoggedIn ? 'Buka Dashboard' : 'Coba Gratis Sekarang'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SynmonyMark size="sm" showDot={false} />
            <div>
              <p className="text-sm font-bold leading-tight">Synmony</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Second Brain for Your Money
              </p>
            </div>
          </div>
          <p className="text-[11px] md:text-xs text-muted-foreground">
            © {new Date().getFullYear()} Synmony
          </p>
        </div>
      </footer>
    </div>
  )
}
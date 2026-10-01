import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Wallet,
  Target,
  Crown,
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
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user

  const features = [
    {
      icon: Wallet,
      title: 'Transaksi & Akun',
      desc: 'Catat pemasukan, pengeluaran, transfer antar akun. Support multi-akun, kategori custom, dan OCR struk.',
      color: '#334DAF',
    },
    {
      icon: Target,
      title: 'Budget & Daily Budget',
      desc: 'Budget bulanan per kategori, daily budget harian, AI Auto-Budgeting 50/30/20.',
      color: '#7096D1',
    },
    {
      icon: Crown,
      title: 'Financial Freedom',
      desc: 'Hitung FI Number, projection compound growth, Coast FI, AI advisor, dan action plan konkret.',
      color: '#f59e0b',
    },
    {
      icon: Users,
      title: 'Split Bill',
      desc: 'Patungan makan, trip, atau kado. Auto-hitung share per orang, settle otomatis, share via link.',
      color: '#8b5cf6',
    },
    {
      icon: Heart,
      title: 'Wishlist Cerdas',
      desc: 'Cooling-off 3 hari, decision framework 6 pertanyaan, envelope saving, statistics anti-impulse.',
      color: '#ef4444',
    },
    {
      icon: TrendingUp,
      title: 'Investasi Portfolio',
      desc: 'Track saham, crypto, reksadana, emas, obligasi. Auto-fetch harga real-time dari Yahoo & CoinGecko.',
      color: '#10b981',
    },
  ]

  const highlights = [
    { icon: Bot, label: 'AI-Powered', desc: 'Advisor & auto-budget' },
    { icon: Bell, label: 'Realtime Notif', desc: 'Milestone & cooling-off' },
    { icon: ScanLine, label: 'OCR Struk', desc: 'Auto-fill transaksi' },
    { icon: LineChart, label: 'Deep Analytics', desc: 'Trend & insight' },
    { icon: ShieldCheck, label: 'PIN Lock', desc: 'Keamanan berlapis' },
    { icon: Zap, label: 'Multi-Profile', desc: 'Personal & bisnis' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#050F2E] dark:via-[#091F5C] dark:to-[#050F2E]">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center font-bold text-base text-white shadow-md shadow-brand/30">
              S
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
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
      <section className="relative max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-20">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand/10 blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-[11px] md:text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Your Second Brain for Your Money
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5 md:mb-6">
            Semua tentang uang lu,
            <br />
            <span className="bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
              dalam satu sistem.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 md:mb-10">
            Transaksi, budget, aset, investasi, dan tujuan — terhubung dalam
            harmoni. Bukan sekadar pencatat, tapi <strong className="text-foreground">financial
              coach</strong> yang bantu lu capai kebebasan finansial.
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
              {isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang, Gratis'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border-2 border-border text-foreground font-bold text-sm md:text-base hover:bg-muted transition-colors"
            >
              Lihat Fitur
            </a>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground">
            Gak perlu kartu kredit. 100% gratis buat personal use.
          </p>
        </div>

        {/* Highlights strip */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mt-12 md:mt-20">
          {highlights.map((h) => {
            const Icon = h.icon
            return (
              <div
                key={h.label}
                className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-4 text-center hover:border-brand/30 transition-colors"
              >
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                </div>
                <p className="text-[11px] md:text-xs font-bold leading-tight mb-0.5 md:mb-1">
                  {h.label}
                </p>
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-tight">
                  {h.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-[11px] md:text-xs font-bold text-brand uppercase tracking-widest">
            Fitur Lengkap
          </span>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mt-2 md:mt-3 mb-3 md:mb-4">
            Semua yang Lu Butuhin
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Dari catat transaksi sampai financial coaching. Saling terhubung,
            bukan aplikasi terpisah-pisah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-5 md:p-6 hover:border-brand/30 hover:shadow-md transition-all"
              >
                <div
                  className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-4 md:mb-5"
                  style={{ backgroundColor: `${f.color}15` }}
                >
                  <Icon
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: f.color }}
                    strokeWidth={2.2}
                  />
                </div>
                <h3 className="text-sm md:text-base font-bold mb-1.5 md:mb-2">
                  {f.title}
                </h3>
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
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-3 md:mb-4">
              Siap Mulai Perjalanan Finansial Lu?
            </h2>
            <p className="text-sm md:text-lg text-white/80 max-w-xl mx-auto mb-6 md:mb-8">
              Gabung sekarang dan rasakan bedanya. Free, no credit card.
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
              {isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center font-bold text-xs text-white">
              S
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Synmony</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Your Second Brain for Your Money
              </p>
            </div>
          </div>
          <p className="text-[11px] md:text-xs text-muted-foreground">
            © {new Date().getFullYear()} Synmony. Made with{' '}
            <span className="text-red-500">♥</span> in Indonesia.
          </p>
        </div>
      </footer>
    </div>
  )
}
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SynmonyMark } from '@/components/brand/synmony-logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <SynmonyMark size="md" className="w-9 h-9 transition-transform group-hover:scale-105" />
                        <span className="text-base font-bold tracking-tight">Synmony</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Kembali
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>

            {/* Footer */}
            <footer className="border-t border-border/60 mt-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground">
                        © {new Date().getFullYear()} Synmony · Second Brain for Your Money
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Kebijakan Privasi
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Syarat &amp; Ketentuan
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
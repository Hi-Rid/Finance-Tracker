import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { AuthGuard } from '@/components/shared/auth-guard'
import { CommandPalette } from '@/components/shared/command-palette'
import { syncCoolingOffNotifications } from '@/lib/notifications/actions'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Auto-sync cooling-off tiap user buka page baru.
  // Idempotent — pakai dedup_key di DB, jadi gak bakal dobel.
  await syncCoolingOffNotifications(user.id)

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen bg-background">
        <div className="app-bg-blob" aria-hidden />

        <Sidebar userEmail={user.email} />

        <div className="relative flex-1 flex flex-col min-w-0">
          <Header userEmail={user.email} />

          <main className="relative flex-1 pb-36 md:pb-8 px-4 md:px-8">
            {children}
          </main>

          <BottomNav />
        </div>
      </div>
      <CommandPalette />
    </AuthGuard>
  )
}
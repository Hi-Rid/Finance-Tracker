import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { AuthGuard } from '@/components/shared/auth-guard'
import { CommandPalette } from '@/components/shared/command-palette'

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

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen bg-background">
        {/* Background gradient blobs */}
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
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { AccountsList } from '@/components/accounts/accounts-list'

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Ambil profile default
  const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_default', true)
  .order('created_at', { ascending: true })
  .limit(1)

  const profile = profiles?.[0]

  if (!profile) {
    return (
      <PageWrapper>
        <PageHeader
          title="Akun"
          description="Belum ada profile. Bikin profile dulu di settings."
        />
      </PageWrapper>
    )
  }

  // Ambil accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  return (
    <PageWrapper>
      <PageHeader
        title="Akun"
        description="Semua dompet, rekening, dan e-wallet lu"
      />
      <AccountsList accounts={accounts || []} profileId={profile.id} />
    </PageWrapper>
  )
}
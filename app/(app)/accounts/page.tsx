import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { AccountsPage } from '@/components/accounts/accounts-page'
import type { Database } from '@/types/database'

type Debt = Database['public']['Tables']['debts']['Row']

export default async function AccountsPageContainer() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Profile default
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

  const [accountsRes, categoriesRes, debtsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_archived', false)
      .neq('type', 'envelope')
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'income')
      .eq('is_archived', false)
      .order('sort_order')
      .order('name'),
    supabase
      .from('debts')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false }),
  ])

  const accounts = accountsRes.data || []

  // Cek akun mana yang udah punya transaksi
  let accountHasTx: Record<string, boolean> = {}
  if (accounts.length > 0) {
    const accountIds = accounts.map((a) => a.id)
    const { data: txCounts } = await supabase
      .from('transactions')
      .select('account_id, to_account_id')
      .eq('profile_id', profile.id)
      .eq('is_deleted', false)
      .or(
        `account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`
      )

    for (const tx of txCounts || []) {
      if (tx.account_id) accountHasTx[tx.account_id] = true
      if (tx.to_account_id) accountHasTx[tx.to_account_id] = true
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Akun"
        description="Semua dompet, rekening, dan e-wallet lu"
      />
      <AccountsPage
        accounts={accounts}
        incomeCategories={categoriesRes.data || []}
        accountHasTx={accountHasTx}
        debts={(debtsRes.data || []) as Debt[]}
        profileId={profile.id}
      />
    </PageWrapper>
  )
}
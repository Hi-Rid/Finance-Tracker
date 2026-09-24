import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { TransactionsList } from '@/components/transactions/transactions-list'

export default async function TransactionsPage() {
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
          title="Transaksi"
          description="Belum ada profile. Bikin profile dulu."
        />
      </PageWrapper>
    )
  }

  // Fetch all in parallel
  const [
    accountsRes,
    categoriesRes,
    transactionsRes,
    receiptsRes,
    dailyItemsRes,
  ] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_archived', false)
      .order('created_at'),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(1000),
    supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .not('transaction_id', 'is', null),
    supabase
      .from('daily_budget_items')
      .select('*')
      .eq('profile_id', profile.id)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <PageWrapper>
      <PageHeader
        title="Transaksi"
        description="Semua pemasukan & pengeluaran lu"
      />
      <TransactionsList
        transactions={transactionsRes.data || []}
        accounts={accountsRes.data || []}
        categories={categoriesRes.data || []}
        receipts={receiptsRes.data || []}
        dailyItems={dailyItemsRes.data || []}
        profileId={profile.id}
      />
    </PageWrapper>
  )
}
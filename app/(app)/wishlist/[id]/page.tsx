import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { WishlistDetail } from '@/components/wishlist/wishlist-detail'
import { ensureUserSetup } from '@/lib/utils/ensure-user-setup'

type PageProps = {
    params: Promise<{ id: string }>
}

export default async function WishlistDetailPage({ params }: PageProps) {
    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { profileId } = await ensureUserSetup(user.id)
    if (!profileId) redirect('/wishlist')

    // 1. Fetch wishlist
    const { data: wishlist } = await supabase
        .from('wishlists')
        .select('*')
        .eq('id', id)
        .eq('profile_id', profileId)
        .maybeSingle()

    if (!wishlist) notFound()

    // 2. Fetch envelope + transactions + accounts in parallel
    const [envelopeRes, transactionsRes, accountsRes] = await Promise.all([
        wishlist.envelope_account_id
            ? supabase
                .from('accounts')
                .select('*')
                .eq('id', wishlist.envelope_account_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),

        // Riwayat transaksi internal yang berhubungan dengan wishlist ini
        wishlist.envelope_account_id
            ? supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .or(
                    `internal_ref_id.eq.${wishlist.envelope_account_id},and(internal_ref_id.eq.${id},internal_ref_type.eq.wishlist_purchase)`
                )
                .order('date', { ascending: false })
            : Promise.resolve({ data: [] }),

        supabase
            .from('accounts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .neq('type', 'envelope')
            .order('created_at'),
    ])

    return (
        <PageWrapper>
            <WishlistDetail
                wishlist={wishlist}
                envelope={envelopeRes.data}
                transactions={transactionsRes.data || []}
                accounts={accountsRes.data || []}
                profileId={profileId}
            />
        </PageWrapper>
    )
}
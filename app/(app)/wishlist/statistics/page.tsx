import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { WishlistStatistics } from '@/components/wishlist/wishlist-statistics'
import { ensureUserSetup } from '@/lib/utils/ensure-user-setup'

export default async function WishlistStatisticsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { profileId } = await ensureUserSetup(user.id)
    if (!profileId) redirect('/wishlist')

    const { data: wishlists } = await supabase
        .from('wishlists')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

    return (
        <PageWrapper>
            <WishlistStatistics wishlists={wishlists || []} />
        </PageWrapper>
    )
}
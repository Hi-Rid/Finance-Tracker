import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { WishlistList } from '@/components/wishlist/wishlist-list'
import { ensureUserSetup } from '@/lib/utils/ensure-user-setup'

export default async function WishlistPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { profileId } = await ensureUserSetup(user.id)

    if (!profileId) {
        return (
            <PageWrapper>
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                        Gagal setup profile. Coba refresh.
                    </p>
                </div>
            </PageWrapper>
        )
    }

    const { data: wishlists } = await supabase
        .from('wishlists')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

    return (
        <PageWrapper>
            <PageHeader
                title="Wishlist"
                description="Barang yang pengen lu beli — direncanain dengan cermat"
            />
            <WishlistList
                wishlists={wishlists || []}
                profileId={profileId}
            />
        </PageWrapper>
    )
}
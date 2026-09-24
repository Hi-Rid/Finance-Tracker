import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoryList } from '@/components/settings/category-list'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type')
        .order('group_name')
        .order('sort_order')
        .order('name')

    return <CategoryList categories={categories || []} />
}
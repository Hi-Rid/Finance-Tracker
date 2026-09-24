import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuditLogList } from '@/components/settings/audit-log-list'

export default async function AuditLogPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500)

    return <AuditLogList logs={logs || []} />
}
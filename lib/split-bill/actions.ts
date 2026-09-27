import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type EventListItem = {
    id: string
    name: string
    date: string
    grand_total: number
    user_share: number
    currency: string
    group_id: string | null
    participants_count: number
    unpaid_count: number
}

export async function getEventList(
    profileId: string
): Promise<EventListItem[]> {
    const supabase = await createClient()

    const { data: events } = await supabase
        .from('events')
        .select('id, name, date, grand_total, user_share, currency, group_id')
        .eq('profile_id', profileId)
        .order('date', { ascending: false })
        .limit(200)

    if (!events || events.length === 0) return []

    const eventIds = events.map((e) => e.id)

    const { data: participants } = await supabase
        .from('event_participants')
        .select('event_id, paid')
        .in('event_id', eventIds)

    const statsMap = new Map<string, { total: number; unpaid: number }>()
    for (const p of participants || []) {
        const s = statsMap.get(p.event_id) || { total: 0, unpaid: 0 }
        s.total++
        if (!p.paid) s.unpaid++
        statsMap.set(p.event_id, s)
    }

    return events.map((e) => {
        const s = statsMap.get(e.id) || { total: 0, unpaid: 0 }
        return {
            ...e,
            grand_total: Number(e.grand_total),
            user_share: Number(e.user_share),
            participants_count: s.total,
            unpaid_count: s.unpaid,
        }
    })
}

export type EventDetailData = {
    event: any
    items: any[]
    participants: any[]
    itemShares: any[]
    receipts: any[]
    transaction: any | null
    debts: any[]
    account: any | null
    group: any | null
    payer_participant: any | null
}

export async function getEventDetail(
    eventId: string,
    profileId: string
): Promise<EventDetailData | null> {
    const supabase = await createClient()

    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('profile_id', profileId)
        .maybeSingle()

    if (!event) return null

    const payerParticipantRes = event.payer_participant_id
        ? await supabase
            .from('event_participants')
            .select('*')
            .eq('id', event.payer_participant_id)
            .maybeSingle()
        : { data: null }

    const [itemsRes, participantsRes, itemSharesRes, eventReceiptsRes, debtsRes] =
        await Promise.all([
            supabase
                .from('event_items')
                .select('*')
                .eq('event_id', eventId)
                .order('sort_order', { ascending: true }),
            supabase
                .from('event_participants')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true }),
            supabase
                .from('event_item_shares')
                .select('*')
                .in(
                    'item_id',
                    (
                        await supabase
                            .from('event_items')
                            .select('id')
                            .eq('event_id', eventId)
                    ).data?.map((i) => i.id) || []
                ),
            supabase
                .from('event_receipts')
                .select('*, receipts(*)')
                .eq('event_id', eventId)
                .order('sort_order', { ascending: true }),
            supabase
                .from('debts')
                .select('*')
                .eq('profile_id', profileId)
                .like('name', `%${event.name}%`)
                .in('status', ['active', 'paid']),
        ])

    const [transactionRes, accountRes, groupRes] = await Promise.all([
        event.transaction_id
            ? supabase
                .from('transactions')
                .select('*')
                .eq('id', event.transaction_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        event.account_id
            ? supabase
                .from('accounts')
                .select('*')
                .eq('id', event.account_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        event.group_id
            ? supabase
                .from('groups')
                .select('*')
                .eq('id', event.group_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
    ])

    return {
        event,
        items: itemsRes.data || [],
        participants: participantsRes.data || [],
        itemShares: itemSharesRes.data || [],
        receipts: (eventReceiptsRes.data || []).map((er: any) => er.receipts).filter(Boolean),
        transaction: transactionRes.data,
        debts: debtsRes.data || [],
        account: accountRes.data,
        group: groupRes.data,
        payer_participant: payerParticipantRes.data,
    }
}
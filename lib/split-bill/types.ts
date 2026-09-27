import type { Database } from '@/types/database'

export type EventRow = Database['public']['Tables']['events']['Row']
export type EventItemRow = Database['public']['Tables']['event_items']['Row']
export type EventParticipantRow = Database['public']['Tables']['event_participants']['Row']
export type EventReceiptRow = Database['public']['Tables']['event_receipts']['Row']
export type GroupRow = Database['public']['Tables']['groups']['Row']
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row']

export type SplitMode = 'equal' | 'per_item' | 'custom' | 'percentage'
export type TaxDistribution = 'proportional' | 'equal'

export type ParticipantInput = {
    temp_id: string
    display_name: string
    is_user: boolean
    contact_id?: string | null
}

export type ItemInput = {
    temp_id: string
    name: string
    quantity: number
    unit_price: number
    assigned_to: string[]
}

export type SplitConfig = {
    mode: SplitMode
    tax_distribution: TaxDistribution
    custom_amounts?: Record<string, number>
    percentages?: Record<string, number>
}

export type EventWizardData = {
    name: string
    date: string
    group_id: string | null
    /** temp_id peserta yang bayar dulu */
    payer_participant_id: string
    ppn_rate: number
    service_rate: number
    discount_amount: number
    currency: string
    account_id: string | null
    note?: string
    participants: ParticipantInput[]
    items: ItemInput[]
    split: SplitConfig
    receipt_ids: string[]
}

export type ComputedShare = {
    temp_id: string
    display_name: string
    is_user: boolean
    is_payer: boolean
    subtotal: number
    ppn_share: number
    service_share: number
    discount_share: number
    total_share: number
}

export type ComputeResult = {
    participants: ComputedShare[]
    subtotal: number
    ppn_amount: number
    service_amount: number
    discount_amount: number
    grand_total: number
    user_share: number
    payer_is_user: boolean
    payer_name: string
    /**
     * Piutang ke peserta lain — cuma terisi kalau USER yang bayar.
     * Format: list peserta non-user dengan amount = total_share.
     */
    receivables: Array<{
        temp_id: string
        display_name: string
        amount: number
    }>
    /**
     * Utang user ke payer — cuma terisi kalau PAYER bukan user.
     * amount = user_share
     */
    user_payable: number
}

export type ScanApplyMode = 'append' | 'replace'

export type ParticipantBreakdown = {
    participant_id: string
    display_name: string
    is_user: boolean
    is_payer: boolean
    paid: boolean
    items: Array<{
        name: string
        quantity: number
        share_amount: number
    }>
    items_total: number
    grand_total_share: number
}
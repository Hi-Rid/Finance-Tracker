import type {
    ComputeResult,
    ComputedShare,
    EventWizardData,
} from './types'

export function computeEventShares(data: EventWizardData): ComputeResult {
    const {
        participants,
        items,
        ppn_rate,
        service_rate,
        discount_amount,
        split,
        payer_participant_id,
    } = data

    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
    )

    const ppn_amount = Math.round(subtotal * ppn_rate)
    const service_amount = Math.round(subtotal * service_rate)
    const grand_total = subtotal + ppn_amount + service_amount - discount_amount

    const subtotals: Record<string, number> = {}
    participants.forEach((p) => {
        subtotals[p.temp_id] = 0
    })

    if (participants.length === 0) {
        return {
            participants: [],
            subtotal,
            ppn_amount,
            service_amount,
            discount_amount,
            grand_total,
            user_share: 0,
            payer_is_user: true,
            payer_name: '',
            receivables: [],
            user_payable: 0,
        }
    }

    const n = participants.length

    if (split.mode === 'equal') {
        const sharePerPerson = subtotal / n
        participants.forEach((p) => {
            subtotals[p.temp_id] = sharePerPerson
        })
    } else if (split.mode === 'per_item') {
        items.forEach((item) => {
            const itemSubtotal = item.quantity * item.unit_price
            const assignees =
                item.assigned_to.length > 0
                    ? item.assigned_to.filter((id) =>
                        participants.some((p) => p.temp_id === id)
                    )
                    : participants.map((p) => p.temp_id)

            if (assignees.length === 0) {
                const sharePerPerson = itemSubtotal / n
                participants.forEach((p) => {
                    subtotals[p.temp_id] += sharePerPerson
                })
                return
            }

            const sharePerPerson = itemSubtotal / assignees.length
            assignees.forEach((pid) => {
                subtotals[pid] += sharePerPerson
            })
        })
    } else if (split.mode === 'custom') {
        participants.forEach((p) => {
            const total = split.custom_amounts?.[p.temp_id] || 0
            const divisor = 1 + ppn_rate + service_rate
            subtotals[p.temp_id] = divisor > 0 ? total / divisor : 0
        })
    } else if (split.mode === 'percentage') {
        participants.forEach((p) => {
            const pct = split.percentages?.[p.temp_id] || 0
            subtotals[p.temp_id] = subtotal * (pct / 100)
        })
    }

    const totalSubtotal = Object.values(subtotals).reduce((a, b) => a + b, 0)

    const computed: ComputedShare[] = participants.map((p) => {
        const pSubtotal = subtotals[p.temp_id] || 0

        let ppn_share = 0
        let service_share = 0
        let discount_share = 0

        if (split.tax_distribution === 'proportional') {
            const ratio = totalSubtotal > 0 ? pSubtotal / totalSubtotal : 1 / n
            ppn_share = ppn_amount * ratio
            service_share = service_amount * ratio
            discount_share = discount_amount * ratio
        } else {
            ppn_share = ppn_amount / n
            service_share = service_amount / n
            discount_share = discount_amount / n
        }

        const total_share =
            pSubtotal + ppn_share + service_share - discount_share

        return {
            temp_id: p.temp_id,
            display_name: p.display_name,
            is_user: p.is_user,
            is_payer: p.temp_id === payer_participant_id,
            subtotal: Math.round(pSubtotal),
            ppn_share: Math.round(ppn_share),
            service_share: Math.round(service_share),
            discount_share: Math.round(discount_share),
            total_share: Math.round(total_share),
        }
    })

    // ============ User & Payer info ============
    const userShare = computed.find((c) => c.is_user)?.total_share || 0
    const payer = computed.find((c) => c.is_payer)
    const payer_is_user = payer?.is_user ?? true
    const payer_name = payer?.display_name || ''

    // ============ Receivables (hanya kalau user yang bayar) ============
    const receivables = payer_is_user
        ? computed
            .filter((c) => !c.is_user)
            .map((c) => ({
                temp_id: c.temp_id,
                display_name: c.display_name,
                amount: c.total_share,
            }))
        : []

    // ============ User payable (kalau payer bukan user) ============
    const user_payable = !payer_is_user ? userShare : 0

    return {
        participants: computed,
        subtotal,
        ppn_amount,
        service_amount,
        discount_amount,
        grand_total,
        user_share: userShare,
        payer_is_user,
        payer_name,
        receivables,
        user_payable,
    }
}
export type NotificationType =
    | 'cooling_off_done'
    | 'saving_ready'
    | 'saving_reminder'
    | 'budget_over'
    | 'bill_reminder'
    | 'piutang_due'
    | 'custom'

export type NotificationRow = {
    id: string
    user_id: string
    type: string
    title: string
    body: string | null
    link: string | null
    icon: string | null
    is_read: boolean
    dedup_key: string | null
    created_at: string
}

export type CreateNotificationInput = {
    userId: string
    type: NotificationType
    title: string
    body?: string
    link?: string
    icon?: string
    dedupKey?: string
}
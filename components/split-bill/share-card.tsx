'use client'

import { formatRupiah } from '@/lib/normalize'
import type { EventDetailData } from '@/lib/split-bill/actions'

type ShareCardProps = {
    data: EventDetailData
    innerRef?: React.Ref<HTMLDivElement>
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
    '#334DAF',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ef4444',
    '#0ea5e9',
    '#ec4899',
    '#14b8a6',
]

const MAX_PARTICIPANTS = 12
const MAX_ITEMS = 10

function formatDateLong(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

export function ShareCard({ data, innerRef }: ShareCardProps) {
    const { event, items, participants } = data

    const sorted = [...participants].sort((a: any, b: any) => {
        if (a.is_payer && !a.is_user) return -1
        if (b.is_payer && !b.is_user) return 1
        if (a.is_user) return -1
        if (b.is_user) return 1
        return 0
    })

    const displayParticipants = sorted.slice(0, MAX_PARTICIPANTS)
    const hiddenParticipants = sorted.length - displayParticipants.length

    const displayItems = items.slice(0, MAX_ITEMS)
    const hiddenItems = items.length - displayItems.length

    return (
        <div
            ref={innerRef}
            style={{
                width: 1080,
                minHeight: 1920,
                background: '#F9FBFF',
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
                padding: '64px 56px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Ambient decor */}
            <div
                style={{
                    position: 'absolute',
                    top: -200,
                    right: -200,
                    width: 900,
                    height: 900,
                    background:
                        'radial-gradient(circle, rgba(51,77,175,0.10) 0%, rgba(51,77,175,0) 55%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: -250,
                    left: -250,
                    width: 900,
                    height: 900,
                    background:
                        'radial-gradient(circle, rgba(112,150,209,0.12) 0%, rgba(112,150,209,0) 55%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Main card */}
            <div
                style={{
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(9,31,92,0.08)',
                    borderRadius: 32,
                    padding: '56px 56px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 24px 60px rgba(9,31,92,0.06)',
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 48,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background:
                                    'linear-gradient(135deg, #7096D1 0%, #334DAF 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: 26,
                                letterSpacing: '-0.04em',
                                boxShadow: '0 8px 20px rgba(51,77,175,0.30)',
                            }}
                        >
                            S
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                lineHeight: 1,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: '#091F5C',
                                    letterSpacing: '-0.025em',
                                }}
                            >
                                Synmony
                            </span>
                            <span
                                style={{
                                    fontSize: 14,
                                    color: '#334DAF',
                                    fontWeight: 500,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                    marginTop: 6,
                                }}
                            >
                                Split Bill Receipt
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '12px 22px',
                            background: 'rgba(51,77,175,0.08)',
                            borderRadius: 100,
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#334DAF',
                            letterSpacing: '0.02em',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {formatDateShort(event.date)}
                    </div>
                </div>

                {/* Event name */}
                <div style={{ marginBottom: 48 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: '#10b981',
                                boxShadow: '0 0 12px rgba(16,185,129,0.7)',
                            }}
                        />
                        <span
                            style={{
                                fontSize: 17,
                                fontWeight: 600,
                                color: '#10b981',
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Event
                        </span>
                    </div>

                    <div
                        style={{
                            fontSize: 96,
                            fontWeight: 800,
                            color: '#091F5C',
                            letterSpacing: '-0.045em',
                            lineHeight: 1,
                            marginBottom: 24,
                        }}
                    >
                        {event.name}
                    </div>

                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 400,
                            color: '#64748B',
                        }}
                    >
                        {formatDateLong(event.date)} · {formatTime(event.date)}
                    </div>
                </div>

                {/* Grand Total */}
                <div
                    style={{
                        background:
                            'linear-gradient(135deg, #091F5C 0%, #1F3680 100%)',
                        borderRadius: 28,
                        padding: '44px 44px 48px',
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: 48,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: -100,
                            right: -100,
                            width: 320,
                            height: 320,
                            background:
                                'radial-gradient(circle, rgba(112,150,209,0.4) 0%, rgba(112,150,209,0) 60%)',
                        }}
                    />
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 500,
                                color: '#A8C5E8',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                marginBottom: 24,
                            }}
                        >
                            Grand Total
                        </div>
                        <div
                            style={{
                                fontSize: 104,
                                fontWeight: 800,
                                color: '#FFFFFF',
                                letterSpacing: '-0.045em',
                                lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {formatRupiah(Number(event.grand_total))}
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 400,
                                color: '#7096D1',
                                marginTop: 24,
                            }}
                        >
                            {items.length} item · {participants.length} peserta
                        </div>
                    </div>
                </div>

                {/* SECTION 01 */}
                <SectionHeader num="01" label="Pembagian Per Orang" />

                <div style={{ marginBottom: 56 }}>
                    {displayParticipants.map((p: any, idx: number) => {
                        const isUser = p.is_user
                        const isPayer = p.is_payer || false
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]

                        return (
                            <div
                                key={p.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 22,
                                    padding: '22px 24px',
                                    background: isUser
                                        ? 'linear-gradient(135deg, rgba(51,77,175,0.06) 0%, rgba(51,77,175,0.01) 100%)'
                                        : '#F9FBFF',
                                    border: isUser
                                        ? '2px solid rgba(51,77,175,0.22)'
                                        : '1.5px solid rgba(9,31,92,0.06)',
                                    borderRadius: 22,
                                    marginBottom: 14,
                                }}
                            >
                                {/* Avatar */}
                                <div
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 20,
                                        background: isUser
                                            ? 'linear-gradient(135deg, #7096D1 0%, #334DAF 100%)'
                                            : avatarColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: 24,
                                        fontWeight: 700,
                                        letterSpacing: '-0.02em',
                                        flexShrink: 0,
                                        boxShadow: isUser
                                            ? '0 8px 22px rgba(51,77,175,0.30)'
                                            : '0 4px 12px rgba(9,31,92,0.10)',
                                    }}
                                >
                                    {getInitials(p.display_name)}
                                </div>

                                {/* Name + payer badge */}
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 32,
                                            fontWeight: 600,
                                            color: '#091F5C',
                                            letterSpacing: '-0.02em',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {p.display_name}
                                    </span>
                                    {isPayer && !isUser && (
                                        <span
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: '#FFFFFF',
                                                background: '#F59E0B',
                                                padding: '6px 14px',
                                                borderRadius: 100,
                                                letterSpacing: '0.08em',
                                            }}
                                        >
                                            TALANGIN
                                        </span>
                                    )}
                                </div>

                                {/* Amount */}
                                <div
                                    style={{
                                        fontSize: 36,
                                        fontWeight: 800,
                                        color: isUser ? '#334DAF' : '#091F5C',
                                        letterSpacing: '-0.03em',
                                        fontVariantNumeric: 'tabular-nums',
                                        flexShrink: 0,
                                    }}
                                >
                                    {formatRupiah(Number(p.total_share))}
                                </div>
                            </div>
                        )
                    })}

                    {hiddenParticipants > 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '16px 0',
                                fontSize: 18,
                                fontWeight: 400,
                                color: '#94a3b8',
                                fontStyle: 'italic',
                            }}
                        >
                            +{hiddenParticipants} peserta lainnya
                        </div>
                    )}
                </div>

                {/* SECTION 02 */}
                {items.length > 0 && (
                    <>
                        <SectionHeader
                            num="02"
                            label="Detail Item"
                            count={items.length}
                        />

                        <div style={{ marginBottom: 56 }}>
                            <div
                                style={{
                                    background: '#F9FBFF',
                                    border: '1.5px solid rgba(9,31,92,0.06)',
                                    borderRadius: 22,
                                    padding: '8px 28px',
                                }}
                            >
                                {displayItems.map((item: any, i: number) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 24,
                                            padding: '22px 0',
                                            borderBottom:
                                                i < displayItems.length - 1
                                                    ? '2px dashed rgba(9,31,92,0.08)'
                                                    : 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: '#334DAF',
                                                fontVariantNumeric: 'tabular-nums',
                                                letterSpacing: '0.05em',
                                                flexShrink: 0,
                                                width: 44,
                                            }}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: 28,
                                                    fontWeight: 600,
                                                    color: '#091F5C',
                                                    letterSpacing: '-0.02em',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {item.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 20,
                                                    color: '#64748B',
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 400,
                                                    marginTop: 6,
                                                }}
                                            >
                                                {item.quantity} ×{' '}
                                                {formatRupiah(Number(item.unit_price))}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: 28,
                                                fontWeight: 700,
                                                color: '#091F5C',
                                                fontVariantNumeric: 'tabular-nums',
                                                letterSpacing: '-0.025em',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {formatRupiah(Number(item.subtotal))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hiddenItems > 0 && (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '16px 0',
                                        fontSize: 18,
                                        fontWeight: 400,
                                        color: '#94a3b8',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    +{hiddenItems} item lainnya
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* SECTION 03 */}
                <SectionHeader num="03" label="Rincian" />

                <div style={{ marginBottom: 48 }}>
                    <div
                        style={{
                            background: '#F9FBFF',
                            border: '1.5px solid rgba(9,31,92,0.06)',
                            borderRadius: 22,
                            padding: '16px 32px',
                        }}
                    >
                        <BreakRow
                            label="Subtotal"
                            value={formatRupiah(Number(event.subtotal))}
                        />
                        {Number(event.ppn_amount) > 0 && (
                            <BreakRow
                                label={`PPN ${(Number(event.ppn_rate) * 100).toFixed(0)}%`}
                                value={formatRupiah(Number(event.ppn_amount))}
                            />
                        )}
                        {Number(event.service_amount) > 0 && (
                            <BreakRow
                                label={`Service ${(Number(event.service_rate) * 100).toFixed(0)}%`}
                                value={formatRupiah(Number(event.service_amount))}
                            />
                        )}
                        {Number(event.discount_amount) > 0 && (
                            <BreakRow
                                label="Diskon"
                                value={`−${formatRupiah(Number(event.discount_amount))}`}
                                valueColor="#ef4444"
                            />
                        )}
                        <BreakRow
                            label="Grand Total"
                            value={formatRupiah(Number(event.grand_total))}
                            valueColor="#334DAF"
                            emphasized
                        />
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div
                style={{
                    padding: '40px 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background:
                                'linear-gradient(135deg, #7096D1 0%, #334DAF 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: 20,
                            fontWeight: 700,
                            letterSpacing: '-0.04em',
                            boxShadow: '0 6px 16px rgba(51,77,175,0.30)',
                        }}
                    >
                        S
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            lineHeight: 1,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#091F5C',
                                letterSpacing: '-0.025em',
                            }}
                        >
                            Synmony
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                color: '#334DAF',
                                fontWeight: 500,
                                letterSpacing: '0.08em',
                                marginTop: 4,
                            }}
                        >
                            Second Brain for Your Money
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        fontSize: 14,
                        color: '#334DAF',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        fontVariantNumeric: 'tabular-nums',
                        padding: '8px 14px',
                        background: 'rgba(51,77,175,0.06)',
                        borderRadius: 100,
                    }}
                >
                    #{event.id.slice(0, 8).toUpperCase()}
                </div>
            </div>
        </div>
    )
}

function SectionHeader({
    num,
    label,
    count,
}: {
    num: string
    label: string
    count?: number
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
            }}
        >
            <span
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#10b981',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.08em',
                }}
            >
                {num}
            </span>
            <div
                style={{
                    width: 24,
                    height: 2,
                    background: 'rgba(16,185,129,0.4)',
                    borderRadius: 2,
                }}
            />
            <span
                style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#334DAF',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                }}
            >
                {label}
                {count !== undefined && (
                    <span
                        style={{
                            marginLeft: 14,
                            color: '#94a3b8',
                            fontWeight: 500,
                        }}
                    >
                        ({count})
                    </span>
                )}
            </span>
        </div>
    )
}

function BreakRow({
    label,
    value,
    valueColor = '#091F5C',
    emphasized = false,
}: {
    label: string
    value: string
    valueColor?: string
    emphasized?: boolean
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: emphasized ? '26px 0' : '18px 0',
                gap: 20,
                borderTop: emphasized
                    ? '2px solid rgba(9,31,92,0.12)'
                    : 'none',
                borderBottom: emphasized
                    ? 'none'
                    : '1.5px dashed rgba(9,31,92,0.06)',
                marginTop: emphasized ? 4 : 0,
            }}
        >
            <span
                style={{
                    fontSize: emphasized ? 24 : 22,
                    color: emphasized ? '#091F5C' : '#64748B',
                    fontWeight: emphasized ? 700 : 400,
                    letterSpacing: emphasized ? '-0.015em' : '0',
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: emphasized ? 36 : 26,
                    color: valueColor,
                    fontWeight: emphasized ? 800 : 600,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.03em',
                    flexShrink: 0,
                }}
            >
                {value}
            </span>
        </div>
    )
}
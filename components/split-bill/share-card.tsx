'use client'

import { formatRupiah } from '@/lib/normalize'
import { formatDateLongWIB } from '@/lib/utils/datetime'
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

export function ShareCard({ data, innerRef }: ShareCardProps) {
    const { event, items, participants, payer_participant } = data

    const payerIsUser = event.payer_is_user
    const payerName = payerIsUser
        ? 'Lu'
        : payer_participant?.display_name || 'Orang lain'

    const sortedParticipants = [...participants].sort((a: any, b: any) => {
        if (a.is_user) return -1
        if (b.is_user) return 1
        if (a.id === event.payer_participant_id) return -1
        if (b.id === event.payer_participant_id) return 1
        return 0
    })

    const displayItems = items.slice(0, 8)
    const hiddenItemsCount = items.length - displayItems.length

    return (
        <div
            ref={innerRef}
            style={{
                width: 420,
                background:
                    'linear-gradient(160deg, #F9FBFF 0%, #E8F2FE 60%, #D0E4FE 100%)',
                borderRadius: 24,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* ============================================ */}
            {/* HERO — Brand + Event name                     */}
            {/* ============================================ */}
            <div
                style={{
                    background:
                        'linear-gradient(135deg, #050F2E 0%, #091F5C 45%, #1F3680 100%)',
                    padding: '24px 24px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative blobs */}
                <div
                    style={{
                        position: 'absolute',
                        top: -80,
                        right: -80,
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: '#334DAF',
                        opacity: 0.35,
                        filter: 'blur(70px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -60,
                        left: -60,
                        width: 180,
                        height: 180,
                        borderRadius: '50%',
                        background: '#7096D1',
                        opacity: 0.25,
                        filter: 'blur(60px)',
                    }}
                />

                <div style={{ position: 'relative' }}>
                    {/* Brand row */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 20,
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 14,
                                background:
                                    'linear-gradient(135deg, #7096D1 0%, #1F3680 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                fontSize: 20,
                                boxShadow:
                                    '0 8px 24px rgba(51, 77, 175, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                                flexShrink: 0,
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
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: 17,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Synmony
                            </span>
                            <span
                                style={{
                                    color: '#A8C5E8',
                                    fontSize: 9,
                                    fontWeight: 600,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    marginTop: 3,
                                }}
                            >
                                Split Bill Receipt
                            </span>
                        </div>
                    </div>

                    {/* Event name */}
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#FFFFFF',
                            letterSpacing: '-0.025em',
                            lineHeight: 1.15,
                            marginBottom: 6,
                        }}
                    >
                        {event.name}
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: '#A8C5E8',
                            fontWeight: 500,
                        }}
                    >
                        {formatDateLongWIB(event.date)}
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* BODY                                          */}
            {/* ============================================ */}
            <div style={{ padding: '20px 24px 12px' }}>
                {/* Payer info banner */}
                <div
                    style={{
                        background: payerIsUser
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.05) 100%)',
                        border: `1px solid ${payerIsUser
                                ? 'rgba(16,185,129,0.25)'
                                : 'rgba(245,158,11,0.25)'
                            }`,
                        borderRadius: 14,
                        padding: '12px 14px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: payerIsUser
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(245,158,11,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                            flexShrink: 0,
                        }}
                    >
                        {payerIsUser ? '💳' : '🤝'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: payerIsUser ? '#059669' : '#B45309',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: 2,
                            }}
                        >
                            {payerIsUser ? 'Ditalangin oleh Lu' : 'Ditalangin oleh'}
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#091F5C',
                            }}
                        >
                            {payerName}
                        </div>
                    </div>
                </div>

                {/* ============================================ */}
                {/* PARTICIPANTS                                  */}
                {/* ============================================ */}
                <SectionTitle>Pembagian Per Orang</SectionTitle>
                <div style={{ marginBottom: 16 }}>
                    {sortedParticipants.map((p: any, idx: number) => {
                        const isUser = p.is_user
                        const isPayer = p.id === event.payer_participant_id
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]

                        return (
                            <div
                                key={p.id}
                                style={{
                                    background: isUser
                                        ? 'linear-gradient(135deg, rgba(51,77,175,0.08) 0%, rgba(51,77,175,0.02) 100%)'
                                        : '#FFFFFF',
                                    border: isUser
                                        ? '1px solid rgba(51,77,175,0.2)'
                                        : '1px solid rgba(9,31,92,0.04)',
                                    borderRadius: 14,
                                    padding: '12px 14px',
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                {/* Avatar */}
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 12,
                                        background: isUser
                                            ? 'linear-gradient(135deg, #7096D1 0%, #334DAF 100%)'
                                            : avatarColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        letterSpacing: '-0.02em',
                                        flexShrink: 0,
                                        boxShadow: isUser
                                            ? '0 4px 12px rgba(51,77,175,0.3)'
                                            : '0 2px 6px rgba(9,31,92,0.08)',
                                    }}
                                >
                                    {getInitials(p.display_name)}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#091F5C',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {p.display_name}
                                        </span>
                                        {isUser && <Pill label="LU" />}
                                        {isPayer && <Pill label="Talangin" variant="warning" />}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: '#64748B',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        Subtotal {formatRupiah(Number(p.subtotal))}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: isUser ? '#334DAF' : '#091F5C',
                                        fontVariantNumeric: 'tabular-nums',
                                        letterSpacing: '-0.02em',
                                        flexShrink: 0,
                                    }}
                                >
                                    {formatRupiah(Number(p.total_share))}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ============================================ */}
                {/* ITEMS                                         */}
                {/* ============================================ */}
                {items.length > 0 && (
                    <>
                        <SectionTitle>
                            Detail Item · {items.length}
                        </SectionTitle>
                        <div
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 14,
                                padding: '4px 14px',
                                marginBottom: 16,
                                boxShadow: '0 1px 3px rgba(9,31,92,0.04)',
                            }}
                        >
                            {displayItems.map((item: any, i: number) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '9px 0',
                                        gap: 12,
                                        borderBottom:
                                            i < displayItems.length - 1
                                                ? '1px solid rgba(9,31,92,0.05)'
                                                : 'none',
                                    }}
                                >
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#091F5C',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {item.name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#64748B',
                                                fontVariantNumeric: 'tabular-nums',
                                                marginTop: 1,
                                            }}
                                        >
                                            {item.quantity} × {formatRupiah(Number(item.unit_price))}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#091F5C',
                                            fontVariantNumeric: 'tabular-nums',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {formatRupiah(Number(item.subtotal))}
                                    </div>
                                </div>
                            ))}
                            {hiddenItemsCount > 0 && (
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#64748B',
                                        fontStyle: 'italic',
                                        padding: '8px 0',
                                    }}
                                >
                                    +{hiddenItemsCount} item lainnya
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ============================================ */}
                {/* BREAKDOWN                                     */}
                {/* ============================================ */}
                <SectionTitle>Rincian</SectionTitle>
                <div
                    style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        padding: '12px 14px',
                        marginBottom: 16,
                        boxShadow: '0 1px 3px rgba(9,31,92,0.04)',
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
                </div>

                {/* ============================================ */}
                {/* GRAND TOTAL — di BAWAH, eye-catching          */}
                {/* ============================================ */}
                <div
                    style={{
                        background:
                            'linear-gradient(135deg, #091F5C 0%, #334DAF 100%)',
                        borderRadius: 18,
                        padding: '18px 20px',
                        marginBottom: 16,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(51,77,175,0.25)',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: -40,
                            right: -40,
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: '#7096D1',
                            opacity: 0.3,
                            filter: 'blur(50px)',
                        }}
                    />
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#A8C5E8',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                marginBottom: 6,
                            }}
                        >
                            Grand Total
                        </div>
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: '#FFFFFF',
                                letterSpacing: '-0.03em',
                                lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {formatRupiah(Number(event.grand_total))}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: '#D0E4FE',
                                marginTop: 8,
                            }}
                        >
                            Share lu:{' '}
                            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                                {formatRupiah(Number(event.user_share))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ============================================ */}
                {/* WHO PAYS WHOM (kalau bukan user)             */}
                {/* ============================================ */}
                {!payerIsUser && (
                    <>
                        <SectionTitle>Siapa Bayar Siapa</SectionTitle>
                        <div
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 14,
                                padding: '12px 14px',
                                marginBottom: 16,
                                boxShadow: '0 1px 3px rgba(9,31,92,0.04)',
                            }}
                        >
                            {sortedParticipants
                                .filter((p: any) => !p.is_payer)
                                .map((p: any) => (
                                    <BreakRow
                                        key={`pay-${p.id}`}
                                        label={`${p.display_name} → ${payerName}`}
                                        value={formatRupiah(Number(p.total_share))}
                                    />
                                ))}
                        </div>
                    </>
                )}

                {payerIsUser && sortedParticipants.filter((p: any) => !p.is_user).length > 0 && (
                    <>
                        <SectionTitle>Piutang Lu</SectionTitle>
                        <div
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 14,
                                padding: '12px 14px',
                                marginBottom: 16,
                                boxShadow: '0 1px 3px rgba(9,31,92,0.04)',
                            }}
                        >
                            {sortedParticipants
                                .filter((p: any) => !p.is_user)
                                .map((p: any) => (
                                    <BreakRow
                                        key={`recv-${p.id}`}
                                        label={`${p.display_name} bayar ke Lu`}
                                        value={formatRupiah(Number(p.total_share))}
                                        valueColor="#10b981"
                                    />
                                ))}
                        </div>
                    </>
                )}
            </div>

            {/* ============================================ */}
            {/* FOOTER WATERMARK                              */}
            {/* ============================================ */}
            <div
                style={{
                    padding: '14px 24px 18px',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(51,77,175,0.08)',
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 10,
                        color: '#64748B',
                        fontWeight: 500,
                    }}
                >
                    <div
                        style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            background:
                                'linear-gradient(135deg, #7096D1 0%, #1F3680 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: 8,
                            fontWeight: 700,
                        }}
                    >
                        S
                    </div>
                    <span>
                        Generated by{' '}
                        <span style={{ color: '#334DAF', fontWeight: 700 }}>Synmony</span>
                        {' · '}Your Second Brain for Money
                    </span>
                </div>
            </div>
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#334DAF',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
                paddingLeft: 2,
            }}
        >
            {children}
        </div>
    )
}

function Pill({
    label,
    variant = 'default',
}: {
    label: string
    variant?: 'default' | 'warning'
}) {
    const colors =
        variant === 'warning'
            ? { bg: 'rgba(245,158,11,0.15)', fg: '#B45309' }
            : { bg: 'rgba(51,77,175,0.12)', fg: '#334DAF' }

    return (
        <span
            style={{
                fontSize: 8,
                fontWeight: 700,
                color: colors.fg,
                background: colors.bg,
                padding: '2px 5px',
                borderRadius: 4,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                flexShrink: 0,
            }}
        >
            {label}
        </span>
    )
}

function BreakRow({
    label,
    value,
    valueColor = '#091F5C',
}: {
    label: string
    value: string
    valueColor?: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0',
                gap: 12,
            }}
        >
            <span
                style={{
                    fontSize: 12,
                    color: '#64748B',
                    fontWeight: 500,
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: 12,
                    color: valueColor,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                }}
            >
                {value}
            </span>
        </div>
    )
}
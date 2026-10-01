import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'Split Bill — Synmony'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type PageProps = {
    params: Promise<{ slug: string }>
}

export default async function Image({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    const { data } = await supabase.rpc('get_shared_event' as any, {
        p_slug: slug,
    })

    const result = data as any

    if (!result || result.error) {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #050F2E 0%, #091F5C 100%)',
                        color: '#FFFFFF',
                        fontSize: 48,
                        fontWeight: 700,
                    }}
                >
                    Synmony
                </div>
            ),
            size
        )
    }

    const event = result.event
    const participants = result.participants || []
    const total = Number(event.grand_total)
    const formattedTotal = `Rp ${total.toLocaleString('id-ID')}`
    const totalPaid = participants.filter((p: any) => p.paid).length

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    background: 'linear-gradient(135deg, #050F2E 0%, #091F5C 50%, #1F3680 100%)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    padding: 64,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Blob decor */}
                <div
                    style={{
                        position: 'absolute',
                        top: -200,
                        right: -200,
                        width: 600,
                        height: 600,
                        borderRadius: '50%',
                        background: '#334DAF',
                        opacity: 0.3,
                        filter: 'blur(120px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -200,
                        left: -200,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: '#7096D1',
                        opacity: 0.2,
                        filter: 'blur(120px)',
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Top bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 20,
                            marginBottom: 48,
                        }}
                    >
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 18,
                                background: 'linear-gradient(135deg, #7096D1 0%, #334DAF 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF',
                                fontSize: 32,
                                fontWeight: 800,
                                letterSpacing: '-0.04em',
                                boxShadow: '0 8px 24px rgba(51,77,175,0.4)',
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
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Synmony
                            </span>
                            <span
                                style={{
                                    fontSize: 14,
                                    color: '#A8C5E8',
                                    fontWeight: 500,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                    marginTop: 6,
                                }}
                            >
                                Split Bill
                            </span>
                        </div>
                    </div>

                    {/* Event name */}
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 800,
                            color: '#FFFFFF',
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                            marginBottom: 24,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 1000,
                        }}
                    >
                        {event.name}
                    </div>

                    {/* Total — hero */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 20,
                            marginBottom: 32,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 24,
                                color: '#A8C5E8',
                                fontWeight: 500,
                            }}
                        >
                            Total
                        </span>
                        <span
                            style={{
                                fontSize: 88,
                                fontWeight: 800,
                                color: '#FFFFFF',
                                letterSpacing: '-0.05em',
                                lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {formattedTotal}
                        </span>
                    </div>

                    {/* Bottom stats */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 40,
                            marginTop: 'auto',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span
                                style={{
                                    fontSize: 14,
                                    color: '#7096D1',
                                    fontWeight: 600,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Peserta
                            </span>
                            <span
                                style={{
                                    fontSize: 32,
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {participants.length} orang
                            </span>
                        </div>

                        <div
                            style={{
                                width: 2,
                                height: 60,
                                background: 'rgba(168,197,232,0.2)',
                            }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span
                                style={{
                                    fontSize: 14,
                                    color: '#7096D1',
                                    fontWeight: 600,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Status
                            </span>
                            <span
                                style={{
                                    fontSize: 32,
                                    fontWeight: 700,
                                    color: totalPaid === participants.length ? '#10b981' : '#f59e0b',
                                }}
                            >
                                {totalPaid === participants.length
                                    ? '✓ Lunas'
                                    : `${participants.length - totalPaid} belum`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        size
    )
}
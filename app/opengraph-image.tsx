import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Synmony — Your Second Brain for Money'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                        'linear-gradient(135deg, #050F2E 0%, #091F5C 50%, #1F3680 100%)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Blur blob dekorasi */}
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

                {/* Mark */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 120,
                        height: 120,
                        borderRadius: 32,
                        background: 'linear-gradient(135deg, #7096D1 0%, #1F3680 100%)',
                        fontSize: 72,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        marginBottom: 40,
                        boxShadow: '0 20px 60px rgba(51, 77, 175, 0.4)',
                    }}
                >
                    S
                </div>

                {/* Wordmark */}
                <div
                    style={{
                        fontSize: 96,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        letterSpacing: '-0.03em',
                        marginBottom: 16,
                    }}
                >
                    Synmony
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: 32,
                        color: '#A8C5E8',
                        letterSpacing: '0.02em',
                    }}
                >
                    Your second brain for money.
                </div>
            </div>
        ),
        size
    )
}
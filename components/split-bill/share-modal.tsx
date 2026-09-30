'use client'

import { useRef, useState } from 'react'
import {
    Loader2,
    Download,
    Share2,
    Copy,
    Check,
    Link2,
    Calendar,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { ShareCard } from './share-card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { EventDetailData } from '@/lib/split-bill/actions'

type ShareModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: EventDetailData
}

function slugify(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

async function convertToJpeg(
    pngBlob: Blob,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(pngBlob)

        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                URL.revokeObjectURL(url)
                reject(new Error('Canvas context gak tersedia'))
                return
            }

            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url)
                    if (blob) resolve(blob)
                    else reject(new Error('Gagal convert ke JPEG'))
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Gagal load image'))
        }

        img.src = url
    })
}

function buildShareCaption(
    data: EventDetailData,
    expiresAt: string | null
): string {
    const { event, participants, items } = data

    const total = Number(event.grand_total)
    const formatted = `Rp ${total.toLocaleString('id-ID')}`
    const pCount = participants.length
    const itemCount = items.length

    let greeting = 'Halo! Ini split bill kita ya 🧾'
    if (pCount === 2) {
        greeting = 'Halo! Ini split bill kita berdua ya 🧾'
    } else if (pCount === 3) {
        greeting = 'Halo! Ini split bill kita bertiga ya 🧾'
    } else if (pCount > 3) {
        greeting = `Halo! Ini split bill kita (${pCount} orang) ya 🧾`
    }

    const lines = [
        greeting,
        '',
        `📌 ${event.name}`,
        `💰 Total: ${formatted}`,
        `🛒 ${itemCount} item`,
    ]

    if (expiresAt) {
        const d = new Date(expiresAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
        })
        lines.push('', `⏰ Link aktif sampai ${d}`)
    }

    lines.push('', 'Klik link buat lihat detail lengkap 👇', '', '— via Synmony')

    return lines.join('\n')
}

export function ShareModal({ open, onOpenChange, data }: ShareModalProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [downloading, setDownloading] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [copiedImg, setCopiedImg] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
    const [generatedExpiry, setGeneratedExpiry] = useState<string | null>(null)

    const filename = `synmony-split-bill-${slugify(data.event.name)}.jpg`

    async function generatePngBlob(): Promise<Blob | null> {
        if (!cardRef.current) return null
        const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 1,
            backgroundColor: '#F9FBFF',
            skipFonts: true,
            style: { transform: 'none' },
        })
        const res = await fetch(dataUrl)
        return await res.blob()
    }

    async function uploadAndGetUrl(): Promise<{
        shareUrl: string
        expiresAt: string
    }> {
        const pngBlob = await generatePngBlob()
        if (!pngBlob) throw new Error('Gagal generate image')

        const jpegBlob = await convertToJpeg(pngBlob, 0.92)

        const formData = new FormData()
        formData.append('eventId', data.event.id)
        formData.append(
            'image',
            new File([jpegBlob], filename, { type: 'image/jpeg' })
        )

        const res = await fetch('/api/split-bill/share', {
            method: 'POST',
            body: formData,
        })

        const result = await res.json()

        if (!res.ok) {
            throw new Error(result.error || 'Gagal generate link')
        }

        return {
            shareUrl: result.shareUrl,
            expiresAt: result.expiresAt,
        }
    }

    async function handleDownload() {
        setDownloading(true)
        try {
            const blob = await generatePngBlob()
            if (!blob) throw new Error('Gagal generate image')
            const jpegBlob = await convertToJpeg(blob, 0.92)
            const url = URL.createObjectURL(jpegBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success('Image ter-download')
        } catch (err) {
            console.error(err)
            toast.error('Gagal download image')
        } finally {
            setDownloading(false)
        }
    }

    async function handleShare() {
        if (!navigator.share) {
            toast.info('Browser gak support share. Pakai Copy Link.')
            return
        }

        setSharing(true)
        try {
            const { shareUrl, expiresAt } = await uploadAndGetUrl()
            setGeneratedUrl(shareUrl)
            setGeneratedExpiry(expiresAt)

            const caption = buildShareCaption(data, expiresAt)

            await navigator.share({
                title: `Split Bill — ${data.event.name}`,
                text: caption,
                url: shareUrl,
            })

            toast.success('Link aktif 5 hari', {
                description:
                    'WhatsApp bakal generate preview otomatis dari link ini.',
                duration: 6000,
            })
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                console.error(err)
                toast.error(err?.message || 'Gagal share')
            }
        } finally {
            setSharing(false)
        }
    }

    async function handleCopyLink() {
        try {
            let url = generatedUrl
            let expiry = generatedExpiry

            if (!url) {
                const result = await uploadAndGetUrl()
                url = result.shareUrl
                expiry = result.expiresAt
                setGeneratedUrl(url)
                setGeneratedExpiry(expiry)
            }

            const caption = buildShareCaption(data, expiry)
            const fullText = `${caption}\n\n${url}`

            await navigator.clipboard.writeText(fullText)
            setCopiedLink(true)
            toast.success('Link + caption ke-copy')
            setTimeout(() => setCopiedLink(false), 2500)
        } catch (err) {
            console.error(err)
            toast.error('Gagal copy link')
        }
    }

    async function handleCopyImage() {
        try {
            const pngBlob = await generatePngBlob()
            if (!pngBlob) throw new Error('Gagal generate')
            const jpegBlob = await convertToJpeg(pngBlob, 0.92)

            if (!document.hasFocus()) window.focus()
            await new Promise((r) => setTimeout(r, 120))

            if (
                typeof ClipboardItem !== 'undefined' &&
                navigator.clipboard?.write
            ) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/jpeg': jpegBlob }),
                    ])
                    setCopiedImg(true)
                    toast.success('Image di-copy')
                    setTimeout(() => setCopiedImg(false), 2000)
                    return
                } catch (clipErr: any) {
                    console.warn('[copy] failed:', clipErr?.name)
                }
            }

            const url = URL.createObjectURL(jpegBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.info('Image ke-download, copy manual dari galeri.')
        } catch (err) {
            console.error(err)
            toast.error('Gagal copy image')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-5 md:px-6 pt-5 md:pt-6 pb-3 md:pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Share2 className="w-4 h-4 md:w-5 md:h-5 text-brand shrink-0" />
                        Share Split Bill
                    </DialogTitle>
                    <DialogDescription className="text-xs md:text-sm">
                        Share link biar preview muncul otomatis, atau download
                        image langsung.
                    </DialogDescription>
                </DialogHeader>

                {/* Preview */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-white/[0.02] py-1.5 md:py-3">
                    <div className="flex justify-center">
                        <div className="share-preview-wrapper origin-top">
                            <ShareCard data={data} innerRef={cardRef} />
                        </div>
                    </div>
                </div>

                {/* Link info strip */}
                <div className="shrink-0 px-4 md:px-6 py-2.5 md:py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-2.5 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                                Link Aktif 5 Hari
                            </p>
                            <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Image & link auto-hapus setelah 5 hari. Butuh
                                lagi? Tinggal share ulang.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-t border-slate-100 dark:border-white/5 bg-card">
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="primary"
                            onClick={handleShare}
                            disabled={downloading || sharing}
                            className="h-10 md:h-11"
                        >
                            {sharing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Share2 className="w-4 h-4" />
                            )}
                            <span className="text-xs md:text-sm">Share Link</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleCopyLink}
                            disabled={downloading || sharing}
                            className={cn(
                                'h-10 md:h-11',
                                copiedLink &&
                                'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white'
                            )}
                        >
                            {copiedLink ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Link2 className="w-4 h-4" />
                            )}
                            <span className="text-xs md:text-sm">
                                {copiedLink ? 'Copied' : 'Copy Link'}
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleDownload}
                            disabled={downloading || sharing}
                            className="h-10 md:h-11"
                        >
                            {downloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            <span className="text-xs md:text-sm">Download</span>
                        </Button>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyImage}
                        disabled={downloading || sharing}
                        className={cn(
                            'mt-2 w-full text-center text-[10px] md:text-[11px] text-muted-foreground',
                            'hover:text-foreground transition-colors py-1 cursor-pointer',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        {copiedImg ? '✓ Image ke-copy' : 'atau copy image ke clipboard'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
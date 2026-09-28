'use client'

import { useRef, useState } from 'react'
import { Loader2, Download, Share2, Copy, Check } from 'lucide-react'
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

export function ShareModal({ open, onOpenChange, data }: ShareModalProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [downloading, setDownloading] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [copied, setCopied] = useState(false)

    const filename = `synmony-split-bill-${slugify(data.event.name)}.png`

    async function generateBlob(): Promise<Blob | null> {
        if (!cardRef.current) return null
        const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 1,
            backgroundColor: '#F9FBFF',
            skipFonts: true,
            style: {
                transform: 'none',
            },
        })
        const res = await fetch(dataUrl)
        return await res.blob()
    }

    async function handleDownload() {
        setDownloading(true)
        try {
            const blob = await generateBlob()
            if (!blob) throw new Error('Gagal generate image')
            const url = URL.createObjectURL(blob)
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
            toast.info('Browser gak support share. Pakai Download.')
            return
        }

        setSharing(true)
        try {
            const blob = await generateBlob()
            if (!blob) throw new Error('Gagal generate')

            const file = new File([blob], filename, { type: 'image/png' })

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Split Bill — ${data.event.name}`,
                    text: `Split bill dari Synmony: ${data.event.name}`,
                })
            } else {
                toast.info('Share file gak didukung. Pakai Download.')
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                console.error(err)
                toast.error('Gagal share')
            }
        } finally {
            setSharing(false)
        }
    }

    async function handleCopy() {
        try {
            const blob = await generateBlob()
            if (!blob) throw new Error('Gagal generate')

            // Clipboard API butuh document fokus.
            // Kalau gak fokus, coba balikin fokus ke body + retry.
            if (!document.hasFocus()) {
                window.focus()
            }

            // Delay sedikit biar fokus settle
            await new Promise((r) => setTimeout(r, 120))

            // Try native ClipboardItem (image support)
            if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob }),
                    ])
                    setCopied(true)
                    toast.success('Image di-copy ke clipboard')
                    setTimeout(() => setCopied(false), 2000)
                    return
                } catch (clipErr: any) {
                    // Kalau gagal karena fokus atau permission, fallback ke download
                    console.warn('[copy] clipboard.write failed:', clipErr?.name)
                }
            }

            // Fallback — auto download aja
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.info(
                'Browser gak izinin copy image otomatis. Image ke-download — copy manual dari galeri.',
                { duration: 5000 }
            )
        } catch (err) {
            console.error(err)
            toast.error('Gagal copy image')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-brand" />
                        Share Split Bill
                    </DialogTitle>
                    <DialogDescription>
                        Download atau share image. Di-generate langsung di browser.
                    </DialogDescription>
                </DialogHeader>

                {/* Preview */}
                <div className="flex justify-center py-4 bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden">
                    <div className="share-preview-wrapper origin-top">
                        <ShareCard data={data} innerRef={cardRef} />
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        variant="primary"
                        onClick={handleDownload}
                        disabled={downloading || sharing}
                    >
                        {downloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Download</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleShare}
                        disabled={downloading || sharing}
                    >
                        {sharing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Share2 className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Share</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleCopy}
                        disabled={downloading || sharing}
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Copy</span>
                    </Button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                    Image di-generate di browser — gak ada data yang dikirim ke server.
                </p>
            </DialogContent>
        </Dialog>
    )
}
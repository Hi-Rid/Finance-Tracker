'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useRef } from 'react'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, X, Link2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useWishlists } from '@/lib/hooks/use-wishlists'
import { useWishlistImage } from '@/lib/hooks/use-wishlist-image'
import {
    wishlistSchema,
    type WishlistInput,
    PRIORITY_LABELS,
    MOOD_OPTIONS,
} from '@/lib/validators/wishlist'
import { WISHLIST_CATEGORIES } from '@/lib/constants/wishlist-categories'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Wishlist = Database['public']['Tables']['wishlists']['Row']

type WishlistFormProps = {
    profileId: string
    wishlist?: Wishlist | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function WishlistForm({
    profileId,
    wishlist,
    onSuccess,
    onCancel,
}: WishlistFormProps) {
    const { createWishlist, updateWishlist } = useWishlists()
    const { uploadImage, deleteImage } = useWishlistImage()
    const isEdit = !!wishlist

    const [imageUrl, setImageUrl] = useState<string | null>(
        wishlist?.image_url || null
    )
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<WishlistInput>({
        resolver: zodResolver(wishlistSchema) as any,
        defaultValues: {
            name: wishlist?.name || '',
            category: wishlist?.category || '',
            priority: (wishlist?.priority as WishlistInput['priority']) || 'wants',
            target_price: wishlist?.target_price ? Number(wishlist.target_price) : 0,
            currency: wishlist?.currency || 'IDR',
            link: wishlist?.link || '',
            target_date: wishlist?.target_date || '',
            reason: wishlist?.reason || '',
            mood: wishlist?.mood || '',
            alternatives: wishlist?.alternatives || '',
            note: wishlist?.note || '',
        },
    })

    const {
        formState: { isSubmitting },
    } = form

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const res = await uploadImage(file)
        setUploading(false)

        if (res.success && res.imageUrl) {
            setImageUrl(res.imageUrl)
            toast.success('Gambar di-upload')
        }

        e.target.value = ''
    }

    async function handleRemoveImage() {
        if (imageUrl) {
            const match = imageUrl.match(/wishlist-images\/(.+)$/)
            if (match && match[1]) {
                deleteImage(match[1]).catch(() => { })
            }
        }
        setImageUrl(null)
    }

    async function onSubmit(data: WishlistInput) {
        const payload = {
            ...data,
            image_url: imageUrl,
            image_source: imageUrl ? 'manual' : null,
        } as any

        if (isEdit && wishlist) {
            const result = await updateWishlist(wishlist.id, payload)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        } else {
            const result = await createWishlist(payload, profileId)
            if (result.success) {
                onSuccess?.()
                form.reset()
                setImageUrl(null)
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* IMAGE UPLOAD */}
                <div className="space-y-3">
                    <FormLabel>Foto Produk (opsional)</FormLabel>

                    {imageUrl ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10">
                            <img
                                src={imageUrl}
                                alt="Preview"
                                className="w-full aspect-[4/3] object-cover"
                                onError={(e) => {
                                    console.error('[form] image load failed:', imageUrl)
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
                                aria-label="Hapus gambar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={cn(
                                'w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                                'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]',
                                'hover:border-brand/40 hover:bg-brand/5',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-brand" />
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {uploading ? 'Upload...' : 'Upload Foto Produk'}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    JPG, PNG, WebP · max 3MB
                                </p>
                            </div>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="sr-only"
                        tabIndex={-1}
                    />
                </div>

                {/* NAMA */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Barang</FormLabel>
                            <FormControl>
                                <Input placeholder="iPhone 15 Pro Max, dll" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* PRIORITY + HARGA */}
                <div className="grid grid-cols-2 gap-3 items-start">
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prioritas</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="target_price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Harga Barang</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                            Rp
                                        </span>
                                        <CurrencyInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="0"
                                            className="pl-9 h-10"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* LINK */}
                <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5" />
                                Link Produk (opsional)
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="https://tokopedia.com/..." {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Tempel link biar gampang cek nanti
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* KATEGORI */}
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <Select
                                onValueChange={(v) =>
                                    field.onChange(v === '__none__' ? '' : v)
                                }
                                value={field.value || '__none__'}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">Tanpa kategori</SelectItem>
                                    {WISHLIST_CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* TARGET DATE + MOOD */}
                <div className="grid grid-cols-2 gap-3 items-start">
                    <FormField
                        control={form.control}
                        name="target_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target Beli</FormLabel>
                                <FormControl>
                                    <Input type="date" className="h-10" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mood Saat Ini</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih mood" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {MOOD_OPTIONS.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Info mood */}
                <div className="rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        💡 <strong>Mood</strong> dipakai buat analisis pattern belanja.
                        Kalau sering beli pas sedih/bosan/stress, itu tanda impulse buying.
                    </p>
                </div>

                {/* ALASAN */}
                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alasan Beli (opsional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Kenapa lu pengen barang ini?"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ALTERNATIF */}
                <FormField
                    control={form.control}
                    name="alternatives"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alternatif Lebih Murah (opsional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ada opsi lain yang lebih murah?"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* NOTE */}
                <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catatan (opsional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ACTIONS */}
                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting || uploading}
                        className="flex-1"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? 'Simpan' : 'Tambah'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
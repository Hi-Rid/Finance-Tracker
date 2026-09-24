'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useWishlists } from '@/lib/hooks/use-wishlists'
import {
    wishlistSchema,
    type WishlistInput,
    PRIORITY_LABELS,
    MOOD_OPTIONS,
} from '@/lib/validators/wishlist'
import { WISHLIST_CATEGORIES } from '@/lib/constants/wishlist-categories'
import { Loader2 } from 'lucide-react'
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
    const isEdit = !!wishlist

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

    async function onSubmit(data: WishlistInput) {
        if (isEdit && wishlist) {
            const result = await updateWishlist(wishlist.id, data)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        } else {
            const result = await createWishlist(data, profileId)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Nama */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Barang</FormLabel>
                            <FormControl>
                                <Input placeholder="Barang yang kamu mau..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Priority + Harga */}
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

                {/* Kategori */}
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

                {/* Link */}
                <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link Produk (opsional)</FormLabel>
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

                {/* Target Date + Mood */}
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

                {/* Info Mood */}
                <div className="rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        💡 <strong>Mood</strong> dipakai buat analisis pattern belanja lu.
                        Kalau sering beli pas lagi sedih/bosan/stress, itu tanda impulse
                        buying.
                    </p>
                </div>

                {/* Alasan */}
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

                {/* Alternatif */}
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

                {/* Note */}
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

                {/* Actions */}
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
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? 'Simpan' : 'Tambah'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
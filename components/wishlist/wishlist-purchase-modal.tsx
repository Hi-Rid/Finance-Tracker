'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShoppingBag, AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Amount } from '@/components/ui/amount'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useWishlists } from '@/lib/hooks/use-wishlists'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { createClient } from '@/lib/supabase/client'
import {
    purchaseWishlistSchema,
    type PurchaseWishlistInput,
} from '@/lib/validators/wishlist'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type Wishlist = Database['public']['Tables']['wishlists']['Row']

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    wishlist: Wishlist | null
}

function toDateTimeInputValue(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
}

export function WishlistPurchaseModal({ open, onOpenChange, wishlist }: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { purchaseWishlist } = useWishlists()
    const [submitting, setSubmitting] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    const envelopeBalance = Number(wishlist?.saved_amount || 0)
    const targetPrice = Number(wishlist?.target_price || 0)

    const form = useForm<PurchaseWishlistInput>({
        resolver: zodResolver(purchaseWishlistSchema) as any,
        defaultValues: {
            amount: targetPrice,
            date: toDateTimeInputValue(new Date()),
            category_id: null,
            note: '',
        },
    })

    useEffect(() => {
        if (!open) return

        form.reset({
            amount: targetPrice,
            date: toDateTimeInputValue(new Date()),
            category_id: null,
            note: '',
        })

        const fetchCats = async () => {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .eq('is_archived', false)
                .order('name')
            setCategories(data || [])
        }
        fetchCats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, wishlist?.id])

    const amount = Number(form.watch('amount')) || 0
    const insufficient = amount > 0 && amount > envelopeBalance

    async function onSubmit(data: PurchaseWishlistInput) {
        if (!wishlist) return
        setSubmitting(true)
        const result = await purchaseWishlist(wishlist.id, data)
        setSubmitting(false)
        if (result.success) {
            onOpenChange(false)
        }
    }

    const formContent = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="rounded-xl p-4 border bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">
                            Beli Sekarang
                        </p>
                        <p className="text-sm font-bold truncate">
                            {wishlist?.name || '-'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>Dana tersedia:</span>
                            <Amount
                                value={envelopeBalance}
                                className="inline text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                            />
                        </p>
                    </div>
                </div>

                {insufficient && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-300">
                            <p className="font-semibold mb-0.5">
                                Dana envelope belum cukup
                            </p>
                            <p>
                                Tersedia Rp {envelopeBalance.toLocaleString('id-ID')}.
                                Setor dulu Rp{' '}
                                {(amount - envelopeBalance).toLocaleString('id-ID')}{' '}
                                sebelum beli.
                            </p>
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah Beli</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                        Rp
                                    </span>
                                    <CurrencyInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="0"
                                        className="pl-9 text-lg font-semibold h-12"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori (opsional)</FormLabel>
                            <Select
                                onValueChange={(v) =>
                                    field.onChange(v === '__none__' ? null : v)
                                }
                                value={field.value || '__none__'}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">
                                        Tanpa kategori
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
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
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tanggal Beli</FormLabel>
                            <FormControl>
                                <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                {amount > 0 && !insufficient && (
                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                Dana envelope
                            </span>
                            <Amount
                                value={envelopeBalance}
                                className="text-xs font-medium"
                            />
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                Sisa setelah beli
                            </span>
                            <Amount
                                value={envelopeBalance - amount}
                                className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                            />
                        </div>
                        {envelopeBalance - amount > 0 && (
                            <p className="text-[11px] text-muted-foreground pt-1">
                                Sisa akan otomatis direfund ke akun sumber terakhir.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="flex-1"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || amount <= 0 || insufficient}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Beli Sekarang
                    </Button>
                </div>
            </form>
        </Form>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    className="max-h-[92vh] overflow-y-auto"
                >
                    <SheetHeader>
                        <SheetTitle>Konfirmasi Pembelian</SheetTitle>
                        <SheetDescription>
                            Uang akan diambil dari envelope wishlist ini.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-6 pt-2">{formContent}</div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Pembelian</DialogTitle>
                    <DialogDescription>
                        Uang akan diambil dari envelope wishlist ini.
                    </DialogDescription>
                </DialogHeader>
                {formContent}
            </DialogContent>
        </Dialog>
    )
}
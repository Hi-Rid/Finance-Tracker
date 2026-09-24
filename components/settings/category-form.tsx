'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { IconPicker } from './icon-picker'
import { ColorPicker } from './color-picker'
import { useCategories } from '@/lib/hooks/use-categories'
import {
    categorySchema,
    type CategoryInput,
    GROUP_LABELS,
    EXPENSE_GROUPS,
    INCOME_GROUPS,
} from '@/lib/validators/category'
import { Loader2 } from 'lucide-react'
import { getCategoryIcon } from '@/lib/constants/category-icons'
import { DEFAULT_CATEGORY_COLOR } from '@/lib/constants/category-colors'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

type CategoryFormProps = {
    category?: Category | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function CategoryForm({
    category,
    onSuccess,
    onCancel,
}: CategoryFormProps) {
    const { createCategory, updateCategory } = useCategories()
    const isEdit = !!category

    const form = useForm<CategoryInput>({
        resolver: zodResolver(categorySchema) as any,
        defaultValues: {
            name: category?.name || '',
            type: (category?.type as CategoryInput['type']) || 'expense',
            group_name: (category?.group_name as CategoryInput['group_name']) || 'needs',
            icon: category?.icon || null,
            color: category?.color || DEFAULT_CATEGORY_COLOR,
        },
    })

    const {
        watch,
        setValue,
        formState: { isSubmitting },
    } = form

    const watchedType = watch('type')
    const watchedIcon = watch('icon')
    const watchedColor = watch('color')

    const availableGroups = watchedType === 'income' ? INCOME_GROUPS : EXPENSE_GROUPS

    // Reset group_name kalau type berubah
    const handleTypeChange = (newType: 'income' | 'expense') => {
        setValue('type', newType)
        const validGroups = newType === 'income' ? INCOME_GROUPS : EXPENSE_GROUPS
        const currentGroup = form.getValues('group_name')
        if (!validGroups.includes(currentGroup as any)) {
            setValue('group_name', newType === 'income' ? 'income' : 'needs')
        }
    }

    async function onSubmit(data: CategoryInput) {
        if (isEdit && category) {
            const result = await updateCategory(category.id, data)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        } else {
            const result = await createCategory(data)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        }
    }

    const PreviewIcon = getCategoryIcon(watchedIcon)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Preview */}
                <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: `${watchedColor}20` }}
                        >
                            <PreviewIcon className="w-7 h-7" style={{ color: watchedColor || DEFAULT_CATEGORY_COLOR }} />
                        </div>
                        <p className="text-xs text-muted-foreground">Preview</p>
                    </div>
                </div>

                {/* Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Kategori</FormLabel>
                            <FormControl>
                                <Input placeholder="Meals, Coffee, Transport..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Type */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipe</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('expense')}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${field.value === 'expense'
                                            ? 'bg-white dark:bg-white/10 shadow-sm text-red-500'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Pengeluaran
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('income')}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${field.value === 'income'
                                            ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-500'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Pemasukan
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Group + Icon — 2 kolom */}
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="group_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Grup</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableGroups.map((g) => (
                                            <SelectItem key={g} value={g}>
                                                {GROUP_LABELS[g] || g}
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
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <FormControl>
                                    <IconPicker value={field.value ?? null} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Color */}
                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Warna</FormLabel>
                            <FormControl>
                                <ColorPicker
                                    value={field.value ?? null}
                                    onChange={field.onChange}
                                />
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
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { useGoals } from '@/lib/hooks/use-goals'
import {
    goalSchema,
    GOAL_TYPES,
    GOAL_TYPE_LABELS,
    GOAL_TYPE_EMOJI,
    GOAL_TYPE_COLORS,
    type GoalInput,
} from '@/lib/validators/goals'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']

type Props = {
    profileId: string
    goal?: Goal | null
    onSuccess?: () => void
    onCancel?: () => void
}

function toDateInputValue(d: string | null | undefined): string {
    if (!d) return ''
    return new Date(d).toISOString().split('T')[0]
}

export function GoalForm({ profileId, goal, onSuccess, onCancel }: Props) {
    const { createGoal, updateGoal } = useGoals()
    const isEdit = !!goal

    const form = useForm<GoalInput>({
        resolver: zodResolver(goalSchema) as any,
        defaultValues: {
            name: goal?.name || '',
            type: (goal?.type as GoalInput['type']) || 'custom',
            target_amount: goal?.target_amount ? Number(goal.target_amount) : 0,
            target_date: toDateInputValue(goal?.target_date),
            note: goal?.note || '',
        },
    })

    const {
        formState: { isSubmitting },
    } = form

    async function onSubmit(data: GoalInput) {
        if (isEdit && goal) {
            const result = await updateGoal(goal.id, data)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        } else {
            const result = await createGoal(data, profileId)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Goal</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Dana Darurat, Liburan Bali, dll"
                                    autoFocus={!isEdit}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipe Goal</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {GOAL_TYPES.map((t) => {
                                        const isActive = field.value === t
                                        const color = GOAL_TYPE_COLORS[t]
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => field.onChange(t)}
                                                className={cn(
                                                    'flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-lg border transition-all cursor-pointer',
                                                    isActive
                                                        ? 'shadow-sm'
                                                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-brand/30'
                                                )}
                                                style={
                                                    isActive
                                                        ? {
                                                            borderColor: color,
                                                            backgroundColor: `${color}10`,
                                                        }
                                                        : undefined
                                                }
                                            >
                                                <span className="text-lg leading-none">
                                                    {GOAL_TYPE_EMOJI[t]}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-[9px] font-semibold text-center leading-tight',
                                                        isActive
                                                            ? 'text-slate-900 dark:text-white'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    )}
                                                >
                                                    {GOAL_TYPE_LABELS[t]}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="target_amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Nominal</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                        Rp
                                    </span>
                                    <CurrencyInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="0"
                                        className="pl-9 text-base font-semibold h-11"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="target_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Target Tanggal{' '}
                                <span className="text-muted-foreground font-normal">
                                    (opsional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
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
                            <FormLabel>
                                Catatan{' '}
                                <span className="text-muted-foreground font-normal">
                                    (opsional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Kenapa lu pengen capai goal ini?"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-2 pt-1">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 h-11"
                        >
                            Batal
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-11 font-bold"
                    >
                        {isSubmitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isEdit ? 'Simpan' : 'Bikin Goal'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Loader2,
    Camera,
    Trash2,
    User,
    Mail,
    Save,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@/lib/hooks/use-profile'
import { cn } from '@/lib/utils'

const schema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(50, 'Maks 50 karakter'),
})

type FormValues = z.infer<typeof schema>

type Props = {
    profile: any
    email: string
}

export function ProfileForm({ profile, email }: Props) {
    const { updateProfile, uploadAvatar, deleteAvatar } = useProfile()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(
        profile?.avatar_url || null
    )
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            name: profile?.name || '',
        },
    })

    const {
        formState: { isSubmitting, isDirty },
    } = form

    const initial = (form.watch('name') || profile?.name || 'U')
        .charAt(0)
        .toUpperCase()

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const result = await uploadAvatar(profile.user_id, file)
        setUploading(false)

        if (result.success && result.url) {
            // Hapus avatar lama
            if (avatarUrl) {
                deleteAvatar(avatarUrl).catch(() => { })
            }
            setAvatarUrl(result.url)
        }

        e.target.value = ''
    }

    async function handleRemoveAvatar() {
        if (!avatarUrl) return
        await deleteAvatar(avatarUrl).catch(() => { })
        setAvatarUrl(null)
    }

    async function onSubmit(data: FormValues) {
        await updateProfile(profile.id, {
            name: data.name.trim(),
            avatar_url: avatarUrl,
        })
        form.reset({ name: data.name.trim() })
    }

    return (
        <div className="space-y-5 md:space-y-6">
            {/* Avatar card */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                    <div className="relative shrink-0">
                        <Avatar className="w-20 h-20 md:w-24 md:h-24 ring-4 ring-brand/10">
                            {avatarUrl && (
                                <AvatarImage src={avatarUrl} alt={profile.name} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-700 text-white text-2xl md:text-3xl font-bold">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                        {uploading && (
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3 className="text-base md:text-lg font-bold mb-1">
                            Foto Profil
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 leading-relaxed">
                            Klik untuk upload foto baru. Max 2MB, format JPG,
                            PNG, atau WebP.
                        </p>
                        <div className="flex gap-2 justify-center sm:justify-start">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="h-9 gap-1.5"
                            >
                                <Camera className="w-3.5 h-3.5" />
                                {avatarUrl ? 'Ganti Foto' : 'Upload Foto'}
                            </Button>
                            {avatarUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Hapus
                                </Button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="sr-only"
                            tabIndex={-1}
                        />
                    </div>
                </div>
            </div>

            {/* Form card */}
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 md:space-y-5"
                >
                    <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-4 md:p-6 space-y-4 md:space-y-5">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                            <User className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm md:text-base font-bold">
                                Info Pribadi
                            </h3>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Tampilan</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nama lu"
                                            autoComplete="name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Nama ini yang muncul di dashboard dan
                                        saat greeting.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div>
                            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                Email
                            </label>
                            <Input
                                type="email"
                                value={email}
                                disabled
                                className="bg-slate-50 dark:bg-white/[0.02] cursor-not-allowed"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                Email gak bisa diubah. Hubungi support kalau
                                perlu.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting || (!isDirty && avatarUrl === (profile?.avatar_url || null))}
                            className={cn(
                                'w-full md:w-auto md:min-w-[180px] h-11'
                            )}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
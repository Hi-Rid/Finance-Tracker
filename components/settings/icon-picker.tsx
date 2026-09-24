'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    CATEGORY_ICONS,
    ICON_NAMES,
    getCategoryIcon,
} from '@/lib/constants/category-icons'
import { cn } from '@/lib/utils'

type IconPickerProps = {
    value: string | null
    onChange: (icon: string | null) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    const CurrentIcon = getCategoryIcon(value)

    const filteredIcons = search
        ? ICON_NAMES.filter((name) =>
            name.toLowerCase().includes(search.toLowerCase())
        )
        : ICON_NAMES

    function handleSelect(iconName: string) {
        onChange(iconName)
        setOpen(false)
        setSearch('')
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(true)}
                className="w-full h-12 justify-start gap-3 px-3"
            >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <CurrentIcon className="w-4 h-4" />
                </div>
                <span className="text-sm">
                    {value || 'Pilih icon'}
                </span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-5 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0 pr-12">
                        <DialogTitle>Pilih Icon</DialogTitle>
                        <DialogDescription>
                            {filteredIcons.length} icon tersedia
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search */}
                    <div className="p-4 pb-3 shrink-0">
                        <input
                            type="text"
                            placeholder="Cari icon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                        />
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-[400px]">
                        {filteredIcons.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                Gak ada icon match
                            </p>
                        ) : (
                            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 content-start">
                                {filteredIcons.map((iconName) => {
                                    const Icon = CATEGORY_ICONS[iconName]
                                    const isSelected = value === iconName

                                    return (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => handleSelect(iconName)}
                                            title={iconName}
                                            className={cn(
                                                'aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer relative group',
                                                isSelected
                                                    ? 'bg-brand text-white ring-2 ring-brand ring-offset-2 ring-offset-background'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-brand dark:hover:text-brand'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-brand flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
'use client'

import { Check } from 'lucide-react'
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '@/lib/constants/category-colors'
import { cn } from '@/lib/utils'

type ColorPickerProps = {
    value: string | null
    onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    const current = value || DEFAULT_CATEGORY_COLOR

    return (
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {CATEGORY_COLORS.map((color) => {
                const isSelected = current.toLowerCase() === color.value.toLowerCase()

                return (
                    <button
                        key={color.value}
                        type="button"
                        title={color.label}
                        onClick={() => onChange(color.value)}
                        className={cn(
                            'aspect-square rounded-lg sm:rounded-xl transition-all cursor-pointer relative flex items-center justify-center',
                            'max-w-[32px] sm:max-w-none mx-auto w-full',
                            isSelected && 'ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-background'
                        )}
                        style={{
                            backgroundColor: color.value,
                            boxShadow: isSelected ? `0 0 0 2px ${color.value}` : undefined,
                        }}
                    >
                        {isSelected && (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-md" strokeWidth={3} />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Gabung class names pakai clsx + tailwind-merge.
 * Konsisten di seluruh app — import via `@/lib/utils`.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
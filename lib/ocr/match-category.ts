import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

/**
 * Match kategori dari nama (hasil OCR) ke kategori di DB.
 *
 * - Case-insensitive
 * - Trim whitespace
 * - Exact match only (biar aman)
 * - Return null kalau gak ketemu (user pilih manual)
 */
export function matchCategoryByName(
    categoryName: string | null,
    categories: Category[]
): Category | null {
    if (!categoryName) return null

    const normalized = categoryName.toLowerCase().trim()
    if (!normalized) return null

    return (
        categories.find(
            (c) => c.name.toLowerCase().trim() === normalized
        ) || null
    )
}
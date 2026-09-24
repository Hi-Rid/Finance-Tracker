export const WISHLIST_CATEGORIES = [
    { value: 'electronics', label: 'Elektronik' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'hobbies', label: 'Hobbies' },
    { value: 'home_decor', label: 'Home & Decor' },
    { value: 'health', label: 'Kesehatan' },
    { value: 'automotive', label: 'Otomotif' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'books', label: 'Buku' },
    { value: 'travel', label: 'Travel' },
    { value: 'collectible', label: 'Koleksi' },
    { value: 'other', label: 'Lainnya' },
] as const

export function getCategoryLabel(value: string | null): string {
    if (!value) return '—'
    return (
        WISHLIST_CATEGORIES.find((c) => c.value === value)?.label || value
    )
}
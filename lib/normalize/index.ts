/** Trim spasi berlebih & rapihin */
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Kapital di huruf pertama (kalimat) */
export function capitalizeFirst(value: string): string {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

/** Title Case per kata ("makan siang" → "Makan Siang") */
export function toTitleCase(value: string): string {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  return normalized
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** UPPERCASE (buat nama akun: BCA, JAGO) */
export function toUppercase(value: string): string {
  return normalizeText(value).toUpperCase()
}

/** Smart: kalau ada 2+ huruf kapital berurutan, biarin (BBCA, iPhone) */
export function smartCapitalize(value: string): string {
  const normalized = normalizeText(value)
  if (!normalized) return ''

  // Cek kalau ada 2+ uppercase berurutan (anggap intentional)
  const hasAcronym = /[A-Z]{2,}/.test(normalized)
  if (hasAcronym) return normalized

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

/** Format Rupiah */
export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

/** Format angka tanpa Rp */
export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID')
}

/** Parse string "1.000.000" atau "1000000" jadi number */
export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}
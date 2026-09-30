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

/** Format Rupiah compact buat UI sempit: Rp 1.5jt, Rp 250rb, Rp 3M */
export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000_000)
    return `${sign}Rp ${(abs / 1_000_000_000_000).toFixed(1)}T`
  if (abs >= 1_000_000_000)
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`
  if (abs >= 1_000_000) {
    const jt = abs / 1_000_000
    return `${sign}Rp ${jt >= 100 ? jt.toFixed(0) : jt.toFixed(1)}jt`
  }
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`
}
/**
 * Centralized color tokens.
 * Ganti palette di sini → berlaku ke seluruh app.
 */

export const PALETTE = {
  navyDeep: '#091F5C',
  navy: '#334DAF',
  steel: '#7096D1',
  ice: '#D0E4FE',
  pale: '#E8F2FE',
  offWhite: '#F9FBFF',
} as const

export const PRIMARY = {
  50: '#F9FBFF',
  100: '#E8F2FE',
  200: '#D0E4FE',
  300: '#A8C5E8',
  400: '#7096D1',
  500: '#4A6FC0',
  600: '#334DAF',
  700: '#1F3680',
  800: '#091F5C',
  900: '#050F2E',
} as const

export const SEMANTIC = {
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#334DAF',
} as const

/** Warna chart konsisten di semua tempat */
export const CHART_COLORS = {
  primary: '#334DAF',
  secondary: '#7096D1',
  tertiary: '#A8C5E8',
  quaternary: '#D0E4FE',
  success: SEMANTIC.success,
  warning: SEMANTIC.warning,
  danger: SEMANTIC.danger,
} as const

/** Palette buat donut/pie chart (urutan default) */
export const CATEGORY_COLORS = [
  '#334DAF',
  '#7096D1',
  '#10b981',
  '#f59e0b',
  '#A8C5E8',
  '#ef4444',
  '#D0E4FE',
  '#4A6FC0',
] as const

export type ChartColor = keyof typeof CHART_COLORS
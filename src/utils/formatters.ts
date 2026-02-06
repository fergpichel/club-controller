import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── CURRENCY ──────────────────────────────────────────────

/** Smart currency format: shows decimals only when needed — 1.234 € or 1.234,50 € */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

/** Abbreviated currency: 1,2M€ / 15k€ / 350€ */
export function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k€`
  return `${Math.round(value)}€`
}

// ─── DATES ─────────────────────────────────────────────────

/** Short date with year: "6 feb 2026" */
export function formatDateShort(date: Date | string | number | undefined | null): string {
  if (!date) return 'Sin fecha'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Fecha inválida'
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return 'Fecha inválida'
  }
}

/** Compact date (no year): "6 feb" */
export function formatDateCompact(date: Date | string | number | undefined | null): string {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return format(d, 'd MMM', { locale: es })
  } catch {
    return ''
  }
}

/** Long date: "6 de febrero de 2026" */
export function formatDateLong(date: Date | string | number | undefined | null): string {
  if (!date) return 'Sin fecha'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Fecha inválida'
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return 'Fecha inválida'
  }
}

/** Heatmap date: "6 de febrero, 2026" */
export function formatDateHeatmap(date: Date): string {
  return format(date, "d 'de' MMMM, yyyy", { locale: es })
}

/** Date + time: "6 feb 2026, 14:30" */
export function formatDateTime(date: Date | string | number | undefined | null): string {
  if (!date) return 'Sin fecha'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Fecha inválida'
    return format(d, 'd MMM yyyy, HH:mm', { locale: es })
  } catch {
    return 'Fecha inválida'
  }
}

/** Relative date: "Hoy", "Ayer", or "6 feb" */
export function formatDateRelative(date: Date | string | number | undefined | null): string {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    if (isToday(d)) return 'Hoy'
    if (isYesterday(d)) return 'Ayer'
    return format(d, 'd MMM', { locale: es })
  } catch {
    return ''
  }
}

/** Day number only: "6" */
export function formatDay(date: Date | string): string {
  return format(new Date(date), 'd')
}

/** Month abbreviation uppercase: "FEB" */
export function formatMonthShort(date: Date | string): string {
  return format(new Date(date), 'MMM', { locale: es }).toUpperCase()
}

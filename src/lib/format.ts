import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatCurrency(value: number, currency = 'IDR', compact = false) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value)
}

export function formatDate(value: string, pattern = 'd MMM yyyy') {
  return format(parseISO(value), pattern, { locale: id })
}

export function parseAmount(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

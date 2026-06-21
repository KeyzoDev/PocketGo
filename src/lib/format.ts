export function formatCurrency(value: number, currency = 'IDR', locale = 'id-ID', compact = false) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(value)
}

export function formatDate(value: string | Date, locale = 'id-ID', options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  return new Intl.DateTimeFormat(locale, options ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatNumber(value: number, locale = 'id-ID', options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function currencySymbol(currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currency
}

export function parseAmount(value: string, locale = 'id-ID') {
  const cleaned = value.trim().replace(/[^\d.,-]/g, '')
  const normalized = locale.startsWith('id')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

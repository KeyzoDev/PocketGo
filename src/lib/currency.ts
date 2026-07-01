export const FALLBACK_USD_TO_IDR_RATE = 17_000
export const SUPPORTED_BASE_CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD'] as const

export function safeUsdToIdrRate(rate?: number | null) {
  return Number.isFinite(rate) && Number(rate) > 0 ? Number(rate) : FALLBACK_USD_TO_IDR_RATE
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, usdToIdrRate?: number | null) {
  if (!Number.isFinite(amount)) return 0
  if (fromCurrency === toCurrency) return amount
  const rate = safeUsdToIdrRate(usdToIdrRate)
  if (fromCurrency === 'USD' && toCurrency === 'IDR') return amount * rate
  if (fromCurrency === 'IDR' && toCurrency === 'USD') return amount / rate
  return amount
}

export async function fetchUsdToIdrRate(signal?: AbortSignal) {
  const response = await fetch('https://api.frankfurter.dev/v2/rate/USD/IDR', { signal })
  if (!response.ok) throw new Error(`Exchange rate request failed: ${response.status}`)
  const payload = await response.json() as { rate?: number; amount?: number; rates?: { IDR?: number }; date?: string }
  const rate = payload.rate ?? payload.rates?.IDR
  if (!Number.isFinite(rate) || Number(rate) <= 0) throw new Error('Exchange rate response is invalid.')
  return {
    rate: Number(rate),
    date: payload.date,
  }
}

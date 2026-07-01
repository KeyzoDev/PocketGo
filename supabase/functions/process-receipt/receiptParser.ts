import { suggestCategory } from './categorySuggester.ts'

type Category = {
  id: string
  localization_key?: string | null
  name: string
  type: 'income' | 'expense' | 'system' | 'transfer'
}

type Rule = {
  language: string
  match_type: 'merchant_exact' | 'merchant_contains' | 'keyword_contains' | 'regex'
  pattern: string
  category_id: string
  category_name: string
  priority: number
  is_default?: boolean
}

function normalize(value = '') {
  return value.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function detectCurrency(text: string, fallback: string) {
  if (/\bIDR\b|Rp\s?/i.test(text)) return 'IDR'
  if (/\bUSD\b|\$/i.test(text)) return 'USD'
  return fallback
}

function parseNumericToken(token: string, currency: string) {
  const cleaned = token.replace(/[^\d.,]/g, '')
  if (!cleaned) return null
  let normalized = cleaned
  if (currency === 'IDR') {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes('.') && cleaned.includes(',')) {
    normalized = cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')
      ? cleaned.replace(/,/g, '')
      : cleaned.replace(/\./g, '').replace(',', '.')
  } else if ((cleaned.match(/,/g) ?? []).length === 1 && !cleaned.includes('.')) {
    normalized = cleaned.replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  if (currency === 'IDR') return Math.round(value)
  return Math.round(value * 100) / 100
}

function looksLikeDateOrTime(token: string) {
  return /\b\d{1,2}[:/.-]\d{1,2}([:/.-]\d{2,4})?\b/.test(token) && !/(rp|idr|usd|\$)/i.test(token)
}

function candidateAmounts(rawText: string, currency: string) {
  const lines = rawText.split('\n')
  const keyword = /(grand\s+total|total\s+belanja|jumlah|total|bayar|amount|paid)/i
  const amountRegex = /(?:Rp|IDR|\$|USD)?\s?\d[\d.,]{1,14}/gi
  const candidates: Array<{ value: number; score: number; line: string }> = []
  lines.forEach((line, index) => {
    const matches = line.match(amountRegex) ?? []
    for (const match of matches) {
      if (looksLikeDateOrTime(match)) continue
      const value = parseNumericToken(match, currency)
      if (!value || value <= 0) continue
      if (currency === 'IDR' && value < 100) continue
      let score = keyword.test(line) ? 100 : 20
      if (/grand\s+total/i.test(line)) score += 30
      if (/subtotal|kembali|change|cash|tunai|uang/i.test(line)) score -= 15
      score += Math.min(20, index)
      candidates.push({ value, score, line })
    }
  })
  return candidates.sort((a, b) => b.score - a.score || b.value - a.value)
}

function extractDate(rawText: string) {
  const warnings: string[] = []
  const iso = rawText.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (iso) return { date: `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`, warnings }
  const local = rawText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/)
  if (local) return { date: `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}`, warnings }
  const months: Record<string, string> = {
    jan: '01', januari: '01', feb: '02', februari: '02', mar: '03', maret: '03',
    apr: '04', april: '04', mei: '05', may: '05', jun: '06', juni: '06', jul: '07',
    juli: '07', aug: '08', agustus: '08', sep: '09', september: '09', oct: '10',
    okt: '10', oktober: '10', nov: '11', november: '11', dec: '12', des: '12', desember: '12',
  }
  const named = rawText.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/)
  if (named && months[named[2].toLowerCase()]) {
    return { date: `${named[3]}-${months[named[2].toLowerCase()]}-${named[1].padStart(2, '0')}`, warnings }
  }
  warnings.push('DATE_NOT_FOUND')
  return { date: new Date().toISOString().slice(0, 10), warnings }
}

function extractMerchant(rawText: string) {
  const ignored = /(total|subtotal|jumlah|bayar|amount|paid|tanggal|date|time|jam|kasir|cashier|npwp|telp|phone|struk|receipt|invoice|alamat|address|www\.|@)/i
  const lines = normalize(rawText).split('\n').map((line) => line.trim()).filter(Boolean)
  const candidate = lines.slice(0, 8).find((line) =>
    line.length >= 3 &&
    line.length <= 60 &&
    !ignored.test(line) &&
    !/\b\d{4,}\b/.test(line) &&
    !/^\d+[\d.,\s-]+$/.test(line)
  )
  return candidate ?? ''
}

function extractItems(rawText: string) {
  const ignored = /(total|subtotal|jumlah|bayar|amount|paid|tanggal|date|kasir|cashier|npwp|telp|phone)/i
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 3 && line.length <= 80 && !ignored.test(line))
    .slice(1, 8)
}

export function parseReceiptText(rawText: string, options: {
  language: string
  baseCurrency: string
  categories: Category[]
  categoryRules: Rule[]
  ocrConfidence?: number
}) {
  const warnings: string[] = []
  const currency = detectCurrency(rawText, options.baseCurrency)
  const amounts = candidateAmounts(rawText, currency)
  const amount = amounts[0]?.value ?? null
  if (!amount) warnings.push('AMOUNT_NOT_FOUND')
  const dateResult = extractDate(rawText)
  warnings.push(...dateResult.warnings)
  const merchant = extractMerchant(rawText)
  if (!merchant) warnings.push('MERCHANT_NOT_FOUND')
  const items = extractItems(rawText)
  const category = suggestCategory({
    merchant,
    description: items[0],
    rawText,
    items,
    type: 'expense',
    language: options.language,
    categories: options.categories,
    userRules: options.categoryRules,
  })
  const confidence = Math.min(0.96, Math.max(0.2,
    (options.ocrConfidence ?? 0.7) * 0.45 +
    (amount ? 0.22 : 0) +
    (merchant ? 0.12 : 0) +
    (category.confidence * 0.16) +
    (warnings.length ? -0.08 : 0),
  ))
  return {
    sourceType: 'receipt',
    transactionType: 'expense',
    merchant,
    amount,
    currency,
    date: dateResult.date,
    items,
    categorySuggestion: category,
    noteSuggestion: items[0] ?? merchant,
    confidence,
    rawText,
    warnings,
  }
}

export function parseStatementText(rawText: string, options: {
  language: string
  baseCurrency: string
  categories: Category[]
  categoryRules: Rule[]
  ocrConfidence?: number
}) {
  const lines = rawText.split('\n').map((line) => line.trim()).filter((line) => line.length >= 8)
  return lines.flatMap((line) => {
    const currency = detectCurrency(line, options.baseCurrency)
    const amount = candidateAmounts(line, currency)[0]?.value
    if (!amount) return []
    const isIncome = /(cr\b|credit|gaji|salary|payroll|income|revenue)/i.test(line)
    const type = isIncome ? 'income' : 'expense'
    const dateResult = extractDate(line)
    const category = suggestCategory({
      description: line,
      rawText: line,
      type,
      language: options.language,
      categories: options.categories,
      userRules: options.categoryRules,
    })
    return [{
      type,
      amount,
      currency,
      date: dateResult.date,
      merchant: '',
      description: line,
      note: line,
      categorySuggestion: category,
      confidence: Math.min(0.9, (options.ocrConfidence ?? 0.7) * 0.5 + category.confidence * 0.25 + 0.12),
      rawText: line,
      warnings: dateResult.warnings,
    }]
  }).slice(0, 30)
}

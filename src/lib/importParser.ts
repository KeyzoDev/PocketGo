import { formatISO } from 'date-fns'
import { createId } from './id'
import { localizedCategoryName } from '../i18n/regions'
import type {
  AppState,
  Category,
  CategoryRule,
  ImportedDraftType,
  ImportedTransactionDraft,
  ImportSourceType,
  ScannedDocument,
  SupportedLocale,
  Transaction,
} from '../types'

const keywordRules: Record<'id-ID' | 'en-US', Record<'income' | 'expense', Record<string, string[]>>> = {
  'id-ID': {
    income: {
      salary: ['gaji', 'salary', 'payroll'],
      business_income: ['usaha', 'wifi customer', 'pelanggan', 'invoice', 'provider', 'maintenance', 'bisnis', 'revenue'],
      freelance: ['freelance', 'project'],
      bonus: ['bonus'],
      cashback: ['cashback'],
      other_income: [],
    },
    expense: {
      food_drinks: ['nasi', 'nasi padang', 'padang', 'warung', 'resto', 'restoran', 'cafe', 'coffee', 'kopi', 'ayam', 'bakso', 'mie', 'indomie', 'martabak', 'grabfood', 'gofood', 'shopeefood', 'makan', 'minum', 'starbucks', 'fore', 'janji jiwa', 'kfc', 'mcd', 'hokben'],
      transport: ['grab', 'gojek', 'gocar', 'goride', 'maxim', 'taxi', 'toll', 'tol', 'parkir', 'transport', 'mrt', 'krl', 'transjakarta'],
      fuel: ['pertamina', 'shell', 'bp akr', 'vivo', 'spbu', 'bensin', 'solar', 'pertamax'],
      groceries: ['alfamart', 'indomaret', 'superindo', 'hypermart', 'lotte', 'ranch market', 'sayur', 'telur', 'beras', 'galon', 'groceries'],
      bills: ['pln', 'listrik', 'pdam', 'bpjs', 'tagihan', 'bill', 'pascabayar', 'kartu kredit'],
      internet: ['internet', 'wifi', 'indihome', 'biznet', 'first media', 'myrepublic', 'iconnet', 'telkomsel', 'xl', 'indosat', 'tri'],
      entertainment: ['netflix', 'spotify', 'youtube premium', 'disney', 'bioskop', 'cinema', 'xxi', 'cgv', 'game', 'playstation'],
      health: ['apotek', 'farmasi', 'dokter', 'klinik', 'rumah sakit', 'obat', 'halodoc', 'vitamin'],
      family: ['transfer istri', 'keluarga', 'orang tua', 'anak', 'rumah', 'household'],
      business: ['usaha', 'wifi customer', 'pelanggan', 'invoice', 'provider', 'maintenance', 'bisnis', 'revenue'],
      other_expense: [],
    },
  },
  'en-US': {
    income: {
      salary: ['salary', 'payroll', 'monthly salary'],
      business_income: ['business', 'client', 'invoice', 'revenue', 'provider', 'maintenance'],
      freelance: ['freelance', 'project'],
      bonus: ['bonus'],
      cashback: ['cashback'],
      other_income: [],
    },
    expense: {
      food_drinks: ['food', 'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'burger', 'pizza', 'lunch', 'dinner', 'breakfast'],
      transport: ['uber', 'lyft', 'grab', 'taxi', 'bus', 'train', 'subway', 'parking', 'toll', 'transport'],
      fuel: ['gas', 'fuel', 'shell', 'bp', 'chevron', 'exxon', 'petrol'],
      groceries: ['supermarket', 'grocery', 'groceries', 'walmart', 'costco', 'target', 'whole foods', 'market'],
      bills: ['bill', 'electricity', 'water', 'utility', 'credit card', 'insurance'],
      internet: ['internet', 'wifi', 'broadband', 'mobile plan', 'telecom'],
      entertainment: ['netflix', 'spotify', 'disney', 'cinema', 'movie', 'game', 'playstation', 'xbox'],
      health: ['pharmacy', 'doctor', 'clinic', 'hospital', 'medicine', 'health'],
      family: ['family', 'spouse', 'wife', 'husband', 'parents', 'household'],
      business: ['business', 'client', 'invoice', 'revenue', 'provider', 'maintenance'],
      other_expense: [],
    },
  },
}

export interface CategorySuggestion {
  categoryId?: string
  categoryName?: string
  confidence: number
  reason: string
  matchedKeywords: string[]
}

export interface ParseContext {
  state: AppState
  language: SupportedLocale
  currency: string
  isDemoMode: boolean
}

export interface ParseResult {
  document: ScannedDocument
  drafts: ImportedTransactionDraft[]
  unsupportedReason?: 'no_parser' | 'no_amount'
}

function normalize(value = '') {
  return value.toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}\s.$,/:-]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function categoryByKey(categories: Category[], key: string, type: 'income' | 'expense') {
  return categories.find((category) => category.localizationKey === key && category.type === type && !category.isArchived)
}

export function suggestCategory({
  merchant,
  description,
  rawText,
  type,
  language,
  categories,
  userRules,
}: {
  merchant?: string
  description?: string
  rawText?: string
  type: 'income' | 'expense'
  language: SupportedLocale
  categories: Category[]
  userRules: CategoryRule[]
}): CategorySuggestion {
  const haystack = normalize(`${merchant ?? ''} ${description ?? ''} ${rawText ?? ''}`)
  const categoryLocale = language === 'id-ID' ? 'ID' : 'GLOBAL'
  const activeUserRules = [...userRules]
    .filter((rule) => !rule.isDefault && rule.language === language)
    .sort((a, b) => b.priority - a.priority)

  for (const rule of activeUserRules) {
    const pattern = normalize(rule.pattern)
    const exact = rule.matchType === 'merchant_exact' && normalize(merchant) === pattern
    const contains = (rule.matchType === 'merchant_contains' || rule.matchType === 'keyword_contains') && haystack.includes(pattern)
    const regex = rule.matchType === 'regex' && new RegExp(rule.pattern, 'i').test(haystack)
    if (exact || contains || regex) {
      const category = categories.find((item) => item.id === rule.categoryId)
      return {
        categoryId: category?.id ?? rule.categoryId,
        categoryName: localizedCategoryName(category?.localizationKey, category?.name ?? rule.categoryName, categoryLocale),
        confidence: 0.94,
        reason: 'user_rule',
        matchedKeywords: [rule.pattern],
      }
    }
  }

  const rules = keywordRules[language][type]
  let best: CategorySuggestion | undefined
  for (const [key, keywords] of Object.entries(rules)) {
    const matched = keywords.filter((keyword) => haystack.includes(normalize(keyword)))
    if (!matched.length) continue
    const category = categoryByKey(categories, key, type)
    const confidence = Math.min(0.9, 0.64 + matched.length * 0.08)
    if (!best || confidence > best.confidence) {
      best = {
        categoryId: category?.id,
        categoryName: category ? localizedCategoryName(category.localizationKey, category.name, categoryLocale) : undefined,
        confidence,
        reason: 'keyword',
        matchedKeywords: matched,
      }
    }
  }
  if (best) return best

  const fallbackKey = type === 'income' ? 'other_income' : 'other_expense'
  const fallback = categoryByKey(categories, fallbackKey, type)
  return {
    categoryId: fallback?.id,
    categoryName: fallback ? localizedCategoryName(fallback.localizationKey, fallback.name, categoryLocale) : undefined,
    confidence: 0.35,
    reason: 'fallback',
    matchedKeywords: [],
  }
}

function detectCurrency(text: string, fallback: string) {
  if (/\bIDR\b|Rp\s?/i.test(text)) return 'IDR'
  if (/\bUSD\b|\$/i.test(text)) return 'USD'
  return fallback
}

function parseNumberToken(token: string, currency: string) {
  const cleaned = token.replace(/[^\d.,]/g, '')
  if (!cleaned) return 0
  const normalized = currency === 'IDR'
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : 0
}

function extractAmount(text: string, currency: string) {
  const amountMatches = text.match(/(?:Rp|IDR|\$|USD)?\s?\d[\d.,]{2,}/gi) ?? []
  const values = amountMatches
    .map((token) => parseNumberToken(token, currency))
    .filter((value) => value > 0)
  if (!values.length) return 0
  return currency === 'IDR' ? Math.max(...values.filter((value) => value >= 1000)) || Math.max(...values) : Math.max(...values)
}

function extractDate(text: string) {
  const today = formatISO(new Date(), { representation: 'date' })
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const local = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/)
  if (local) return `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}`
  return today
}

function filenameText(fileName: string) {
  return fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(20\d{2}|\d{4,}|rp|idr|usd|jpg|jpeg|png|webp|pdf|receipt|struk|mutasi|bank|statement)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMerchant(rawText: string, fileName: string) {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const firstUseful = lines.find((line) => !/(total|subtotal|tanggal|date|amount|jumlah|rp|idr|usd|\$)/i.test(line) && line.length >= 3)
  return firstUseful?.slice(0, 80) || filenameText(fileName).slice(0, 80)
}

function extractMerchantFromText(rawText: string) {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return lines.find((line) =>
    !/(total|subtotal|tanggal|date|amount|jumlah|rp|idr|usd|\$|telp|phone|npwp|kasir|cashier|struk|receipt)/i.test(line) &&
    !/\b\d{4,}\b/.test(line) &&
    line.length >= 3 &&
    line.length <= 80
  )?.slice(0, 80) ?? ''
}

export function parseReceiptText(rawText: string, context: Omit<ParseContext, 'isDemoMode'>) {
  const warnings: string[] = []
  const detectedCurrency = detectCurrency(rawText, context.currency)
  const amount = extractAmount(rawText, detectedCurrency)
  if (!amount) warnings.push('AMOUNT_NOT_FOUND')
  const merchant = extractMerchantFromText(rawText)
  if (!merchant) warnings.push('MERCHANT_NOT_FOUND')
  const category = suggestCategory({
    merchant,
    rawText,
    type: 'expense',
    language: context.language,
    categories: context.state.categories,
    userRules: context.state.categoryRules,
  })
  return {
    sourceType: 'receipt' as const,
    transactionType: 'expense' as const,
    merchant,
    amount: amount || null,
    currency: detectedCurrency,
    date: extractDate(rawText),
    categorySuggestion: category,
    noteSuggestion: merchant || undefined,
    confidence: Math.min(0.94, 0.48 + (amount ? 0.22 : 0) + (merchant ? 0.12 : 0) + category.confidence * 0.16),
    rawText,
    warnings,
  }
}

function detectType(text: string): ImportedDraftType {
  const normalized = normalize(text)
  if (/(gaji|salary|payroll|cr\b|credit|income|revenue|pemasukan)/i.test(normalized)) return 'income'
  if (/(trsf|transfer|pemindahan)/i.test(normalized)) return 'unknown'
  if (/(db\b|debit|bayar|payment|belanja|purchase|expense|pengeluaran)/i.test(normalized)) return 'expense'
  return 'expense'
}

function similar(a = '', b = '') {
  const left = normalize(a)
  const right = normalize(b)
  return Boolean(left && right && (left.includes(right) || right.includes(left)))
}

export function isDuplicateDraft(draft: Pick<ImportedTransactionDraft, 'date' | 'amount' | 'merchant' | 'description' | 'accountId'>, transactions: Transaction[]) {
  if (!draft.amount) return false
  const amount = draft.amount
  return transactions.some((transaction) =>
    transaction.transactionDate === draft.date &&
    Math.abs(transaction.amount - amount) < 0.01 &&
    (!draft.accountId || transaction.walletId === draft.accountId) &&
    (similar(transaction.merchant, draft.merchant) || similar(transaction.note, draft.description)),
  )
}

function makeDocument(file: File, sourceType: ImportSourceType, rawText: string, parseStatus: ScannedDocument['parseStatus']): ScannedDocument {
  const now = new Date().toISOString()
  return {
    id: createId('scan'),
    fileName: file.name,
    fileType: file.type || 'unknown',
    fileSize: file.size,
    sourceType,
    uploadStatus: 'local',
    parseStatus,
    rawText,
    createdAt: now,
    updatedAt: now,
  }
}

async function readText(file: File) {
  if (file.type.startsWith('image/')) return ''
  try {
    const text = await file.text()
    return Array.from(text)
      .map((char) => {
        const code = char.charCodeAt(0)
        return code === 9 || code === 10 || code === 13 || code >= 32 ? char : ' '
      })
      .join('')
  } catch {
    return ''
  }
}

function makeDraft(base: Omit<ImportedTransactionDraft, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ImportedTransactionDraft {
  const now = new Date().toISOString()
  return { ...base, id: createId('draft'), status: 'draft', createdAt: now, updatedAt: now }
}

export async function parseReceiptFile(file: File, context: ParseContext): Promise<ParseResult> {
  const rawText = await readText(file)
  const source = `${rawText}\n${file.name}`
  const currency = detectCurrency(source, context.currency)
  const amount = extractAmount(source, currency)
  const merchant = extractMerchant(rawText, file.name)
  const canUseFilenameSignal = Boolean(amount && merchant)
  if (!rawText && file.type.startsWith('image/') && !context.isDemoMode && !canUseFilenameSignal) {
    return { document: makeDocument(file, 'receipt', rawText, 'unsupported'), drafts: [], unsupportedReason: 'no_parser' }
  }
  if (!amount) return { document: makeDocument(file, 'receipt', rawText, 'failed'), drafts: [], unsupportedReason: 'no_amount' }
  const category = suggestCategory({
    merchant,
    rawText: source,
    type: 'expense',
    language: context.language,
    categories: context.state.categories,
    userRules: context.state.categoryRules,
  })
  const wallet = context.state.wallets.find((item) => !item.isArchived && item.currency === currency) ?? context.state.wallets.find((item) => !item.isArchived)
  const draft = makeDraft({
    scannedDocumentId: '',
    type: 'expense',
    amount,
    currency,
    date: extractDate(source),
    merchant,
    description: merchant,
    note: merchant,
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    accountId: wallet?.id,
    confidence: Math.min(0.94, 0.52 + (rawText ? 0.16 : 0) + (merchant ? 0.1 : 0) + (category.confidence * 0.16)),
    duplicateCandidate: false,
    rawText: source,
  })
  const document = makeDocument(file, 'receipt', rawText, 'parsed')
  draft.scannedDocumentId = document.id
  draft.duplicateCandidate = isDuplicateDraft(draft, context.state.transactions)
  return { document, drafts: [draft] }
}

export async function parseStatementFile(file: File, context: ParseContext): Promise<ParseResult> {
  const rawText = await readText(file)
  if (!rawText.trim()) {
    return { document: makeDocument(file, 'bank_statement', rawText, 'unsupported'), drafts: [], unsupportedReason: 'no_parser' }
  }
  const document = makeDocument(file, 'bank_statement', rawText, 'parsed')
  const wallet = context.state.wallets.find((item) => !item.isArchived)
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length >= 6)
  const drafts = lines
    .map((line) => {
      const currency = detectCurrency(line, context.currency)
      const amount = extractAmount(line, currency)
      if (!amount) return undefined
      const type = detectType(line)
      const safeType = type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'unknown'
      const suggestionType = safeType === 'income' ? 'income' : 'expense'
      const category = suggestCategory({
        description: line,
        rawText: line,
        type: suggestionType,
        language: context.language,
        categories: context.state.categories,
        userRules: context.state.categoryRules,
      })
      const draft = makeDraft({
        scannedDocumentId: document.id,
        type: safeType,
        amount,
        currency,
        date: extractDate(line),
        description: line.replace(/(?:Rp|IDR|\$|USD)?\s?\d[\d.,]{2,}/gi, '').trim(),
        note: line,
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        accountId: wallet?.id,
        confidence: Math.min(0.88, 0.5 + category.confidence * 0.18 + (safeType !== 'unknown' ? 0.12 : 0)),
        duplicateCandidate: false,
        rawText: line,
      })
      draft.duplicateCandidate = isDuplicateDraft(draft, context.state.transactions)
      return draft
    })
    .filter(Boolean) as ImportedTransactionDraft[]
  return { document, drafts: drafts.slice(0, 20), unsupportedReason: drafts.length ? undefined : 'no_amount' }
}

export type WalletType =
  | 'cash'
  | 'bank'
  | 'ewallet'
  | 'credit_card'
  | 'paylater'
  | 'savings'
  | 'investment'
  | 'business'
  | 'loan'
  | 'other'

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment'

export type CategoryType = 'income' | 'expense' | 'system'
export type SupportedLocale = 'id-ID' | 'en-US'
export type CountryCode = 'ID' | 'US' | 'GLOBAL'

export interface Profile {
  fullName: string
  preferredLanguage: SupportedLocale
  locale: SupportedLocale
  countryCode: CountryCode
  currency: string
  usdToIdrRate: number
  exchangeRateSource: 'realtime' | 'manual' | 'fallback'
  exchangeRateUpdatedAt?: string
  incomePattern: 'monthly' | 'twice_monthly' | 'weekly' | 'daily' | 'irregular' | 'none'
  defaultIncomeDay?: number
  onboardingCompleted: boolean
}

export interface Wallet {
  id: string
  name: string
  type: WalletType
  startingBalance: number
  currency: string
  includeInTotal: boolean
  isArchived: boolean
  color: string
  createdAt: string
}

export interface Category {
  id: string
  localizationKey?: string
  name: string
  type: CategoryType
  isDefault: boolean
  isArchived: boolean
}

export interface Transaction {
  id: string
  walletId: string
  categoryId?: string
  type: TransactionType
  amount: number
  currency?: string
  exchangeRate?: number
  amountInBaseCurrency?: number
  adjustmentDirection?: 'increase' | 'decrease'
  transactionDate: string
  merchant?: string
  note?: string
  transferGroupId?: string
  relatedWalletId?: string
  createdAt: string
}

export interface RecurringRule {
  id: string
  name: string
  type: 'income' | 'expense' | 'debt_payment' | 'subscription'
  amount: number
  walletId?: string
  categoryId?: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  nextDueDate: string
  isActive: boolean
}

export interface Budget {
  id: string
  name: string
  categoryId?: string
  totalLimit: number
  periodStart: string
  periodEnd: string
}

export interface Goal {
  id: string
  name: string
  walletId?: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
  priority: 'low' | 'medium' | 'high'
}

export interface Debt {
  id: string
  name: string
  type: 'credit_card' | 'paylater' | 'personal_loan' | 'installment' | 'other'
  lender?: string
  originalAmount: number
  remainingBalance: number
  installmentAmount: number
  minimumPayment: number
  dueDay: number
  status: 'active' | 'paid'
}

export type ImportSourceType = 'receipt' | 'bank_statement'
export type ImportedDraftType = 'income' | 'expense' | 'transfer' | 'adjustment' | 'unknown'

export interface ScannedDocument {
  id: string
  userId?: string
  fileName: string
  filePath?: string
  fileType: string
  fileSize: number
  sourceType: ImportSourceType
  uploadStatus: 'local' | 'uploaded' | 'failed'
  parseStatus: 'pending' | 'processing' | 'parsed' | 'failed' | 'unsupported'
  rawText?: string
  ocrProvider?: string
  ocrConfidence?: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface ImportedTransactionDraft {
  id: string
  scannedDocumentId: string
  userId?: string
  type: ImportedDraftType
  amount: number | null
  currency: string
  date: string
  merchant?: string
  description?: string
  note?: string
  categoryId?: string
  categoryName?: string
  accountId?: string
  confidence: number
  duplicateCandidate: boolean
  status: 'draft' | 'approved' | 'rejected' | 'saved'
  rawText?: string
  createdAt: string
  updatedAt: string
}

export interface CategoryRule {
  id: string
  userId?: string
  language: SupportedLocale
  matchType: 'merchant_exact' | 'merchant_contains' | 'keyword_contains' | 'regex'
  pattern: string
  categoryId: string
  categoryName: string
  priority: number
  isDefault: boolean
  createdAt: string
}

export interface AppState {
  profile: Profile
  wallets: Wallet[]
  categories: Category[]
  categoryRules: CategoryRule[]
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  budgets: Budget[]
  goals: Goal[]
  debts: Debt[]
}

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>

export interface TransferInput {
  sourceWalletId: string
  destinationWalletId: string
  amount: number
  transactionDate: string
  note?: string
}

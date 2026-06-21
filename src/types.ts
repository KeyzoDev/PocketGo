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
  totalLimit: number
  periodStart: string
  periodEnd: string
}

export interface Goal {
  id: string
  name: string
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

export interface AppState {
  profile: Profile
  wallets: Wallet[]
  categories: Category[]
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

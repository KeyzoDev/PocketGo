import type { AppState, CountryCode, SupportedLocale } from '../types'
import { createDefaultCategories } from '../i18n/regions'
import { FALLBACK_USD_TO_IDR_RATE } from '../lib/currency'

export const defaultCategories = createDefaultCategories('GLOBAL')

export const emptyState: AppState = {
  profile: {
    fullName: '',
    preferredLanguage: 'id-ID',
    locale: 'id-ID',
    countryCode: 'ID',
    currency: 'IDR',
    usdToIdrRate: FALLBACK_USD_TO_IDR_RATE,
    exchangeRateSource: 'fallback',
    incomePattern: 'monthly',
    onboardingCompleted: false,
  },
  wallets: [],
  categories: defaultCategories,
  categoryRules: [],
  transactions: [],
  recurringRules: [],
  budgets: [],
  goals: [],
  debts: [],
}

const today = new Date()
const isoDate = (offsetDays: number) => {
  const date = new Date(today)
  date.setDate(today.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

interface DemoPreferences {
  language?: SupportedLocale
  locale?: SupportedLocale
  countryCode?: CountryCode
  currency?: string
}

export function createDemoState(preferences: DemoPreferences = {}): AppState {
  const countryCode = preferences.countryCode ?? 'GLOBAL'
  const currency = preferences.currency ?? (countryCode === 'ID' ? 'IDR' : 'USD')
  const locale = preferences.locale ?? (countryCode === 'ID' ? 'id-ID' : 'en-US')
  const preferredLanguage = preferences.language ?? locale
  const isIndonesian = preferredLanguage === 'id-ID'
  const amount = (idr: number, usd: number) => currency === 'IDR' ? idr : usd
  const categories = createDefaultCategories(isIndonesian ? 'ID' : 'GLOBAL')
  const expense = (key: string) => categories.find((item) => item.localizationKey === key && item.type === 'expense')?.id
  const income = (key: string) => categories.find((item) => item.localizationKey === key && item.type === 'income')?.id

  return {
    profile: {
      fullName: 'Alex',
      preferredLanguage,
      locale,
      countryCode,
      currency,
      usdToIdrRate: FALLBACK_USD_TO_IDR_RATE,
      exchangeRateSource: 'fallback',
      incomePattern: 'monthly',
      defaultIncomeDay: 25,
      onboardingCompleted: true,
    },
    wallets: [
      {
        id: 'demo_cash',
        name: isIndonesian ? 'Dompet Tunai' : 'Cash Wallet',
        type: 'cash',
        startingBalance: amount(420_000, 120),
        currency,
        includeInTotal: true,
        isArchived: false,
        color: '#18B57D',
        createdAt: isoDate(-40),
      },
      {
        id: 'demo_checking',
        name: isIndonesian ? 'Rekening Bank' : 'Checking Account',
        type: 'bank',
        startingBalance: amount(5_240_000, 2350),
        currency,
        includeInTotal: true,
        isArchived: false,
        color: '#0A1D3D',
        createdAt: isoDate(-40),
      },
      {
        id: 'demo_ewallet',
        name: 'PocketGo e-Wallet',
        type: 'ewallet',
        startingBalance: amount(640_000, 180),
        currency,
        includeInTotal: true,
        isArchived: false,
        color: '#A8F0D1',
        createdAt: isoDate(-40),
      },
      {
        id: 'demo_paylater',
        name: 'PayLater',
        type: 'paylater',
        startingBalance: 0,
        currency,
        includeInTotal: false,
        isArchived: false,
        color: '#FF6B6B',
        createdAt: isoDate(-25),
      },
    ],
    categories,
    categoryRules: [],
    transactions: [
      {
        id: 'demo_tx_income',
        walletId: 'demo_checking',
        categoryId: income('salary'),
        type: 'income',
        amount: amount(4_200_000, 2800),
        transactionDate: isoDate(-3),
        merchant: isIndonesian ? 'Gaji Bulanan' : 'Monthly Salary',
        note: isIndonesian ? 'Pemasukan bulanan' : 'Monthly income',
        createdAt: isoDate(-3),
      },
      {
        id: 'demo_tx_food',
        walletId: 'demo_cash',
        categoryId: expense('food_drinks'),
        type: 'expense',
        amount: amount(65_000, 6.5),
        transactionDate: isoDate(-1),
        merchant: isIndonesian ? 'Makan di Cafe' : 'Coffee Shop',
        note: isIndonesian ? 'Makan & minum' : 'Food & drinks',
        createdAt: isoDate(-1),
      },
      {
        id: 'demo_tx_grocery',
        walletId: 'demo_checking',
        categoryId: expense('groceries'),
        type: 'expense',
        amount: amount(210_000, 85),
        transactionDate: isoDate(-2),
        merchant: isIndonesian ? 'Belanja Dapur' : 'Groceries',
        note: isIndonesian ? 'Stok dapur mingguan' : 'Weekly groceries',
        createdAt: isoDate(-2),
      },
      {
        id: 'demo_tx_transport',
        walletId: 'demo_ewallet',
        categoryId: expense('transport'),
        type: 'expense',
        amount: amount(32_000, 12),
        transactionDate: isoDate(-2),
        merchant: isIndonesian ? 'Transportasi' : 'Transport',
        note: isIndonesian ? 'Transportasi' : 'Transport',
        createdAt: isoDate(-2),
      },
      {
        id: 'demo_tx_bill',
        walletId: 'demo_checking',
        categoryId: expense('internet') ?? expense('utilities'),
        type: 'expense',
        amount: amount(275_000, 45),
        transactionDate: isoDate(-4),
        merchant: isIndonesian ? 'Bayar Internet' : 'Internet Bill',
        note: isIndonesian ? 'Tagihan internet rumah' : 'Home internet',
        createdAt: isoDate(-4),
      },
      {
        id: 'demo_tx_transfer_out',
        walletId: 'demo_checking',
        type: 'transfer_out',
        amount: amount(250_000, 65),
        transactionDate: isoDate(-5),
        note: isIndonesian ? 'Transfer Keluarga' : 'Family Transfer',
        transferGroupId: 'demo_transfer_1',
        relatedWalletId: 'demo_ewallet',
        createdAt: isoDate(-5),
      },
      {
        id: 'demo_tx_transfer_in',
        walletId: 'demo_ewallet',
        type: 'transfer_in',
        amount: amount(250_000, 65),
        transactionDate: isoDate(-5),
        note: isIndonesian ? 'Transfer Keluarga' : 'Family Transfer',
        transferGroupId: 'demo_transfer_1',
        relatedWalletId: 'demo_checking',
        createdAt: isoDate(-5),
      },
      {
        id: 'demo_tx_business',
        walletId: 'demo_checking',
        categoryId: income('business_income'),
        type: 'income',
        amount: amount(1_200_000, 180),
        transactionDate: isoDate(-6),
        merchant: isIndonesian ? 'Usaha WiFi' : 'Side Business',
        note: isIndonesian ? 'Pemasukan usaha' : 'Business income',
        createdAt: isoDate(-6),
      },
    ],
    recurringRules: [
      {
        id: 'demo_rec_electricity',
        name: isIndonesian ? 'Tagihan Internet' : 'Internet Bill',
        type: 'expense',
        amount: amount(250_000, 45),
        walletId: 'demo_checking',
        categoryId: expense('internet') ?? expense('utilities'),
        frequency: 'monthly',
        nextDueDate: isoDate(3),
        isActive: true,
      },
      {
        id: 'demo_rec_internet',
        name: isIndonesian ? 'Langganan Internet' : 'Internet Subscription',
        type: 'subscription',
        amount: amount(55_000, 15),
        walletId: 'demo_checking',
        categoryId: expense('internet'),
        frequency: 'monthly',
        nextDueDate: isoDate(7),
        isActive: true,
      },
      {
        id: 'demo_rec_salary',
        name: isIndonesian ? 'Gaji Bulanan' : 'Monthly Salary',
        type: 'income',
        amount: amount(4_200_000, 2800),
        walletId: 'demo_checking',
        categoryId: income('salary'),
        frequency: 'monthly',
        nextDueDate: isoDate(22),
        isActive: true,
      },
    ],
    budgets: [
      {
        id: 'demo_budget_monthly',
        name: isIndonesian ? 'Budget Bulanan' : 'Monthly Budget',
        totalLimit: amount(3_200_000, 950),
        periodStart: isoDate(-today.getDate() + 1),
        periodEnd: isoDate(30 - today.getDate()),
      },
    ],
    goals: [
      {
        id: 'demo_goal_emergency',
        name: isIndonesian ? 'Dana Darurat' : 'Emergency Fund',
        targetAmount: amount(5_000_000, 5000),
        currentAmount: amount(2_450_000, 2450),
        targetDate: isoDate(190),
        monthlyContribution: amount(350_000, 350),
        priority: 'high',
      },
    ],
    debts: [
      {
        id: 'demo_debt_paylater',
        name: isIndonesian ? 'Cicilan PayLater' : 'PayLater Installment',
        type: 'paylater',
        lender: 'Marketplace',
        originalAmount: amount(600_000, 180),
        remainingBalance: amount(420_000, 120),
        installmentAmount: amount(105_000, 35),
        minimumPayment: amount(105_000, 35),
        dueDay: Math.min(28, today.getDate() + 5),
        status: 'active',
      },
    ],
  }
}

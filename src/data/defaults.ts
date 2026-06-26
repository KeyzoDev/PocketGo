import type { AppState } from '../types'
import { createDefaultCategories } from '../i18n/regions'

export const defaultCategories = createDefaultCategories('ID')

export const emptyState: AppState = {
  profile: {
    fullName: '',
    preferredLanguage: 'en-US',
    locale: 'en-US',
    countryCode: 'GLOBAL',
    currency: 'USD',
    incomePattern: 'monthly',
    onboardingCompleted: false,
  },
  wallets: [],
  categories: defaultCategories,
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

export function createDemoState(): AppState {
  const categories = createDefaultCategories('GLOBAL')
  const expense = (key: string) => categories.find((item) => item.localizationKey === key && item.type === 'expense')?.id
  const income = (key: string) => categories.find((item) => item.localizationKey === key && item.type === 'income')?.id

  return {
    profile: {
      fullName: 'Alex',
      preferredLanguage: 'en-US',
      locale: 'en-US',
      countryCode: 'GLOBAL',
      currency: 'USD',
      incomePattern: 'monthly',
      defaultIncomeDay: 25,
      onboardingCompleted: true,
    },
    wallets: [
      {
        id: 'demo_cash',
        name: 'Cash Wallet',
        type: 'cash',
        startingBalance: 420,
        currency: 'USD',
        includeInTotal: true,
        isArchived: false,
        color: '#C7E36B',
        createdAt: isoDate(-40),
      },
      {
        id: 'demo_checking',
        name: 'Checking Account',
        type: 'bank',
        startingBalance: 5240,
        currency: 'USD',
        includeInTotal: true,
        isArchived: false,
        color: '#0A1D3D',
        createdAt: isoDate(-40),
      },
      {
        id: 'demo_ewallet',
        name: 'PocketGo e-Wallet',
        type: 'ewallet',
        startingBalance: 640,
        currency: 'USD',
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
        currency: 'USD',
        includeInTotal: false,
        isArchived: false,
        color: '#FF6B6B',
        createdAt: isoDate(-25),
      },
    ],
    categories,
    transactions: [
      {
        id: 'demo_tx_income',
        walletId: 'demo_checking',
        categoryId: income('salary'),
        type: 'income',
        amount: 4200,
        transactionDate: isoDate(-3),
        merchant: 'Salary Deposit',
        note: 'Monthly income',
        createdAt: isoDate(-3),
      },
      {
        id: 'demo_tx_food',
        walletId: 'demo_cash',
        categoryId: expense('food_drinks'),
        type: 'expense',
        amount: 45,
        transactionDate: isoDate(-1),
        merchant: 'Daily lunch',
        note: 'Food & drinks',
        createdAt: isoDate(-1),
      },
      {
        id: 'demo_tx_grocery',
        walletId: 'demo_checking',
        categoryId: expense('groceries'),
        type: 'expense',
        amount: 210,
        transactionDate: isoDate(-2),
        merchant: 'Groceries',
        note: 'Weekly kitchen stock',
        createdAt: isoDate(-2),
      },
      {
        id: 'demo_tx_transport',
        walletId: 'demo_ewallet',
        categoryId: expense('transport'),
        type: 'expense',
        amount: 32,
        transactionDate: isoDate(-2),
        merchant: 'Ride share',
        note: 'Transport',
        createdAt: isoDate(-2),
      },
      {
        id: 'demo_tx_bill',
        walletId: 'demo_checking',
        categoryId: expense('utilities'),
        type: 'expense',
        amount: 160,
        transactionDate: isoDate(-4),
        merchant: 'Electricity Bill',
        note: 'Utility payment',
        createdAt: isoDate(-4),
      },
      {
        id: 'demo_tx_transfer_out',
        walletId: 'demo_checking',
        type: 'transfer_out',
        amount: 250,
        transactionDate: isoDate(-5),
        note: 'Move spending money',
        transferGroupId: 'demo_transfer_1',
        relatedWalletId: 'demo_ewallet',
        createdAt: isoDate(-5),
      },
      {
        id: 'demo_tx_transfer_in',
        walletId: 'demo_ewallet',
        type: 'transfer_in',
        amount: 250,
        transactionDate: isoDate(-5),
        note: 'Move spending money',
        transferGroupId: 'demo_transfer_1',
        relatedWalletId: 'demo_checking',
        createdAt: isoDate(-5),
      },
    ],
    recurringRules: [
      {
        id: 'demo_rec_electricity',
        name: 'Electricity Bill',
        type: 'expense',
        amount: 120,
        walletId: 'demo_checking',
        categoryId: expense('utilities'),
        frequency: 'monthly',
        nextDueDate: isoDate(3),
        isActive: true,
      },
      {
        id: 'demo_rec_internet',
        name: 'Internet',
        type: 'subscription',
        amount: 55,
        walletId: 'demo_checking',
        categoryId: expense('internet'),
        frequency: 'monthly',
        nextDueDate: isoDate(7),
        isActive: true,
      },
      {
        id: 'demo_rec_salary',
        name: 'Salary',
        type: 'income',
        amount: 4200,
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
        name: 'Monthly Budget',
        totalLimit: 3200,
        periodStart: isoDate(-today.getDate() + 1),
        periodEnd: isoDate(30 - today.getDate()),
      },
    ],
    goals: [
      {
        id: 'demo_goal_emergency',
        name: 'Emergency Fund',
        targetAmount: 5000,
        currentAmount: 2450,
        targetDate: isoDate(190),
        monthlyContribution: 350,
        priority: 'high',
      },
    ],
    debts: [
      {
        id: 'demo_debt_paylater',
        name: 'PayLater Installment',
        type: 'paylater',
        lender: 'Marketplace',
        originalAmount: 600,
        remainingBalance: 420,
        installmentAmount: 105,
        minimumPayment: 105,
        dueDay: Math.min(28, today.getDate() + 5),
        status: 'active',
      },
    ],
  }
}

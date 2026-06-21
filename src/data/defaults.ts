import type { AppState, Category } from '../types'

const expenseNames = [
  'Makanan & Minuman',
  'Belanja Harian',
  'Transportasi',
  'Tagihan',
  'Tempat Tinggal',
  'Kesehatan',
  'Dukungan Keluarga',
  'Pembayaran Utang',
  'Paylater',
  'Belanja',
  'Hiburan',
  'Pendidikan',
  'Langganan',
  'Darurat',
  'Biaya Admin',
  'Lainnya',
]

const incomeNames = [
  'Gaji',
  'Penghasilan Usaha',
  'Freelance',
  'Bonus',
  'Hadiah',
  'Cashback',
  'Uang Saku',
  'Lainnya',
]

export const defaultCategories: Category[] = [
  ...expenseNames.map((name, index) => ({
    id: `expense_${index}`,
    name,
    type: 'expense' as const,
    isDefault: true,
    isArchived: false,
  })),
  ...incomeNames.map((name, index) => ({
    id: `income_${index}`,
    name,
    type: 'income' as const,
    isDefault: true,
    isArchived: false,
  })),
  {
    id: 'system_adjustment',
    name: 'Penyesuaian Saldo',
    type: 'system',
    isDefault: true,
    isArchived: false,
  },
]

export const emptyState: AppState = {
  profile: {
    fullName: '',
    currency: 'IDR',
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

import type { AppState } from '../types'
import { createDefaultCategories } from '../i18n/regions'

export const defaultCategories = createDefaultCategories('ID')

export const emptyState: AppState = {
  profile: {
    fullName: '',
    preferredLanguage: 'id-ID',
    locale: 'id-ID',
    countryCode: 'ID',
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

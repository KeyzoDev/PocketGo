import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type {
  AppState,
  Budget,
  CategoryRule,
  CountryCode,
  Debt,
  Goal,
  ImportedTransactionDraft,
  ImportSourceType,
  RecurringRule,
  ScannedDocument,
  SupportedLocale,
  TransactionInput,
  TransferInput,
  Wallet,
} from '../types'

export interface AppStoreValue {
  state: AppState
  session: Session | null
  authLoading: boolean
  dataLoading: boolean
  syncing: boolean
  syncError: string
  isCloudMode: boolean
  passwordRecovery: boolean
  isDemoMode: boolean
  reload: () => Promise<void>
  startDemo: (preferences?: { language?: SupportedLocale; locale?: SupportedLocale; countryCode?: CountryCode; currency?: string }) => void
  exitDemo: () => void
  resetDemo: () => void
  updatePassword: (password: string) => Promise<void>
  saveProfile: (profile: AppState['profile']) => Promise<void>
  createTransaction: (input: TransactionInput) => Promise<void>
  createTransfer: (input: TransferInput) => Promise<void>
  editTransaction: (id: string, input: TransactionInput) => Promise<void>
  editTransfer: (groupId: string, input: TransferInput) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
  saveWallet: (wallet: Wallet) => Promise<void>
  saveRecurring: (rule: RecurringRule) => Promise<void>
  removeRecurring: (id: string) => Promise<void>
  saveBudget: (budget: Budget) => Promise<void>
  removeBudget: (id: string) => Promise<void>
  saveGoal: (goal: Goal) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  saveDebt: (debt: Debt) => Promise<void>
  removeDebt: (id: string) => Promise<void>
  saveCategoryRule: (rule: CategoryRule) => Promise<void>
  uploadImportedDocument: (file: File, sourceType: ImportSourceType) => Promise<ScannedDocument>
  processImportedDocument: (documentId: string, sourceType: ImportSourceType) => Promise<{ document?: ScannedDocument; drafts: ImportedTransactionDraft[] }>
  reset: () => Promise<void>
}

export const AppStoreContext = createContext<AppStoreValue | null>(null)

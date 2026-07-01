import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { addTransaction, addTransfer, deleteTransaction, updateTransaction, updateTransfer } from '../domain/ledger'
import { clearDemoState, clearState, loadDemoState, loadState, saveDemoState, saveState } from '../data/storage'
import { createDemoState, emptyState } from '../data/defaults'
import {
  createCloudTransaction,
  createCloudTransfer,
  deleteCloudRecord,
  deleteCloudTransaction,
  loadCloudState,
  saveCloudCurrencyConversion,
  saveCloudBudget,
  saveCloudDebt,
  saveCloudGoal,
  saveCloudProfile,
  saveCloudCategoryRule,
  syncCloudDefaultCategories,
  saveCloudRecurring,
  saveCloudWallet,
  uploadCloudImportedDocument,
  processCloudImportedDocument,
  updateCloudTransaction,
  updateCloudTransfer,
} from '../data/supabaseRepository'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AppState } from '../types'
import { createDefaultCategories } from '../i18n/regions'
import { convertAppStateCurrency, needsAppStateCurrencyConversion } from '../domain/currencyConversion'
import { AppStoreContext, type AppStoreValue } from './AppStoreContext'

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => sessionStorage.getItem('pocketgo-demo-active') === 'true')
  const [state, setState] = useState<AppState>(() =>
    sessionStorage.getItem('pocketgo-demo-active') === 'true'
      ? loadDemoState()
      : isSupabaseConfigured ? emptyState : loadState(),
  )
  const [session, setSession] = useState<Session | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const isDemoModeRef = useRef(isDemoMode)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [dataLoading, setDataLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return
    if (isDemoModeRef.current) {
      setState(loadDemoState())
      return
    }
    const user = sessionRef.current?.user
    if (!user) {
      setState(emptyState)
      return
    }
    setDataLoading(true)
    try {
      setState(await loadCloudState(user))
      setSyncError('')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    isDemoModeRef.current = isDemoMode
  }, [isDemoMode])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    let active = true
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      sessionRef.current = nextSession
      setSession(nextSession)
      setAuthLoading(false)
      if (nextSession && isDemoModeRef.current) {
        sessionStorage.removeItem('pocketgo-demo-active')
        setIsDemoMode(false)
      }
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (nextSession && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setDataLoading(true)
        queueMicrotask(() => reload().catch((error) => setSyncError(error.message)))
      } else {
        if (!nextSession && !isDemoModeRef.current) {
          setState(emptyState)
          setSyncError('')
          setPasswordRecovery(false)
        }
      }
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [reload])

  useEffect(() => {
    if (isDemoMode) saveDemoState(state)
    else if (!isSupabaseConfigured) saveState(state)
  }, [isDemoMode, state])

  const mutate = useCallback(async (cloudAction: () => Promise<void>, localAction: () => void) => {
    setSyncing(true)
    setSyncError('')
    try {
      if (isSupabaseConfigured && !isDemoModeRef.current) {
        await cloudAction()
        await reload()
      } else {
        localAction()
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Sinkronisasi gagal.'
      setSyncError(message)
      throw caught
    } finally {
      setSyncing(false)
    }
  }, [reload])

  const value = useMemo<AppStoreValue>(
    () => ({
      state,
      session,
      authLoading,
      dataLoading,
      syncing,
      syncError,
      isCloudMode: isSupabaseConfigured,
      passwordRecovery,
      isDemoMode,
      reload,
      startDemo: (preferences) => {
        clearDemoState()
        sessionStorage.setItem('pocketgo-demo-active', 'true')
        const demoState = createDemoState(preferences)
        setIsDemoMode(true)
        setState(demoState)
        setSession(null)
        sessionRef.current = null
        setAuthLoading(false)
        setSyncError('')
        setPasswordRecovery(false)
      },
      exitDemo: () => {
        sessionStorage.removeItem('pocketgo-demo-active')
        clearDemoState()
        setIsDemoMode(false)
        setAuthLoading(false)
        setState(isSupabaseConfigured ? emptyState : loadState())
        setSyncError('')
        setPasswordRecovery(false)
      },
      resetDemo: () => {
        clearDemoState()
        const demoState = createDemoState({
          language: state.profile.preferredLanguage,
          locale: state.profile.locale,
          countryCode: state.profile.countryCode,
          currency: state.profile.currency,
        })
        sessionStorage.setItem('pocketgo-demo-active', 'true')
        setIsDemoMode(true)
        setState(demoState)
        setAuthLoading(false)
        setSyncError('')
      },
      updatePassword: async (password) => {
        if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
        setSyncing(true)
        try {
          const { error } = await supabase.auth.updateUser({ password })
          if (error) throw error
          setPasswordRecovery(false)
        } finally {
          setSyncing(false)
        }
      },
      saveProfile: async (profile) => {
        const currencyConversionNeeded = needsAppStateCurrencyConversion(state, profile.currency)
        const countryChanged = profile.countryCode !== state.profile.countryCode
        await mutate(
          async () => {
            if (!session) throw new Error('Sesi telah berakhir.')
            if (currencyConversionNeeded) {
              await saveCloudCurrencyConversion(session.user.id, convertAppStateCurrency(state, profile))
            } else {
              await saveCloudProfile(session.user.id, profile)
            }
            if (countryChanged) {
              await syncCloudDefaultCategories(profile.countryCode)
            }
          },
          () => setState((current) => {
            if (isDemoModeRef.current) {
              const demoLocalizationChanged =
                profile.preferredLanguage !== current.profile.preferredLanguage ||
                profile.locale !== current.profile.locale ||
                profile.countryCode !== current.profile.countryCode ||
                profile.currency !== current.profile.currency

              if (demoLocalizationChanged) {
                const localizedDemo = createDemoState({
                  language: profile.preferredLanguage,
                  locale: profile.locale,
                  countryCode: profile.countryCode,
                  currency: profile.currency,
                })
                return {
                  ...localizedDemo,
                  profile: {
                    ...localizedDemo.profile,
                    ...profile,
                  },
                }
              }
            }
            const next = needsAppStateCurrencyConversion(current, profile.currency) ? convertAppStateCurrency(current, profile) : { ...current, profile }
            return {
              ...next,
              categories: countryChanged
                ? [
                  ...createDefaultCategories(profile.countryCode),
                  ...current.categories.filter((category) => !category.isDefault),
                ]
                : current.categories,
            }
          }),
        )
      },
      createTransaction: async (input) => {
        await mutate(
          () => createCloudTransaction(input),
          () => setState((current) => addTransaction(current, input)),
        )
      },
      createTransfer: async (input) => {
        await mutate(
          () => createCloudTransfer(input),
          () => setState((current) => addTransfer(current, input)),
        )
      },
      editTransaction: async (id, input) => {
        await mutate(
          () => updateCloudTransaction(id, input),
          () => setState((current) => updateTransaction(current, id, input)),
        )
      },
      editTransfer: async (groupId, input) => {
        await mutate(
          () => updateCloudTransfer(groupId, input),
          () => setState((current) => updateTransfer(current, groupId, input)),
        )
      },
      removeTransaction: async (id) => {
        await mutate(
          () => deleteCloudTransaction(id),
          () => setState((current) => deleteTransaction(current, id)),
        )
      },
      saveWallet: async (wallet) => {
        await mutate(
          () => saveCloudWallet(wallet),
          () =>
            setState((current) => ({
              ...current,
              wallets: current.wallets.some((item) => item.id === wallet.id)
                ? current.wallets.map((item) => (item.id === wallet.id ? wallet : item))
                : [...current.wallets, wallet],
            })),
        )
      },
      saveRecurring: async (rule) => {
        await mutate(
          () => saveCloudRecurring(rule),
          () =>
            setState((current) => ({
              ...current,
              recurringRules: current.recurringRules.some((item) => item.id === rule.id)
                ? current.recurringRules.map((item) => (item.id === rule.id ? rule : item))
                : [...current.recurringRules, rule],
            })),
        )
      },
      removeRecurring: async (id) => {
        await mutate(
          () => deleteCloudRecord('recurring_rules', id),
          () => setState((current) => ({ ...current, recurringRules: current.recurringRules.filter((item) => item.id !== id) })),
        )
      },
      saveBudget: async (budget) => {
        await mutate(
          () => saveCloudBudget(budget),
          () =>
            setState((current) => ({
              ...current,
              budgets: current.budgets.some((item) => item.id === budget.id)
                ? current.budgets.map((item) => (item.id === budget.id ? budget : item))
                : [...current.budgets, budget],
            })),
        )
      },
      removeBudget: async (id) => {
        await mutate(
          () => deleteCloudRecord('budgets', id),
          () => setState((current) => ({ ...current, budgets: current.budgets.filter((item) => item.id !== id) })),
        )
      },
      saveGoal: async (goal) => {
        await mutate(
          () => saveCloudGoal(goal),
          () =>
            setState((current) => ({
              ...current,
              goals: current.goals.some((item) => item.id === goal.id)
                ? current.goals.map((item) => (item.id === goal.id ? goal : item))
                : [...current.goals, goal],
            })),
        )
      },
      removeGoal: async (id) => {
        await mutate(
          () => deleteCloudRecord('goals', id),
          () => setState((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== id) })),
        )
      },
      saveDebt: async (debt) => {
        await mutate(
          () => saveCloudDebt(debt),
          () =>
            setState((current) => ({
              ...current,
              debts: current.debts.some((item) => item.id === debt.id)
                ? current.debts.map((item) => (item.id === debt.id ? debt : item))
                : [...current.debts, debt],
            })),
        )
      },
      removeDebt: async (id) => {
        await mutate(
          () => deleteCloudRecord('debts', id),
          () => setState((current) => ({ ...current, debts: current.debts.filter((item) => item.id !== id) })),
        )
      },
      saveCategoryRule: async (rule) => {
        if (isSupabaseConfigured && !isDemoModeRef.current) {
          const saved = await saveCloudCategoryRule(rule)
          setState((current) => ({
            ...current,
            categoryRules: [
              saved,
              ...current.categoryRules.filter((item) => item.id !== saved.id),
            ],
          }))
        } else {
          setState((current) => ({
            ...current,
            categoryRules: [
              rule,
              ...current.categoryRules.filter((item) => item.id !== rule.id),
            ],
          }))
        }
      },
      uploadImportedDocument: async (file, sourceType) => {
        if (isSupabaseConfigured && !isDemoModeRef.current) return uploadCloudImportedDocument(file, sourceType)
        const now = new Date().toISOString()
        return {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileType: file.type || 'unknown',
          fileSize: file.size,
          sourceType,
          uploadStatus: 'local',
          parseStatus: 'pending',
          createdAt: now,
          updatedAt: now,
        }
      },
      processImportedDocument: async (documentId, sourceType) => {
        if (isSupabaseConfigured && !isDemoModeRef.current) return processCloudImportedDocument(documentId, sourceType)
        return { drafts: [] }
      },
      reset: async () => {
        if (isDemoModeRef.current) {
          clearDemoState()
          setState(loadDemoState())
          return
        }
        if (isSupabaseConfigured) throw new Error('Reset akun cloud belum tersedia. Hapus data per item.')
        clearState()
        setState(loadState())
      },
    }),
    [authLoading, dataLoading, isDemoMode, mutate, passwordRecovery, reload, session, state, syncError, syncing],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

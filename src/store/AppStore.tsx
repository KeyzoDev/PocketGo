import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { addTransaction, addTransfer, deleteTransaction, updateTransaction, updateTransfer } from '../domain/ledger'
import { clearState, loadState, saveState } from '../data/storage'
import { emptyState } from '../data/defaults'
import {
  createCloudTransaction,
  createCloudTransfer,
  deleteCloudRecord,
  deleteCloudTransaction,
  loadCloudState,
  saveCloudBudget,
  saveCloudDebt,
  saveCloudGoal,
  saveCloudProfile,
  saveCloudRecurring,
  saveCloudWallet,
  updateCloudTransaction,
  updateCloudTransfer,
} from '../data/supabaseRepository'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AppState } from '../types'
import { AppStoreContext, type AppStoreValue } from './AppStoreContext'

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() =>
    isSupabaseConfigured ? emptyState : loadState(),
  )
  const [session, setSession] = useState<Session | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [dataLoading, setDataLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return
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
    if (!isSupabaseConfigured || !supabase) return
    let active = true
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      sessionRef.current = nextSession
      setSession(nextSession)
      setAuthLoading(false)
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (nextSession && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setDataLoading(true)
        queueMicrotask(() => reload().catch((error) => setSyncError(error.message)))
      } else {
        if (!nextSession) {
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
    if (!isSupabaseConfigured) saveState(state)
  }, [state])

  const mutate = useCallback(async (cloudAction: () => Promise<void>, localAction: () => void) => {
    setSyncing(true)
    setSyncError('')
    try {
      if (isSupabaseConfigured) {
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
      reload,
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
        await mutate(
          async () => {
            if (!session) throw new Error('Sesi telah berakhir.')
            await saveCloudProfile(session.user.id, profile)
          },
          () => setState((current) => ({ ...current, profile })),
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
      reset: async () => {
        if (isSupabaseConfigured) throw new Error('Reset akun cloud belum tersedia. Hapus data per item.')
        clearState()
        setState(loadState())
      },
    }),
    [authLoading, dataLoading, mutate, passwordRecovery, reload, session, state, syncError, syncing],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

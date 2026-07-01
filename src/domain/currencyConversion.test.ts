import { describe, expect, it } from 'vitest'
import { emptyState } from '../data/defaults'
import type { AppState } from '../types'
import { convertAppStateCurrency, needsAppStateCurrencyConversion } from './currencyConversion'

function stateWithIdrData(): AppState {
  return {
    ...emptyState,
    profile: {
      ...emptyState.profile,
      currency: 'IDR',
      usdToIdrRate: 17000,
      exchangeRateSource: 'manual',
    },
    wallets: [{
      id: 'wallet-1',
      name: 'BCA',
      type: 'bank',
      startingBalance: 170000,
      currency: 'IDR',
      includeInTotal: true,
      isArchived: false,
      color: '#183B6B',
      createdAt: '2026-01-01',
    }],
    transactions: [{
      id: 'txn-1',
      walletId: 'wallet-1',
      categoryId: 'expense-food',
      type: 'expense',
      amount: 85000,
      currency: 'IDR',
      transactionDate: '2026-01-02',
      createdAt: '2026-01-02',
    }],
    recurringRules: [{
      id: 'rule-1',
      name: 'Internet',
      type: 'expense',
      amount: 170000,
      walletId: 'wallet-1',
      frequency: 'monthly',
      nextDueDate: '2026-02-01',
      isActive: true,
    }],
    budgets: [{
      id: 'budget-1',
      name: 'Makan',
      categoryId: 'expense-food',
      totalLimit: 340000,
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    }],
    goals: [{
      id: 'goal-1',
      name: 'Mobil',
      walletId: 'wallet-1',
      targetAmount: 1700000,
      currentAmount: 170000,
      monthlyContribution: 85000,
      targetDate: '2026-12-31',
      priority: 'high',
    }],
    debts: [{
      id: 'debt-1',
      name: 'Paylater',
      type: 'paylater',
      originalAmount: 340000,
      remainingBalance: 170000,
      installmentAmount: 85000,
      minimumPayment: 42500,
      dueDay: 25,
      status: 'active',
    }],
  }
}

describe('currency conversion', () => {
  it('converts existing financial records when base currency changes', () => {
    const state = stateWithIdrData()
    const converted = convertAppStateCurrency(state, { ...state.profile, currency: 'USD' })

    expect(converted.wallets[0].startingBalance).toBe(10)
    expect(converted.wallets[0].currency).toBe('USD')
    expect(converted.transactions[0].amount).toBe(5)
    expect(converted.transactions[0].currency).toBe('USD')
    expect(converted.recurringRules[0].amount).toBe(10)
    expect(converted.budgets[0].totalLimit).toBe(20)
    expect(converted.goals[0].targetAmount).toBe(100)
    expect(converted.debts[0].remainingBalance).toBe(10)
  })

  it('detects records that were left in the old currency after profile changed', () => {
    const state = stateWithIdrData()
    state.profile.currency = 'USD'

    expect(needsAppStateCurrencyConversion(state, 'USD')).toBe(true)
    expect(convertAppStateCurrency(state, state.profile).transactions[0].amount).toBe(5)
  })

  it('converts records back from USD to IDR using the selected rate', () => {
    const state = stateWithIdrData()
    const usdState = convertAppStateCurrency(state, { ...state.profile, currency: 'USD' })
    const idrState = convertAppStateCurrency(usdState, { ...usdState.profile, currency: 'IDR' })

    expect(idrState.profile.currency).toBe('IDR')
    expect(idrState.wallets[0].startingBalance).toBe(170000)
    expect(idrState.wallets[0].currency).toBe('IDR')
    expect(idrState.transactions[0].amount).toBe(85000)
    expect(idrState.transactions[0].currency).toBe('IDR')
    expect(idrState.recurringRules[0].amount).toBe(170000)
    expect(idrState.budgets[0].totalLimit).toBe(340000)
    expect(idrState.goals[0].currentAmount).toBe(170000)
    expect(idrState.debts[0].installmentAmount).toBe(85000)
  })
})

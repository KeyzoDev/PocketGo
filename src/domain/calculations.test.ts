import { describe, expect, it } from 'vitest'
import { emptyState } from '../data/defaults'
import { calculateForecast, calculateSafeToSpend } from './calculations'
import type { AppState } from '../types'

function planningState(): AppState {
  return {
    ...emptyState,
    profile: { ...emptyState.profile, defaultIncomeDay: 20 },
    categories: [...emptyState.categories],
    wallets: [
      {
        id: 'bank',
        name: 'Bank',
        type: 'bank',
        startingBalance: 1000000,
        currency: 'IDR',
        includeInTotal: true,
        isArchived: false,
        color: '#0b2447',
        createdAt: '2026-06-01',
      },
    ],
    recurringRules: [
      {
        id: 'bill',
        name: 'Listrik',
        type: 'expense',
        amount: 200000,
        frequency: 'monthly',
        nextDueDate: '2026-06-15',
        isActive: true,
      },
    ],
  }
}

describe('planning calculations', () => {
  it('reserves bills and buffer in safe to spend', () => {
    const result = calculateSafeToSpend(planningState(), new Date('2026-06-10T00:00:00'))
    expect(result.required).toBe(200000)
    expect(result.buffer).toBe(20000)
    expect(result.safeTotal).toBe(780000)
    expect(result.days).toBe(10)
    expect(result.safeToday).toBe(78000)
  })

  it('includes recurring items in forecast without crashing', () => {
    const result = calculateForecast(planningState(), 7, new Date('2026-06-10T00:00:00'))
    expect(result).toHaveLength(7)
    expect(result.find((point) => point.date === '2026-06-15')?.outflow).toBe(200000)
  })

  it('includes debt due next month before the next income date', () => {
    const state = planningState()
    state.profile.defaultIncomeDay = 20
    state.debts = [
      {
        id: 'debt',
        name: 'Paylater',
        type: 'paylater',
        originalAmount: 500000,
        remainingBalance: 400000,
        installmentAmount: 100000,
        minimumPayment: 0,
        dueDay: 5,
        status: 'active',
      },
    ]
    const result = calculateSafeToSpend(state, new Date('2026-06-25T00:00:00'))
    expect(result.required).toBe(100000)
  })
})

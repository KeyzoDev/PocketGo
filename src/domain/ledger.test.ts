import { describe, expect, it } from 'vitest'
import {
  addTransaction,
  addTransfer,
  analyticsTransactions,
  deleteTransaction,
  totalBalance,
  updateTransaction,
  updateTransfer,
  walletBalances,
} from './ledger'
import { emptyState } from '../data/defaults'
import type { AppState } from '../types'

function stateWithWallets(): AppState {
  return {
    ...emptyState,
    profile: { ...emptyState.profile },
    categories: [...emptyState.categories],
    wallets: [
      {
        id: 'cash',
        name: 'Tunai',
        type: 'cash',
        startingBalance: 100000,
        currency: 'IDR',
        includeInTotal: true,
        isArchived: false,
        color: '#0b2447',
        createdAt: '2026-01-01',
      },
      {
        id: 'bank',
        name: 'Bank',
        type: 'bank',
        startingBalance: 200000,
        currency: 'IDR',
        includeInTotal: true,
        isArchived: false,
        color: '#5f7c45',
        createdAt: '2026-01-01',
      },
    ],
  }
}

describe('ledger', () => {
  it('applies income and expense from positive stored amounts', () => {
    let state = stateWithWallets()
    state = addTransaction(state, {
      walletId: 'cash',
      categoryId: 'income_0',
      type: 'income',
      amount: 50000,
      transactionDate: '2026-01-02',
    })
    state = addTransaction(state, {
      walletId: 'cash',
      categoryId: 'expense_0',
      type: 'expense',
      amount: 25000,
      transactionDate: '2026-01-02',
    })
    expect(walletBalances(state.wallets, state.transactions).cash).toBe(125000)
  })

  it('moves money without changing total balance or analytics totals', () => {
    const state = addTransfer(stateWithWallets(), {
      sourceWalletId: 'cash',
      destinationWalletId: 'bank',
      amount: 40000,
      transactionDate: '2026-01-02',
    })
    const balances = walletBalances(state.wallets, state.transactions)
    expect(balances.cash).toBe(60000)
    expect(balances.bank).toBe(240000)
    expect(totalBalance(state)).toBe(300000)
    expect(state.transactions[0].transferGroupId).toBe(state.transactions[1].transferGroupId)
  })

  it('converts mixed wallet balances into the selected base currency', () => {
    const state = stateWithWallets()
    state.profile = {
      ...state.profile,
      currency: 'USD',
      usdToIdrRate: 17000,
      exchangeRateSource: 'manual',
    }
    state.wallets.push({
      id: 'usd',
      name: 'USD Wallet',
      type: 'bank',
      startingBalance: 10,
      currency: 'USD',
      includeInTotal: true,
      isArchived: false,
      color: '#18B57D',
      createdAt: '2026-01-01',
    })
    expect(totalBalance(state)).toBeCloseTo(300000 / 17000 + 10, 5)
  })

  it('deletes both transfer rows and restores balances', () => {
    const transferred = addTransfer(stateWithWallets(), {
      sourceWalletId: 'cash',
      destinationWalletId: 'bank',
      amount: 40000,
      transactionDate: '2026-01-02',
    })
    const deleted = deleteTransaction(transferred, transferred.transactions[0].id)
    expect(deleted.transactions).toHaveLength(0)
    expect(totalBalance(deleted)).toBe(300000)
  })

  it('updates both transfer rows without double counting totals', () => {
    const transferred = addTransfer(stateWithWallets(), {
      sourceWalletId: 'cash',
      destinationWalletId: 'bank',
      amount: 40000,
      transactionDate: '2026-01-02',
    })
    const groupId = transferred.transactions[0].transferGroupId!
    const updated = updateTransfer(transferred, groupId, {
      sourceWalletId: 'bank',
      destinationWalletId: 'cash',
      amount: 75000,
      transactionDate: '2026-01-03',
    })
    const balances = walletBalances(updated.wallets, updated.transactions)
    expect(updated.transactions).toHaveLength(2)
    expect(updated.transactions.every((transaction) => transaction.transferGroupId)).toBe(true)
    expect(balances.cash).toBe(175000)
    expect(balances.bank).toBe(125000)
    expect(totalBalance(updated)).toBe(300000)
  })

  it('excludes transfer rows from analytics transactions', () => {
    let state = addTransfer(stateWithWallets(), {
      sourceWalletId: 'cash',
      destinationWalletId: 'bank',
      amount: 40000,
      transactionDate: '2026-01-02',
    })
    state = addTransaction(state, {
      walletId: 'cash',
      categoryId: 'expense_0',
      type: 'expense',
      amount: 25000,
      transactionDate: '2026-01-02',
    })
    expect(analyticsTransactions(state.transactions)).toHaveLength(1)
  })

  it('rejects direct transfer rows outside the transfer flow', () => {
    expect(() =>
      addTransaction(stateWithWallets(), {
        walletId: 'cash',
        type: 'transfer_out',
        amount: 25000,
        transactionDate: '2026-01-02',
      }),
    ).toThrow('Gunakan alur transfer')
  })

  it('recomputes the wallet correctly when a transaction is edited', () => {
    let state = addTransaction(stateWithWallets(), {
      walletId: 'cash',
      categoryId: 'expense_0',
      type: 'expense',
      amount: 25000,
      transactionDate: '2026-01-02',
    })
    state = updateTransaction(state, state.transactions[0].id, {
      walletId: 'bank',
      categoryId: 'expense_0',
      type: 'expense',
      amount: 40000,
      transactionDate: '2026-01-02',
    })
    const balances = walletBalances(state.wallets, state.transactions)
    expect(balances.cash).toBe(100000)
    expect(balances.bank).toBe(160000)
  })
})

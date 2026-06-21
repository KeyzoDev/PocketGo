import { createId } from '../lib/id'
import type { AppState, Transaction, TransactionInput, TransferInput, Wallet } from '../types'

export function transactionEffect(transaction: Transaction) {
  switch (transaction.type) {
    case 'income':
    case 'transfer_in':
      return transaction.amount
    case 'expense':
    case 'transfer_out':
      return -transaction.amount
    case 'adjustment':
      return transaction.adjustmentDirection === 'decrease'
        ? -transaction.amount
        : transaction.amount
  }
}

export function walletBalance(wallet: Wallet, transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.walletId === wallet.id)
    .reduce((balance, transaction) => balance + transactionEffect(transaction), wallet.startingBalance)
}

export function walletBalances(wallets: Wallet[], transactions: Transaction[]) {
  return Object.fromEntries(
    wallets.map((wallet) => [wallet.id, walletBalance(wallet, transactions)]),
  )
}

export function totalBalance(state: AppState) {
  const balances = walletBalances(state.wallets, state.transactions)
  return state.wallets
    .filter((wallet) => !wallet.isArchived && wallet.includeInTotal)
    .reduce((sum, wallet) => sum + balances[wallet.id], 0)
}

function validateAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Jumlah harus lebih dari 0.')
  }
}

export function addTransaction(state: AppState, input: TransactionInput): AppState {
  validateAmount(input.amount)
  if (!state.wallets.some((wallet) => wallet.id === input.walletId && !wallet.isArchived)) {
    throw new Error('Dompet tidak tersedia.')
  }
  if (
    (input.type === 'income' || input.type === 'expense') &&
    !state.categories.some((category) => category.id === input.categoryId && !category.isArchived)
  ) {
    throw new Error('Kategori wajib dipilih.')
  }
  if (input.type === 'transfer_in' || input.type === 'transfer_out') {
    throw new Error('Gunakan alur transfer agar kedua sisi tetap sinkron.')
  }

  const transaction: Transaction = {
    ...input,
    id: createId('txn'),
    amount: Math.abs(input.amount),
    createdAt: new Date().toISOString(),
  }
  return { ...state, transactions: [transaction, ...state.transactions] }
}

export function addTransfer(state: AppState, input: TransferInput): AppState {
  validateAmount(input.amount)
  if (input.sourceWalletId === input.destinationWalletId) {
    throw new Error('Dompet asal dan tujuan harus berbeda.')
  }
  const activeIds = new Set(state.wallets.filter((wallet) => !wallet.isArchived).map((wallet) => wallet.id))
  if (!activeIds.has(input.sourceWalletId) || !activeIds.has(input.destinationWalletId)) {
    throw new Error('Dompet transfer tidak tersedia.')
  }

  const now = new Date().toISOString()
  const groupId = createId('trf')
  const base = {
    amount: Math.abs(input.amount),
    transactionDate: input.transactionDate,
    note: input.note,
    transferGroupId: groupId,
    createdAt: now,
  }
  const rows: Transaction[] = [
    {
      ...base,
      id: createId('txn'),
      walletId: input.sourceWalletId,
      relatedWalletId: input.destinationWalletId,
      type: 'transfer_out',
    },
    {
      ...base,
      id: createId('txn'),
      walletId: input.destinationWalletId,
      relatedWalletId: input.sourceWalletId,
      type: 'transfer_in',
    },
  ]
  return { ...state, transactions: [...rows, ...state.transactions] }
}

export function updateTransaction(
  state: AppState,
  transactionId: string,
  input: TransactionInput,
): AppState {
  validateAmount(input.amount)
  const current = state.transactions.find((transaction) => transaction.id === transactionId)
  if (!current) throw new Error('Transaksi tidak ditemukan.')
  if (current.transferGroupId) {
    throw new Error('Transfer harus diedit melalui alur transfer.')
  }
  if (input.type === 'transfer_in' || input.type === 'transfer_out') {
    throw new Error('Gunakan alur transfer agar kedua sisi tetap sinkron.')
  }
  if (!state.wallets.some((wallet) => wallet.id === input.walletId && !wallet.isArchived)) {
    throw new Error('Dompet tidak tersedia.')
  }
  if (
    (input.type === 'income' || input.type === 'expense') &&
    !state.categories.some((category) => category.id === input.categoryId && !category.isArchived)
  ) {
    throw new Error('Kategori wajib dipilih.')
  }
  const updated: Transaction = {
    ...current,
    ...input,
    id: current.id,
    amount: Math.abs(input.amount),
  }
  return {
    ...state,
    transactions: state.transactions.map((transaction) =>
      transaction.id === transactionId ? updated : transaction,
    ),
  }
}

export function updateTransfer(
  state: AppState,
  transferGroupId: string,
  input: TransferInput,
): AppState {
  const withoutTransfer = {
    ...state,
    transactions: state.transactions.filter(
      (transaction) => transaction.transferGroupId !== transferGroupId,
    ),
  }
  if (withoutTransfer.transactions.length === state.transactions.length) {
    throw new Error('Transfer tidak ditemukan.')
  }
  return addTransfer(withoutTransfer, input)
}

export function deleteTransaction(state: AppState, transactionId: string): AppState {
  const current = state.transactions.find((transaction) => transaction.id === transactionId)
  if (!current) return state
  return {
    ...state,
    transactions: state.transactions.filter((transaction) =>
      current.transferGroupId
        ? transaction.transferGroupId !== current.transferGroupId
        : transaction.id !== transactionId,
    ),
  }
}

export function analyticsTransactions(transactions: Transaction[]) {
  return transactions.filter(
    (transaction) => transaction.type === 'income' || transaction.type === 'expense',
  )
}

import { convertCurrency, safeUsdToIdrRate } from '../lib/currency'
import type { AppState, Profile } from '../types'

function roundMoney(value: number, currency: string) {
  const decimals = currency === 'IDR' ? 0 : 2
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function convertAmount(amount: number, fromCurrency: string, toCurrency: string, usdToIdrRate: number) {
  return roundMoney(convertCurrency(amount, fromCurrency, toCurrency, usdToIdrRate), toCurrency)
}

export function needsAppStateCurrencyConversion(state: AppState, toCurrency: string) {
  return state.profile.currency !== toCurrency
    || state.wallets.some((wallet) => (wallet.currency || state.profile.currency) !== toCurrency)
    || state.transactions.some((transaction) => (transaction.currency ?? state.wallets.find((wallet) => wallet.id === transaction.walletId)?.currency ?? state.profile.currency) !== toCurrency)
}

export function convertAppStateCurrency(state: AppState, nextProfile: Profile): AppState {
  const toCurrency = nextProfile.currency
  const usdToIdrRate = safeUsdToIdrRate(nextProfile.usdToIdrRate)
  const walletCurrencyById = new Map(state.wallets.map((wallet) => [wallet.id, wallet.currency || state.profile.currency]))
  const sourceCurrency = state.wallets.find((wallet) => (wallet.currency || state.profile.currency) !== toCurrency)?.currency
    ?? state.transactions.find((transaction) => (transaction.currency ?? state.profile.currency) !== toCurrency)?.currency
    ?? state.profile.currency

  if (!needsAppStateCurrencyConversion(state, toCurrency)) {
    return { ...state, profile: nextProfile }
  }

  return {
    ...state,
    profile: nextProfile,
    wallets: state.wallets.map((wallet) => ({
      ...wallet,
      startingBalance: convertAmount(wallet.startingBalance, wallet.currency || sourceCurrency, toCurrency, usdToIdrRate),
      currency: toCurrency,
    })),
    transactions: state.transactions.map((transaction) => {
      const fromCurrency = transaction.currency ?? walletCurrencyById.get(transaction.walletId) ?? sourceCurrency
      return {
        ...transaction,
        amount: convertAmount(transaction.amount, fromCurrency, toCurrency, usdToIdrRate),
        currency: toCurrency,
        exchangeRate: usdToIdrRate,
        amountInBaseCurrency: undefined,
      }
    }),
    recurringRules: state.recurringRules.map((rule) => ({
      ...rule,
      amount: convertAmount(rule.amount, rule.walletId ? walletCurrencyById.get(rule.walletId) ?? sourceCurrency : sourceCurrency, toCurrency, usdToIdrRate),
    })),
    budgets: state.budgets.map((budget) => ({
      ...budget,
      totalLimit: convertAmount(budget.totalLimit, sourceCurrency, toCurrency, usdToIdrRate),
    })),
    goals: state.goals.map((goal) => {
      const fromCurrency = goal.walletId ? walletCurrencyById.get(goal.walletId) ?? sourceCurrency : sourceCurrency
      return {
        ...goal,
        targetAmount: convertAmount(goal.targetAmount, fromCurrency, toCurrency, usdToIdrRate),
        currentAmount: convertAmount(goal.currentAmount, fromCurrency, toCurrency, usdToIdrRate),
        monthlyContribution: convertAmount(goal.monthlyContribution, fromCurrency, toCurrency, usdToIdrRate),
      }
    }),
    debts: state.debts.map((debt) => ({
      ...debt,
      originalAmount: convertAmount(debt.originalAmount, sourceCurrency, toCurrency, usdToIdrRate),
      remainingBalance: convertAmount(debt.remainingBalance, sourceCurrency, toCurrency, usdToIdrRate),
      installmentAmount: convertAmount(debt.installmentAmount, sourceCurrency, toCurrency, usdToIdrRate),
      minimumPayment: convertAmount(debt.minimumPayment, sourceCurrency, toCurrency, usdToIdrRate),
    })),
  }
}

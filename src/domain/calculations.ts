import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  formatISO,
  getDate,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  setDate,
  startOfDay,
} from 'date-fns'
import { analyticsTransactions, totalBalance, transactionAmountInBase } from './ledger'
import type { AppState, RecurringRule } from '../types'

function nextIncomeDate(state: AppState, today: Date) {
  const scheduledIncome = state.recurringRules
    .filter((rule) => rule.isActive && rule.type === 'income')
    .map((rule) => parseISO(rule.nextDueDate))
    .filter((date) => !isBefore(date, today))
    .sort((a, b) => a.getTime() - b.getTime())[0]
  if (scheduledIncome) return scheduledIncome

  const day = state.profile.defaultIncomeDay
  if (!day) return endOfMonth(today)
  const thisMonth = setDate(today, Math.min(day, 28))
  return isAfter(thisMonth, today) ? thisMonth : setDate(addDays(endOfMonth(today), 1), Math.min(day, 28))
}

function dueBefore(rule: RecurringRule, limit: Date, today: Date) {
  const dueDate = parseISO(rule.nextDueDate)
  return (
    rule.isActive &&
    !isBefore(dueDate, today) &&
    (isBefore(dueDate, limit) || isSameDay(dueDate, limit))
  )
}

function nextMonthlyDueDate(dueDay: number, today: Date) {
  const thisMonth = setDate(today, Math.min(dueDay, 28))
  return isBefore(thisMonth, today)
    ? setDate(addDays(endOfMonth(today), 1), Math.min(dueDay, 28))
    : thisMonth
}

export interface SafeToSpendResult {
  availableBalance: number
  required: number
  goalCommitments: number
  buffer: number
  safeTotal: number
  safeToday: number
  days: number
  status: 'safe' | 'caution' | 'danger'
  confidence: 'complete' | 'estimated'
  nextIncomeDate: string
}

export function calculateSafeToSpend(state: AppState, date = new Date()): SafeToSpendResult {
  const today = startOfDay(date)
  const incomeDate = startOfDay(nextIncomeDate(state, today))
  const days = Math.max(1, differenceInCalendarDays(incomeDate, today))
  const obligations = state.recurringRules
    .filter(
      (rule) =>
        rule.type !== 'income' &&
        rule.type !== 'debt_payment' &&
        dueBefore(rule, incomeDate, today),
    )
    .reduce((sum, rule) => sum + rule.amount, 0)
  const debtPayments = state.debts
    .filter((debt) => {
      const dueDate = nextMonthlyDueDate(debt.dueDay, today)
      return (
        debt.status === 'active' &&
        (isBefore(dueDate, incomeDate) || isSameDay(dueDate, incomeDate))
      )
    })
    .reduce((sum, debt) => sum + Math.max(debt.installmentAmount, debt.minimumPayment), 0)
  const required = obligations + debtPayments
  const goalCommitments = state.goals.reduce(
    (sum, goal) => sum + Math.min(goal.monthlyContribution, Math.max(0, goal.targetAmount - goal.currentAmount)),
    0,
  )
  const buffer = required * 0.1
  const availableBalance = totalBalance(state)
  const safeTotal = availableBalance - required - goalCommitments - buffer
  const safeToday = Math.max(0, safeTotal / days)
  const coverage = required > 0 ? availableBalance / required : availableBalance > 0 ? 2 : 0
  const status = safeTotal < 0 ? 'danger' : coverage < 1.25 || safeToday < 50000 ? 'caution' : 'safe'
  const confidence =
    state.recurringRules.length > 0 || state.profile.defaultIncomeDay ? 'complete' : 'estimated'

  return {
    availableBalance,
    required,
    goalCommitments,
    buffer,
    safeTotal,
    safeToday,
    days,
    status,
    confidence,
    nextIncomeDate: formatISO(incomeDate, { representation: 'date' }),
  }
}

export interface ForecastPoint {
  date: string
  balance: number
  inflow: number
  outflow: number
  status: 'safe' | 'caution' | 'danger'
}

function occursOn(rule: RecurringRule, date: Date) {
  const due = parseISO(rule.nextDueDate)
  if (isBefore(date, due)) return false
  const elapsed = differenceInCalendarDays(date, due)
  if (rule.frequency === 'weekly') return elapsed % 7 === 0
  if (rule.frequency === 'monthly') return getDate(date) === getDate(due)
  return date.getMonth() === due.getMonth() && getDate(date) === getDate(due)
}

export function calculateForecast(state: AppState, days = 7, date = new Date()): ForecastPoint[] {
  let balance = totalBalance(state)
  return Array.from({ length: days }, (_, index) => {
    const current = startOfDay(addDays(date, index))
    const scheduled = state.recurringRules.filter((rule) => rule.isActive && occursOn(rule, current))
    const inflow = scheduled
      .filter((rule) => rule.type === 'income')
      .reduce((sum, rule) => sum + rule.amount, 0)
    const recurringOutflow = scheduled
      .filter((rule) => rule.type !== 'income' && rule.type !== 'debt_payment')
      .reduce((sum, rule) => sum + rule.amount, 0)
    const debtOutflow = state.debts
      .filter((debt) => debt.status === 'active' && debt.dueDay === getDate(current))
      .reduce((sum, debt) => sum + Math.max(debt.installmentAmount, debt.minimumPayment), 0)
    const outflow = recurringOutflow + debtOutflow
    balance += inflow - outflow
    return {
      date: formatISO(current, { representation: 'date' }),
      balance,
      inflow,
      outflow,
      status: balance < 0 ? 'danger' : balance < Math.max(outflow * 1.5, 250000) ? 'caution' : 'safe',
    }
  })
}

export function monthlySummary(state: AppState, date = new Date()) {
  const month = date.getMonth()
  const year = date.getFullYear()
  const transactions = analyticsTransactions(state.transactions).filter((transaction) => {
    const transactionDate = parseISO(transaction.transactionDate)
    return transactionDate.getMonth() === month && transactionDate.getFullYear() === year
  })
  const income = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transactionAmountInBase(state, transaction), 0)
  const expense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transactionAmountInBase(state, transaction), 0)
  return {
    income,
    expense,
    net: income - expense,
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : null,
  }
}

export function debtSummary(state: AppState) {
  const active = state.debts.filter((debt) => debt.status === 'active')
  const remaining = active.reduce((sum, debt) => sum + debt.remainingBalance, 0)
  const monthlyPayment = active.reduce(
    (sum, debt) => sum + Math.max(debt.installmentAmount, debt.minimumPayment),
    0,
  )
  const income = monthlySummary(state).income
  const ratio = income > 0 ? (monthlyPayment / income) * 100 : null
  const status =
    ratio === null ? 'unknown' : ratio > 50 ? 'risky' : ratio > 35 ? 'heavy' : ratio > 20 ? 'watch' : 'healthy'
  return { remaining, monthlyPayment, ratio, status }
}

export function detectSmallSpendingLeak(state: AppState) {
  const expenses = analyticsTransactions(state.transactions).filter(
    (transaction) => transaction.type === 'expense',
  )
  const small = expenses.filter((transaction) => transaction.amount <= 30000)
  const total = small.reduce((sum, transaction) => sum + transactionAmountInBase(state, transaction), 0)
  return small.length >= 5 ? { count: small.length, total } : null
}

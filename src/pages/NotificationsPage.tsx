import { Bell, CalendarClock, CircleAlert, Goal, Settings, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { monthlySummary } from '../domain/calculations'
import { walletBalances } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'

export function NotificationsPage() {
  const { state } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const balances = useMemo(() => walletBalances(state.wallets, state.transactions), [state.wallets, state.transactions])
  const summary = useMemo(() => monthlySummary(state), [state])
  const upcoming = state.recurringRules.filter((rule) => rule.isActive).sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)).slice(0, 4)
  const lowWallet = state.wallets.find((wallet) => wallet.includeInTotal && !wallet.isArchived && (balances[wallet.id] ?? wallet.startingBalance) < 100)
  const topGoal = state.goals[0]

  return (
    <div className="standard-page page-width notifications-page">
      <header className="mobile-titlebar">
        <div><h1>{t('notifications.title')}</h1><p>{t('notifications.body')}</p></div>
        <button className="icon-button" type="button" aria-label={t('settings.settings')}><Settings size={18} /></button>
      </header>
      <div className="filter-row notification-tabs">
        <button className="chip active" type="button">{t('transactions.allTypes')}</button>
        <button className="chip" type="button">{t('notifications.alerts')}</button>
        <button className="chip" type="button">{t('notifications.reminders')}</button>
      </div>
      <section className="notification-list">
        {lowWallet ? (
          <article><span className="brief-icon amber"><CircleAlert size={20} /></span><div><strong>{t('notifications.lowBalance')}</strong><p>{lowWallet.name}: {formatCurrency(balances[lowWallet.id] ?? lowWallet.startingBalance, lowWallet.currency || currency, locale)}</p></div><time>{t('common.today')}</time></article>
        ) : null}
        {upcoming.map((rule) => (
          <article key={rule.id}><span className="brief-icon sage"><CalendarClock size={20} /></span><div><strong>{rule.name}</strong><p>{formatCurrency(rule.amount, currency, locale)} · {formatDate(rule.nextDueDate, locale)}</p></div><time>{formatDate(rule.nextDueDate, locale, { month: 'short', day: 'numeric' })}</time></article>
        ))}
        <article><span className="brief-icon green"><TrendingUp size={20} /></span><div><strong>{t('notifications.weeklySummary')}</strong><p>{t('notifications.weeklyBody', { amount: formatCurrency(summary.expense, currency, locale) })}</p></div><time>{t('common.today')}</time></article>
        {topGoal ? <article><span className="brief-icon navy"><Goal size={20} /></span><div><strong>{t('notifications.goalProgress')}</strong><p>{topGoal.name}: {Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100)}%</p></div><time>{formatDate(topGoal.targetDate, locale, { month: 'short', day: 'numeric' })}</time></article> : null}
        {!lowWallet && upcoming.length === 0 && !topGoal ? (
          <article><span className="brief-icon navy"><Bell size={20} /></span><div><strong>{t('notifications.empty')}</strong><p>{t('notifications.emptyBody')}</p></div></article>
        ) : null}
      </section>
    </div>
  )
}

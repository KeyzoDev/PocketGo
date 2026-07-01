import { useMemo } from 'react'
import { Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { monthlySummary } from '../domain/calculations'
import { walletBalances } from '../domain/ledger'
import { convertCurrency } from '../lib/currency'
import { formatCurrency, formatDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import { PremiumIcon } from '../components/PremiumIcon'

export function NotificationsPage() {
  const { state } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const navigate = useNavigate()
  const balances = useMemo(() => walletBalances(state.wallets, state.transactions), [state.wallets, state.transactions])
  const summary = useMemo(() => monthlySummary(state), [state])
  const upcoming = state.recurringRules.filter((rule) => rule.isActive).sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)).slice(0, 4)
  const lowWallet = state.wallets.find((wallet) => wallet.includeInTotal && !wallet.isArchived && (balances[wallet.id] ?? wallet.startingBalance) < 100)
  const topGoal = state.goals[0]
  const balanceInBase = lowWallet
    ? convertCurrency(balances[lowWallet.id] ?? lowWallet.startingBalance, lowWallet.currency || currency, currency, state.profile.usdToIdrRate)
    : 0
  const recurringAmountInBase = (rule: (typeof state.recurringRules)[number]) => {
    const wallet = state.wallets.find((item) => item.id === rule.walletId)
    return convertCurrency(rule.amount, wallet?.currency || state.profile.currency, currency, state.profile.usdToIdrRate)
  }

  return (
    <div className="standard-page page-width notifications-page">
      <header className="mobile-titlebar">
        <div><h1>{t('notifications.title')}</h1><p>{t('notifications.body')}</p></div>
        <button className="icon-button settings-shortcut" type="button" onClick={() => navigate('/more')} aria-label={t('settings.settings')} title={t('settings.settings')}>
          <Settings size={19} />
        </button>
      </header>
      <div className="filter-row notification-tabs">
        <button className="chip active" type="button">{t('transactions.allTypes')}</button>
        <button className="chip" type="button">{t('notifications.alerts')}</button>
        <button className="chip" type="button">{t('notifications.reminders')}</button>
      </div>
      <section className="notification-list">
        {lowWallet ? (
          <article><PremiumIcon name="notification" tone="amber" variant="transaction" size="md" /><div><strong>{t('notifications.lowBalance')}</strong><p>{lowWallet.name}: {formatCurrency(balanceInBase, currency, locale)}</p></div><time>{t('common.today')}</time></article>
        ) : null}
        {upcoming.map((rule) => (
          <article key={rule.id}><PremiumIcon name={rule.type === 'income' ? 'income' : 'bills'} tone={rule.type === 'income' ? 'green' : 'amber'} variant="transaction" size="md" /><div><strong>{rule.name}</strong><p>{formatCurrency(recurringAmountInBase(rule), currency, locale)} · {formatDate(rule.nextDueDate, locale)}</p></div><time>{formatDate(rule.nextDueDate, locale, { month: 'short', day: 'numeric' })}</time></article>
        ))}
        <article><PremiumIcon name="analytics" tone="green" variant="transaction" size="md" /><div><strong>{t('notifications.weeklySummary')}</strong><p>{t('notifications.weeklyBody', { amount: formatCurrency(summary.expense, currency, locale) })}</p></div><time>{t('common.today')}</time></article>
        {topGoal ? <article><PremiumIcon name="goals" tone="purple" variant="transaction" size="md" /><div><strong>{t('notifications.goalProgress')}</strong><p>{topGoal.name}: {Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100)}%</p></div><time>{formatDate(topGoal.targetDate, locale, { month: 'short', day: 'numeric' })}</time></article> : null}
        {!lowWallet && upcoming.length === 0 && !topGoal ? (
          <article><PremiumIcon name="notification" tone="navy" variant="transaction" size="md" /><div><strong>{t('notifications.empty')}</strong><p>{t('notifications.emptyBody')}</p></div></article>
        ) : null}
      </section>
    </div>
  )
}

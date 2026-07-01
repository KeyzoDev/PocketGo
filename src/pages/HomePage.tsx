import {
  Bell,
  MoonStar,
  SunMedium,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { calculateSafeToSpend, debtSummary, detectSmallSpendingLeak, monthlySummary } from '../domain/calculations'
import { analyticsTransactions, totalBalance, transactionAmountInBase } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'
import { EmptyState } from '../components/EmptyState'
import { PremiumIcon, type PremiumIconTone } from '../components/PremiumIcon'
import { applyTheme, readTheme, type AppTheme } from '../lib/theme'
import { categoryPremiumIcon } from '../lib/premiumIconMapping'

const chartColors = ['#183B6B', '#18B57D', '#A8F0D1', '#64748B', '#FF6B6B']

export function HomePage() {
  const { state } = useAppStore()
  const { t, locale, currency, language } = useLocalization()
  const categoryLocale = language === 'id-ID' ? 'ID' : 'GLOBAL'
  const navigate = useNavigate()
  const [theme, setTheme] = useState<AppTheme>(() => readTheme())
  const [now, setNow] = useState(() => new Date())
  const money = (value: number) => formatCurrency(value, currency, locale)
  const firstName = state.profile.fullName.trim().split(' ')[0] || 'Alex'
  const balance = totalBalance(state)
  const summary = useMemo(() => monthlySummary(state), [state])
  const safeToSpend = useMemo(() => calculateSafeToSpend(state), [state])
  const debt = useMemo(() => debtSummary(state), [state])
  const smallLeak = useMemo(() => detectSmallSpendingLeak(state), [state])
  const recent = [...state.transactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  const nextCommitments = useMemo(() => {
    const recurring = state.recurringRules
      .filter((rule) => rule.isActive && rule.type !== 'income')
      .map((rule) => ({
        id: rule.id,
        name: rule.name,
        amount: rule.amount,
        date: rule.nextDueDate,
        icon: rule.type === 'subscription' ? 'subscription' : categoryPremiumIcon(rule.name, 'expense').name,
        tone: rule.type === 'subscription' ? 'amber' : categoryPremiumIcon(rule.name, 'expense').tone,
      }))
    const debtItems = state.debts
      .filter((item) => item.status === 'active')
      .map((item) => {
        const now = new Date()
        const due = new Date(now)
        due.setDate(Math.min(item.dueDay, 28))
        if (due < now) due.setMonth(due.getMonth() + 1)
        return {
          id: item.id,
          name: item.name,
          amount: Math.max(item.installmentAmount, item.minimumPayment),
          date: due.toISOString().slice(0, 10),
          icon: item.type === 'paylater' ? 'paylater' : item.type === 'credit_card' ? 'credit' : 'debt',
          tone: 'coral' as PremiumIconTone,
        }
      })
    return [...recurring, ...debtItems].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  }, [state.debts, state.recurringRules])
  const spending = useMemo(() => {
    const totals = new Map<string, number>()
    analyticsTransactions(state.transactions)
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const category = state.categories.find((item) => item.id === transaction.categoryId)
        const name = localizedCategoryName(category?.localizationKey, category?.name ?? 'Other', categoryLocale)
        totals.set(name, (totals.get(name) ?? 0) + transactionAmountInBase(state, transaction))
      })
    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [categoryLocale, state])
  const totalSpending = spending.reduce((sum, item) => sum + item.value, 0)
  const goal = [...state.goals].sort((a, b) => b.priority.localeCompare(a.priority))[0]
  const goalProgress = goal ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  const safeStatusLabel = safeToSpend.status === 'safe' ? t('home.safe') : safeToSpend.status === 'caution' ? t('home.caution') : t('home.risky')
  const adviceTitle = safeToSpend.status === 'danger'
    ? t('home.obligationsHigh')
    : smallLeak ? t('home.smallPurchases') : t('home.recordDaily')
  const adviceBody = safeToSpend.status === 'danger'
    ? t('home.addBalance')
    : smallLeak
      ? t('home.smallPurchasesBody', { count: String(smallLeak.count), amount: money(smallLeak.total) })
      : t('home.recordDailyBody')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const formattedToday = formatDate(now, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="reference-page dashboard-page">
      <header className="reference-topbar">
        <div>
          <h1>{t('home.hello', { name: firstName })}</h1>
          <p>{t('home.summary')} · {formattedToday}</p>
        </div>
        <div className="topbar-actions">
          <button className="theme-toggle-button" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}>
            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
          <button className="circle-button" type="button" onClick={() => navigate('/notifications')} aria-label={t('notifications.title')}>
            <Bell size={19} />
          </button>
        </div>
      </header>

      {state.wallets.length === 0 ? (
        <EmptyState
          nativeIcon="wallet"
          nativeTone="green"
          title={t('home.startTitle')}
          body={t('home.startBody')}
          action={t('home.startAction')}
          onAction={() => navigate('/transactions')}
        />
      ) : (
        <>
          <section className={`decision-card ${safeToSpend.status}`}>
            <div className="decision-card-top">
              <span>{t('home.totalBalance')}</span>
              <b>{safeStatusLabel}</b>
            </div>
            <strong>{money(balance)}</strong>
            <p>
              {safeToSpend.status === 'danger' ? t('home.obligationsHigh') : t('home.enough')}
            </p>
            <div className="decision-metrics">
              <span><small>{t('home.safeToSpend')}</small><b>{money(safeToSpend.safeToday)}</b></span>
              <span><small>{t('home.runway')}</small><b>{safeToSpend.days} {t('common.days')}</b></span>
              <span><small>{t('home.reserved')}</small><b>{money(safeToSpend.required + safeToSpend.goalCommitments + safeToSpend.buffer)}</b></span>
            </div>
          </section>

          <section className="reference-stat-grid">
            <article><span>{t('insight.income')}</span><strong>{money(summary.income)}</strong></article>
            <article><span>{t('insight.expense')}</span><strong>{money(summary.expense)}</strong></article>
          </section>

          <section className="reference-card quick-actions-card">
            <div className="reference-section-head">
              <h2>{t('home.quickActions')}</h2>
              <button type="button">{t('common.edit')}</button>
            </div>
            <div className="reference-quick-actions">
              <button type="button" onClick={() => navigate('/transactions')}><PremiumIcon name="add" variant="quickAction" tone="green" size="lg" /><span>{t('home.addTransaction')}</span></button>
              <button type="button" onClick={() => navigate('/budgets')}><PremiumIcon name="budget" variant="quickAction" tone="amber" size="lg" /><span>{t('nav.budgets')}</span></button>
              <button type="button" onClick={() => navigate('/goals')}><PremiumIcon name="goals" variant="quickAction" tone="purple" size="lg" /><span>{t('nav.goals')}</span></button>
              <button type="button" onClick={() => navigate('/budgets')}><PremiumIcon name="bills" variant="quickAction" tone="amber" size="lg" /><span>{t('quick.bill')}</span></button>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-section-head">
              <h2>{t('home.attention')}</h2>
              <button type="button" onClick={() => navigate('/budgets')}>{t('home.viewPlan')}</button>
            </div>
            <div className="attention-list">
              {nextCommitments.length ? nextCommitments.map((item) => (
                <article key={item.id}>
                  <PremiumIcon name={item.icon} variant="transaction" tone={item.tone} size="md" />
                  <span><strong>{item.name}</strong><small>{t('home.due', { date: formatDate(item.date, locale, { month: 'short', day: 'numeric' }) })}</small></span>
                  <b>{money(item.amount)}</b>
                </article>
              )) : (
                <article>
                  <PremiumIcon name="security" variant="transaction" tone="green" size="md" />
                  <span><strong>{t('home.noBills')}</strong><small>{t('home.noBillsBody')}</small></span>
                </article>
              )}
            </div>
          </section>

          <section className="reference-card spending-overview-card">
            <div className="reference-section-head">
              <h2>{t('home.spendingOverview')}</h2>
              <button type="button">{t('home.thisMonth')}</button>
            </div>
            <div className="reference-chart-row">
              <div className="reference-donut">
                <ResponsiveContainer width="100%" height={138}>
                  <PieChart>
                    <Pie data={spending.length ? spending : [{ name: 'No spending', value: 1 }]} dataKey="value" nameKey="name" innerRadius={39} outerRadius={60} paddingAngle={2} isAnimationActive={false}>
                      {(spending.length ? spending : [{ name: 'No spending', value: 1 }]).map((item, index) => <Cell key={item.name} fill={spending.length ? chartColors[index % chartColors.length] : '#E3E8EF'} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span><strong>{money(totalSpending)}</strong><small>{t('home.totalExpense')}</small></span>
              </div>
              <div className="reference-legend">
                {(spending.length ? spending : [{ name: 'No spending', value: 0 }]).map((item, index) => (
                  <div key={item.name}>
                    <i style={{ background: chartColors[index % chartColors.length] }} />
                    <span>{item.name}</span>
                    <b>{totalSpending ? Math.round((item.value / totalSpending) * 100) : 0}%</b>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="decision-grid">
            <article>
              <PremiumIcon name="credit" variant="transaction" tone="coral" size="md" />
              <strong>{debt.monthlyPayment > 0 ? (debt.status === 'risky' || debt.status === 'heavy' ? t('home.debtPressure') : t('home.debtTracked')) : t('home.noDebt')}</strong>
              <small>{debt.ratio === null ? t('home.addIncomeRatio') : t('home.incomeRatio', { value: String(Math.round(debt.ratio)) })}</small>
            </article>
            <article>
              <PremiumIcon name="goals" variant="transaction" tone="purple" size="md" />
              <strong>{goal ? goal.name : t('home.noGoals')}</strong>
              <small>{goal ? `${goalProgress}% · ${t('home.target', { amount: money(goal.targetAmount), date: formatDate(goal.targetDate, locale, { month: 'short', day: 'numeric' }) })}` : t('home.noGoalsBody')}</small>
            </article>
          </section>

          <section className="reference-card advisor-card">
            <PremiumIcon name={safeToSpend.status === 'danger' ? 'debt' : smallLeak ? 'coffee' : 'lightbulb'} variant="transaction" tone={safeToSpend.status === 'danger' ? 'coral' : smallLeak ? 'green' : 'amber'} size="md" />
            <div><strong>{adviceTitle}</strong><p>{adviceBody}</p></div>
          </section>

          <section className="reference-card">
            <div className="reference-section-head">
              <h2>{t('home.recentTransactions')}</h2>
              <button type="button" onClick={() => navigate('/transactions')}>{t('home.seeAll')}</button>
            </div>
            <div className="reference-list">
              {recent.slice(0, 3).map((transaction) => {
                const isTransfer = Boolean(transaction.transferGroupId)
                const isIncome = transaction.type === 'income' || transaction.type === 'transfer_in'
                const wallet = state.wallets.find((item) => item.id === transaction.walletId)
                const category = state.categories.find((item) => item.id === transaction.categoryId)
                const categoryName = localizedCategoryName(category?.localizationKey, category?.name ?? '', categoryLocale)
                const icon = isTransfer
                  ? { name: 'transfer', tone: 'blue' as const }
                  : isIncome
                    ? { name: 'income', tone: 'green' as const }
                    : categoryPremiumIcon(`${transaction.merchant ?? ''} ${categoryName}`, 'expense')
                const displayAmount = transactionAmountInBase(state, transaction)
                const transactionTitle = isTransfer
                  ? transaction.note || t('transactions.transfer')
                  : transaction.merchant || transaction.note || categoryName || t('transactions.thisTransaction')
                return (
                  <button key={transaction.id} type="button" onClick={() => navigate('/transactions')}>
                    <PremiumIcon name={icon.name} variant="transaction" tone={icon.tone} size="md" />
                    <span><strong>{transactionTitle}</strong><small>{wallet?.name ?? t('common.wallet')} · {formatDate(transaction.transactionDate, locale, { month: 'short', day: 'numeric' })}</small></span>
                    <b className={isIncome ? 'positive' : isTransfer ? '' : 'negative'}>{isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(displayAmount, currency, locale)}</b>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="reference-card reference-alert">
            <PremiumIcon name="security" variant="transaction" tone="blue" size="md" />
            <div><strong>{t('home.securityTitle')}</strong><p>{t('auth.bankAccess')} {t('auth.security')}</p></div>
          </section>
        </>
      )}
    </div>
  )
}

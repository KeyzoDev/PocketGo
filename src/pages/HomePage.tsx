import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Bell,
  CalendarClock,
  CreditCard,
  Goal,
  Lightbulb,
  Plus,
  ReceiptText,
  TrendingDown,
  WalletCards,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { calculateForecast, calculateSafeToSpend, debtSummary, detectSmallSpendingLeak, monthlySummary } from '../domain/calculations'
import { analyticsTransactions, totalBalance } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'
import { EmptyState } from '../components/EmptyState'

const chartColors = ['#0A1D3D', '#C7E36B', '#A8F0D1', '#7D8FB3', '#E8B86D']

export function HomePage() {
  const { state } = useAppStore()
  const { t, locale, currency, countryCode } = useLocalization()
  const navigate = useNavigate()
  const money = (value: number) => formatCurrency(value, currency, locale)
  const firstName = state.profile.fullName.trim().split(' ')[0] || 'Alex'
  const balance = totalBalance(state)
  const summary = useMemo(() => monthlySummary(state), [state])
  const safeToSpend = useMemo(() => calculateSafeToSpend(state), [state])
  const forecast = useMemo(() => calculateForecast(state, 7), [state])
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
        tone: rule.type === 'subscription' ? 'blue' : 'amber',
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
          tone: 'red',
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
        const name = localizedCategoryName(category?.localizationKey, category?.name ?? 'Other', countryCode)
        totals.set(name, (totals.get(name) ?? 0) + transaction.amount)
      })
    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [countryCode, state.categories, state.transactions])
  const totalSpending = spending.reduce((sum, item) => sum + item.value, 0)
  const lowestForecast = forecast.reduce((lowest, point) => Math.min(lowest, point.balance), Number.POSITIVE_INFINITY)
  const dangerPoint = forecast.find((point) => point.status === 'danger')
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

  return (
    <div className="reference-page dashboard-page">
      <header className="reference-topbar">
        <div>
          <h1>{t('home.hello', { name: firstName })}</h1>
          <p>{t('home.summary')}</p>
        </div>
        <button className="circle-button" type="button" onClick={() => navigate('/notifications')} aria-label={t('notifications.title')}>
          <Bell size={19} />
        </button>
      </header>

      {state.wallets.length === 0 ? (
        <EmptyState
          icon={WalletCards}
          title={t('home.startTitle')}
          body={t('home.startBody')}
          action={t('home.startAction')}
          onAction={() => navigate('/transactions')}
        />
      ) : (
        <>
          <section className={`decision-card ${safeToSpend.status}`}>
            <div className="decision-card-top">
              <span>{t('home.safeToSpend')}</span>
              <b>{safeStatusLabel}</b>
            </div>
            <strong>{money(safeToSpend.safeToday)}</strong>
            <p>
              {safeToSpend.status === 'danger' ? t('home.obligationsHigh') : t('home.enough')}
            </p>
            <div className="decision-metrics">
              <span><small>{t('home.totalBalance')}</small><b>{money(balance)}</b></span>
              <span><small>{t('home.runway')}</small><b>{safeToSpend.days} {t('common.days')}</b></span>
              <span><small>{t('home.reserved')}</small><b>{money(safeToSpend.required + safeToSpend.goalCommitments + safeToSpend.buffer)}</b></span>
            </div>
          </section>

          <section className="reference-stat-grid">
            <article><span>{t('insight.income')}</span><strong>{money(summary.income)}</strong><ArrowUp size={15} /></article>
            <article><span>{t('insight.expense')}</span><strong>{money(summary.expense)}</strong><ArrowDown size={15} /></article>
          </section>

          <section className="reference-card forecast-card">
            <div className="reference-section-head">
              <h2>{t('home.forecast7')}</h2>
              <button type="button">{safeToSpend.confidence === 'complete' ? t('home.planned') : t('home.estimated')}</button>
            </div>
            <div className="forecast-summary">
              <span className={`reference-icon ${dangerPoint ? 'expense' : 'income'}`}><TrendingDown size={18} /></span>
              <div>
                <strong>{dangerPoint ? t('home.forecastDanger') : t('home.forecastSafe')}</strong>
                <small>{t('home.lowestBalance', { amount: money(Number.isFinite(lowestForecast) ? lowestForecast : balance) })}</small>
              </div>
            </div>
            <div className="forecast-bars" aria-label={t('home.forecast7')}>
              {forecast.map((point) => {
                const max = Math.max(balance, ...forecast.map((item) => Math.abs(item.balance)), 1)
                const height = Math.max(12, Math.round((Math.max(0, point.balance) / max) * 44))
                return <span key={point.date} className={point.status} style={{ height }} title={`${point.date}: ${money(point.balance)}`} />
              })}
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
                  <span className={`reference-icon ${item.tone === 'red' ? 'expense' : item.tone === 'blue' ? 'transfer' : 'amber'}`}><CalendarClock size={18} /></span>
                  <span><strong>{item.name}</strong><small>{t('home.due', { date: formatDate(item.date, locale, { month: 'short', day: 'numeric' }) })}</small></span>
                  <b>{money(item.amount)}</b>
                </article>
              )) : (
                <article>
                  <span className="reference-icon income"><CalendarClock size={18} /></span>
                  <span><strong>{t('home.noBills')}</strong><small>{t('home.noBillsBody')}</small></span>
                </article>
              )}
            </div>
          </section>

          <section className="decision-grid">
            <article>
              <span className="reference-icon expense"><CreditCard size={18} /></span>
              <strong>{debt.monthlyPayment > 0 ? (debt.status === 'risky' || debt.status === 'heavy' ? t('home.debtPressure') : t('home.debtTracked')) : t('home.noDebt')}</strong>
              <small>{debt.ratio === null ? t('home.addIncomeRatio') : t('home.incomeRatio', { value: String(Math.round(debt.ratio)) })}</small>
            </article>
            <article>
              <span className="reference-icon income"><Goal size={18} /></span>
              <strong>{goal ? goal.name : t('home.noGoals')}</strong>
              <small>{goal ? `${goalProgress}% · ${t('home.target', { amount: money(goal.targetAmount), date: formatDate(goal.targetDate, locale, { month: 'short', day: 'numeric' }) })}` : t('home.noGoalsBody')}</small>
            </article>
          </section>

          <section className="reference-card advisor-card">
            <span className="reference-icon amber"><Lightbulb size={18} /></span>
            <div><strong>{adviceTitle}</strong><p>{adviceBody}</p></div>
          </section>

          <section className="reference-card">
            <div className="reference-section-head">
              <h2>Quick Actions</h2>
              <button type="button">{t('common.edit')}</button>
            </div>
            <div className="reference-quick-actions">
              <button type="button" onClick={() => navigate('/transactions')}><ArrowLeftRight size={20} /><span>{t('quick.transfer')}</span></button>
              <button type="button" onClick={() => navigate('/transactions')}><ArrowDown size={20} /><span>{t('quick.expense')}</span></button>
              <button type="button" onClick={() => navigate('/transactions')}><Plus size={20} /><span>{t('quick.income')}</span></button>
              <button type="button" onClick={() => navigate('/budgets')}><ReceiptText size={20} /><span>{t('quick.bill')}</span></button>
            </div>
          </section>

          <section className="reference-card">
            <div className="reference-section-head">
              <h2>Spending Overview</h2>
              <button type="button">This Month</button>
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
                <span><strong>{money(totalSpending)}</strong><small>Total Expense</small></span>
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

          <section className="reference-card">
            <div className="reference-section-head">
              <h2>Recent Transactions</h2>
              <button type="button" onClick={() => navigate('/transactions')}>See all</button>
            </div>
            <div className="reference-list">
              {recent.map((transaction) => {
                const isTransfer = Boolean(transaction.transferGroupId)
                const isIncome = transaction.type === 'income' || transaction.type === 'transfer_in'
                const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowUp : ArrowDown
                const wallet = state.wallets.find((item) => item.id === transaction.walletId)
                return (
                  <button key={transaction.id} type="button" onClick={() => navigate('/transactions')}>
                    <span className={`reference-icon ${isTransfer ? 'transfer' : isIncome ? 'income' : 'expense'}`}><Icon size={18} /></span>
                    <span><strong>{transaction.merchant || transaction.note || t('transactions.thisTransaction')}</strong><small>{wallet?.name ?? t('common.wallet')} · {formatDate(transaction.transactionDate, locale, { month: 'short', day: 'numeric' })}</small></span>
                    <b className={isIncome ? 'positive' : isTransfer ? '' : 'negative'}>{isIncome ? '+' : isTransfer ? '' : '-'}{money(transaction.amount)}</b>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="reference-card reference-alert">
            <span className="reference-icon amber"><CreditCard size={18} /></span>
            <div><strong>Keep your account secure</strong><p>PocketGo does not ask for bank access. Your data stays tied to your account.</p></div>
          </section>
        </>
      )}
    </div>
  )
}

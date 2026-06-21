import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Goal as GoalIcon,
  Lightbulb,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { calculateForecast, calculateSafeToSpend, debtSummary, detectSmallSpendingLeak } from '../domain/calculations'
import { totalBalance } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { useLocalization } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import { EmptyState } from '../components/EmptyState'

export function HomePage() {
  const { state } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const money = (value: number) => formatCurrency(value, currency, locale)
  const navigate = useNavigate()
  const safe = useMemo(() => calculateSafeToSpend(state), [state])
  const forecast = useMemo(() => calculateForecast(state, 7), [state])
  const debt = useMemo(() => debtSummary(state), [state])
  const leak = useMemo(() => detectSmallSpendingLeak(state), [state])
  const balance = totalBalance(state)
  const nextRule = state.recurringRules
    .filter((rule) => rule.isActive && rule.type !== 'income')
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0]
  const topGoal = [...state.goals].sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 }
    return priority[b.priority] - priority[a.priority]
  })[0]
  const firstName = state.profile.fullName.trim().split(' ')[0]

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-brand">
          <div className="brand-lockup light">
            <div><strong>PocketGo</strong><small>Track Your Money</small></div>
          </div>
          <button className="avatar-button" type="button" onClick={() => navigate('/more')} aria-label={t('home.profile')}>
            {firstName ? firstName.charAt(0).toUpperCase() : 'P'}
          </button>
        </div>
        <div className="hero-heading">
          <p>{t('home.summary')}</p>
          <h1>{firstName ? t('home.hello', { name: firstName }) : t('home.clarity')}</h1>
        </div>
        <div className="money-summary">
          <div>
            <span>{t('home.totalBalance')}</span>
            <strong>{money(balance)}</strong>
          </div>
          <div className="summary-divider" />
          <div>
            <span>{t('home.safeToSpend')}</span>
            <strong className={safe.status}>{money(safe.safeToday)}</strong>
            <small className={`status-pill ${safe.status}`}>
              {safe.status === 'safe' ? <Check size={14} /> : <CircleAlert size={14} />}
              {safe.status === 'safe' ? t('home.safe') : safe.status === 'caution' ? t('home.caution') : t('home.risky')}
            </small>
          </div>
        </div>
        <div className="forecast-panel">
          <div className="forecast-head">
            <span className="round-icon"><CalendarDays size={21} /></span>
            <div>
              <strong>
                {balance > 0
                  ? safe.safeTotal >= 0
                    ? t('home.enough')
                    : t('home.obligationsHigh')
                  : t('home.addBalance')}
              </strong>
              <small>{safe.confidence === 'estimated' ? t('home.estimated') : t('home.planned')}</small>
            </div>
            <b>{safe.days}<small> {t('common.days')}</small></b>
          </div>
          <div className="forecast-timeline">
            {forecast.map((point, index) => (
              <div key={point.date}>
                <span>{index === 0 ? t('common.today') : formatDate(point.date, locale, { weekday: 'short' })}</span>
                <i className={point.status}>{point.status === 'safe' ? <Check size={15} /> : <CircleAlert size={15} />}</i>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-body page-width">
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
            <section className="brief-section">
              <h2>{t('home.attention')}</h2>
              <div className="brief-list">
                {nextRule ? (
                  <button type="button" onClick={() => navigate('/plan')}>
                    <span className="brief-icon amber"><ReceiptText size={20} /></span>
                    <span><strong>{nextRule.name}</strong><small>{t('home.due', { date: formatDate(nextRule.nextDueDate, locale, { day: 'numeric', month: 'short' }) })}</small></span>
                    <b>{money(nextRule.amount)}</b><ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate('/plan')}>
                    <span className="brief-icon amber"><ReceiptText size={20} /></span>
                    <span><strong>{t('home.noBills')}</strong><small>{t('home.noBillsBody')}</small></span>
                    <ChevronRight size={18} />
                  </button>
                )}
                {state.debts.length ? (
                  <button type="button" onClick={() => navigate('/plan')}>
                    <span className="brief-icon coral"><CircleAlert size={20} /></span>
                    <span>
                      <strong>{debt.status === 'risky' || debt.status === 'heavy' ? t('home.debtPressure') : t('home.debtTracked')}</strong>
                      <small>{debt.ratio === null ? t('home.addIncomeRatio') : t('home.incomeRatio', { value: Math.round(debt.ratio) })}</small>
                    </span>
                    <b>{money(debt.monthlyPayment)}</b><ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
            </section>

            <section className="brief-section">
              <div className="section-title-row"><h2>{t('home.goals')}</h2><button type="button" onClick={() => navigate('/plan')}>{t('home.viewPlan')} <ChevronRight size={16} /></button></div>
              {topGoal ? (
                <button className="goal-row" type="button" onClick={() => navigate('/plan')}>
                  <span className="brief-icon sage"><GoalIcon size={20} /></span>
                  <span className="goal-copy">
                    <strong>{topGoal.name}</strong>
                    <small>{t('home.target', { amount: money(topGoal.targetAmount), date: formatDate(topGoal.targetDate, locale) })}</small>
                    <i><em style={{ width: `${Math.min(100, (topGoal.currentAmount / topGoal.targetAmount) * 100)}%` }} /></i>
                  </span>
                  <b>{Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100)}%</b>
                </button>
              ) : (
                <div className="compact-empty"><GoalIcon size={20} /><span><strong>{t('home.noGoals')}</strong><small>{t('home.noGoalsBody')}</small></span><button onClick={() => navigate('/plan')}>{t('common.create')}</button></div>
              )}
            </section>

            <section className="brief-section">
              <h2>{t('home.advice')}</h2>
              <button className="advisor-row" type="button" onClick={() => leak ? navigate('/insight') : navigate('/transactions')}>
                <span className="brief-icon green"><Lightbulb size={20} /></span>
                <span>
                  <strong>{leak ? t('home.smallPurchases') : t('home.recordDaily')}</strong>
                  <small>{leak ? t('home.smallPurchasesBody', { count: leak.count, amount: money(leak.total) }) : t('home.recordDailyBody')}</small>
                </span>
                <ArrowRight size={18} />
              </button>
            </section>

            <div className="privacy-note"><ShieldCheck size={16} /> {t('home.privacy')}</div>
          </>
        )}
      </section>
    </div>
  )
}

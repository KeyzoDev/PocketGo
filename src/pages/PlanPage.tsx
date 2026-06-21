import {
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Goal as GoalIcon,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { addMonths, endOfMonth, formatISO, startOfMonth } from 'date-fns'
import { calculateForecast, calculateSafeToSpend, debtSummary } from '../domain/calculations'
import { currencySymbol, formatCurrency, formatDate, parseAmount } from '../lib/format'
import { createId } from '../lib/id'
import { useAppStore } from '../store/useAppStore'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Budget, Debt, Goal, RecurringRule } from '../types'
import { useLocalization } from '../i18n'

type PlanForm = 'budget' | 'recurring' | 'goal' | 'debt' | null

export function PlanPage() {
  const {
    state,
    saveBudget,
    removeBudget,
    saveRecurring,
    removeRecurring,
    saveGoal,
    removeGoal,
    saveDebt,
    removeDebt,
  } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const money = (value: number) => formatCurrency(value, currency, locale)
  const [form, setForm] = useState<PlanForm>(null)
  const [formError, setFormError] = useState('')
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [editingRecurring, setEditingRecurring] = useState<RecurringRule | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [simulation, setSimulation] = useState('')
  const forecast = useMemo(() => calculateForecast(state, 30), [state])
  const safe = useMemo(() => calculateSafeToSpend(state), [state])
  const debt = useMemo(() => debtSummary(state), [state])
  const simulatedSpend = parseAmount(simulation, locale)
  const simulatedDaily = Math.max(0, (safe.safeTotal - simulatedSpend) / safe.days)
  const lowest = forecast.reduce((min, point) => Math.min(min, point.balance), forecast[0]?.balance ?? 0)

  async function submitBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const data = new FormData(event.currentTarget)
    try {
      await saveBudget({
        id: editingBudget?.id ?? createId('budget'),
        name: String(data.get('name')),
        totalLimit: parseAmount(String(data.get('amount')), locale),
        periodStart: formatISO(startOfMonth(new Date()), { representation: 'date' }),
        periodEnd: formatISO(endOfMonth(new Date()), { representation: 'date' }),
      })
      closeForm()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Budget belum dapat disimpan.')
    }
  }

  async function submitRecurring(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const data = new FormData(event.currentTarget)
    try {
      await saveRecurring({
        id: editingRecurring?.id ?? createId('recurring'),
        name: String(data.get('name')),
        type: data.get('type') as 'income' | 'expense' | 'debt_payment' | 'subscription',
        amount: parseAmount(String(data.get('amount')), locale),
        walletId: String(data.get('walletId')) || undefined,
        frequency: data.get('frequency') as 'weekly' | 'monthly' | 'yearly',
        nextDueDate: String(data.get('nextDueDate')),
        isActive: true,
      })
      closeForm()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Jadwal belum dapat disimpan.')
    }
  }

  async function submitGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const data = new FormData(event.currentTarget)
    try {
      await saveGoal({
        id: editingGoal?.id ?? createId('goal'),
        name: String(data.get('name')),
        targetAmount: parseAmount(String(data.get('targetAmount')), locale),
        currentAmount: parseAmount(String(data.get('currentAmount')), locale),
        targetDate: String(data.get('targetDate')),
        monthlyContribution: parseAmount(String(data.get('monthlyContribution')), locale),
        priority: data.get('priority') as 'low' | 'medium' | 'high',
      })
      closeForm()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Tujuan belum dapat disimpan.')
    }
  }

  async function submitDebt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const data = new FormData(event.currentTarget)
    const originalAmount = parseAmount(String(data.get('originalAmount')), locale)
    try {
      await saveDebt({
        id: editingDebt?.id ?? createId('debt'),
        name: String(data.get('name')),
        lender: String(data.get('lender')) || undefined,
        type: data.get('type') as 'credit_card' | 'paylater' | 'personal_loan' | 'installment' | 'other',
        originalAmount,
        remainingBalance: parseAmount(String(data.get('remainingBalance')), locale) || originalAmount,
        installmentAmount: parseAmount(String(data.get('installmentAmount')), locale),
        minimumPayment: parseAmount(String(data.get('minimumPayment')), locale),
        dueDay: Math.min(28, Math.max(1, Number(data.get('dueDay')))),
        status: 'active',
      })
      closeForm()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Utang belum dapat disimpan.')
    }
  }

  function closeForm() {
    setForm(null)
    setFormError('')
    setEditingBudget(null)
    setEditingRecurring(null)
    setEditingGoal(null)
    setEditingDebt(null)
  }

  async function remove(kind: 'budget' | 'recurring' | 'goal' | 'debt', id: string) {
    if (!window.confirm('Hapus item ini? Data historis transaksi tidak akan ikut terhapus.')) return
    try {
      if (kind === 'budget') await removeBudget(id)
      if (kind === 'recurring') await removeRecurring(id)
      if (kind === 'goal') await removeGoal(id)
      if (kind === 'debt') await removeDebt(id)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Item belum dapat dihapus.')
    }
  }

  return (
    <div className="standard-page page-width plan-page">
      <header className="page-header"><div><p>{t('plan.eyebrow')}</p><h1>{t('plan.title')}</h1></div></header>

      <section className="plan-overview">
        <div><span>{t('plan.forecast')}</span><strong className={lowest < 0 ? 'danger-text' : ''}>{lowest < 0 ? t('home.risky') : t('plan.tracked')}</strong><small>{t('plan.lowest', { amount: money(lowest) })}</small></div>
        <div><span>{t('plan.safeToday')}</span><strong>{money(safe.safeToday)}</strong><small>{t('plan.safeDays', { days: safe.days })}</small></div>
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>{t('plan.budget')}</h2><p>{t('plan.budgetBody')}</p></div><button type="button" onClick={() => setForm('budget')}><Plus size={16} /> {t('common.create')}</button></div>
        {state.budgets.length === 0 ? (
          <EmptyState icon={CircleDollarSign} title={t('plan.noBudget')} body={t('plan.noBudgetBody')} action={t('common.create')} onAction={() => setForm('budget')} />
        ) : (
          <div className="stack-list">
            {state.budgets.map((budget) => {
              const expenses = state.transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0)
              const percentage = Math.min(100, (expenses / budget.totalLimit) * 100)
              return <article key={budget.id}><span className="brief-icon navy"><CircleDollarSign size={20} /></span><div><strong>{budget.name}</strong><small>{money(expenses)} {t('common.from')} {money(budget.totalLimit)}</small><i><em style={{ width: `${percentage}%` }} /></i></div><b>{Math.round(percentage)}%</b><span className="row-actions"><button aria-label={`${t('common.edit')} ${budget.name}`} onClick={() => { setEditingBudget(budget); setForm('budget') }}><Pencil size={15} /></button><button aria-label={`${t('common.delete')} ${budget.name}`} onClick={() => remove('budget', budget.id)}><Trash2 size={15} /></button></span></article>
            })}
          </div>
        )}
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>{t('plan.recurring')}</h2><p>{t('plan.recurringBody')}</p></div><button type="button" onClick={() => setForm('recurring')}><Plus size={16} /> {t('common.add')}</button></div>
        {state.recurringRules.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t('plan.noRecurring')} body={t('plan.noRecurringBody')} action={t('common.add')} onAction={() => setForm('recurring')} />
        ) : (
          <div className="stack-list">
            {state.recurringRules.map((rule) => <article key={rule.id}><span className={`brief-icon ${rule.type === 'income' ? 'sage' : 'amber'}`}><CalendarClock size={20} /></span><div><strong>{rule.name}</strong><small>{rule.frequency} · {formatDate(rule.nextDueDate, locale)}</small></div><b className={rule.type === 'income' ? 'positive' : ''}>{rule.type === 'income' ? '+' : '-'}{money(rule.amount)}</b><span className="row-actions"><button aria-label={`${t('common.edit')} ${rule.name}`} onClick={() => { setEditingRecurring(rule); setForm('recurring') }}><Pencil size={15} /></button><button aria-label={`${t('common.delete')} ${rule.name}`} onClick={() => remove('recurring', rule.id)}><Trash2 size={15} /></button></span></article>)}
          </div>
        )}
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>{t('plan.goals')}</h2><p>{t('plan.goalsBody')}</p></div><button type="button" onClick={() => setForm('goal')}><Plus size={16} /> {t('common.add')}</button></div>
        {state.goals.length === 0 ? (
          <EmptyState icon={GoalIcon} title={t('plan.noGoals')} body={t('plan.noGoalsBody')} action={t('common.create')} onAction={() => setForm('goal')} />
        ) : (
          <div className="stack-list">
            {state.goals.map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              const months = Math.max(1, Math.ceil((goal.targetAmount - goal.currentAmount) / Math.max(goal.monthlyContribution, 1)))
              return <article key={goal.id}><span className="brief-icon sage"><GoalIcon size={20} /></span><div><strong>{goal.name}</strong><small>{money(goal.currentAmount)} {t('common.from')} {money(goal.targetAmount)} · {months} {t('common.months')}</small><i><em style={{ width: `${progress}%` }} /></i></div><b>{Math.round(progress)}%</b><span className="row-actions"><button aria-label={`${t('common.edit')} ${goal.name}`} onClick={() => { setEditingGoal(goal); setForm('goal') }}><Pencil size={15} /></button><button aria-label={`${t('common.delete')} ${goal.name}`} onClick={() => remove('goal', goal.id)}><Trash2 size={15} /></button></span></article>
            })}
          </div>
        )}
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>{t('plan.debts')}</h2><p>{t('plan.debtsBody')}</p></div><button type="button" onClick={() => setForm('debt')}><Plus size={16} /> {t('common.add')}</button></div>
        {state.debts.length === 0 ? (
          <EmptyState icon={CreditCard} title={t('plan.noDebt')} body={t('plan.noDebtBody')} action={t('common.add')} onAction={() => setForm('debt')} />
        ) : (
          <>
            <div className={`debt-radar ${debt.status}`}><div><span>{t('plan.totalDebt')}</span><strong>{money(debt.remaining)}</strong></div><div><span>{t('plan.monthlyPayment')}</span><strong>{money(debt.monthlyPayment)}</strong></div><div><span>{t('plan.incomeRatio')}</span><strong>{debt.ratio === null ? t('plan.unknown') : `${Math.round(debt.ratio)}%`}</strong></div></div>
            <div className="stack-list">{state.debts.map((item) => <article key={item.id}><span className="brief-icon coral"><CreditCard size={20} /></span><div><strong>{item.name}</strong><small>{item.dueDay} · {money(item.remainingBalance)}</small></div><b>{money(Math.max(item.installmentAmount, item.minimumPayment))}</b><span className="row-actions"><button aria-label={`${t('common.edit')} ${item.name}`} onClick={() => { setEditingDebt(item); setForm('debt') }}><Pencil size={15} /></button><button aria-label={`${t('common.delete')} ${item.name}`} onClick={() => remove('debt', item.id)}><Trash2 size={15} /></button></span></article>)}</div>
          </>
        )}
      </section>

      <section className="what-if">
        <span className="brief-icon navy"><Sparkles size={20} /></span>
        <div><h2>{t('plan.whatIf')}</h2><p>{t('plan.whatIfBody')}</p><label><span>{currencySymbol(currency, locale)}</span><input inputMode="decimal" value={simulation} onChange={(event) => setSimulation(event.target.value)} placeholder="0" /></label>{simulatedSpend > 0 ? <small>{t('plan.afterSpend', { amount: money(simulatedDaily) })}</small> : null}</div>
        <ChevronRight size={18} />
      </section>

      <Modal open={form === 'budget'} title={editingBudget ? t('plan.form.editBudget') : t('plan.form.createBudget')} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitBudget}><label>{t('plan.form.budgetName')}<input name="name" required defaultValue={editingBudget?.name} /></label><label>{t('plan.form.budgetLimit')}<input name="amount" inputMode="numeric" required placeholder="0" defaultValue={editingBudget?.totalLimit} /></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">{t('plan.form.saveBudget')}</button></form>
      </Modal>
      <Modal open={form === 'recurring'} title={editingRecurring ? t('plan.form.editSchedule') : t('plan.form.addSchedule')} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitRecurring}><label>{t('plan.form.name')}<input name="name" required defaultValue={editingRecurring?.name} /></label><label>{t('plan.form.type')}<select name="type" defaultValue={editingRecurring?.type ?? 'expense'}><option value="expense">{t('plan.form.expense')}</option><option value="subscription">{t('plan.form.subscription')}</option><option value="income">{t('plan.form.income')}</option></select></label><label>{t('plan.form.amount')}<input name="amount" inputMode="numeric" required placeholder="0" defaultValue={editingRecurring?.amount} /></label><label>{t('plan.form.wallet')}<select name="walletId" defaultValue={editingRecurring?.walletId ?? ''}><option value="">{t('plan.form.notSet')}</option>{state.wallets.filter((wallet) => !wallet.isArchived).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label><label>{t('plan.form.frequency')}<select name="frequency" defaultValue={editingRecurring?.frequency ?? 'monthly'}><option value="monthly">{t('common.monthly')}</option><option value="weekly">{t('common.weekly')}</option><option value="yearly">{t('common.yearly')}</option></select></label><label>{t('plan.form.nextDate')}<input name="nextDueDate" type="date" required defaultValue={editingRecurring?.nextDueDate ?? formatISO(addMonths(new Date(), 1), { representation: 'date' })} /></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">{t('plan.form.saveSchedule')}</button></form>
      </Modal>
      <Modal open={form === 'goal'} title={editingGoal ? t('plan.form.editGoal') : t('plan.form.createGoal')} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitGoal}><label>{t('plan.form.goalName')}<input name="name" required defaultValue={editingGoal?.name} /></label><label>{t('plan.form.targetAmount')}<input name="targetAmount" inputMode="numeric" required placeholder="0" defaultValue={editingGoal?.targetAmount} /></label><label>{t('plan.form.currentAmount')}<input name="currentAmount" inputMode="numeric" defaultValue={editingGoal?.currentAmount ?? 0} /></label><label>{t('plan.form.targetDate')}<input name="targetDate" type="date" required defaultValue={editingGoal?.targetDate ?? formatISO(addMonths(new Date(), 12), { representation: 'date' })} /></label><label>{t('plan.form.monthlyContribution')}<input name="monthlyContribution" inputMode="numeric" required placeholder="0" defaultValue={editingGoal?.monthlyContribution} /></label><label>{t('plan.form.priority')}<select name="priority" defaultValue={editingGoal?.priority ?? 'high'}><option value="high">{t('plan.form.high')}</option><option value="medium">{t('plan.form.medium')}</option><option value="low">{t('plan.form.low')}</option></select></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">{t('plan.form.saveGoal')}</button></form>
      </Modal>
      <Modal open={form === 'debt'} title={editingDebt ? t('plan.form.editDebt') : t('plan.form.addDebt')} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitDebt}><label>{t('plan.form.name')}<input name="name" required defaultValue={editingDebt?.name} /></label><label>{t('plan.form.lender')} <span className="optional">{t('common.optional')}</span><input name="lender" defaultValue={editingDebt?.lender} /></label><label>{t('plan.form.type')}<select name="type" defaultValue={editingDebt?.type ?? 'paylater'}><option value="paylater">{t('wallet.paylater')}</option><option value="credit_card">{t('plan.form.creditCard')}</option><option value="installment">{t('plan.form.installment')}</option><option value="personal_loan">{t('plan.form.personalLoan')}</option><option value="other">{t('plan.form.other')}</option></select></label><label>{t('plan.form.originalAmount')}<input name="originalAmount" inputMode="numeric" required placeholder="0" defaultValue={editingDebt?.originalAmount} /></label><label>{t('plan.form.remainingBalance')}<input name="remainingBalance" inputMode="numeric" defaultValue={editingDebt?.remainingBalance} /></label><label>{t('plan.form.monthlyInstallment')}<input name="installmentAmount" inputMode="numeric" required placeholder="0" defaultValue={editingDebt?.installmentAmount} /></label><label>{t('plan.form.minimumPayment')}<input name="minimumPayment" inputMode="numeric" placeholder="0" defaultValue={editingDebt?.minimumPayment} /></label><label>{t('plan.form.dueDay')}<input name="dueDay" type="number" min="1" max="28" defaultValue={editingDebt?.dueDay ?? 1} required /></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">{t('plan.form.saveDebt')}</button></form>
      </Modal>
    </div>
  )
}

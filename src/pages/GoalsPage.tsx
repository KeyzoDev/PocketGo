import { Plus } from 'lucide-react'
import { useState } from 'react'
import { addMonths, formatISO } from 'date-fns'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PremiumIcon } from '../components/PremiumIcon'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import { formatCurrency, formatDate, parseAmount } from '../lib/format'
import { createId } from '../lib/id'
import type { Goal, Wallet } from '../types'

function createUuidFallback(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return createId(prefix)
}

export function GoalsPage() {
  const { state, saveGoal, saveWallet, createTransfer, syncing, syncError } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const [open, setOpen] = useState(false)
  const money = (value: number) => formatCurrency(value, currency, locale)

  async function submitGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const currentAmount = parseAmount(String(data.get('currentAmount')), locale)
    const sourceWalletId = String(data.get('sourceWalletId') ?? '')
    const walletId = createUuidFallback('wallet')
    const wallet: Wallet = {
      id: walletId,
      name,
      type: 'savings',
      startingBalance: sourceWalletId ? 0 : currentAmount,
      currency: state.profile.currency,
      includeInTotal: true,
      isArchived: false,
      color: '#18B57D',
      createdAt: new Date().toISOString(),
    }
    await saveWallet(wallet)
    if (sourceWalletId && currentAmount > 0) {
      await createTransfer({
        sourceWalletId,
        destinationWalletId: walletId,
        amount: currentAmount,
        transactionDate: formatISO(new Date(), { representation: 'date' }),
        note: name,
      })
    }
    await saveGoal({
      id: createId('goal'),
      name,
      walletId,
      targetAmount: parseAmount(String(data.get('targetAmount')), locale),
      currentAmount,
      targetDate: String(data.get('targetDate')),
      monthlyContribution: parseAmount(String(data.get('monthlyContribution')), locale),
      priority: data.get('priority') as Goal['priority'],
    })
    setOpen(false)
  }

  return (
    <div className="reference-page goals-page">
      <header className="reference-topbar">
        <div>
          <h1>{t('goals.title')}</h1>
          <p>{t('goals.subtitle')}</p>
        </div>
        <button className="circle-button" type="button" onClick={() => setOpen(true)} aria-label={t('goals.add')}>
          <Plus size={20} />
        </button>
      </header>

      {state.goals.length === 0 ? (
        <EmptyState nativeIcon="goals" nativeTone="purple" title={t('plan.noGoals')} body={t('plan.noGoalsBody')} action={t('goals.add')} onAction={() => setOpen(true)} />
      ) : (
        <section className="goal-card-list">
          {state.goals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
            const months = Math.max(1, Math.ceil(remaining / Math.max(goal.monthlyContribution, 1)))
            const wallet = state.wallets.find((item) => item.id === goal.walletId)
            return (
              <article className="goal-card-premium" key={goal.id}>
                <div className="goal-card-head">
                  <PremiumIcon name="goals" tone="purple" variant="transaction" size="md" />
                  <div>
                    <strong>{goal.name}</strong>
                    <small>{wallet?.name ?? t('wallet.savings')} · {formatDate(goal.targetDate, locale, { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                  </div>
                  <b>{progress}%</b>
                </div>
                <div className="goal-progress-track"><span style={{ width: `${progress}%` }} /></div>
                <div className="goal-card-metrics">
                  <span><small>{t('goals.saved')}</small><b>{money(goal.currentAmount)}</b></span>
                  <span><small>{t('goals.remaining')}</small><b>{money(remaining)}</b></span>
                  <span><small>{t('goals.monthlyNeed')}</small><b>{money(Math.ceil(remaining / months))}</b></span>
                </div>
              </article>
            )
          })}
        </section>
      )}

      <Modal open={open} title={t('goals.add')} onClose={() => setOpen(false)}>
        <form className="form-stack" noValidate onSubmit={submitGoal}>
          <label>{t('plan.form.goalName')}<input name="name" placeholder={t('plan.noGoalsBody')} /></label>
          <div className="inline-notice">{t('plan.form.createGoalWallet')}</div>
          <label>{t('plan.form.targetAmount')}<input name="targetAmount" inputMode="numeric" placeholder="0" /></label>
          <label>{t('plan.form.currentAmount')}<input name="currentAmount" inputMode="numeric" defaultValue="0" /></label>
          <label>{t('plan.form.sourceWallet')} <span className="optional">{t('common.optional')}</span><select name="sourceWalletId" defaultValue=""><option value="">{t('plan.form.notSet')}</option>{state.wallets.filter((wallet) => !wallet.isArchived).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>
          <label>{t('plan.form.targetDate')}<input name="targetDate" type="date" defaultValue={formatISO(addMonths(new Date(), 12), { representation: 'date' })} /></label>
          <label>{t('plan.form.monthlyContribution')}<input name="monthlyContribution" inputMode="numeric" placeholder="0" /></label>
          <label>{t('plan.form.priority')}<select name="priority" defaultValue="high"><option value="high">{t('plan.form.high')}</option><option value="medium">{t('plan.form.medium')}</option><option value="low">{t('plan.form.low')}</option></select></label>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? t('common.saving') : t('plan.form.saveGoal')}</button>
        </form>
      </Modal>
    </div>
  )
}

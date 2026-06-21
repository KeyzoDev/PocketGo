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
import { formatCurrency, parseAmount } from '../lib/format'
import { createId } from '../lib/id'
import { useAppStore } from '../store/useAppStore'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Budget, Debt, Goal, RecurringRule } from '../types'

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
  const simulatedSpend = parseAmount(simulation)
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
        totalLimit: parseAmount(String(data.get('amount'))),
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
        amount: parseAmount(String(data.get('amount'))),
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
        targetAmount: parseAmount(String(data.get('targetAmount'))),
        currentAmount: parseAmount(String(data.get('currentAmount'))),
        targetDate: String(data.get('targetDate')),
        monthlyContribution: parseAmount(String(data.get('monthlyContribution'))),
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
    const originalAmount = parseAmount(String(data.get('originalAmount')))
    try {
      await saveDebt({
        id: editingDebt?.id ?? createId('debt'),
        name: String(data.get('name')),
        lender: String(data.get('lender')) || undefined,
        type: data.get('type') as 'credit_card' | 'paylater' | 'personal_loan' | 'installment' | 'other',
        originalAmount,
        remainingBalance: parseAmount(String(data.get('remainingBalance'))) || originalAmount,
        installmentAmount: parseAmount(String(data.get('installmentAmount'))),
        minimumPayment: parseAmount(String(data.get('minimumPayment'))),
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
      <header className="page-header"><div><p>Siapkan langkah berikutnya</p><h1>Plan</h1></div></header>

      <section className="plan-overview">
        <div><span>Forecast 30 hari</span><strong className={lowest < 0 ? 'danger-text' : ''}>{lowest < 0 ? 'Berisiko' : 'Terpantau'}</strong><small>Saldo terendah {formatCurrency(lowest)}</small></div>
        <div><span>Aman hari ini</span><strong>{formatCurrency(safe.safeToday)}</strong><small>{safe.days} hari menuju pemasukan/akhir bulan</small></div>
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>Budget bulan ini</h2><p>Jaga batas yang realistis, bukan aturan kaku.</p></div><button type="button" onClick={() => setForm('budget')}><Plus size={16} /> Buat</button></div>
        {state.budgets.length === 0 ? (
          <EmptyState icon={CircleDollarSign} title="Belum ada budget" body="Buat budget agar PocketGo dapat memperkirakan apa yang aman dibelanjakan." action="Buat budget" onAction={() => setForm('budget')} />
        ) : (
          <div className="stack-list">
            {state.budgets.map((budget) => {
              const expenses = state.transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0)
              const percentage = Math.min(100, (expenses / budget.totalLimit) * 100)
              return <article key={budget.id}><span className="brief-icon navy"><CircleDollarSign size={20} /></span><div><strong>{budget.name}</strong><small>{formatCurrency(expenses)} dari {formatCurrency(budget.totalLimit)}</small><i><em style={{ width: `${percentage}%` }} /></i></div><b>{Math.round(percentage)}%</b><span className="row-actions"><button aria-label={`Edit ${budget.name}`} onClick={() => { setEditingBudget(budget); setForm('budget') }}><Pencil size={15} /></button><button aria-label={`Hapus ${budget.name}`} onClick={() => remove('budget', budget.id)}><Trash2 size={15} /></button></span></article>
            })}
          </div>
        )}
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>Tagihan & pemasukan rutin</h2><p>Dipakai untuk menghitung Safe to Spend dan forecast.</p></div><button type="button" onClick={() => setForm('recurring')}><Plus size={16} /> Tambah</button></div>
        {state.recurringRules.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Belum ada jadwal rutin" body="Tambahkan tagihan, langganan, atau pemasukan agar risiko ke depan terlihat." action="Tambah jadwal" onAction={() => setForm('recurring')} />
        ) : (
          <div className="stack-list">
            {state.recurringRules.map((rule) => <article key={rule.id}><span className={`brief-icon ${rule.type === 'income' ? 'sage' : 'amber'}`}><CalendarClock size={20} /></span><div><strong>{rule.name}</strong><small>{rule.frequency} · berikutnya {rule.nextDueDate}</small></div><b className={rule.type === 'income' ? 'positive' : ''}>{rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}</b><span className="row-actions"><button aria-label={`Edit ${rule.name}`} onClick={() => { setEditingRecurring(rule); setForm('recurring') }}><Pencil size={15} /></button><button aria-label={`Hapus ${rule.name}`} onClick={() => remove('recurring', rule.id)}><Trash2 size={15} /></button></span></article>)}
          </div>
        )}
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>Tujuan keuangan</h2><p>Lihat apakah kontribusi saat ini cukup realistis.</p></div><button type="button" onClick={() => setForm('goal')}><Plus size={16} /> Tambah</button></div>
        {state.goals.length === 0 ? (
          <EmptyState icon={GoalIcon} title="Belum ada tujuan" body="Buat tujuan pertama seperti dana darurat, pendidikan, kendaraan, atau liburan." action="Buat tujuan" onAction={() => setForm('goal')} />
        ) : (
          <div className="stack-list">
            {state.goals.map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              const months = Math.max(1, Math.ceil((goal.targetAmount - goal.currentAmount) / Math.max(goal.monthlyContribution, 1)))
              return <article key={goal.id}><span className="brief-icon sage"><GoalIcon size={20} /></span><div><strong>{goal.name}</strong><small>{formatCurrency(goal.currentAmount)} dari {formatCurrency(goal.targetAmount)} · sekitar {months} bulan</small><i><em style={{ width: `${progress}%` }} /></i></div><b>{Math.round(progress)}%</b><span className="row-actions"><button aria-label={`Edit ${goal.name}`} onClick={() => { setEditingGoal(goal); setForm('goal') }}><Pencil size={15} /></button><button aria-label={`Hapus ${goal.name}`} onClick={() => remove('goal', goal.id)}><Trash2 size={15} /></button></span></article>
            })}
          </div>
        )}
      </section>

      <section className="plan-section">
        <div className="section-title-row"><div><h2>Utang & paylater</h2><p>Lihat tekanan cicilan sebelum mengambil kewajiban baru.</p></div><button type="button" onClick={() => setForm('debt')}><Plus size={16} /> Tambah</button></div>
        {state.debts.length === 0 ? (
          <EmptyState icon={CreditCard} title="Belum ada catatan utang" body="Tambahkan paylater, kartu kredit, atau pinjaman jika ada agar jatuh tempo terlihat." action="Tambah utang" onAction={() => setForm('debt')} />
        ) : (
          <>
            <div className={`debt-radar ${debt.status}`}><div><span>Total sisa utang</span><strong>{formatCurrency(debt.remaining)}</strong></div><div><span>Cicilan bulanan</span><strong>{formatCurrency(debt.monthlyPayment)}</strong></div><div><span>Rasio ke pemasukan</span><strong>{debt.ratio === null ? 'Belum diketahui' : `${Math.round(debt.ratio)}%`}</strong></div></div>
            <div className="stack-list">{state.debts.map((item) => <article key={item.id}><span className="brief-icon coral"><CreditCard size={20} /></span><div><strong>{item.name}</strong><small>Jatuh tempo tiap tanggal {item.dueDay} · sisa {formatCurrency(item.remainingBalance)}</small></div><b>{formatCurrency(Math.max(item.installmentAmount, item.minimumPayment))}</b><span className="row-actions"><button aria-label={`Edit ${item.name}`} onClick={() => { setEditingDebt(item); setForm('debt') }}><Pencil size={15} /></button><button aria-label={`Hapus ${item.name}`} onClick={() => remove('debt', item.id)}><Trash2 size={15} /></button></span></article>)}</div>
          </>
        )}
      </section>

      <section className="what-if">
        <span className="brief-icon navy"><Sparkles size={20} /></span>
        <div><h2>Kalau saya belanja...</h2><p>Lihat dampaknya ke uang aman harian sebelum memutuskan.</p><label><span>Rp</span><input inputMode="numeric" value={simulation} onChange={(event) => setSimulation(event.target.value)} placeholder="0" /></label>{simulatedSpend > 0 ? <small>Setelah belanja, uang aman sekitar <strong>{formatCurrency(simulatedDaily)}/hari</strong>.</small> : null}</div>
        <ChevronRight size={18} />
      </section>

      <Modal open={form === 'budget'} title={editingBudget ? 'Edit budget' : 'Buat budget'} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitBudget}><label>Nama budget<input name="name" required placeholder="Contoh: Budget bulanan" defaultValue={editingBudget?.name} /></label><label>Batas pengeluaran<input name="amount" inputMode="numeric" required placeholder="Rp0" defaultValue={editingBudget?.totalLimit} /></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">Simpan budget</button></form>
      </Modal>
      <Modal open={form === 'recurring'} title={editingRecurring ? 'Edit jadwal rutin' : 'Tambah jadwal rutin'} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitRecurring}><label>Nama<input name="name" required placeholder="Contoh: Listrik" defaultValue={editingRecurring?.name} /></label><label>Jenis<select name="type" defaultValue={editingRecurring?.type ?? 'expense'}><option value="expense">Tagihan/pengeluaran</option><option value="subscription">Langganan</option><option value="income">Pemasukan</option></select></label><label>Jumlah<input name="amount" inputMode="numeric" required placeholder="Rp0" defaultValue={editingRecurring?.amount} /></label><label>Dompet<select name="walletId" defaultValue={editingRecurring?.walletId ?? ''}><option value="">Belum ditentukan</option>{state.wallets.filter((wallet) => !wallet.isArchived).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label><label>Frekuensi<select name="frequency" defaultValue={editingRecurring?.frequency ?? 'monthly'}><option value="monthly">Bulanan</option><option value="weekly">Mingguan</option><option value="yearly">Tahunan</option></select></label><label>Jadwal berikutnya<input name="nextDueDate" type="date" required defaultValue={editingRecurring?.nextDueDate ?? formatISO(addMonths(new Date(), 1), { representation: 'date' })} /></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">Simpan jadwal</button></form>
      </Modal>
      <Modal open={form === 'goal'} title={editingGoal ? 'Edit tujuan' : 'Buat tujuan'} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitGoal}><label>Nama tujuan<input name="name" required placeholder="Contoh: Dana darurat" defaultValue={editingGoal?.name} /></label><label>Target dana<input name="targetAmount" inputMode="numeric" required placeholder="Rp0" defaultValue={editingGoal?.targetAmount} /></label><label>Dana saat ini<input name="currentAmount" inputMode="numeric" defaultValue={editingGoal?.currentAmount ?? 0} /></label><label>Target tanggal<input name="targetDate" type="date" required defaultValue={editingGoal?.targetDate ?? formatISO(addMonths(new Date(), 12), { representation: 'date' })} /></label><label>Rencana tabungan per bulan<input name="monthlyContribution" inputMode="numeric" required placeholder="Rp0" defaultValue={editingGoal?.monthlyContribution} /></label><label>Prioritas<select name="priority" defaultValue={editingGoal?.priority ?? 'high'}><option value="high">Tinggi</option><option value="medium">Sedang</option><option value="low">Rendah</option></select></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">Simpan tujuan</button></form>
      </Modal>
      <Modal open={form === 'debt'} title={editingDebt ? 'Edit utang atau paylater' : 'Tambah utang atau paylater'} onClose={closeForm}>
        <form className="form-stack" onSubmit={submitDebt}><label>Nama<input name="name" required placeholder="Contoh: Paylater belanja" defaultValue={editingDebt?.name} /></label><label>Pemberi pinjaman<input name="lender" placeholder="Opsional" defaultValue={editingDebt?.lender} /></label><label>Jenis<select name="type" defaultValue={editingDebt?.type ?? 'paylater'}><option value="paylater">Paylater</option><option value="credit_card">Kartu kredit</option><option value="installment">Cicilan</option><option value="personal_loan">Pinjaman pribadi</option><option value="other">Lainnya</option></select></label><label>Jumlah awal<input name="originalAmount" inputMode="numeric" required placeholder="Rp0" defaultValue={editingDebt?.originalAmount} /></label><label>Sisa utang<input name="remainingBalance" inputMode="numeric" placeholder="Jika kosong, sama dengan jumlah awal" defaultValue={editingDebt?.remainingBalance} /></label><label>Cicilan per bulan<input name="installmentAmount" inputMode="numeric" required placeholder="Rp0" defaultValue={editingDebt?.installmentAmount} /></label><label>Minimum pembayaran<input name="minimumPayment" inputMode="numeric" placeholder="Rp0" defaultValue={editingDebt?.minimumPayment} /></label><label>Tanggal jatuh tempo<input name="dueDay" type="number" min="1" max="28" defaultValue={editingDebt?.dueDay ?? 1} required /></label>{formError ? <p className="form-error">{formError}</p> : null}<button className="primary-button sticky-submit">Simpan utang</button></form>
      </Modal>
    </div>
  )
}

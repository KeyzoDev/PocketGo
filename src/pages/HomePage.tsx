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
import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { calculateForecast, calculateSafeToSpend, debtSummary, detectSmallSpendingLeak } from '../domain/calculations'
import { totalBalance } from '../domain/ledger'
import { formatCurrency } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { EmptyState } from '../components/EmptyState'
import { TransactionSheet } from '../components/TransactionSheet'

export function HomePage() {
  const { state } = useAppStore()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
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
          <button className="avatar-button" type="button" onClick={() => navigate('/more')} aria-label="Buka profil">
            {firstName ? firstName.charAt(0).toUpperCase() : 'P'}
          </button>
        </div>
        <div className="hero-heading">
          <p>Ringkasan hari ini</p>
          <h1>{firstName ? `Hai, ${firstName}` : 'Kejelasan uangmu'}</h1>
        </div>
        <div className="money-summary">
          <div>
            <span>Saldo total</span>
            <strong>{formatCurrency(balance)}</strong>
          </div>
          <div className="summary-divider" />
          <div>
            <span>Aman dibelanjakan</span>
            <strong className={safe.status}>{formatCurrency(safe.safeToday)}</strong>
            <small className={`status-pill ${safe.status}`}>
              {safe.status === 'safe' ? <Check size={14} /> : <CircleAlert size={14} />}
              {safe.status === 'safe' ? 'Aman' : safe.status === 'caution' ? 'Perlu hati-hati' : 'Berisiko'}
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
                    ? 'Uangmu diperkirakan cukup sampai gajian'
                    : 'Kewajiban lebih besar dari saldo tersedia'
                  : 'Tambahkan saldo untuk mulai menghitung'}
              </strong>
              <small>{safe.confidence === 'estimated' ? 'Perkiraan memakai akhir bulan' : 'Berdasarkan rencana yang tercatat'}</small>
            </div>
            <b>{safe.days}<small> hari</small></b>
          </div>
          <div className="forecast-timeline">
            {forecast.map((point, index) => (
              <div key={point.date}>
                <span>{index === 0 ? 'Hari ini' : format(parseISO(point.date), 'EEE', { locale: id })}</span>
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
            title="Mulai dari tempat uangmu disimpan"
            body="Tambahkan dompet pertama agar PocketGo dapat menghitung saldo dan uang yang aman dibelanjakan."
            action="Tambah dompet"
            onAction={() => navigate('/more')}
          />
        ) : (
          <>
            <section className="brief-section">
              <h2>Yang perlu diperhatikan</h2>
              <div className="brief-list">
                {nextRule ? (
                  <button type="button" onClick={() => navigate('/plan')}>
                    <span className="brief-icon amber"><ReceiptText size={20} /></span>
                    <span><strong>{nextRule.name}</strong><small>Jatuh tempo {format(parseISO(nextRule.nextDueDate), 'd MMM', { locale: id })}</small></span>
                    <b>{formatCurrency(nextRule.amount)}</b><ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate('/plan')}>
                    <span className="brief-icon amber"><ReceiptText size={20} /></span>
                    <span><strong>Belum ada tagihan terjadwal</strong><small>Catat agar forecast lebih akurat.</small></span>
                    <ChevronRight size={18} />
                  </button>
                )}
                {state.debts.length ? (
                  <button type="button" onClick={() => navigate('/plan')}>
                    <span className="brief-icon coral"><CircleAlert size={20} /></span>
                    <span>
                      <strong>{debt.status === 'risky' || debt.status === 'heavy' ? 'Tekanan cicilan perlu perhatian' : 'Cicilan masih terpantau'}</strong>
                      <small>{debt.ratio === null ? 'Catat pemasukan untuk melihat rasio utang.' : `${Math.round(debt.ratio)}% dari pemasukan bulan ini`}</small>
                    </span>
                    <b>{formatCurrency(debt.monthlyPayment)}</b><ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
            </section>

            <section className="brief-section">
              <div className="section-title-row"><h2>Tujuan</h2><button type="button" onClick={() => navigate('/plan')}>Lihat rencana <ChevronRight size={16} /></button></div>
              {topGoal ? (
                <button className="goal-row" type="button" onClick={() => navigate('/plan')}>
                  <span className="brief-icon sage"><GoalIcon size={20} /></span>
                  <span className="goal-copy">
                    <strong>{topGoal.name}</strong>
                    <small>Target {formatCurrency(topGoal.targetAmount)} · {format(parseISO(topGoal.targetDate), 'd MMM yyyy', { locale: id })}</small>
                    <i><em style={{ width: `${Math.min(100, (topGoal.currentAmount / topGoal.targetAmount) * 100)}%` }} /></i>
                  </span>
                  <b>{Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100)}%</b>
                </button>
              ) : (
                <div className="compact-empty"><GoalIcon size={20} /><span><strong>Belum ada tujuan</strong><small>Buat target dana darurat, pendidikan, kendaraan, atau kebutuhan lain.</small></span><button onClick={() => navigate('/plan')}>Buat</button></div>
              )}
            </section>

            <section className="brief-section">
              <h2>Saran hari ini</h2>
              <button className="advisor-row" type="button" onClick={() => leak ? navigate('/insight') : setAdding(true)}>
                <span className="brief-icon green"><Lightbulb size={20} /></span>
                <span>
                  <strong>{leak ? 'Pembelian kecil mulai terkumpul' : 'Catat transaksi harianmu'}</strong>
                  <small>{leak ? `${leak.count} transaksi kecil mencapai ${formatCurrency(leak.total)}.` : 'Data rutin membuat rencana dan peringatan lebih akurat.'}</small>
                </span>
                <ArrowRight size={18} />
              </button>
            </section>

            <section className="quick-add-section">
              <h2>Tambah transaksi</h2>
              <button className="quick-add-card" type="button" onClick={() => setAdding(true)}>
                <span><WalletCards size={21} /></span>
                <div><strong>Catat pergerakan uang</strong><small>Pengeluaran, pemasukan, atau transfer</small></div>
                <ArrowRight size={18} />
              </button>
            </section>

            <div className="privacy-note"><ShieldCheck size={16} /> Data lokal hanya tersimpan di perangkat ini.</div>
          </>
        )}
      </section>
      <TransactionSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

import { BarChart3, CircleAlert, PieChart as PieIcon, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { debtSummary, detectSmallSpendingLeak, monthlySummary } from '../domain/calculations'
import { analyticsTransactions } from '../domain/ledger'
import { formatCurrency } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { EmptyState } from '../components/EmptyState'

const colors = ['#0b2447', '#5f7c45', '#d79b2e', '#dd6258', '#7c8da5', '#9b8269']

export function InsightPage() {
  const { state } = useAppStore()
  const summary = useMemo(() => monthlySummary(state), [state])
  const debt = useMemo(() => debtSummary(state), [state])
  const leak = useMemo(() => detectSmallSpendingLeak(state), [state])
  const categories = useMemo(() => {
    const totals = new Map<string, number>()
    analyticsTransactions(state.transactions)
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const name = state.categories.find((category) => category.id === transaction.categoryId)?.name ?? 'Lainnya'
        totals.set(name, (totals.get(name) ?? 0) + transaction.amount)
      })
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [state.categories, state.transactions])
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      50 +
        (summary.net > 0 ? 15 : -15) +
        (debt.ratio === null ? 0 : debt.ratio < 20 ? 15 : debt.ratio > 50 ? -20 : -5) +
        (state.goals.length ? 10 : 0) +
        (leak ? -10 : 10),
    ),
  )

  return (
    <div className="standard-page page-width insight-page">
      <header className="page-header"><div><p>Pahami pola, ambil langkah</p><h1>Insight</h1></div></header>
      {state.transactions.length < 2 ? (
        <EmptyState icon={BarChart3} title="Insight belum terbuka" body="Tambahkan beberapa transaksi agar PocketGo dapat menjelaskan pola pengeluaranmu." />
      ) : (
        <>
          <section className="insight-summary">
            <div><span>Pemasukan bulan ini</span><strong className="positive">{formatCurrency(summary.income)}</strong></div>
            <div><span>Pengeluaran bulan ini</span><strong>{formatCurrency(summary.expense)}</strong></div>
            <div><span>Arus kas bersih</span><strong className={summary.net >= 0 ? 'positive' : 'danger-text'}>{formatCurrency(summary.net)}</strong></div>
          </section>

          <section className="insight-card chart-card">
            <div className="section-title-row"><div><h2>Uang paling banyak pergi ke mana?</h2><p>Transfer internal tidak dihitung sebagai pengeluaran.</p></div><PieIcon size={20} /></div>
            {categories.length ? (
              <div className="category-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={categories.slice(0, 6)} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} isAnimationActive={false}>{categories.slice(0, 6).map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">{categories.slice(0, 6).map((item, index) => <div key={item.name}><i style={{ background: colors[index % colors.length] }} /><span>{item.name}</span><b>{formatCurrency(item.value)}</b></div>)}</div>
              </div>
            ) : null}
          </section>

          <section className="insight-grid">
            <article className="insight-card health-card"><span className="brief-icon navy"><Sparkles size={20} /></span><div><span>Kesehatan finansial</span><strong>{healthScore}/100</strong><p>{healthScore >= 75 ? 'Dasar keuanganmu terlihat sehat. Pertahankan pencatatan dan dana cadangan.' : 'Fokus pada arus kas positif, utang, dan dana cadangan untuk meningkatkan skor.'}</p></div></article>
            <article className="insight-card"><span className={`brief-icon ${leak ? 'amber' : 'sage'}`}><CircleAlert size={20} /></span><div><span>Kebocoran kecil</span><strong>{leak ? formatCurrency(leak.total) : 'Belum terdeteksi'}</strong><p>{leak ? `${leak.count} pembelian kecil terkumpul. Periksa mana yang bisa dikurangi tanpa mengganggu kebutuhan.` : 'Belum ada pola pembelian kecil berulang yang cukup kuat.'}</p></div></article>
            <article className="insight-card"><span className="brief-icon coral"><BarChart3 size={20} /></span><div><span>Tekanan utang</span><strong>{debt.ratio === null ? 'Pemasukan belum cukup' : `${Math.round(debt.ratio)}%`}</strong><p>{debt.ratio === null ? 'Catat pemasukan untuk menghitung rasio cicilan.' : debt.ratio > 35 ? 'Tunda cicilan baru dan prioritaskan kewajiban terdekat.' : 'Cicilan masih dalam rentang yang dapat dipantau.'}</p></div></article>
          </section>
        </>
      )}
    </div>
  )
}

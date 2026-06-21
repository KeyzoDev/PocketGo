import { BarChart3, CircleAlert, PieChart as PieIcon, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { debtSummary, detectSmallSpendingLeak, monthlySummary } from '../domain/calculations'
import { analyticsTransactions } from '../domain/ledger'
import { formatCurrency } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { EmptyState } from '../components/EmptyState'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'

const colors = ['#0b2447', '#5f7c45', '#d79b2e', '#dd6258', '#7c8da5', '#9b8269']

export function InsightPage() {
  const { state } = useAppStore()
  const { t, locale, currency, countryCode, language } = useLocalization()
  const money = (value: number) => formatCurrency(value, currency, locale)
  const summary = useMemo(() => monthlySummary(state), [state])
  const debt = useMemo(() => debtSummary(state), [state])
  const leak = useMemo(() => detectSmallSpendingLeak(state), [state])
  const categories = useMemo(() => {
    const totals = new Map<string, number>()
    analyticsTransactions(state.transactions)
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const category = state.categories.find((item) => item.id === transaction.categoryId)
        const name = localizedCategoryName(category?.localizationKey, category?.name ?? (language === 'id-ID' ? 'Lainnya' : 'Other'), countryCode)
        totals.set(name, (totals.get(name) ?? 0) + transaction.amount)
      })
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [countryCode, language, state.categories, state.transactions])
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
      <header className="page-header"><div><p>{t('insight.eyebrow')}</p><h1>{t('insight.title')}</h1></div></header>
      {state.transactions.length < 2 ? (
        <EmptyState icon={BarChart3} title={t('insight.locked')} body={t('insight.lockedBody')} />
      ) : (
        <>
          <section className="insight-summary">
            <div><span>{t('insight.income')}</span><strong className="positive">{money(summary.income)}</strong></div>
            <div><span>{t('insight.expense')}</span><strong>{money(summary.expense)}</strong></div>
            <div><span>{t('insight.net')}</span><strong className={summary.net >= 0 ? 'positive' : 'danger-text'}>{money(summary.net)}</strong></div>
          </section>

          <section className="insight-card chart-card">
            <div className="section-title-row"><div><h2>{t('insight.where')}</h2><p>{t('insight.noTransfers')}</p></div><PieIcon size={20} /></div>
            {categories.length ? (
              <div className="category-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={categories.slice(0, 6)} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} isAnimationActive={false}>{categories.slice(0, 6).map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">{categories.slice(0, 6).map((item, index) => <div key={item.name}><i style={{ background: colors[index % colors.length] }} /><span>{item.name}</span><b>{money(item.value)}</b></div>)}</div>
              </div>
            ) : null}
          </section>

          <section className="insight-grid">
            <article className="insight-card health-card"><span className="brief-icon navy"><Sparkles size={20} /></span><div><span>{t('insight.health')}</span><strong>{healthScore}/100</strong><p>{language === 'id-ID' ? (healthScore >= 75 ? 'Dasar keuanganmu terlihat sehat. Pertahankan pencatatan dan dana cadangan.' : 'Fokus pada arus kas positif, utang, dan dana cadangan untuk meningkatkan skor.') : (healthScore >= 75 ? 'Your financial foundation looks healthy. Keep tracking and maintaining a cash buffer.' : 'Focus on positive cash flow, debt, and a cash buffer to improve your score.')}</p></div></article>
            <article className="insight-card"><span className={`brief-icon ${leak ? 'amber' : 'sage'}`}><CircleAlert size={20} /></span><div><span>{t('insight.leak')}</span><strong>{leak ? money(leak.total) : t('insight.notDetected')}</strong><p>{language === 'id-ID' ? (leak ? `${leak.count} pembelian kecil terkumpul. Periksa mana yang bisa dikurangi tanpa mengganggu kebutuhan.` : 'Belum ada pola pembelian kecil berulang yang cukup kuat.') : (leak ? `${leak.count} small purchases added up. Review what can be reduced without affecting essentials.` : 'No strong recurring small-purchase pattern has been detected.')}</p></div></article>
            <article className="insight-card"><span className="brief-icon coral"><BarChart3 size={20} /></span><div><span>{t('insight.debt')}</span><strong>{debt.ratio === null ? t('plan.unknown') : `${Math.round(debt.ratio)}%`}</strong><p>{language === 'id-ID' ? (debt.ratio === null ? 'Catat pemasukan untuk menghitung rasio cicilan.' : debt.ratio > 35 ? 'Tunda cicilan baru dan prioritaskan kewajiban terdekat.' : 'Cicilan masih dalam rentang yang dapat dipantau.') : (debt.ratio === null ? 'Add income to calculate your debt payment ratio.' : debt.ratio > 35 ? 'Delay new debt and prioritize your nearest payments.' : 'Debt payments remain within a trackable range.')}</p></div></article>
          </section>
        </>
      )}
    </div>
  )
}

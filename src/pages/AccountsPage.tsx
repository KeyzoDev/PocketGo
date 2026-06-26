import { ArrowLeft, ArrowLeftRight, ChevronRight, FileText, MoreHorizontal, Plus, ShieldCheck, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { walletBalances } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import type { Wallet } from '../types'
import { EmptyState } from '../components/EmptyState'

export function AccountsPage() {
  const { state } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const balances = useMemo(() => walletBalances(state.wallets, state.transactions), [state.wallets, state.transactions])
  const [selected, setSelected] = useState<Wallet | null>(null)
  const total = state.wallets.filter((wallet) => wallet.includeInTotal && !wallet.isArchived).reduce((sum, wallet) => sum + (balances[wallet.id] ?? wallet.startingBalance), 0)
  const activeWallets = state.wallets.filter((wallet) => !wallet.isArchived)
  const current = selected && activeWallets.find((wallet) => wallet.id === selected.id)
  const accountTransactions = current
    ? state.transactions.filter((transaction) => transaction.walletId === current.id).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)).slice(0, 6)
    : []

  if (current) {
    return (
      <div className="standard-page page-width accounts-page">
        <header className="mobile-titlebar">
          <button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label={t('feedback.back')}><ArrowLeft size={18} /></button>
          <div><h1>{current.name}</h1><p>•••• {current.id.slice(-4)}</p></div>
        </header>
        <section className="account-balance-card">
          <span>{t('accounts.available')}</span>
          <strong>{formatCurrency(balances[current.id] ?? current.startingBalance, current.currency || currency, locale)}</strong>
          <small>{t(`wallet.${current.type}` as Parameters<typeof t>[0])}</small>
        </section>
        <section className="account-actions">
          <button type="button"><ArrowLeftRight size={19} />{t('quick.transfer')}</button>
          <button type="button"><Plus size={19} />{t('quick.income')}</button>
          <button type="button"><FileText size={19} />Statements</button>
          <button type="button"><MoreHorizontal size={19} />{t('nav.more')}</button>
        </section>
        <section className="brief-section">
          <div className="section-title-row"><h2>{t('accounts.recent')}</h2></div>
          <div className="transaction-list">
            {accountTransactions.map((transaction) => (
              <article className="transaction-row" key={transaction.id}>
                <div className="transaction-main">
                  <span className={`transaction-icon ${transaction.transferGroupId ? 'transfer' : transaction.type === 'income' ? 'income' : 'expense'}`}><WalletCards size={18} /></span>
                  <span><strong>{transaction.merchant || transaction.note || t('transactions.thisTransaction')}</strong><small>{formatDate(transaction.transactionDate, locale)}</small></span>
                  <b className={transaction.type === 'income' || transaction.type === 'transfer_in' ? 'positive' : transaction.type === 'transfer_out' ? '' : 'negative'}>{transaction.type === 'income' || transaction.type === 'transfer_in' ? '+' : transaction.type === 'transfer_out' ? '' : '-'}{formatCurrency(transaction.amount, current.currency || currency, locale)}</b>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="standard-page page-width accounts-page">
      <header className="page-header"><div><p>{t('accounts.eyebrow')}</p><h1>{t('accounts.title')}</h1></div></header>
      <section className="account-balance-card">
        <span>{t('accounts.totalAssets')}</span>
        <strong>{formatCurrency(total, currency, locale)}</strong>
        <small>{t('settings.walletsBody')}</small>
      </section>
      {activeWallets.length === 0 ? (
        <EmptyState icon={WalletCards} title={t('settings.noWallet')} body={t('settings.noWalletBody')} />
      ) : (
        <section className="wallet-list account-card-list">
          <h2>{t('accounts.myAccounts')}</h2>
          {activeWallets.map((wallet) => (
            <article key={wallet.id}>
              <button className="wallet-main" type="button" onClick={() => setSelected(wallet)}>
                <i style={{ background: wallet.color }}><WalletCards size={19} /></i>
                <span><strong>{wallet.name}</strong><small>{t(`wallet.${wallet.type}` as Parameters<typeof t>[0])}</small></span>
                <b>{formatCurrency(balances[wallet.id] ?? wallet.startingBalance, wallet.currency || currency, locale)}</b>
                <ChevronRight size={17} />
              </button>
            </article>
          ))}
        </section>
      )}
      <aside className="security-card"><ShieldCheck size={20} /><span><strong>{t('settings.accountProtection')}</strong><small>{t('settings.privacyFirstBody')}</small></span></aside>
    </div>
  )
}

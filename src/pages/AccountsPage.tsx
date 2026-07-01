import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { totalBalance, transactionAmountInBase, walletBalances } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { convertCurrency } from '../lib/currency'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import type { Wallet } from '../types'
import { EmptyState } from '../components/EmptyState'
import { TransactionSheet, type EntryMode } from '../components/TransactionSheet'
import { PremiumIcon } from '../components/PremiumIcon'
import { categoryPremiumIcon } from '../lib/premiumIconMapping'

export function AccountsPage() {
  const { state } = useAppStore()
  const { t, locale, currency } = useLocalization()
  const navigate = useNavigate()
  const balances = useMemo(() => walletBalances(state.wallets, state.transactions), [state.wallets, state.transactions])
  const [selected, setSelected] = useState<Wallet | null>(null)
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null)
  const total = totalBalance(state)
  const activeWallets = state.wallets.filter((wallet) => !wallet.isArchived)
  const current = selected && activeWallets.find((wallet) => wallet.id === selected.id)
  const accountTransactions = current
    ? state.transactions.filter((transaction) => transaction.walletId === current.id).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)).slice(0, 6)
    : []
  const balanceInBase = (wallet: Wallet) => convertCurrency(balances[wallet.id] ?? wallet.startingBalance, wallet.currency || currency, currency, state.profile.usdToIdrRate)

  if (current) {
    return (
      <div className="standard-page page-width accounts-page">
        <header className="mobile-titlebar">
          <button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label={t('feedback.back')}><ArrowLeft size={18} /></button>
          <div><h1>{current.name}</h1><p>•••• {current.id.slice(-4)}</p></div>
        </header>
        <section className="account-balance-card">
          <span>{t('accounts.available')}</span>
          <strong>{formatCurrency(balanceInBase(current), currency, locale)}</strong>
          <small>{t(`wallet.${current.type}` as Parameters<typeof t>[0])}</small>
        </section>
        <section className="account-actions">
          <button type="button" onClick={() => setEntryMode('transfer')}><PremiumIcon name="transfer" variant="quickAction" tone="navy" size="lg" />{t('quick.transfer')}</button>
          <button type="button" onClick={() => setEntryMode('income')}><PremiumIcon name="income" variant="quickAction" tone="green" size="lg" />{t('quick.income')}</button>
          <button type="button" onClick={() => navigate('/transactions')}><PremiumIcon name="receipt" variant="quickAction" tone="blue" size="lg" />{t('accounts.statements')}</button>
          <button type="button" onClick={() => navigate('/more')}><PremiumIcon name="more" variant="quickAction" tone="gray" size="lg" />{t('nav.more')}</button>
        </section>
        <section className="brief-section">
          <div className="section-title-row"><h2>{t('accounts.recent')}</h2></div>
          <div className="transaction-list">
            {accountTransactions.map((transaction) => (
              <article className="transaction-row" key={transaction.id}>
                <div className="transaction-main">
                  <PremiumIcon
                    name={transaction.transferGroupId ? 'transfer' : transaction.type === 'income' ? categoryPremiumIcon(`${transaction.merchant ?? ''} ${state.categories.find((item) => item.id === transaction.categoryId)?.name ?? ''}`, 'income').name : categoryPremiumIcon(`${transaction.merchant ?? ''} ${state.categories.find((item) => item.id === transaction.categoryId)?.name ?? ''}`, 'expense').name}
                    variant="transaction"
                    tone={transaction.transferGroupId ? 'blue' : transaction.type === 'income' ? categoryPremiumIcon(`${transaction.merchant ?? ''} ${state.categories.find((item) => item.id === transaction.categoryId)?.name ?? ''}`, 'income').tone : categoryPremiumIcon(`${transaction.merchant ?? ''} ${state.categories.find((item) => item.id === transaction.categoryId)?.name ?? ''}`, 'expense').tone}
                    size="md"
                  />
                  <span><strong>{transaction.merchant || transaction.note || t('transactions.thisTransaction')}</strong><small>{formatDate(transaction.transactionDate, locale)}</small></span>
                  <b className={transaction.type === 'income' || transaction.type === 'transfer_in' ? 'positive' : transaction.type === 'transfer_out' ? '' : 'negative'}>{transaction.type === 'income' || transaction.type === 'transfer_in' ? '+' : transaction.type === 'transfer_out' ? '' : '-'}{formatCurrency(transactionAmountInBase(state, transaction), currency, locale)}</b>
                </div>
              </article>
            ))}
          </div>
        </section>
        <TransactionSheet
          key={entryMode ? `${entryMode}-${current.id}` : 'closed-account-entry'}
          open={Boolean(entryMode)}
          initialMode={entryMode ?? undefined}
          initialWalletId={current.id}
          onClose={() => setEntryMode(null)}
        />
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
        <EmptyState nativeIcon="wallet" nativeTone="green" title={t('settings.noWallet')} body={t('settings.noWalletBody')} />
      ) : (
        <section className="wallet-list account-card-list">
          <h2>{t('accounts.myAccounts')}</h2>
          {activeWallets.map((wallet) => (
            <article key={wallet.id}>
              <button className="wallet-main" type="button" onClick={() => setSelected(wallet)}>
                <PremiumIcon name="wallet" variant="settings" tone="green" size="md" />
                <span><strong>{wallet.name}</strong><small>{t(`wallet.${wallet.type}` as Parameters<typeof t>[0])}</small></span>
                <b>{formatCurrency(balanceInBase(wallet), currency, locale)}</b>
                <ChevronRight size={17} />
              </button>
            </article>
          ))}
        </section>
      )}
      <aside className="security-card"><PremiumIcon name="security" tone="green" variant="utility" size="xs" /><span><strong>{t('settings.accountProtection')}</strong><small>{t('settings.privacyFirstBody')}</small></span></aside>
    </div>
  )
}

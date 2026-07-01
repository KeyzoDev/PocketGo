import { Search, Trash2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isToday, isYesterday, parseISO } from 'date-fns'
import { EmptyState } from '../components/EmptyState'
import { TransactionSheet } from '../components/TransactionSheet'
import type { EntryMode } from '../components/TransactionSheet'
import { TransactionTypeChooser } from '../components/TransactionTypeChooser'
import { ProComingSoonModal } from '../components/ProComingSoonModal'
import { PremiumIcon } from '../components/PremiumIcon'
import { transactionAmountInBase } from '../domain/ledger'
import { formatCurrency, formatDate } from '../lib/format'
import { categoryPremiumIcon } from '../lib/premiumIconMapping'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'
import type { Transaction } from '../types'

function dateLabel(value: string, locale: string, today: string, yesterday: string) {
  const date = parseISO(value)
  if (isToday(date)) return today
  if (isYesterday(date)) return yesterday
  return formatDate(value, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function TransactionsPage() {
  const { state, removeTransaction } = useAppStore()
  const { t, locale, currency, language } = useLocalization()
  const categoryLocale = language === 'id-ID' ? 'ID' : 'GLOBAL'
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [walletId, setWalletId] = useState('all')
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [choosing, setChoosing] = useState(false)
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null)
  const [proComingSoonOpen, setProComingSoonOpen] = useState(false)

  const filtered = useMemo(() => {
    const seenTransfers = new Set<string>()
    return [...state.transactions]
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt))
      .filter((transaction) => {
        if (transaction.transferGroupId) {
          if (seenTransfers.has(transaction.transferGroupId)) return false
          seenTransfers.add(transaction.transferGroupId)
        }
        const rawCategory = state.categories.find((item) => item.id === transaction.categoryId)
        const category = localizedCategoryName(rawCategory?.localizationKey, rawCategory?.name ?? '', categoryLocale)
        const haystack = `${transaction.merchant ?? ''} ${transaction.note ?? ''} ${category}`.toLowerCase()
        const normalizedType = transaction.transferGroupId ? 'transfer' : transaction.type
        return (
          haystack.includes(query.toLowerCase()) &&
          (type === 'all' || normalizedType === type) &&
          (walletId === 'all' || transaction.walletId === walletId)
        )
      })
  }, [categoryLocale, query, state.categories, state.transactions, type, walletId])

  const groups = filtered.reduce<Record<string, Transaction[]>>((result, transaction) => {
    const group = result[transaction.transactionDate] ?? []
    group.push(transaction)
    result[transaction.transactionDate] = group
    return result
  }, {})

  async function remove(transaction: Transaction) {
    const label = transaction.transferGroupId ? t('transactions.transferPair') : t('transactions.thisTransaction')
    if (window.confirm(t('transactions.deleteConfirm', { item: label }))) {
      try {
        await removeTransaction(transaction.id)
      } catch (error) {
        window.alert(error instanceof Error ? error.message : t('transactions.deleteFailed'))
      }
    }
  }

  return (
    <div className="reference-page transactions-reference">
      <header className="reference-topbar">
        <div><h1>{t('transactions.title')}</h1><p>{t('transactions.history')}</p></div>
        <div className="topbar-actions">
          <button className="secondary-chip-button transaction-import-button" type="button" onClick={() => setProComingSoonOpen(true)}><Upload size={16} /> {t('import.short')}</button>
          <button className="circle-button" type="button" onClick={() => setChoosing(true)} aria-label={t('common.add')}>+</button>
        </div>
      </header>
      <div className="toolbar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('transactions.search')} /></label>
        <div className="reference-chip-row" aria-label={t('transactions.filterType')}>
          {[
            ['all', t('transactions.allTypes')],
            ['income', t('transactions.income')],
            ['expense', t('transactions.expense')],
            ['transfer', t('transactions.transfer')],
          ].map(([value, label]) => (
            <button key={value} className={type === value ? 'active' : ''} type="button" onClick={() => setType(value)}>{label}</button>
          ))}
          <select value={walletId} onChange={(event) => setWalletId(event.target.value)} aria-label={t('transactions.filterWallet')}>
            <option value="all">{t('transactions.allWallets')}</option>
            {state.wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
          </select>
        </div>
      </div>

      {state.transactions.length === 0 ? (
        <EmptyState nativeIcon="transactions" nativeTone="blue" title={t('transactions.emptyTitle')} body={t('transactions.emptyBody')} action={t('home.addTransaction')} onAction={() => setChoosing(true)} />
      ) : filtered.length === 0 ? (
        <EmptyState nativeIcon="search" nativeTone="gray" title={t('transactions.notFound')} body={t('transactions.notFoundBody')} />
      ) : (
        <div className="transaction-groups">
          {Object.entries(groups).map(([date, transactions]) => (
            <section key={date}>
              <h2>{dateLabel(date, locale, t('common.today'), t('common.yesterday'))}</h2>
              <div className="reference-list transaction-reference-list">
                {transactions?.map((transaction) => {
                  const isTransfer = Boolean(transaction.transferGroupId)
                  const rawCategory = state.categories.find((item) => item.id === transaction.categoryId)
                  const category = localizedCategoryName(rawCategory?.localizationKey, rawCategory?.name ?? '', categoryLocale)
                  const sourceWallet = state.wallets.find((wallet) => wallet.id === transaction.walletId)?.name
                  const destinationWallet = state.wallets.find((wallet) => wallet.id === transaction.relatedWalletId)?.name
                  const isIncome = transaction.type === 'income'
                  const isAdjustment = transaction.type === 'adjustment'
                  const typeIcon = isTransfer
                    ? { name: 'transfer', tone: 'blue' as const }
                    : isIncome
                      ? categoryPremiumIcon(`${transaction.merchant ?? ''} ${category}`, 'income')
                      : isAdjustment
                        ? { name: 'adjustment', tone: 'amber' as const }
                        : categoryPremiumIcon(`${transaction.merchant ?? ''} ${category}`, 'expense')
                  const displayAmount = transactionAmountInBase(state, transaction)
                  return (
                    <article key={transaction.id}>
                      <button type="button" onClick={() => setEditing(transaction)}>
                        <PremiumIcon name={typeIcon.name} tone={typeIcon.tone} variant="transaction" size="md" />
                        <span><strong>{isTransfer ? `${sourceWallet} → ${destinationWallet}` : transaction.merchant || category || t('transactions.balanceAdjustment')}</strong><small>{isTransfer ? t('transactions.internalTransfer') : `${category || t('common.system')} · ${sourceWallet ?? t('common.wallet')}`}</small></span>
                        <b className={isIncome || (isAdjustment && transaction.adjustmentDirection !== 'decrease') ? 'positive' : isTransfer ? '' : 'negative'}>
                          {isIncome || (isAdjustment && transaction.adjustmentDirection !== 'decrease') ? '+' : isTransfer ? '' : '-'}{formatCurrency(displayAmount, currency, locale)}
                        </b>
                      </button>
                      <button className="row-delete" type="button" aria-label={t('transactions.delete')} onClick={() => remove(transaction)}><Trash2 size={17} /></button>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <TransactionTypeChooser
        open={choosing}
        onClose={() => setChoosing(false)}
        onSelect={(mode) => {
          setChoosing(false)
          setEntryMode(mode)
        }}
      />
      <TransactionSheet key={entryMode ?? 'closed'} open={Boolean(entryMode)} initialMode={entryMode ?? undefined} onClose={() => setEntryMode(null)} />
      <TransactionSheet key={editing?.id ?? 'none'} open={Boolean(editing)} transaction={editing} onClose={() => setEditing(undefined)} />
      <ProComingSoonModal open={proComingSoonOpen} feature="import" onClose={() => setProComingSoonOpen(false)} />
    </div>
  )
}

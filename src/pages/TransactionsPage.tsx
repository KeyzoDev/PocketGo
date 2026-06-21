import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Search, SlidersHorizontal, Trash2, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { EmptyState } from '../components/EmptyState'
import { TransactionSheet } from '../components/TransactionSheet'
import { formatCurrency } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { Transaction } from '../types'

function dateLabel(value: string) {
  const date = parseISO(value)
  if (isToday(date)) return 'Hari ini'
  if (isYesterday(date)) return 'Kemarin'
  return format(date, 'EEEE, d MMMM yyyy', { locale: id })
}

export function TransactionsPage() {
  const { state, removeTransaction } = useAppStore()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [walletId, setWalletId] = useState('all')
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const seenTransfers = new Set<string>()
    return [...state.transactions]
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt))
      .filter((transaction) => {
        if (transaction.transferGroupId) {
          if (seenTransfers.has(transaction.transferGroupId)) return false
          seenTransfers.add(transaction.transferGroupId)
        }
        const category = state.categories.find((item) => item.id === transaction.categoryId)?.name ?? ''
        const haystack = `${transaction.merchant ?? ''} ${transaction.note ?? ''} ${category}`.toLowerCase()
        const normalizedType = transaction.transferGroupId ? 'transfer' : transaction.type
        return (
          haystack.includes(query.toLowerCase()) &&
          (type === 'all' || normalizedType === type) &&
          (walletId === 'all' || transaction.walletId === walletId)
        )
      })
  }, [query, state.categories, state.transactions, type, walletId])

  const groups = filtered.reduce<Record<string, Transaction[]>>((result, transaction) => {
    const group = result[transaction.transactionDate] ?? []
    group.push(transaction)
    result[transaction.transactionDate] = group
    return result
  }, {})

  async function remove(transaction: Transaction) {
    const label = transaction.transferGroupId ? 'transfer beserta kedua sisinya' : 'transaksi ini'
    if (window.confirm(`Hapus ${label}? Saldo akan dihitung ulang otomatis.`)) {
      try {
        await removeTransaction(transaction.id)
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Transaksi belum dapat dihapus.')
      }
    }
  }

  return (
    <div className="standard-page page-width">
      <header className="page-header">
        <div><p>Riwayat uangmu</p><h1>Transaksi</h1></div>
        <button className="primary-button small" type="button" onClick={() => setAdding(true)}>Tambah</button>
      </header>
      <div className="toolbar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari merchant, catatan, kategori" /></label>
        <div className="filter-row">
          <SlidersHorizontal size={17} />
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter jenis transaksi">
            <option value="all">Semua jenis</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Penyesuaian</option>
          </select>
          <select value={walletId} onChange={(event) => setWalletId(event.target.value)} aria-label="Filter dompet">
            <option value="all">Semua dompet</option>
            {state.wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
          </select>
        </div>
      </div>

      {state.transactions.length === 0 ? (
        <EmptyState icon={WalletCards} title="Belum ada transaksi" body="Tambahkan transaksi pertama dan PocketGo akan mulai menemukan pola uangmu." action="Tambah transaksi" onAction={() => setAdding(true)} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Transaksi tidak ditemukan" body="Coba ubah kata pencarian atau filter yang dipilih." />
      ) : (
        <div className="transaction-groups">
          {Object.entries(groups).map(([date, transactions]) => (
            <section key={date}>
              <h2>{dateLabel(date)}</h2>
              <div className="transaction-list">
                {transactions?.map((transaction) => {
                  const isTransfer = Boolean(transaction.transferGroupId)
                  const category = state.categories.find((item) => item.id === transaction.categoryId)?.name
                  const sourceWallet = state.wallets.find((wallet) => wallet.id === transaction.walletId)?.name
                  const destinationWallet = state.wallets.find((wallet) => wallet.id === transaction.relatedWalletId)?.name
                  const isIncome = transaction.type === 'income'
                  const isAdjustment = transaction.type === 'adjustment'
                  const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowDownLeft : ArrowUpRight
                  return (
                    <article key={transaction.id} className="transaction-row">
                      <button className="transaction-main" type="button" onClick={() => setEditing(transaction)}>
                        <span className={`transaction-icon ${isTransfer ? 'transfer' : isIncome ? 'income' : 'expense'}`}><Icon size={19} /></span>
                        <span><strong>{isTransfer ? `${sourceWallet} → ${destinationWallet}` : transaction.merchant || category || 'Penyesuaian saldo'}</strong><small>{isTransfer ? 'Transfer internal' : `${category ?? 'Sistem'} · ${sourceWallet ?? 'Dompet'}`}</small></span>
                        <b className={isIncome || (isAdjustment && transaction.adjustmentDirection !== 'decrease') ? 'positive' : isTransfer ? '' : 'negative'}>
                          {isIncome || (isAdjustment && transaction.adjustmentDirection !== 'decrease') ? '+' : isTransfer ? '' : '-'}{formatCurrency(transaction.amount)}
                        </b>
                      </button>
                      <button className="row-delete" type="button" aria-label="Hapus transaksi" onClick={() => remove(transaction)}><Trash2 size={17} /></button>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <TransactionSheet open={adding} onClose={() => setAdding(false)} />
      <TransactionSheet key={editing?.id ?? 'none'} open={Boolean(editing)} transaction={editing} onClose={() => setEditing(undefined)} />
    </div>
  )
}

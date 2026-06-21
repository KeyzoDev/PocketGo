import { useMemo, useState } from 'react'
import { ArrowDown, ArrowLeftRight, ArrowUp, SlidersHorizontal } from 'lucide-react'
import { formatISO } from 'date-fns'
import { Modal } from './Modal'
import { useAppStore } from '../store/useAppStore'
import { parseAmount } from '../lib/format'
import type { Transaction, TransactionType } from '../types'

type EntryMode = 'expense' | 'income' | 'transfer' | 'adjustment'

function modeFromTransaction(transaction?: Transaction): EntryMode {
  if (!transaction) return 'expense'
  if (transaction.transferGroupId) return 'transfer'
  return transaction.type as EntryMode
}

export function TransactionSheet({
  open,
  onClose,
  initialMode,
  transaction,
}: {
  open: boolean
  onClose: () => void
  initialMode?: EntryMode
  transaction?: Transaction
}) {
  const { state, createTransaction, createTransfer, editTransaction, editTransfer } = useAppStore()
  const initial = initialMode ?? modeFromTransaction(transaction)
  const pair = transaction?.transferGroupId
    ? state.transactions.find(
        (item) =>
          item.transferGroupId === transaction.transferGroupId && item.id !== transaction.id,
      )
    : undefined
  const source = transaction?.type === 'transfer_out' ? transaction : pair
  const destination = transaction?.type === 'transfer_in' ? transaction : pair

  const [mode, setMode] = useState<EntryMode>(initial)
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [walletId, setWalletId] = useState(transaction?.walletId ?? state.wallets[0]?.id ?? '')
  const [destinationWalletId, setDestinationWalletId] = useState(
    destination?.walletId ?? state.wallets[1]?.id ?? '',
  )
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [date, setDate] = useState(
    transaction?.transactionDate ?? formatISO(new Date(), { representation: 'date' }),
  )
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [adjustmentDirection, setAdjustmentDirection] = useState<'increase' | 'decrease'>(
    transaction?.adjustmentDirection ?? 'increase',
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const activeWallets = state.wallets.filter((wallet) => !wallet.isArchived)
  const categories = useMemo(
    () =>
      state.categories.filter(
        (category) =>
          !category.isArchived &&
          category.type === (mode === 'income' ? 'income' : 'expense'),
      ),
    [mode, state.categories],
  )

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const numericAmount = parseAmount(amount)
    try {
      if (mode === 'transfer') {
        const input = {
          sourceWalletId: source?.walletId ?? walletId,
          destinationWalletId,
          amount: numericAmount,
          transactionDate: date,
          note: note || undefined,
        }
        if (transaction?.transferGroupId) await editTransfer(transaction.transferGroupId, input)
        else await createTransfer(input)
      } else {
        const input = {
          walletId,
          categoryId:
            mode === 'adjustment'
              ? state.categories.find((category) => category.id === 'system_adjustment')?.id
              : categoryId,
          type: mode as TransactionType,
          amount: numericAmount,
          adjustmentDirection: mode === 'adjustment' ? adjustmentDirection : undefined,
          transactionDate: date,
          merchant: merchant || undefined,
          note: note || undefined,
        }
        if (transaction) await editTransaction(transaction.id, input)
        else await createTransaction(input)
      }
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Transaksi belum dapat disimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={transaction ? 'Edit transaksi' : 'Tambah transaksi'} onClose={onClose}>
      {activeWallets.length === 0 ? (
        <div className="inline-notice danger">
          Tambahkan dompet terlebih dahulu agar transaksi punya sumber saldo.
        </div>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          <div className="segmented-control" aria-label="Jenis transaksi">
            {([
              ['expense', ArrowUp, 'Pengeluaran'],
              ['income', ArrowDown, 'Pemasukan'],
              ['transfer', ArrowLeftRight, 'Transfer'],
              ['adjustment', SlidersHorizontal, 'Sesuaikan'],
            ] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                className={mode === value ? 'active' : ''}
                disabled={Boolean(transaction)}
                onClick={() => {
                  setMode(value)
                  setCategoryId('')
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <label className="amount-field">
            <span>Jumlah</span>
            <div><small>Rp</small><input autoFocus inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></div>
          </label>

          {mode === 'transfer' ? (
            <div className="form-grid">
              <label>Dompet asal
                <select value={source?.walletId ?? walletId} onChange={(event) => setWalletId(event.target.value)} disabled={Boolean(source)}>
                  <option value="">Pilih dompet</option>
                  {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
              <label>Dompet tujuan
                <select value={destinationWalletId} onChange={(event) => setDestinationWalletId(event.target.value)}>
                  <option value="">Pilih dompet</option>
                  {activeWallets.filter((wallet) => wallet.id !== (source?.walletId ?? walletId)).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <>
              <label>Dompet
                <select value={walletId} onChange={(event) => setWalletId(event.target.value)} required>
                  <option value="">Pilih dompet</option>
                  {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
              {mode === 'adjustment' ? (
                <label>Arah penyesuaian
                  <select value={adjustmentDirection} onChange={(event) => setAdjustmentDirection(event.target.value as 'increase' | 'decrease')}>
                    <option value="increase">Tambah saldo</option>
                    <option value="decrease">Kurangi saldo</option>
                  </select>
                </label>
              ) : (
                <fieldset className="category-fieldset">
                  <legend>Kategori</legend>
                  <div className="chip-list">
                    {categories.map((category) => (
                      <button key={category.id} type="button" className={categoryId === category.id ? 'chip active' : 'chip'} onClick={() => setCategoryId(category.id)}>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}

          <label>Tanggal
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          {mode !== 'transfer' && mode !== 'adjustment' ? (
            <label>Merchant <span className="optional">opsional</span>
              <input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="Contoh: Warung dekat kantor" />
            </label>
          ) : null}
          <label>Catatan <span className="optional">opsional</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tambahkan konteks singkat" rows={2} />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button sticky-submit" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan transaksi'}</button>
        </form>
      )}
    </Modal>
  )
}

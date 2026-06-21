import { useMemo, useState } from 'react'
import { ArrowDown, ArrowLeftRight, ArrowUp, SlidersHorizontal } from 'lucide-react'
import { formatISO } from 'date-fns'
import { Modal } from './Modal'
import { useAppStore } from '../store/useAppStore'
import { parseAmount } from '../lib/format'
import { currencySymbol } from '../lib/format'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'
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
  const { t, locale, currency, countryCode } = useLocalization()
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
    const numericAmount = parseAmount(amount, locale)
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
      setError(caught instanceof Error ? caught.message : t('entry.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={transaction ? t('entry.editTitle') : t('entry.addTitle')} onClose={onClose}>
      {activeWallets.length === 0 ? (
        <div className="inline-notice danger">
          {t('entry.noWallet')}
        </div>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          {!transaction ? <div className="transaction-intro"><strong>{t('entry.addTitle')}</strong><small>{t('entry.choose')}</small></div> : null}
          <div className="segmented-control" aria-label={t('transactions.filterType')}>
            {([
              ['expense', ArrowUp, t('transactions.expense')],
              ['income', ArrowDown, t('transactions.income')],
              ['transfer', ArrowLeftRight, t('transactions.transfer')],
              ['adjustment', SlidersHorizontal, t('entry.adjustment')],
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
            <span>{t('entry.amount')}</span>
            <div><small>{currencySymbol(currency, locale)}</small><input autoFocus inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></div>
          </label>

          {mode === 'transfer' ? (
            <div className="form-grid">
              <label>{t('entry.sourceWallet')}
                <select value={source?.walletId ?? walletId} onChange={(event) => setWalletId(event.target.value)} disabled={Boolean(source)}>
                  <option value="">{t('entry.selectWallet')}</option>
                  {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
              <label>{t('entry.destinationWallet')}
                <select value={destinationWalletId} onChange={(event) => setDestinationWalletId(event.target.value)}>
                  <option value="">{t('entry.selectWallet')}</option>
                  {activeWallets.filter((wallet) => wallet.id !== (source?.walletId ?? walletId)).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <>
              <label>{t('entry.wallet')}
                <select value={walletId} onChange={(event) => setWalletId(event.target.value)} required>
                  <option value="">{t('entry.selectWallet')}</option>
                  {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
              {mode === 'adjustment' ? (
                <label>{t('entry.direction')}
                  <select value={adjustmentDirection} onChange={(event) => setAdjustmentDirection(event.target.value as 'increase' | 'decrease')}>
                    <option value="increase">{t('entry.increase')}</option>
                    <option value="decrease">{t('entry.decrease')}</option>
                  </select>
                </label>
              ) : (
                <fieldset className="category-fieldset">
                  <legend>{t('entry.category')}</legend>
                  <div className="chip-list">
                    {categories.map((category) => (
                      <button key={category.id} type="button" className={categoryId === category.id ? 'chip active' : 'chip'} onClick={() => setCategoryId(category.id)}>
                        {localizedCategoryName(category.localizationKey, category.name, countryCode)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}

          <label>{t('entry.date')}
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          {mode !== 'transfer' && mode !== 'adjustment' ? (
            <label>{t('entry.merchant')} <span className="optional">{t('common.optional')}</span>
              <input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder={t('entry.merchantPlaceholder')} />
            </label>
          ) : null}
          <label>{t('entry.note')} <span className="optional">{t('common.optional')}</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('entry.notePlaceholder')} rows={2} />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button sticky-submit" type="submit" disabled={saving}>{saving ? t('common.saving') : t('entry.save')}</button>
        </form>
      )}
    </Modal>
  )
}

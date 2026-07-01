import { useEffect, useMemo, useRef, useState } from 'react'
import { formatISO } from 'date-fns'
import { Modal } from './Modal'
import { ProComingSoonModal } from './ProComingSoonModal'
import { PremiumIcon, type PremiumIconTone } from './PremiumIcon'
import { useAppStore } from '../store/useAppStore'
import { currencySymbol, formatNumber, parseAmount } from '../lib/format'
import { categoryPremiumIcon } from '../lib/premiumIconMapping'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'
import type { Transaction, TransactionType } from '../types'

export type EntryMode = 'expense' | 'income' | 'transfer' | 'adjustment'

function modeFromTransaction(transaction?: Transaction): EntryMode {
  if (!transaction) return 'expense'
  if (transaction.transferGroupId) return 'transfer'
  return transaction.type as EntryMode
}

export function TransactionSheet({
  open,
  onClose,
  initialMode,
  initialWalletId,
  transaction,
}: {
  open: boolean
  onClose: () => void
  initialMode?: EntryMode
  initialWalletId?: string
  transaction?: Transaction
}) {
  const { state, createTransaction, createTransfer, editTransaction, editTransfer } = useAppStore()
  const { t, locale, currency, language } = useLocalization()
  const categoryLocale = language === 'id-ID' ? 'ID' : 'GLOBAL'
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
  const [walletId, setWalletId] = useState(transaction?.walletId ?? initialWalletId ?? state.wallets[0]?.id ?? '')
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
  const [hasChosenMode, setHasChosenMode] = useState(Boolean(initialMode || transaction))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedCelebration, setSavedCelebration] = useState(false)
  const [proComingSoon, setProComingSoon] = useState<'scan' | 'import' | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const activeWallets = state.wallets.filter((wallet) => !wallet.isArchived)
  const selectedWallet = activeWallets.find((wallet) => wallet.id === walletId)
  const selectedDestinationWallet = activeWallets.find((wallet) => wallet.id === destinationWalletId)
  const entryCurrency = selectedWallet?.currency ?? state.profile.currency
  const categories = useMemo(
    () => {
      const seen = new Set<string>()
      return state.categories.filter(
        (category) =>
          !category.isArchived &&
          category.type === (mode === 'income' ? 'income' : 'expense') &&
          !seen.has(`${category.type}:${category.localizationKey ?? category.name.trim().toLowerCase()}`) &&
          Boolean(seen.add(`${category.type}:${category.localizationKey ?? category.name.trim().toLowerCase()}`)),
      )
    },
    [mode, state.categories],
  )
  const savedTitle = language === 'id-ID' ? 'Transaksi tersimpan' : 'Transaction saved'
  const savedBody = language === 'id-ID'
    ? 'Saldo dan insight PocketGo sudah diperbarui.'
    : 'Your balance and PocketGo insights are now updated.'

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const numericAmount = parseAmount(amount, locale)
    try {
      if (!numericAmount || numericAmount <= 0) throw new Error(t('validation.transactionAmountRequired'))
      if (!walletId) throw new Error(t('validation.walletRequired'))
      if (mode === 'transfer') {
        if (!destinationWalletId) throw new Error(t('validation.walletRequired'))
        if (selectedWallet && selectedDestinationWallet && selectedWallet.currency !== selectedDestinationWallet.currency) {
          throw new Error(t('entry.crossCurrencyTransferUnsupported'))
        }
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
        if (mode !== 'adjustment' && !categoryId) throw new Error(t('validation.categoryRequired'))
        const input = {
          walletId,
          categoryId:
            mode === 'adjustment'
              ? state.categories.find((category) => category.id === 'system_adjustment')?.id
              : categoryId,
          type: mode as TransactionType,
          amount: numericAmount,
          currency: entryCurrency,
          adjustmentDirection: mode === 'adjustment' ? adjustmentDirection : undefined,
          transactionDate: date,
          merchant: merchant || undefined,
          note: note || undefined,
        }
        if (transaction) await editTransaction(transaction.id, input)
        else await createTransaction(input)
      }
      if (transaction) {
        onClose()
      } else {
        setSavedCelebration(true)
        closeTimerRef.current = window.setTimeout(() => {
          setSavedCelebration(false)
          onClose()
        }, 1000)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('entry.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Modal open={open} title={transaction ? t('entry.editTitle') : t('entry.addTitle')} onClose={onClose}>
      {activeWallets.length === 0 ? (
        <div className="inline-notice danger">
          {t('entry.noWallet')}
        </div>
      ) : (
        <form className="form-stack" noValidate onSubmit={submit}>
          {!hasChosenMode ? (
            <div className="transaction-type-list" aria-label={t('entry.choose')}>
              <p className="chooser-lead">{t('entry.choose')}</p>
              {([
                ['expense', 'expense', 'coral', t('transactions.expense'), t('entry.expenseHelp')],
                ['income', 'income', 'green', t('transactions.income'), t('entry.incomeHelp')],
                ['transfer', 'transfer', 'blue', t('transactions.transfer'), t('entry.transferHelp')],
                ['adjustment', 'adjustment', 'amber', t('entry.adjustment'), t('entry.adjustmentHelp')],
              ] as const).map(([value, iconName, tone, label, help]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value)
                    setCategoryId('')
                    setHasChosenMode(true)
                  }}
                >
                  <PremiumIcon name={iconName} variant="transaction" tone={tone as PremiumIconTone} size="md" />
                  <span><strong>{label}</strong><small>{help}</small></span>
                </button>
              ))}
              {!transaction ? (
                <div className="import-inline-actions">
                  <button type="button" onClick={() => setProComingSoon('scan')}><PremiumIcon name="scan" variant="utility" tone="purple" size="xs" /> {t('import.scanReceipt')}</button>
                  <button type="button" onClick={() => setProComingSoon('import')}><PremiumIcon name="import" variant="utility" tone="blue" size="xs" /> {t('import.uploadStatement')}</button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
          <div className="segmented-control" aria-label={t('transactions.filterType')}>
            {([
              ['expense', 'expense', 'coral', t('transactions.expense')],
              ['income', 'income', 'green', t('transactions.income')],
              ['transfer', 'transfer', 'blue', t('transactions.transfer')],
              ['adjustment', 'adjustment', 'amber', t('entry.adjustment')],
            ] as const).map(([value, iconName, tone, label]) => (
              <button
                key={value}
                type="button"
                className={`${value} ${mode === value ? 'active' : ''}`}
                disabled={Boolean(transaction)}
                onClick={() => {
                  setMode(value)
                  setCategoryId('')
                }}
              >
                <PremiumIcon name={iconName} variant="utility" tone={tone as PremiumIconTone} size="xs" active={mode === value} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <label className="amount-field">
            <span>{t('entry.amount')}</span>
            <div><small>{currencySymbol(entryCurrency || currency, locale)}</small><input autoFocus inputMode="numeric" value={amount ? formatNumber(parseAmount(amount, locale), locale, { maximumFractionDigits: 0 }) : ''} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} placeholder="0" /></div>
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
                <select value={walletId} onChange={(event) => setWalletId(event.target.value)}>
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
                      <button key={category.id} type="button" className={categoryId === category.id ? 'chip category-chip active' : 'chip category-chip'} onClick={() => setCategoryId(category.id)}>
                        <PremiumIcon {...categoryPremiumIcon(localizedCategoryName(category.localizationKey, category.name, categoryLocale), category.type === 'income' ? 'income' : 'expense')} variant="category" size="sm" active={categoryId === category.id} />
                        <span>{localizedCategoryName(category.localizationKey, category.name, categoryLocale)}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}

          <label>{t('entry.date')}
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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
            </>
          )}
        </form>
      )}
      {savedCelebration ? (
        <div className="save-success-pop" role="status" aria-live="polite">
          <div className="save-success-cube">
            <PremiumIcon name="check" variant="emptyState" tone="green" size="xl" />
          </div>
          <strong>{savedTitle}</strong>
          <p>{savedBody}</p>
        </div>
      ) : null}
    </Modal>
    <ProComingSoonModal open={Boolean(proComingSoon)} feature={proComingSoon ?? 'import'} onClose={() => setProComingSoon(null)} />
    </>
  )
}

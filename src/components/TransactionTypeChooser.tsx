import { ArrowDown, ArrowLeftRight, ArrowUp, SlidersHorizontal } from 'lucide-react'
import { useLocalization } from '../i18n'
import { Modal } from './Modal'
import type { EntryMode } from './TransactionSheet'

export function TransactionTypeChooser({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (mode: EntryMode) => void
}) {
  const { t } = useLocalization()
  const options = [
    { mode: 'expense', icon: ArrowDown, title: t('transactions.expense'), body: t('entry.expenseHelp') },
    { mode: 'income', icon: ArrowUp, title: t('transactions.income'), body: t('entry.incomeHelp') },
    { mode: 'transfer', icon: ArrowLeftRight, title: t('transactions.transfer'), body: t('entry.transferHelp') },
    { mode: 'adjustment', icon: SlidersHorizontal, title: t('entry.adjustment'), body: t('entry.adjustmentHelp') },
  ] as const

  return (
    <Modal open={open} title={t('entry.addTitle')} onClose={onClose}>
      <p className="chooser-lead">{t('entry.choose')}</p>
      <div className="transaction-type-list">
        {options.map(({ mode, icon: Icon, title, body }) => (
          <button key={mode} type="button" onClick={() => onSelect(mode)}>
            <span className={`transaction-type-icon ${mode}`}><Icon size={21} /></span>
            <span><strong>{title}</strong><small>{body}</small></span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

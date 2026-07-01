import { useLocalization } from '../i18n'
import { Modal } from './Modal'
import { PremiumIcon, type PremiumIconTone } from './PremiumIcon'
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
    { mode: 'expense', icon: 'expense', tone: 'coral', title: t('transactions.expense'), body: t('entry.expenseHelp') },
    { mode: 'income', icon: 'income', tone: 'green', title: t('transactions.income'), body: t('entry.incomeHelp') },
    { mode: 'transfer', icon: 'transfer', tone: 'blue', title: t('transactions.transfer'), body: t('entry.transferHelp') },
    { mode: 'adjustment', icon: 'adjustment', tone: 'amber', title: t('entry.adjustment'), body: t('entry.adjustmentHelp') },
  ] as const

  return (
    <Modal open={open} title={t('entry.addTitle')} onClose={onClose}>
      <p className="chooser-lead">{t('entry.choose')}</p>
      <div className="transaction-type-list">
        {options.map(({ mode, icon, tone, title, body }) => (
          <button key={mode} type="button" onClick={() => onSelect(mode)}>
            <PremiumIcon name={icon} variant="transaction" tone={tone as PremiumIconTone} size="md" />
            <span><strong>{title}</strong><small>{body}</small></span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

import type { LucideIcon } from 'lucide-react'
import { PremiumIcon, type PremiumIconTone } from './PremiumIcon'

export function EmptyState({
  icon: Icon,
  nativeIcon,
  nativeTone = 'gray',
  title,
  body,
  action,
  onAction,
}: {
  icon?: LucideIcon
  nativeIcon?: string
  nativeTone?: PremiumIconTone
  title: string
  body: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="empty-state">
      {nativeIcon ? (
        <PremiumIcon name={nativeIcon} tone={nativeTone} variant="emptyState" size="xl" />
      ) : Icon ? (
        <span className="empty-icon"><Icon size={22} /></span>
      ) : null}
      <h3>{title}</h3>
      <p>{body}</p>
      {action && onAction ? (
        <button className="secondary-button" type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  )
}

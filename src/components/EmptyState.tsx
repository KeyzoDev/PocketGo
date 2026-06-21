import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={22} /></span>
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

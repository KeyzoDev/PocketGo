import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useLocalization } from '../i18n'

let activeScrollLocks = 0
let previousBodyOverflow = ''
let previousHtmlOverflow = ''
let previousBodyPosition = ''
let previousBodyHeight = ''
let previousBodyTouchAction = ''
let previousHtmlHeight = ''

function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (activeScrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow
    previousBodyPosition = document.body.style.position
    previousBodyHeight = document.body.style.height
    previousBodyTouchAction = document.body.style.touchAction
    previousHtmlHeight = document.documentElement.style.height
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }
  activeScrollLocks += 1
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  activeScrollLocks = Math.max(0, activeScrollLocks - 1)
  if (activeScrollLocks > 0) return
  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overflow = previousHtmlOverflow
  document.body.style.position = previousBodyPosition
  document.body.style.height = previousBodyHeight
  document.body.style.touchAction = previousBodyTouchAction
  document.documentElement.style.height = previousHtmlHeight
}

export function Modal({
  open,
  title,
  children,
  onClose,
  closeLabel,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  closeLabel?: string
}) {
  const { t } = useLocalization()
  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label={closeLabel ?? t('common.close')}>
            <X size={20} />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}

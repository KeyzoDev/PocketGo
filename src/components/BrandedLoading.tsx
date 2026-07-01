import { useEffect, useState } from 'react'
import { useLocalization } from '../i18n'

interface BrandedLoadingProps {
  variant?: 'dark' | 'light'
}

export function BrandedLoading({ variant = 'light' }: BrandedLoadingProps) {
  const { t } = useLocalization()
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 9000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main className={`branded-loading ${variant}`} role="status" aria-live="polite">
      <section>
        <span className="branded-loading-logo"><img src="/pocketgo-icon.png" alt="" /></span>
        <strong>{t('common.loadingTitle')}</strong>
        <span className="branded-loading-line" />
        {slow ? (
          <button type="button" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </button>
        ) : <small>{t('common.loadingHelp')}</small>}
      </section>
    </main>
  )
}

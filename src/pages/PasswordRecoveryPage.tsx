import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'

export function PasswordRecoveryPage() {
  const { updatePassword, syncing } = useAppStore()
  const { t } = useLocalization()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError(t('recovery.mismatch'))
      return
    }
    try {
      await updatePassword(password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('recovery.failed'))
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-hero-icon"><KeyRound size={26} /></span>
        <p className="eyebrow">{t('recovery.eyebrow')}</p>
        <h1>{t('recovery.title')}</h1>
        <p className="auth-lead">{t('recovery.lead')}</p>
        <form className="form-stack" onSubmit={submit}>
          <label>{t('recovery.password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></label>
          <label>{t('recovery.confirm')}<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button" disabled={syncing}>{syncing ? t('common.saving') : t('recovery.update')}</button>
        </form>
      </section>
    </main>
  )
}

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function PasswordRecoveryPage() {
  const { updatePassword, syncing } = useAppStore()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Konfirmasi kata sandi tidak sama.')
      return
    }
    try {
      await updatePassword(password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kata sandi belum dapat diperbarui.')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-hero-icon"><KeyRound size={26} /></span>
        <p className="eyebrow">Pemulihan akun</p>
        <h1>Buat kata sandi baru</h1>
        <p className="auth-lead">Gunakan minimal 8 karakter dan jangan pakai ulang kata sandi lama.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>Kata sandi baru<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></label>
          <label>Konfirmasi kata sandi<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button" disabled={syncing}>{syncing ? 'Menyimpan...' : 'Perbarui kata sandi'}</button>
        </form>
      </section>
    </main>
  )
}

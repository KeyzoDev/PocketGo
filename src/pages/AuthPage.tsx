import { useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

type Mode = 'login' | 'signup' | 'forgot'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (authError) throw authError
        setMessage(
          data.session
            ? 'Akun berhasil dibuat.'
            : 'Periksa email untuk mengonfirmasi akun, lalu kembali ke PocketGo.',
        )
      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (authError) throw authError
        setMessage('Tautan pemulihan kata sandi telah dikirim.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Autentikasi gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="onboarding-brand">
          <img className="brand-icon" src="/pocketgo-icon.png" alt="" />
          <div><strong>PocketGo</strong><small>Track Your Money</small></div>
        </div>
        <span className="auth-hero-icon"><LockKeyhole size={26} /></span>
        <p className="eyebrow">Keuangan pribadi, tetap pribadi</p>
        <h1>{mode === 'login' ? 'Masuk ke uangmu' : mode === 'signup' ? 'Buat akun PocketGo' : 'Pulihkan akses'}</h1>
        <p className="auth-lead">Data setiap akun dipisahkan dengan Supabase Row Level Security.</p>
        <form className="form-stack" onSubmit={submit}>
          <div className="segmented-control auth-tabs">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Masuk</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Daftar</button>
            <button type="button" className={mode === 'forgot' ? 'active' : ''} onClick={() => setMode('forgot')}>Lupa sandi</button>
          </div>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          {mode !== 'forgot' ? <label>Kata sandi<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="inline-message" role="status">{message}</p> : null}
          <button className="primary-button" disabled={loading}>{loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : mode === 'signup' ? 'Buat akun' : 'Kirim tautan'}</button>
        </form>
        <p className="auth-trust"><ShieldCheck size={15} /> PocketGo tidak meminta akses rekening bank.</p>
        <div className="auth-legal-links"><Link to="/privacy">Privasi</Link><Link to="/terms">Ketentuan</Link></div>
      </section>
    </main>
  )
}

import { useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocalization } from '../i18n'
import { supabase } from '../lib/supabase'
import type { SupportedLocale } from '../types'

type Mode = 'login' | 'signup' | 'forgot'

export function AuthPage() {
  const { t, language, selectLanguage, countryCode, currency, locale } = useLocalization()
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
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              preferred_language: language,
              locale,
              country_code: countryCode,
              currency,
            },
          },
        })
        if (authError) throw authError
        setMessage(data.session ? t('auth.created') : t('auth.confirmEmail'))
      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (authError) throw authError
        setMessage(t('auth.recoverySent'))
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('auth.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <label className="auth-language">{t('auth.language')}
          <select value={language} onChange={(event) => selectLanguage(event.target.value as SupportedLocale)}>
            <option value="id-ID">ID</option>
            <option value="en-US">EN</option>
          </select>
        </label>
        <div className="onboarding-brand">
          <img className="brand-icon" src="/pocketgo-icon.png" alt="" />
          <div><strong>PocketGo</strong><small>Track Your Money</small></div>
        </div>
        <span className="auth-hero-icon"><LockKeyhole size={26} /></span>
        <p className="eyebrow">{t('auth.eyebrow')}</p>
        <h1>{mode === 'login' ? t('auth.loginTitle') : mode === 'signup' ? t('auth.signupTitle') : t('auth.forgotTitle')}</h1>
        <p className="auth-lead">{t('auth.lead')}</p>
        <p className="auth-security">{t('auth.security')}</p>
        <form className="form-stack" onSubmit={submit}>
          <div className="segmented-control auth-tabs">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{t('auth.login')}</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>{t('auth.signup')}</button>
            <button type="button" className={mode === 'forgot' ? 'active' : ''} onClick={() => setMode('forgot')}>{t('auth.forgot')}</button>
          </div>
          <label>{t('auth.email')}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          {mode !== 'forgot' ? <label>{t('auth.password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="inline-message" role="status">{message}</p> : null}
          <button className="primary-button" disabled={loading}>{loading ? t('common.processing') : mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.createAccount') : t('auth.sendLink')}</button>
        </form>
        <p className="auth-trust"><ShieldCheck size={15} /> {t('auth.bankAccess')}</p>
        <div className="auth-legal-links"><Link to="/privacy">{t('auth.privacy')}</Link><Link to="/terms">{t('auth.terms')}</Link></div>
      </section>
    </main>
  )
}

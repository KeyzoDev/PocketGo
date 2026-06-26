import { useEffect, useMemo, useState } from 'react'
import { Globe2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useLocalization } from '../i18n'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import type { CountryCode, SupportedLocale } from '../types'
import { regions } from '../i18n/regions'

type Mode = 'splash' | 'login' | 'signup' | 'forgot' | 'language'
type SocialLoading = 'google' | null

function getRequestedMode(search: string): Mode | null {
  const requested = new URLSearchParams(search).get('auth')
  if (requested === 'login' || requested === 'signup' || requested === 'forgot' || requested === 'language') return requested
  return null
}

export function AuthPage() {
  const { t, language, countryCode, currency, locale, setPreferences } = useLocalization()
  const { startDemo } = useAppStore()
  const location = useLocation()
  const initialMode = useMemo(() => getRequestedMode(location.search) ?? 'splash', [location.search])
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<SocialLoading>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const requested = getRequestedMode(location.search)
    if (requested) setMode(requested)
  }, [location.search])

  useEffect(() => {
    if (mode !== 'splash') return undefined
    const timer = window.setTimeout(() => setMode('login'), 1450)
    return () => window.clearTimeout(timer)
  }, [mode])

  function showAppleSoon() {
    setError('')
    setMessage(t('auth.appleSoon'))
  }

  async function signInWithGoogle() {
    setSocialLoading('google')
    setError('')
    setMessage('')
    try {
      if (!supabase) {
        setError(t('auth.googleUnavailable'))
        return
      }
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError
    } catch {
      setError(t('auth.googleUnavailable'))
      setSocialLoading(null)
    }
  }

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
              full_name: fullName,
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
    } catch {
      setError(t('auth.failed'))
    } finally {
      setLoading(false)
    }
  }

  function submitLanguage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const preferredLanguage = data.get('language') as SupportedLocale
    const nextCountry = data.get('countryCode') as CountryCode
    const nextCurrency = String(data.get('currency'))
    setPreferences({
      language: preferredLanguage,
      locale: regions[nextCountry].locale,
      countryCode: nextCountry,
      currency: nextCurrency,
    })
    setMode('login')
  }

  const title = mode === 'login' ? t('auth.loginTitle') : mode === 'signup' ? t('auth.signupTitle') : mode === 'language' ? t('onboarding.regionTitle') : t('auth.forgotTitle')
  const lead = mode === 'language' ? t('onboarding.regionLead') : mode === 'login' ? t('auth.lead') : mode === 'signup' ? t('onboarding.start') : t('auth.lead')

  if (mode === 'splash') {
    return (
      <main className="auth-splash-screen">
        <div className="splash-logo-panel">
          <span className="splash-logo-orb"><img src="/pocketgo-icon.png" alt="PocketGo" /></span>
          <h1>PocketGo</h1>
          <p>{t('auth.welcomeSubtitle')}</p>
          <span className="splash-loader" aria-label={t('common.loading')} />
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button className="auth-language-button" type="button" onClick={() => setMode('language')}>{language === 'id-ID' ? 'ID' : 'EN'} ▾</button>
        <div className="onboarding-brand">
          <img className="brand-icon" src="/pocketgo-icon.png" alt="" />
          <div><strong>PocketGo</strong><small>Track Your Money</small></div>
        </div>
        <span className="auth-hero-icon">{mode === 'language' ? <Globe2 size={26} /> : <LockKeyhole size={26} />}</span>
        <p className="eyebrow">{t('auth.eyebrow')}</p>
        <h1>{title}</h1>
        <p className="auth-lead">{lead}</p>
        {mode !== 'language' ? <p className="auth-security">{t('auth.security')}</p> : null}

        {mode === 'language' ? (
          <form className="form-stack" onSubmit={submitLanguage}>
            <label>{t('onboarding.language')}<select name="language" defaultValue={language}><option value="en-US">{t('language.en-US')}</option><option value="id-ID">{t('language.id-ID')}</option></select></label>
            <label>{t('onboarding.region')}<select name="countryCode" defaultValue={countryCode}><option value="GLOBAL">{t('region.GLOBAL')}</option><option value="US">{t('region.US')}</option><option value="ID">{t('region.ID')}</option></select></label>
            <label>{t('onboarding.currency')}<select name="currency" defaultValue={currency}><option value="USD">{t('currency.USD')}</option><option value="IDR">{t('currency.IDR')}</option><option value="MYR">{t('currency.MYR')}</option><option value="SGD">{t('currency.SGD')}</option></select></label>
            <button className="primary-button">{t('common.next')}</button>
          </form>
        ) : (
        <form className="form-stack" onSubmit={submit}>
          {mode === 'signup' ? <label>{t('settings.name')}<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder={t('settings.namePlaceholder')} /></label> : null}
          <label>{t('auth.email')}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          {mode !== 'forgot' ? <label>{t('auth.password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label> : null}
          {mode === 'login' ? <div className="auth-row"><label className="remember-row"><input type="checkbox" /> {t('auth.remember')}</label><button className="text-button" type="button" onClick={() => setMode('forgot')}>{t('auth.forgot')}?</button></div> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="inline-message" role="status">{message}</p> : null}
          <button className="primary-button" disabled={loading}>{loading ? t('common.processing') : mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.createAccount') : t('auth.sendLink')}</button>
          {mode === 'login' ? (
            <>
              <div className="auth-divider"><span>{t('auth.orContinue')}</span></div>
              <button className="social-button" type="button" disabled={socialLoading === 'google'} onClick={signInWithGoogle}>
                <span><img src="/google-g.svg" alt="" /></span><b>{socialLoading === 'google' ? t('auth.googleLoading') : t('auth.google')}</b>
              </button>
              <button className="social-button soon" type="button" disabled onClick={showAppleSoon}>
                <span></span><b>{t('auth.apple')}</b><small>{t('auth.comingSoon')}</small>
              </button>
            </>
          ) : null}
          {mode === 'login' ? <button className="secondary-button" type="button" onClick={startDemo}>{t('demo.try')}</button> : null}
          {mode === 'login' ? <p className="auth-helper-copy">{t('auth.helper')}</p> : null}
          <p className="auth-switch">
            {mode === 'signup' ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
            <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? t('auth.login') : t('auth.signup')}</button>
          </p>
          {mode === 'forgot' ? <button className="text-button" type="button" onClick={() => setMode('login')}>{t('feedback.back')}</button> : null}
        </form>
        )}
        <p className="auth-trust"><ShieldCheck size={15} /> {t('auth.bankAccess')}</p>
        <div className="auth-legal-links"><Link to="/privacy">{t('auth.privacy')}</Link><Link to="/terms">{t('auth.terms')}</Link></div>
      </section>
    </main>
  )
}

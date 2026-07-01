import { useEffect, useMemo, useRef, useState } from 'react'
import { Globe2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { translateMessage, useLocalization } from '../i18n'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import type { CountryCode, SupportedLocale } from '../types'

type Mode = 'splash' | 'login' | 'signup' | 'forgot' | 'language'
type SocialLoading = 'google' | null
const googleOAuthDisabled = import.meta.env.VITE_DISABLE_GOOGLE_OAUTH === 'true'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [draftLanguage, setDraftLanguage] = useState<SupportedLocale>(language)
  const [draftCountry, setDraftCountry] = useState<CountryCode>(countryCode)
  const [draftCurrency, setDraftCurrency] = useState(currency)
  const oauthFallbackRef = useRef<number | null>(null)
  const lt = (key: Parameters<typeof t>[0], variables?: Record<string, string | number>) =>
    translateMessage(draftLanguage, key, variables)

  useEffect(() => {
    const requested = getRequestedMode(location.search)
    if (requested) {
      setMode(requested)
      if (requested === 'language') {
        setDraftLanguage(language)
        setDraftCountry(countryCode)
        setDraftCurrency(currency)
      }
    }
  }, [countryCode, currency, language, location.search])

  useEffect(() => {
    if (mode !== 'splash') return undefined
    const timer = window.setTimeout(() => setMode('login'), 1450)
    return () => window.clearTimeout(timer)
  }, [mode])

  useEffect(() => () => {
    if (oauthFallbackRef.current) window.clearTimeout(oauthFallbackRef.current)
  }, [])

  function startDemoWithCurrentLocale() {
    startDemo({ language, locale, countryCode, currency })
  }

  function showAppleSoon() {
    setError('')
    setMessage(t('auth.appleSoon'))
  }

  async function signInWithGoogle() {
    if (socialLoading === 'google') return
    if (googleOAuthDisabled) {
      setMessage('')
      setError(t('auth.googleUnavailable'))
      return
    }
    setSocialLoading('google')
    setError('')
    setMessage('')
    if (oauthFallbackRef.current) window.clearTimeout(oauthFallbackRef.current)
    oauthFallbackRef.current = window.setTimeout(() => {
      setSocialLoading(null)
      setError(t('auth.googleUnavailable'))
    }, 8000)
    try {
      if (!supabase) {
        setError(t('auth.googleUnavailable'))
        setSocialLoading(null)
        if (oauthFallbackRef.current) window.clearTimeout(oauthFallbackRef.current)
        return
      }
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) {
        if (oauthFallbackRef.current) window.clearTimeout(oauthFallbackRef.current)
        throw authError
      }
    } catch {
      setError(t('auth.googleUnavailable'))
      setSocialLoading(null)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) return
    const nextErrors: Record<string, string> = {}
    if ((mode === 'signup') && !fullName.trim()) nextErrors.fullName = t('validation.nameRequired')
    if (!email.trim()) nextErrors.email = t('validation.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = t('validation.emailInvalid')
    if (mode !== 'forgot' && !password) nextErrors.password = t('validation.passwordRequired')
    if (mode === 'signup' && password && password.length < 8) nextErrors.password = t('validation.passwordMin')
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setError('')
      setMessage('')
      return
    }
    setFieldErrors({})
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
    setPreferences({
      language: draftLanguage,
      locale: draftLanguage,
      countryCode: draftCountry,
      currency: draftCurrency,
    })
    setMode('login')
  }

  const copy = mode === 'language' ? lt : t
  const title = mode === 'login' ? t('auth.loginTitle') : mode === 'signup' ? t('auth.signupTitle') : mode === 'language' ? lt('onboarding.regionTitle') : t('auth.forgotTitle')
  const lead = mode === 'language' ? lt('onboarding.regionLead') : mode === 'login' ? t('auth.lead') : mode === 'signup' ? t('onboarding.start') : t('auth.lead')

  if (mode === 'splash') {
    return (
      <main className="auth-splash-screen">
        <div className="splash-logo-panel">
          <span className="splash-logo-orb"><img src="/pocketgo-icon.png" alt="PocketGo" /></span>
          <strong className="splash-brand-name">PocketGo</strong>
          <h1>{t('common.loadingTitle')}</h1>
          <p>{t('common.loadingHelp')}</p>
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
        <p className="eyebrow">{copy('auth.eyebrow')}</p>
        <h1>{title}</h1>
        <p className="auth-lead">{lead}</p>
        {mode !== 'language' ? <p className="auth-security">{t('auth.security')}</p> : null}

        {mode === 'language' ? (
          <form className="form-stack" noValidate onSubmit={submitLanguage}>
            <label>{lt('onboarding.language')}<select name="language" value={draftLanguage} aria-label={lt('onboarding.language')} onChange={(event) => {
              const nextLanguage = event.target.value as SupportedLocale
              setDraftLanguage(nextLanguage)
              if (nextLanguage === 'id-ID') {
                setDraftCountry('ID')
                setDraftCurrency('IDR')
              } else {
                setDraftCountry('GLOBAL')
                setDraftCurrency('USD')
              }
            }}><option value="en-US">{lt('language.en-US')}</option><option value="id-ID">{lt('language.id-ID')}</option></select></label>
            <label>{lt('onboarding.region')}<select name="countryCode" value={draftCountry} aria-label={lt('onboarding.region')} onChange={(event) => setDraftCountry(event.target.value as CountryCode)}><option value="GLOBAL">{lt('region.GLOBAL')}</option><option value="US">{lt('region.US')}</option><option value="ID">{lt('region.ID')}</option></select></label>
            <label>{lt('onboarding.currency')}<select name="currency" value={draftCurrency} aria-label={lt('onboarding.currency')} onChange={(event) => setDraftCurrency(event.target.value)}><option value="USD">{lt('currency.USD')}</option><option value="IDR">{lt('currency.IDR')}</option><option value="MYR">{lt('currency.MYR')}</option><option value="SGD">{lt('currency.SGD')}</option></select></label>
            <button className="primary-button" type="submit">{lt('common.next')}</button>
          </form>
        ) : (
        <form className="form-stack" noValidate onSubmit={submit}>
          {mode === 'signup' ? <label>{t('settings.name')}<input value={fullName} onChange={(event) => { setFullName(event.target.value); setFieldErrors((current) => ({ ...current, fullName: '' })) }} autoComplete="name" placeholder={t('settings.namePlaceholder')} aria-invalid={Boolean(fieldErrors.fullName)} />{fieldErrors.fullName ? <small className="field-error">{fieldErrors.fullName}</small> : null}</label> : null}
          <label>{t('auth.email')}<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })) }} autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email ? <small className="field-error">{fieldErrors.email}</small> : null}</label>
          {mode !== 'forgot' ? <label>{t('auth.password')}<input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: '' })) }} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} aria-invalid={Boolean(fieldErrors.password)} />{fieldErrors.password ? <small className="field-error">{fieldErrors.password}</small> : null}</label> : null}
          {mode === 'login' ? <div className="auth-row"><label className="remember-row"><input type="checkbox" /> {t('auth.remember')}</label><button className="text-button" type="button" onClick={() => setMode('forgot')}>{t('auth.forgot')}?</button></div> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="inline-message" role="status">{message}</p> : null}
          <button className="primary-button" disabled={loading}>{loading ? t('common.processing') : mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.createAccount') : t('auth.sendLink')}</button>
          {mode === 'login' || mode === 'signup' ? (
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
          {mode === 'login' ? <button className="secondary-button" type="button" onClick={startDemoWithCurrentLocale}>{t('demo.try')}</button> : null}
          {mode === 'login' ? <p className="auth-helper-copy">{t('auth.helper')}</p> : null}
          <p className="auth-switch">
            {mode === 'signup' ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
            <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? t('auth.login') : t('auth.signup')}</button>
          </p>
          {mode === 'forgot' ? <button className="text-button" type="button" onClick={() => setMode('login')}>{t('feedback.back')}</button> : null}
        </form>
        )}
        <p className="auth-trust"><ShieldCheck size={15} /> {copy('auth.bankAccess')}</p>
        <div className="auth-legal-links"><Link to="/privacy">{copy('auth.privacy')}</Link><Link to="/terms">{copy('auth.terms')}</Link></div>
      </section>
    </main>
  )
}

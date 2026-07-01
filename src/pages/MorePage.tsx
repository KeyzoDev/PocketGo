import {
  ChevronRight,
  Plus,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createId } from '../lib/id'
import { formatCurrency, formatDate, formatNumber, parseAmount } from '../lib/format'
import { walletBalances } from '../domain/ledger'
import { needsAppStateCurrencyConversion } from '../domain/currencyConversion'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { AuthPanel } from '../components/AuthPanel'
import { ProComingSoonModal } from '../components/ProComingSoonModal'
import { PremiumIcon } from '../components/PremiumIcon'
import type { CountryCode, SupportedLocale, Wallet, WalletType } from '../types'
import { translateMessage, useLocalization, type LocalePreferences } from '../i18n'
import { FALLBACK_USD_TO_IDR_RATE, convertCurrency, fetchUsdToIdrRate, safeUsdToIdrRate } from '../lib/currency'

export function MorePage() {
  const { state, saveProfile, saveWallet, reset, isCloudMode, syncing, syncError } = useAppStore()
  const { t, language, locale, countryCode, currency, setPreferences } = useLocalization()
  const [walletForm, setWalletForm] = useState(false)
  const [profileForm, setProfileForm] = useState(false)
  const [languageRegionForm, setLanguageRegionForm] = useState(false)
  const [currencyForm, setCurrencyForm] = useState(false)
  const [proComingSoonFeature, setProComingSoonFeature] = useState<'import' | 'scan' | 'export' | null>(null)
  const [editingWallet, setEditingWallet] = useState<Wallet | undefined>()
  const [rateInput, setRateInput] = useState(String(state.profile.usdToIdrRate ?? FALLBACK_USD_TO_IDR_RATE))
  const [rateSource, setRateSource] = useState(state.profile.exchangeRateSource ?? 'fallback')
  const [rateStatus, setRateStatus] = useState<{ type: 'updated' | 'fallback'; rate?: number; date?: string } | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [draftLanguage, setDraftLanguage] = useState<SupportedLocale>(language)
  const [draftCountry, setDraftCountry] = useState<CountryCode>(countryCode)
  const [draftCurrency, setDraftCurrency] = useState(currency)
  const [localizationError, setLocalizationError] = useState('')
  const [pendingLocalization, setPendingLocalization] = useState<{
    profile: typeof state.profile
    preferences: LocalePreferences
  } | null>(null)
  const balances = useMemo(() => walletBalances(state.wallets, state.transactions), [state.wallets, state.transactions])
  const hasFinancialData = state.wallets.length > 0 || state.transactions.length > 0 || state.budgets.length > 0 || state.goals.length > 0 || state.recurringRules.length > 0 || state.debts.length > 0
  const balanceInBase = (wallet: Wallet) => convertCurrency(balances[wallet.id] ?? wallet.startingBalance, wallet.currency || currency, currency, state.profile.usdToIdrRate)
  const draftLocale = draftLanguage
  const lt = (key: Parameters<typeof t>[0], variables?: Record<string, string | number>) =>
    translateMessage(draftLanguage, key, variables)
  const rateCopy = rateStatus
    ? rateStatus.type === 'updated'
      ? lt('settings.exchangeRateUpdated', {
        rate: formatCurrency(rateStatus.rate ?? safeUsdToIdrRate(parseAmount(rateInput, draftLocale)), 'IDR', draftLocale),
        date: rateStatus.date ?? lt('common.today'),
      })
      : lt('settings.exchangeRateFallback')
    : lt('settings.exchangeRateHelp')

  async function submitWallet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const wallet: Wallet = {
      id: editingWallet?.id ?? createId('wallet'),
      name: String(data.get('name')),
      type: data.get('type') as WalletType,
      startingBalance: editingWallet?.startingBalance ?? parseAmount(String(data.get('startingBalance')), locale),
      currency: state.profile.currency,
      includeInTotal: data.get('includeInTotal') === 'on',
      isArchived: editingWallet?.isArchived ?? false,
      color: String(data.get('color')),
      createdAt: editingWallet?.createdAt ?? new Date().toISOString(),
    }
    try {
      await saveWallet(wallet)
      setWalletForm(false)
      setEditingWallet(undefined)
    } catch {
      // Store exposes the sync error in the form.
    }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await saveProfile({
        ...state.profile,
        fullName: String(data.get('fullName')),
        incomePattern: data.get('incomePattern') as typeof state.profile.incomePattern,
        defaultIncomeDay: Number(data.get('defaultIncomeDay')) || undefined,
      })
      setProfileForm(false)
    } catch {
      // Store exposes the sync error in the form.
    }
  }

  async function persistLocalization(nextProfile: typeof state.profile, nextPreferences: LocalePreferences) {
    try {
      await saveProfile(nextProfile)
      setPreferences(nextPreferences)
      setLanguageRegionForm(false)
      setCurrencyForm(false)
      setPendingLocalization(null)
    } catch (caught) {
      setLocalizationError(caught instanceof Error ? caught.message : t('settings.localizationSaveFailed'))
    }
  }

  async function submitLanguageRegion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalizationError('')
    const preferredLanguage = draftLanguage
    const nextCountry = draftCountry
    const nextLocale = preferredLanguage
    const nextPreferences = { language: preferredLanguage, locale: nextLocale, countryCode: nextCountry, currency: state.profile.currency }
    const nextProfile = {
      ...state.profile,
      preferredLanguage,
      locale: nextLocale,
      countryCode: nextCountry,
    }
    await persistLocalization(nextProfile, nextPreferences)
  }

  async function submitCurrency(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalizationError('')
    const data = new FormData(event.currentTarget)
    const nextCurrency = draftCurrency
    const nextRateSource = data.get('exchangeRateSource') as typeof state.profile.exchangeRateSource
    const nextRate = safeUsdToIdrRate(parseAmount(String(data.get('usdToIdrRate')), locale))
    const currencyConversionNeeded = needsAppStateCurrencyConversion(state, nextCurrency)
    const nextPreferences = { language, locale, countryCode, currency: nextCurrency }
    const nextProfile = {
      ...state.profile,
      currency: nextCurrency,
      usdToIdrRate: nextRate,
      exchangeRateSource: nextRateSource,
      exchangeRateUpdatedAt: nextRateSource === 'manual' ? new Date().toISOString() : state.profile.exchangeRateUpdatedAt,
    }
    if (currencyConversionNeeded && hasFinancialData) {
      setPendingLocalization({ profile: nextProfile, preferences: nextPreferences })
      setCurrencyForm(false)
      return
    }
    await persistLocalization(nextProfile, nextPreferences)
  }

  async function refreshRate() {
    setRateLoading(true)
    setRateStatus(null)
    try {
      const result = await fetchUsdToIdrRate()
      setRateInput(String(Math.round(result.rate)))
      setRateSource('realtime')
      setRateStatus({ type: 'updated', rate: result.rate, date: result.date })
    } catch {
      setRateInput(String(FALLBACK_USD_TO_IDR_RATE))
      setRateSource('fallback')
      setRateStatus({ type: 'fallback' })
    } finally {
      setRateLoading(false)
    }
  }

  useEffect(() => {
    if (!languageRegionForm) return
    setDraftLanguage(language)
    setDraftCountry(countryCode)
    setLocalizationError('')
  }, [languageRegionForm, language, countryCode])

  useEffect(() => {
    if (!currencyForm) return
    setDraftCurrency(currency)
    setDraftLanguage(language)
    setRateInput(String(state.profile.usdToIdrRate ?? FALLBACK_USD_TO_IDR_RATE))
    setRateSource(state.profile.exchangeRateSource ?? 'fallback')
    setRateStatus(null)
    setLocalizationError('')
    if (state.profile.exchangeRateSource !== 'manual') {
      void refreshRate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyForm])

  return (
    <div className="standard-page page-width more-page ios-settings-page">
      <header className="page-header ios-settings-header"><div><p>{t('settings.eyebrow')}</p><h1>{t('settings.title')}</h1></div></header>

      <section className="settings-profile-card ios-profile-card">
        <div className="settings-profile-avatar"><img className="brand-icon" src="/pocketgo-icon.png" alt="" /></div>
        <div>
          <h2>{state.profile.fullName || 'PocketGo User'}</h2>
          <p>{t('settings.profileCardBody')}</p>
        </div>
        <button className="circle-button" type="button" onClick={() => setProfileForm(true)} aria-label={t('common.edit')}>
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="settings-section ios-settings-group">
        <h2>{t('settings.accountSync')}</h2>
        <div className="ios-settings-card auth-settings-card">
          <AuthPanel />
        </div>
      </section>

      <section className="settings-section ios-settings-group">
        <div className="section-title-row ios-section-title-row">
          <div>
            <h2>{t('settings.wallets')}</h2>
            <p>{t('settings.walletsBody')}</p>
          </div>
          <button type="button" onClick={() => { setEditingWallet(undefined); setWalletForm(true) }}><Plus size={16} /> {t('common.add')}</button>
        </div>
        {state.wallets.length === 0 ? (
          <div className="compact-empty">
            <PremiumIcon name="wallet" variant="settings" tone="green" />
            <span><strong>{t('settings.noWallet')}</strong><small>{t('settings.noWalletBody')}</small></span>
            <button type="button" onClick={() => setWalletForm(true)}>{t('settings.addWallet')}</button>
          </div>
        ) : (
          <div className="wallet-list ios-settings-card ios-wallet-list">
            {state.wallets.map((wallet) => (
              <article key={wallet.id} className={wallet.isArchived ? 'archived' : ''}>
                <PremiumIcon name="wallet" variant="settings" tone="green" />
                <span>
                  <strong>{wallet.name}</strong>
                  <small>{t(`wallet.${wallet.type}` as Parameters<typeof t>[0])}{wallet.isArchived ? ` · ${t('settings.archived')}` : ''}</small>
                </span>
                <b>{formatCurrency(balanceInBase(wallet), currency, locale)}</b>
                <button type="button" aria-label={`${t('common.edit')} ${wallet.name}`} onClick={() => { setEditingWallet(wallet); setWalletForm(true) }}>
                  <ChevronRight size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="settings-section ios-settings-group">
        <h2>{t('settings.settings')}</h2>
        <div className="settings-list ios-settings-card">
          <button type="button" onClick={() => setLanguageRegionForm(true)}><PremiumIcon name="language" variant="settings" tone="blue" /><span><strong>{t('settings.languageRegion')}</strong><small>{t('settings.languageRegionBody', { language: t(`language.${language}` as Parameters<typeof t>[0]), region: t(`region.${countryCode}` as Parameters<typeof t>[0]) })}</small></span><ChevronRight size={18} /></button>
          <button type="button" onClick={() => setCurrencyForm(true)}><PremiumIcon name="currency" variant="settings" tone="green" /><span><strong>{t('settings.currency')}</strong><small>{currency} · {t('settings.exchangeRateShort', { rate: formatNumber(safeUsdToIdrRate(state.profile.usdToIdrRate), locale) })}</small></span><ChevronRight size={18} /></button>
          <button type="button" onClick={() => setProfileForm(true)}><PremiumIcon name="profile" variant="settings" tone="blue" /><span><strong>{t('settings.profileIncome')}</strong><small>{state.profile.fullName || t('common.notSet')}</small></span><ChevronRight size={18} /></button>
          <div className="static-setting"><PremiumIcon name="category" variant="settings" tone="purple" /><span><strong>{t('settings.categories')}</strong><small>{t('settings.categoryCount', { count: state.categories.filter((category) => !category.isArchived).length })}</small></span></div>
          <button type="button" onClick={() => setProComingSoonFeature('import')}><PremiumIcon name="import" variant="settings" tone="blue" /><span><span className="setting-title-with-badge"><strong>{t('settings.importData')}</strong><span className="pro-mini-badge">Pro</span></span><small>{t('settings.importDataBody')}</small></span><ChevronRight size={18} /></button>
        </div>
      </section>

      <section className="settings-section ios-settings-group">
        <h2>{t('settings.dataPrivacy')}</h2>
        <div className="settings-list ios-settings-card">
          <button type="button" onClick={() => setProComingSoonFeature('export')}><PremiumIcon name="excel" variant="settings" tone="green" /><span><span className="setting-title-with-badge"><strong>{t('settings.export')}</strong><span className="pro-mini-badge">Pro</span></span><small>{t('settings.exportBody')}</small></span><ChevronRight size={18} /></button>
          <div className="static-setting"><PremiumIcon name="lock" variant="settings" tone="blue" /><span><strong>{t('settings.privacyFirst')}</strong><small>{t('settings.privacyFirstBody')}</small></span></div>
          <div className="static-setting"><PremiumIcon name="security" variant="settings" tone="green" /><span><strong>{t('settings.accountProtection')}</strong><small>{t('settings.accountProtectionBody')}</small></span></div>
          {!isCloudMode ? <button type="button" className="danger-action" onClick={() => { if (window.confirm(t('settings.resetConfirm'))) reset() }}><PremiumIcon name="cashback" variant="settings" tone="coral" /><span><strong>{t('settings.reset')}</strong><small>{t('settings.resetBody')}</small></span></button> : null}
        </div>
      </section>

      <section className="settings-section ios-settings-group">
        <h2>{t('settings.feedback')}</h2>
        <div className="settings-list ios-settings-card">
          <Link className="settings-link" to="/feedback" state={{ from: '/more' }}><PremiumIcon name="question" variant="settings" tone="amber" /><span><strong>{t('settings.feedbackTitle')}</strong><small>{t('settings.feedbackBody')}</small></span><ChevronRight size={18} /></Link>
        </div>
      </section>

      <footer className="app-footer"><img className="brand-icon" src="/pocketgo-icon.png" alt="" /><div><strong>PocketGo</strong><small>{t('settings.footer')}</small><span><Link to="/privacy">{t('settings.privacy')}</Link> · <Link to="/terms">{t('settings.terms')}</Link></span></div></footer>

      <Modal open={walletForm} title={editingWallet ? t('settings.editWallet') : t('settings.addWallet')} onClose={() => { setWalletForm(false); setEditingWallet(undefined) }}>
        <form className="form-stack" noValidate onSubmit={submitWallet}>
          <label>{t('settings.walletName')}<input name="name" defaultValue={editingWallet?.name} placeholder={t('onboarding.walletPlaceholder')} /></label>
          <label>{t('settings.walletType')}<select name="type" defaultValue={editingWallet?.type ?? 'bank'}><option value="cash">{t('wallet.cash')}</option><option value="bank">{t('wallet.bank')}</option><option value="ewallet">{t('wallet.ewallet')}</option><option value="credit_card">{t('wallet.credit_card')}</option><option value="paylater">{t('wallet.paylater')}</option><option value="savings">{t('wallet.savings')}</option><option value="investment">{t('wallet.investment')}</option><option value="business">{t('wallet.business')}</option><option value="loan">{t('wallet.loan')}</option><option value="other">{t('wallet.other')}</option></select></label>
          {!editingWallet ? <label>{t('settings.startingBalance')}<input name="startingBalance" inputMode="numeric" defaultValue="0" /></label> : <div className="inline-notice">{t('settings.startingBalanceLocked')}</div>}
          <label>{t('settings.color')}<select name="color" defaultValue={editingWallet?.color ?? '#0b2447'}><option value="#0b2447">Navy</option><option value="#5f7c45">Sage</option><option value="#d79b2e">Amber</option><option value="#7c5e8e">Purple</option><option value="#667085">Gray</option></select></label>
          <label className="checkbox-row"><input type="checkbox" name="includeInTotal" defaultChecked={editingWallet?.includeInTotal ?? true} /><span><strong>{t('settings.includeTotal')}</strong><small>{t('settings.includeTotalBody')}</small></span></label>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? t('common.saving') : t('settings.saveWallet')}</button>
        </form>
      </Modal>
      <Modal open={profileForm} title={t('settings.profileTitle')} onClose={() => setProfileForm(false)}>
        <form className="form-stack" noValidate onSubmit={submitProfile}><label>{t('settings.name')}<input name="fullName" defaultValue={state.profile.fullName} placeholder={t('settings.namePlaceholder')} /></label><label>{t('onboarding.incomePattern')}<select name="incomePattern" defaultValue={state.profile.incomePattern}><option value="monthly">{t('common.monthly')}</option><option value="twice_monthly">{t('onboarding.twiceMonthly')}</option><option value="weekly">{t('common.weekly')}</option><option value="daily">{t('common.daily')}</option><option value="irregular">{t('onboarding.irregular')}</option><option value="none">{t('onboarding.noIncome')}</option></select></label><label>{t('settings.incomeDate')}<input name="defaultIncomeDay" type="number" min="1" max="28" defaultValue={state.profile.defaultIncomeDay} placeholder="1–28" /></label>{syncError ? <p className="form-error">{syncError}</p> : null}<button className="primary-button sticky-submit" disabled={syncing}>{syncing ? t('common.saving') : t('settings.saveProfile')}</button></form>
      </Modal>
      <Modal open={languageRegionForm} title={lt('settings.localizationTitle')} closeLabel={lt('common.close')} onClose={() => setLanguageRegionForm(false)}>
        <form className="form-stack" noValidate onSubmit={submitLanguageRegion}>
          <label>{lt('onboarding.language')}<select name="language" value={draftLanguage} onChange={(event) => {
            const nextLanguage = event.target.value as SupportedLocale
            setDraftLanguage(nextLanguage)
            if (nextLanguage === 'id-ID') {
              setDraftCountry('ID')
            } else {
              setDraftCountry('GLOBAL')
            }
          }}><option value="id-ID">{lt('language.id-ID')}</option><option value="en-US">{lt('language.en-US')}</option></select></label>
          <label>{lt('onboarding.region')}<select name="countryCode" value={draftCountry} onChange={(event) => setDraftCountry(event.target.value as CountryCode)}><option value="ID">{lt('region.ID')}</option><option value="US">{lt('region.US')}</option><option value="GLOBAL">{lt('region.GLOBAL')}</option></select></label>
          <div className="locale-preview">
            <span>{lt('settings.datePreview')}</span><strong>{formatDate(new Date(), draftLocale, { dateStyle: 'long' })}</strong>
          </div>
          {localizationError ? <p className="form-error" role="alert">{localizationError}</p> : null}
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? lt('common.saving') : lt('common.save')}</button>
        </form>
      </Modal>
      <Modal open={currencyForm} title={lt('settings.currency')} closeLabel={lt('common.close')} onClose={() => setCurrencyForm(false)}>
        <form className="form-stack" noValidate onSubmit={submitCurrency}>
          <label>{lt('onboarding.currency')}<select name="currency" value={draftCurrency} onChange={(event) => setDraftCurrency(event.target.value)}><option value="IDR">{lt('currency.IDR')}</option><option value="USD">{lt('currency.USD')}</option><option value="EUR">{lt('currency.EUR')}</option><option value="SGD">{lt('currency.SGD')}</option><option value="MYR">{lt('currency.MYR')}</option><option value="JPY">{lt('currency.JPY')}</option><option value="AUD">{lt('currency.AUD')}</option></select></label>
          <div className="exchange-rate-card">
            <label>{lt('settings.exchangeRateSource')}<select name="exchangeRateSource" value={rateSource} onChange={(event) => setRateSource(event.target.value as typeof rateSource)}><option value="realtime">{lt('settings.exchangeRateRealtime')}</option><option value="manual">{lt('settings.exchangeRateManual')}</option><option value="fallback">{lt('settings.exchangeRateFallbackOption')}</option></select></label>
            <details className="advanced-settings">
              <summary>{lt('settings.exchangeAdvanced')}</summary>
              <label>{lt('settings.usdToIdrRate')}<input name="usdToIdrRate" inputMode="numeric" value={rateInput} onChange={(event) => { setRateInput(event.target.value.replace(/\D/g, '')); setRateSource('manual'); setRateStatus(null) }} /></label>
            </details>
            <button className="primary-button" type="button" onClick={refreshRate} disabled={rateLoading}>{rateLoading ? lt('common.loading') : lt('settings.updateExchangeRate')}</button>
            <small>{rateCopy}</small>
          </div>
          <div className="locale-preview">
            <span>{lt('settings.baseCurrency')}</span><strong>{draftCurrency}</strong>
            <span>{lt('settings.numberPreview')}</span><strong>{formatCurrency(draftCurrency === 'IDR' ? 12450750 : 12450.75, draftCurrency, draftLocale)}</strong>
            <span>{lt('settings.exchangeRateLabel')}</span><strong>{lt('settings.exchangeRateValue', { rate: formatNumber(safeUsdToIdrRate(parseAmount(rateInput, draftLocale)), draftLocale) })}</strong>
          </div>
          {localizationError ? <p className="form-error" role="alert">{localizationError}</p> : null}
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? lt('common.saving') : lt('common.save')}</button>
        </form>
      </Modal>
      <ProComingSoonModal open={Boolean(proComingSoonFeature)} feature={proComingSoonFeature ?? 'import'} onClose={() => setProComingSoonFeature(null)} />
      <Modal open={Boolean(pendingLocalization)} title={t('settings.currencyConfirmTitle')} onClose={() => setPendingLocalization(null)}>
        <div className="form-stack">
          <p className="modal-copy">{t('settings.currencyConfirmBody', {
            from: state.profile.currency,
            to: pendingLocalization?.profile.currency ?? currency,
          })}</p>
          <div className="inline-notice">
            {t('settings.currencyConfirmRate', { rate: formatCurrency(safeUsdToIdrRate(pendingLocalization?.profile.usdToIdrRate), 'IDR', locale) })}
          </div>
          {localizationError ? <p className="form-error" role="alert">{localizationError}</p> : null}
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={() => setPendingLocalization(null)}>{t('common.cancel')}</button>
            <button
              className="primary-button"
              type="button"
              disabled={syncing || !pendingLocalization}
              onClick={() => pendingLocalization && persistLocalization(pendingLocalization.profile, pendingLocalization.preferences)}
            >
              {syncing ? t('common.saving') : t('settings.currencyConfirmContinue')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

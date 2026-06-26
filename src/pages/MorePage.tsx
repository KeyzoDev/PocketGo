import {
  ChevronRight,
  Download,
  Globe2,
  LockKeyhole,
  MessageSquareText,
  Moon,
  RotateCcw,
  ShieldCheck,
  Tags,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createId } from '../lib/id'
import { formatCurrency, formatDate, formatNumber, parseAmount } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { AuthPanel } from '../components/AuthPanel'
import type { Wallet, WalletType } from '../types'
import type { CountryCode, SupportedLocale } from '../types'
import { useLocalization } from '../i18n'
import { regions } from '../i18n/regions'

export function MorePage() {
  const { state, saveProfile, saveWallet, reset, isCloudMode, syncing, syncError } = useAppStore()
  const { t, language, locale, countryCode, currency, setPreferences } = useLocalization()
  const [walletForm, setWalletForm] = useState(false)
  const [profileForm, setProfileForm] = useState(false)
  const [localizationForm, setLocalizationForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | undefined>()

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

  async function submitLocalization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const preferredLanguage = data.get('language') as SupportedLocale
    const nextCountry = data.get('countryCode') as CountryCode
    const nextCurrency = String(data.get('currency'))
    const nextLocale = regions[nextCountry].locale
    const next = { language: preferredLanguage, locale: nextLocale, countryCode: nextCountry, currency: nextCurrency }
    setPreferences(next)
    try {
      await saveProfile({
        ...state.profile,
        preferredLanguage,
        locale: nextLocale,
        countryCode: nextCountry,
        currency: nextCurrency,
      })
      setLocalizationForm(false)
    } catch {
      setPreferences({ language, locale, countryCode, currency })
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pocketgo-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="standard-page page-width more-page">
      <header className="page-header"><div><p>{t('settings.eyebrow')}</p><h1>{t('settings.title')}</h1></div></header>

      <section className="settings-section settings-profile-card">
        <div className="settings-profile-avatar"><img className="brand-icon" src="/pocketgo-icon.png" alt="" /></div>
        <div>
          <h2>{state.profile.fullName || 'PocketGo User'}</h2>
          <p>{language === 'id-ID' ? 'Pengaturan akun dan preferensi aplikasi.' : 'Manage your account and app preferences.'}</p>
        </div>
        <button className="circle-button" type="button" onClick={() => setProfileForm(true)} aria-label={t('common.edit')}>
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="settings-section">
        <h2>{t('settings.accountSync')}</h2>
        <AuthPanel />
      </section>

      <section className="settings-section">
        <h2>{t('settings.settings')}</h2>
        <div className="settings-list">
          <button type="button" onClick={() => setLocalizationForm(true)}><span className="brief-icon sage"><Globe2 size={19} /></span><span><strong>{t('settings.languageRegion')}</strong><small>{t('settings.languageRegionBody', { language: t(`language.${language}` as Parameters<typeof t>[0]), region: t(`region.${countryCode}` as Parameters<typeof t>[0]), currency })}</small></span><ChevronRight size={18} /></button>
          <button type="button" onClick={() => setProfileForm(true)}><span className="brief-icon navy"><UserRound size={19} /></span><span><strong>{t('settings.profileIncome')}</strong><small>{state.profile.fullName || t('common.notSet')}</small></span><ChevronRight size={18} /></button>
          <div className="static-setting"><span className="brief-icon sage"><Tags size={19} /></span><span><strong>{t('settings.categories')}</strong><small>{t('settings.categoryCount', { count: state.categories.filter((category) => !category.isArchived).length })}</small></span></div>
          <button type="button" disabled><span className="brief-icon navy"><Moon size={19} /></span><span><strong>{t('settings.darkMode')}</strong><small>{t('settings.nextVersion')}</small></span></button>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.dataPrivacy')}</h2>
        <div className="settings-list">
          <button type="button" onClick={exportData}><span className="brief-icon sage"><Download size={19} /></span><span><strong>{t('settings.export')}</strong><small>{t('settings.exportBody')}</small></span><ChevronRight size={18} /></button>
          <div className="static-setting"><span className="brief-icon navy"><LockKeyhole size={19} /></span><span><strong>{t('settings.privacyFirst')}</strong><small>{t('settings.privacyFirstBody')}</small></span></div>
          <div className="static-setting"><span className="brief-icon sage"><ShieldCheck size={19} /></span><span><strong>{t('settings.accountProtection')}</strong><small>{t('settings.accountProtectionBody')}</small></span></div>
          {!isCloudMode ? <button type="button" className="danger-action" onClick={() => { if (window.confirm(t('settings.resetConfirm'))) reset() }}><span className="brief-icon coral"><RotateCcw size={19} /></span><span><strong>{t('settings.reset')}</strong><small>{t('settings.resetBody')}</small></span></button> : null}
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.feedback')}</h2>
        <div className="settings-list">
          <Link className="settings-link" to="/feedback" state={{ from: '/more' }}><span className="brief-icon navy"><MessageSquareText size={19} /></span><span><strong>{t('settings.feedbackTitle')}</strong><small>{t('settings.feedbackBody')}</small></span><ChevronRight size={18} /></Link>
        </div>
      </section>

      <footer className="app-footer"><img className="brand-icon" src="/pocketgo-icon.png" alt="" /><div><strong>PocketGo</strong><small>{t('settings.footer')}</small><span><Link to="/privacy">{t('settings.privacy')}</Link> · <Link to="/terms">{t('settings.terms')}</Link></span></div></footer>

      <Modal open={walletForm} title={editingWallet ? t('settings.editWallet') : t('settings.addWallet')} onClose={() => { setWalletForm(false); setEditingWallet(undefined) }}>
        <form className="form-stack" onSubmit={submitWallet}>
          <label>{t('settings.walletName')}<input name="name" required defaultValue={editingWallet?.name} placeholder={t('onboarding.walletPlaceholder')} /></label>
          <label>{t('settings.walletType')}<select name="type" defaultValue={editingWallet?.type ?? 'bank'}><option value="cash">{t('wallet.cash')}</option><option value="bank">{t('wallet.bank')}</option><option value="ewallet">{t('wallet.ewallet')}</option><option value="credit_card">{t('wallet.credit_card')}</option><option value="paylater">{t('wallet.paylater')}</option><option value="savings">{t('wallet.savings')}</option><option value="investment">{t('wallet.investment')}</option><option value="business">{t('wallet.business')}</option><option value="loan">{t('wallet.loan')}</option><option value="other">{t('wallet.other')}</option></select></label>
          {!editingWallet ? <label>{t('settings.startingBalance')}<input name="startingBalance" inputMode="numeric" defaultValue="0" required /></label> : <div className="inline-notice">{t('settings.startingBalanceLocked')}</div>}
          <label>{t('settings.color')}<select name="color" defaultValue={editingWallet?.color ?? '#0b2447'}><option value="#0b2447">Navy</option><option value="#5f7c45">Sage</option><option value="#d79b2e">Amber</option><option value="#7c5e8e">Purple</option><option value="#667085">Gray</option></select></label>
          <label className="checkbox-row"><input type="checkbox" name="includeInTotal" defaultChecked={editingWallet?.includeInTotal ?? true} /><span><strong>{t('settings.includeTotal')}</strong><small>{t('settings.includeTotalBody')}</small></span></label>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? t('common.saving') : t('settings.saveWallet')}</button>
        </form>
      </Modal>
      <Modal open={profileForm} title={t('settings.profileTitle')} onClose={() => setProfileForm(false)}>
        <form className="form-stack" onSubmit={submitProfile}><label>{t('settings.name')}<input name="fullName" defaultValue={state.profile.fullName} placeholder={t('settings.namePlaceholder')} /></label><label>{t('onboarding.incomePattern')}<select name="incomePattern" defaultValue={state.profile.incomePattern}><option value="monthly">{t('common.monthly')}</option><option value="twice_monthly">{t('onboarding.twiceMonthly')}</option><option value="weekly">{t('common.weekly')}</option><option value="daily">{t('common.daily')}</option><option value="irregular">{t('onboarding.irregular')}</option><option value="none">{t('onboarding.noIncome')}</option></select></label><label>{t('settings.incomeDate')}<input name="defaultIncomeDay" type="number" min="1" max="28" defaultValue={state.profile.defaultIncomeDay} placeholder="1–28" /></label>{syncError ? <p className="form-error">{syncError}</p> : null}<button className="primary-button sticky-submit" disabled={syncing}>{syncing ? t('common.saving') : t('settings.saveProfile')}</button></form>
      </Modal>
      <Modal open={localizationForm} title={t('settings.localizationTitle')} onClose={() => setLocalizationForm(false)}>
        <form className="form-stack" onSubmit={submitLocalization}>
          <label>{t('onboarding.language')}<select name="language" defaultValue={language}><option value="id-ID">{t('language.id-ID')}</option><option value="en-US">{t('language.en-US')}</option></select></label>
          <label>{t('onboarding.region')}<select name="countryCode" defaultValue={countryCode}><option value="ID">{t('region.ID')}</option><option value="US">{t('region.US')}</option><option value="GLOBAL">{t('region.GLOBAL')}</option></select></label>
          <label>{t('onboarding.currency')}<select name="currency" defaultValue={currency}><option value="IDR">{t('currency.IDR')}</option><option value="USD">{t('currency.USD')}</option><option value="MYR">{t('currency.MYR')}</option><option value="SGD">{t('currency.SGD')}</option></select></label>
          <div className="locale-preview"><span>{t('settings.datePreview')}</span><strong>{formatDate(new Date(), locale, { dateStyle: 'long' })}</strong><span>{t('settings.numberPreview')}</span><strong>{formatCurrency(12450, currency, locale)} · {formatNumber(12450.75, locale)}</strong></div>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? t('common.saving') : t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}

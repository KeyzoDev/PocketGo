import { ArrowRight, Check, Globe2, ShieldCheck, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalization } from '../i18n'
import { regions } from '../i18n/regions'
import { createId } from '../lib/id'
import { currencySymbol, parseAmount } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { CountryCode, SupportedLocale, WalletType } from '../types'

export function OnboardingPage() {
  const { state, saveProfile, saveWallet, syncing, syncError } = useAppStore()
  const { t, language, locale, countryCode, currency, setPreferences } = useLocalization()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [need, setNeed] = useState('safe')
  const [incomePattern, setIncomePattern] = useState('monthly')
  const [walletName, setWalletName] = useState('')
  const [walletType, setWalletType] = useState<WalletType>('bank')
  const [balance, setBalance] = useState('')

  function updateLanguage(nextLanguage: SupportedLocale) {
    const nextCountry: CountryCode = nextLanguage === 'id-ID' ? 'ID' : 'GLOBAL'
    const region = regions[nextCountry]
    setPreferences({ language: nextLanguage, locale: nextLanguage, countryCode: nextCountry, currency: region.defaultCurrency })
  }

  function updateRegion(nextCountry: CountryCode) {
    const region = regions[nextCountry]
    setPreferences({
      language: nextCountry === 'ID' ? 'id-ID' : language,
      locale: nextCountry === 'ID' ? 'id-ID' : language,
      countryCode: nextCountry,
      currency: region.defaultCurrency,
    })
  }

  async function finish(skipWallet = false) {
    try {
      await saveProfile({
        ...state.profile,
        fullName: name,
        preferredLanguage: language,
        locale,
        countryCode,
        currency,
        incomePattern: incomePattern as typeof state.profile.incomePattern,
        onboardingCompleted: true,
      })
      if (!skipWallet && walletName) {
        await saveWallet({
          id: createId('wallet'),
          name: walletName,
          type: walletType,
          startingBalance: parseAmount(balance, locale),
          currency,
          includeInTotal: true,
          isArchived: false,
          color: '#0b2447',
          createdAt: new Date().toISOString(),
        })
      }
      navigate('/')
    } catch {
      // The sync error is rendered below.
    }
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-brand"><img className="brand-icon" src="/pocketgo-icon.png" alt="" /><div><strong>PocketGo</strong><small>Track Your Money</small></div></div>
      <div className="onboarding-progress">{[1, 2, 3, 4].map((item) => <i key={item} className={step >= item ? 'active' : ''} />)}</div>
      {step === 1 ? (
        <section>
          <span className="onboarding-icon"><Globe2 size={28} /></span>
          <p>{t('onboarding.region')}</p><h1>{t('onboarding.regionTitle')}</h1>
          <p className="lead">{t('onboarding.regionLead')}</p>
          <label>{t('onboarding.language')}<select value={language} onChange={(event) => updateLanguage(event.target.value as SupportedLocale)}><option value="id-ID">{t('language.id-ID')}</option><option value="en-US">{t('language.en-US')}</option></select></label>
          <label>{t('onboarding.region')}<select value={countryCode} onChange={(event) => updateRegion(event.target.value as CountryCode)}><option value="ID">{t('region.ID')}</option><option value="US">{t('region.US')}</option><option value="GLOBAL">{t('region.GLOBAL')}</option></select></label>
          <label>{t('onboarding.currency')}<select value={currency} onChange={(event) => setPreferences({ language, locale, countryCode, currency: event.target.value })}><option value="IDR">{t('currency.IDR')}</option><option value="USD">{t('currency.USD')}</option><option value="MYR">{t('currency.MYR')}</option><option value="SGD">{t('currency.SGD')}</option></select></label>
          <button className="primary-button" type="button" onClick={() => setStep(2)}>{t('common.next')} <ArrowRight size={18} /></button>
        </section>
      ) : step === 2 ? (
        <section>
          <span className="onboarding-icon"><ShieldCheck size={28} /></span>
          <p>{t('onboarding.welcome')}</p><h1>{t('onboarding.title')}</h1>
          <p className="lead">{t('onboarding.lead')}</p>
          <label>{t('onboarding.name')} <span className="optional">{t('common.optional')}</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('onboarding.namePlaceholder')} /></label>
          <button className="primary-button" type="button" onClick={() => setStep(3)}>{t('onboarding.start')} <ArrowRight size={18} /></button>
        </section>
      ) : step === 3 ? (
        <section>
          <p>{t('onboarding.priority')}</p><h1>{t('onboarding.priorityTitle')}</h1>
          <div className="choice-list">
            {[['safe', t('onboarding.needSafe')], ['payday', t('onboarding.needPayday')], ['bills', t('onboarding.needBills')], ['track', t('onboarding.needTrack')], ['goal', t('onboarding.needGoal')]].map(([value, label]) => <button key={value} className={need === value ? 'selected' : ''} type="button" onClick={() => setNeed(value)}><span>{label}</span>{need === value ? <Check size={18} /> : null}</button>)}
          </div>
          <label>{t('onboarding.incomePattern')}<select value={incomePattern} onChange={(event) => setIncomePattern(event.target.value)}><option value="monthly">{t('common.monthly')}</option><option value="twice_monthly">{t('onboarding.twiceMonthly')}</option><option value="weekly">{t('common.weekly')}</option><option value="daily">{t('common.daily')}</option><option value="irregular">{t('onboarding.irregular')}</option><option value="none">{t('onboarding.noIncome')}</option></select></label>
          <button className="primary-button" type="button" onClick={() => setStep(4)}>{t('common.next')} <ArrowRight size={18} /></button>
        </section>
      ) : (
        <section>
          <span className="onboarding-icon"><WalletCards size={28} /></span>
          <p>{t('onboarding.firstWallet')}</p><h1>{t('onboarding.walletTitle')}</h1>
          <p className="lead">{t('onboarding.walletLead')}</p>
          <label>{t('onboarding.walletName')}<input list="wallet-examples" value={walletName} onChange={(event) => setWalletName(event.target.value)} placeholder={t('onboarding.walletPlaceholder')} /><datalist id="wallet-examples">{regions[countryCode].walletExamples.map((item) => <option key={item} value={item} />)}</datalist></label>
          <label>{t('onboarding.walletType')}<select value={walletType} onChange={(event) => setWalletType(event.target.value as WalletType)}><option value="bank">{t('wallet.bank')}</option><option value="cash">{t('wallet.cash')}</option><option value="ewallet">{t('wallet.ewallet')}</option><option value="savings">{t('wallet.savings')}</option><option value="business">{t('wallet.business')}</option><option value="paylater">{t('wallet.paylater')}</option></select></label>
          <label>{t('onboarding.balance')}<div className="localized-amount"><span>{currencySymbol(currency, locale)}</span><input inputMode="decimal" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder="0" /></div></label>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button" type="button" onClick={() => finish(false)} disabled={!walletName || syncing}>{syncing ? t('common.saving') : t('common.done')} <Check size={18} /></button>
          <button className="text-button" type="button" onClick={() => finish(true)} disabled={syncing}>{t('common.skip')}</button>
        </section>
      )}
    </main>
  )
}

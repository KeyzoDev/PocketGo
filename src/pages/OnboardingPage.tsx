import { ArrowRight, Check, ShieldCheck, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createId } from '../lib/id'
import { parseAmount } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { WalletType } from '../types'

export function OnboardingPage() {
  const { state, saveProfile, saveWallet, syncing, syncError } = useAppStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [need, setNeed] = useState('safe')
  const [incomePattern, setIncomePattern] = useState('monthly')
  const [walletName, setWalletName] = useState('')
  const [walletType, setWalletType] = useState<WalletType>('bank')
  const [balance, setBalance] = useState('')

  async function finish(skipWallet = false) {
    try {
      await saveProfile({
        ...state.profile,
        fullName: name,
        incomePattern: incomePattern as typeof state.profile.incomePattern,
        onboardingCompleted: true,
      })
      if (!skipWallet && walletName) {
        await saveWallet({
          id: createId('wallet'),
          name: walletName,
          type: walletType,
          startingBalance: parseAmount(balance),
          currency: 'IDR',
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
      <div className="onboarding-progress"><i className={step >= 1 ? 'active' : ''} /><i className={step >= 2 ? 'active' : ''} /><i className={step >= 3 ? 'active' : ''} /></div>
      {step === 1 ? (
        <section>
          <span className="onboarding-icon"><ShieldCheck size={28} /></span>
          <p>Selamat datang</p><h1>Uang lebih jelas, keputusan lebih tenang.</h1>
          <p className="lead">PocketGo membantu melihat saldo nyata, kewajiban mendatang, dan berapa yang aman dibelanjakan hari ini.</p>
          <label>Namamu <span className="optional">opsional</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Bagaimana kami menyapamu?" /></label>
          <button className="primary-button" type="button" onClick={() => setStep(2)}>Mulai <ArrowRight size={18} /></button>
        </section>
      ) : step === 2 ? (
        <section>
          <p>Prioritasmu</p><h1>Apa yang paling ingin kamu pahami?</h1>
          <div className="choice-list">
            {[['safe', 'Tahu apa yang aman dibelanjakan'], ['payday', 'Bertahan sampai pemasukan berikutnya'], ['bills', 'Mengendalikan tagihan dan cicilan'], ['track', 'Tahu ke mana uang pergi'], ['goal', 'Menabung untuk tujuan']].map(([value, label]) => <button key={value} className={need === value ? 'selected' : ''} type="button" onClick={() => setNeed(value)}><span>{label}</span>{need === value ? <Check size={18} /> : null}</button>)}
          </div>
          <label>Pola pemasukan<select value={incomePattern} onChange={(event) => setIncomePattern(event.target.value)}><option value="monthly">Bulanan</option><option value="twice_monthly">Dua kali sebulan</option><option value="weekly">Mingguan</option><option value="daily">Harian</option><option value="irregular">Tidak tetap</option><option value="none">Belum ada pemasukan tetap</option></select></label>
          <button className="primary-button" type="button" onClick={() => setStep(3)}>Lanjut <ArrowRight size={18} /></button>
        </section>
      ) : (
        <section>
          <span className="onboarding-icon"><WalletCards size={28} /></span>
          <p>Dompet pertama</p><h1>Di mana uangmu disimpan?</h1>
          <p className="lead">Tidak perlu menghubungkan rekening. Catat manual dan tetap pegang kendali atas datamu.</p>
          <label>Nama dompet<input value={walletName} onChange={(event) => setWalletName(event.target.value)} placeholder="Contoh: Rekening utama" /></label>
          <label>Jenis<select value={walletType} onChange={(event) => setWalletType(event.target.value as WalletType)}><option value="bank">Bank</option><option value="cash">Tunai</option><option value="ewallet">E-wallet</option><option value="savings">Tabungan</option><option value="business">Bisnis</option><option value="paylater">Paylater</option></select></label>
          <label>Saldo saat ini<input inputMode="numeric" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder="Rp0" /></label>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button" type="button" onClick={() => finish(false)} disabled={!walletName || syncing}>{syncing ? 'Menyimpan...' : 'Selesai'} <Check size={18} /></button>
          <button className="text-button" type="button" onClick={() => finish(true)} disabled={syncing}>Lewati, atur nanti</button>
        </section>
      )}
    </main>
  )
}

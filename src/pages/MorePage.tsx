import {
  Archive,
  ChevronRight,
  Download,
  LockKeyhole,
  MessageSquareText,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Tags,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createId } from '../lib/id'
import { formatCurrency, parseAmount } from '../lib/format'
import { walletBalances } from '../domain/ledger'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { AuthPanel } from '../components/AuthPanel'
import type { Wallet, WalletType } from '../types'

export function MorePage() {
  const { state, saveProfile, saveWallet, reset, isCloudMode, syncing, syncError } = useAppStore()
  const [walletForm, setWalletForm] = useState(false)
  const [profileForm, setProfileForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | undefined>()
  const balances = walletBalances(state.wallets, state.transactions)

  async function submitWallet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const wallet: Wallet = {
      id: editingWallet?.id ?? createId('wallet'),
      name: String(data.get('name')),
      type: data.get('type') as WalletType,
      startingBalance: editingWallet?.startingBalance ?? parseAmount(String(data.get('startingBalance'))),
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
        currency: String(data.get('currency')),
        incomePattern: data.get('incomePattern') as typeof state.profile.incomePattern,
        defaultIncomeDay: Number(data.get('defaultIncomeDay')) || undefined,
      })
      setProfileForm(false)
    } catch {
      // Store exposes the sync error in the form.
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

  async function archiveWallet(wallet: Wallet) {
    try {
      await saveWallet({ ...wallet, isArchived: !wallet.isArchived })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Dompet belum dapat diarsipkan.')
    }
  }

  return (
    <div className="standard-page page-width more-page">
      <header className="page-header"><div><p>Atur data dan privasi</p><h1>Lainnya</h1></div></header>

      <section className="settings-section">
        <div className="section-title-row"><div><h2>Dompet</h2><p>Saldo dihitung dari saldo awal dan seluruh riwayat transaksi.</p></div><button type="button" onClick={() => setWalletForm(true)}><Plus size={16} /> Tambah</button></div>
        {state.wallets.length === 0 ? (
          <EmptyState icon={WalletCards} title="Belum ada dompet" body="Tambahkan dompet pertama agar PocketGo tahu di mana uangmu tersimpan." action="Tambah dompet" onAction={() => setWalletForm(true)} />
        ) : (
          <div className="wallet-list">
            {state.wallets.map((wallet) => (
              <article key={wallet.id} className={wallet.isArchived ? 'archived' : ''}>
                <button type="button" className="wallet-main" onClick={() => { setEditingWallet(wallet); setWalletForm(true) }}>
                  <i style={{ background: wallet.color }}><WalletCards size={19} /></i>
                  <span><strong>{wallet.name}</strong><small>{wallet.type.replace('_', ' ')}{wallet.isArchived ? ' · Diarsipkan' : ''}</small></span>
                  <b>{formatCurrency(balances[wallet.id] ?? wallet.startingBalance, wallet.currency)}</b>
                  <ChevronRight size={17} />
                </button>
                <button className="archive-button" type="button" onClick={() => archiveWallet(wallet)} aria-label={wallet.isArchived ? 'Aktifkan dompet' : 'Arsipkan dompet'}><Archive size={16} /></button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>Akun & sinkronisasi</h2>
        <AuthPanel />
      </section>

      <section className="settings-section">
        <h2>Pengaturan</h2>
        <div className="settings-list">
          <button type="button" onClick={() => setProfileForm(true)}><span className="brief-icon navy"><UserRound size={19} /></span><span><strong>Profil & pola pemasukan</strong><small>{state.profile.fullName || 'Belum diatur'}</small></span><ChevronRight size={18} /></button>
          <div className="static-setting"><span className="brief-icon sage"><Tags size={19} /></span><span><strong>Kategori</strong><small>{state.categories.filter((category) => !category.isArchived).length} kategori aktif</small></span></div>
          <button type="button" disabled><span className="brief-icon navy"><Moon size={19} /></span><span><strong>Tampilan gelap</strong><small>Disiapkan untuk versi berikutnya</small></span></button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Data & privasi</h2>
        <div className="settings-list">
          <button type="button" onClick={exportData}><span className="brief-icon sage"><Download size={19} /></span><span><strong>Ekspor data</strong><small>Unduh backup JSON milikmu</small></span><ChevronRight size={18} /></button>
          <div className="static-setting"><span className="brief-icon navy"><LockKeyhole size={19} /></span><span><strong>Privasi sejak awal</strong><small>Tidak ada sinkronisasi bank paksa dan tidak ada data contoh di akun.</small></span></div>
          <div className="static-setting"><span className="brief-icon sage"><ShieldCheck size={19} /></span><span><strong>RLS Supabase</strong><small>Schema membatasi setiap baris ke pemilik atau anggota household aktif.</small></span></div>
          {!isCloudMode ? <button type="button" className="danger-action" onClick={() => { if (window.confirm('Hapus seluruh data lokal PocketGo di perangkat ini?')) reset() }}><span className="brief-icon coral"><RotateCcw size={19} /></span><span><strong>Reset data lokal</strong><small>Menghapus semua dompet, transaksi, dan rencana dari perangkat.</small></span></button> : null}
        </div>
      </section>

      <section className="settings-section">
        <h2>Bantu pengembangan</h2>
        <div className="settings-list">
          <Link className="settings-link" to="/feedback" state={{ from: '/more' }}><span className="brief-icon navy"><MessageSquareText size={19} /></span><span><strong>Kirim feedback beta</strong><small>Laporkan bug, bagian membingungkan, atau ide perbaikan.</small></span><ChevronRight size={18} /></Link>
        </div>
      </section>

      <footer className="app-footer"><img className="brand-icon" src="/pocketgo-icon.png" alt="" /><div><strong>PocketGo</strong><small>Membantu melihat apa yang aman, berisiko, dan perlu dilakukan berikutnya.</small><span><Link to="/privacy">Privasi</Link> · <Link to="/terms">Ketentuan</Link></span></div></footer>

      <Modal open={walletForm} title={editingWallet ? 'Edit dompet' : 'Tambah dompet'} onClose={() => { setWalletForm(false); setEditingWallet(undefined) }}>
        <form className="form-stack" onSubmit={submitWallet}>
          <label>Nama dompet<input name="name" required defaultValue={editingWallet?.name} placeholder="Contoh: Rekening utama" /></label>
          <label>Jenis<select name="type" defaultValue={editingWallet?.type ?? 'bank'}><option value="cash">Tunai</option><option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="credit_card">Kartu kredit</option><option value="paylater">Paylater</option><option value="savings">Tabungan</option><option value="investment">Investasi</option><option value="business">Bisnis</option><option value="loan">Pinjaman</option><option value="other">Lainnya</option></select></label>
          {!editingWallet ? <label>Saldo awal<input name="startingBalance" inputMode="numeric" defaultValue="0" required /></label> : <div className="inline-notice">Saldo awal dikunci setelah dompet dibuat. Gunakan transaksi Penyesuaian untuk koreksi agar jejak perubahan tetap jelas.</div>}
          <label>Warna<select name="color" defaultValue={editingWallet?.color ?? '#0b2447'}><option value="#0b2447">Navy</option><option value="#5f7c45">Sage</option><option value="#d79b2e">Amber</option><option value="#7c5e8e">Ungu</option><option value="#667085">Abu</option></select></label>
          <label className="checkbox-row"><input type="checkbox" name="includeInTotal" defaultChecked={editingWallet?.includeInTotal ?? true} /><span><strong>Sertakan dalam saldo total</strong><small>Matikan untuk dompet yang tidak ingin dihitung sebagai uang tersedia.</small></span></label>
          {syncError ? <p className="form-error">{syncError}</p> : null}
          <button className="primary-button sticky-submit" disabled={syncing}>{syncing ? 'Menyimpan...' : 'Simpan dompet'}</button>
        </form>
      </Modal>
      <Modal open={profileForm} title="Profil & pemasukan" onClose={() => setProfileForm(false)}>
        <form className="form-stack" onSubmit={submitProfile}><label>Nama<input name="fullName" defaultValue={state.profile.fullName} placeholder="Nama panggilan atau nama lengkap" /></label><label>Mata uang<select name="currency" defaultValue={state.profile.currency}><option value="IDR">IDR — Rupiah</option><option value="USD">USD — Dollar</option><option value="MYR">MYR — Ringgit</option><option value="SGD">SGD — Dollar Singapura</option></select></label><label>Pola pemasukan<select name="incomePattern" defaultValue={state.profile.incomePattern}><option value="monthly">Bulanan</option><option value="twice_monthly">Dua kali sebulan</option><option value="weekly">Mingguan</option><option value="daily">Harian</option><option value="irregular">Tidak tetap</option><option value="none">Belum ada pemasukan tetap</option></select></label><label>Tanggal pemasukan utama<input name="defaultIncomeDay" type="number" min="1" max="28" defaultValue={state.profile.defaultIncomeDay} placeholder="1–28" /></label>{syncError ? <p className="form-error">{syncError}</p> : null}<button className="primary-button sticky-submit" disabled={syncing}>{syncing ? 'Menyimpan...' : 'Simpan profil'}</button></form>
      </Modal>
    </div>
  )
}

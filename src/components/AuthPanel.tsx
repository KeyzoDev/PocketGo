import { LogOut, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

export function AuthPanel() {
  const { session, isCloudMode, syncing } = useAppStore()

  if (!isCloudMode) {
    return (
      <div className="auth-status">
        <span className="brief-icon amber"><ShieldCheck size={20} /></span>
        <div><strong>Mode lokal aktif</strong><p>Data hanya tersimpan di perangkat ini karena Supabase belum dikonfigurasi.</p></div>
      </div>
    )
  }

  return (
    <div className="auth-status">
      <span className="brief-icon sage"><Mail size={20} /></span>
      <div><strong>{session?.user.email}</strong><p>Data tersinkron ke Supabase dan dilindungi per akun.</p></div>
      <button className="secondary-button" type="button" disabled={syncing} onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> Keluar</button>
    </div>
  )
}

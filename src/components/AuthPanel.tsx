import { LogOut, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'

export function AuthPanel() {
  const { session, isCloudMode, syncing } = useAppStore()
  const { t } = useLocalization()

  if (!isCloudMode) {
    return (
      <div className="auth-status">
        <span className="brief-icon amber"><ShieldCheck size={20} /></span>
        <div><strong>{t('sync.localTitle')}</strong><p>{t('sync.localBody')}</p></div>
      </div>
    )
  }

  return (
    <div className="auth-status">
      <span className="brief-icon sage"><Mail size={20} /></span>
      <div><strong>{session?.user.email}</strong><p>{t('sync.cloudBody')}</p></div>
      <button className="secondary-button" type="button" disabled={syncing} onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> {t('sync.signOut')}</button>
    </div>
  )
}

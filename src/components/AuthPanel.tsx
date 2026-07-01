import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'
import { PremiumIcon } from './PremiumIcon'

export function AuthPanel() {
  const { session, isCloudMode, syncing } = useAppStore()
  const { t } = useLocalization()

  if (!isCloudMode) {
    return (
      <div className="auth-status">
        <PremiumIcon name="security" tone="amber" variant="transaction" size="md" />
        <div><strong>{t('sync.localTitle')}</strong><p>{t('sync.localBody')}</p></div>
      </div>
    )
  }

  return (
    <div className="auth-status">
      <PremiumIcon name="mail" tone="green" variant="transaction" size="md" />
      <div><strong>{session?.user.email}</strong><p>{t('sync.cloudBody')}</p></div>
      <button className="secondary-button" type="button" disabled={syncing} onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> {t('sync.signOut')}</button>
    </div>
  )
}

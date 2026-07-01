import { Plus } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { TransactionSheet } from './TransactionSheet'
import { PremiumIcon, type PremiumIconTone } from './PremiumIcon'
import type { EntryMode } from './TransactionSheet'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'

export function AppShell() {
  const [entryOpen, setEntryOpen] = useState(false)
  const [entryMode, setEntryMode] = useState<EntryMode | undefined>(undefined)
  const location = useLocation()
  const navigate = useNavigate()
  const isOnboarding = location.pathname === '/onboarding'
  const showGlobalFab = !isOnboarding && location.pathname === '/' && !entryOpen
  const { syncing, syncError, isCloudMode, isDemoMode, exitDemo } = useAppStore()
  const { t } = useLocalization()
  const nav: Array<{ to: string; label: string; premiumName: string; tone: PremiumIconTone }> = [
    { to: '/', label: t('nav.home'), premiumName: 'home', tone: 'green' },
    { to: '/transactions', label: t('nav.transactions'), premiumName: 'transactions', tone: 'blue' },
    { to: '/budgets', label: t('nav.budgets'), premiumName: 'budget', tone: 'amber' },
    { to: '/goals', label: t('nav.goals'), premiumName: 'goals', tone: 'purple' },
    { to: '/more', label: t('nav.profile'), premiumName: 'profile', tone: 'teal' },
  ]
  const exitDemoToLogin = () => {
    exitDemo()
    navigate('/?auth=login', { replace: true })
  }
  const exitDemoToSignup = () => {
    exitDemo()
    navigate('/?auth=signup', { replace: true })
  }

  if (isOnboarding) return <Outlet />

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-lockup">
          <img className="brand-icon" src="/pocketgo-icon.png" alt="" />
          <div><strong>PocketGo</strong><small>Track Your Money</small></div>
        </div>
        <nav>
          {nav.map(({ to, label, premiumName, tone }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <PremiumIcon name={premiumName} variant="utility" tone={tone} size="xs" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-add" type="button" onClick={() => { setEntryMode(undefined); setEntryOpen(true) }}>
          <Plus size={20} /> {t('home.addTransaction')}
        </button>
      </aside>
      <main className="app-content">
        {isCloudMode && syncing ? <div className="sync-banner" role="status">{t('sync.syncing')}</div> : null}
        {isCloudMode && syncError ? <div className="sync-banner error" role="alert">{syncError}</div> : null}
        {isDemoMode ? (
          <div className="demo-banner" role="status">
            <span><strong>{t('demo.bannerTitle')}</strong>{t('demo.bannerBody')}</span>
            <button type="button" onClick={exitDemoToSignup}>{t('demo.createAccount')}</button>
            <button type="button" onClick={exitDemoToLogin}>{t('demo.exit')}</button>
          </div>
        ) : null}
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label={t('nav.main')}>
        {nav.map(({ to, label, premiumName, tone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            onClick={() => navigator.vibrate?.(8)}
          >
            {({ isActive }) => (
              <>
                <PremiumIcon name={premiumName} variant="nav" tone={tone} active={isActive} size="sm" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {showGlobalFab ? (
        <button className={`global-fab ${entryOpen ? 'open' : ''}`} type="button" aria-label={t('home.addTransaction')} onClick={() => { setEntryMode(undefined); setEntryOpen(true) }}>
          <Plus size={25} />
        </button>
      ) : null}
      <TransactionSheet
        key={entryOpen ? `open-${entryMode ?? 'chooser'}` : 'closed'}
        open={entryOpen}
        initialMode={entryMode}
        onClose={() => { setEntryOpen(false); setEntryMode(undefined) }}
      />
    </div>
  )
}

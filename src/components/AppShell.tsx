import {
  BarChart3,
  Home,
  ListChecks,
  MoreHorizontal,
  Plus,
  ReceiptText,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { TransactionSheet } from './TransactionSheet'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'

export function AppShell() {
  const [adding, setAdding] = useState(false)
  const location = useLocation()
  const isOnboarding = location.pathname === '/onboarding'
  const { syncing, syncError, isCloudMode } = useAppStore()
  const { t } = useLocalization()
  const nav = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/transactions', label: t('nav.transactions'), icon: ReceiptText },
    { to: '/plan', label: t('nav.plan'), icon: ListChecks },
    { to: '/insight', label: t('nav.insights'), icon: BarChart3 },
    { to: '/more', label: t('nav.more'), icon: MoreHorizontal },
  ]

  if (isOnboarding) return <Outlet />

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-lockup">
          <img className="brand-icon" src="/pocketgo-icon.png" alt="" />
          <div><strong>PocketGo</strong><small>Track Your Money</small></div>
        </div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-add" type="button" onClick={() => setAdding(true)}>
          <Plus size={20} /> {t('home.addTransaction')}
        </button>
      </aside>
      <main className="app-content">
        {isCloudMode && syncing ? <div className="sync-banner" role="status">{t('sync.syncing')}</div> : null}
        {isCloudMode && syncError ? <div className="sync-banner error" role="alert">{syncError}</div> : null}
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label={t('nav.main')}>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon size={21} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <TransactionSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

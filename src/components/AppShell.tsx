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

const nav = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/transactions', label: 'Transaksi', icon: ReceiptText },
  { to: '/plan', label: 'Plan', icon: ListChecks },
  { to: '/insight', label: 'Insight', icon: BarChart3 },
  { to: '/more', label: 'Lainnya', icon: MoreHorizontal },
]

export function AppShell() {
  const [adding, setAdding] = useState(false)
  const location = useLocation()
  const isOnboarding = location.pathname === '/onboarding'
  const { syncing, syncError, isCloudMode } = useAppStore()

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
          <Plus size={20} /> Tambah transaksi
        </button>
      </aside>
      <main className="app-content">
        {isCloudMode && syncing ? <div className="sync-banner" role="status">Menyinkronkan...</div> : null}
        {isCloudMode && syncError ? <div className="sync-banner error" role="alert">{syncError}</div> : null}
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Navigasi utama">
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

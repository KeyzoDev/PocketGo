import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Home,
  MoreHorizontal,
  PieChart,
  Plus,
  ReceiptText,
  WalletCards,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { TransactionSheet } from './TransactionSheet'
import type { EntryMode } from './TransactionSheet'
import { useAppStore } from '../store/useAppStore'
import { useLocalization } from '../i18n'

export function AppShell() {
  const [choosing, setChoosing] = useState(false)
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isOnboarding = location.pathname === '/onboarding'
  const showGlobalFab = location.pathname === '/transactions' || location.pathname === '/budgets'
  const { syncing, syncError, isCloudMode, isDemoMode, exitDemo } = useAppStore()
  const { t } = useLocalization()
  const nav = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/accounts', label: t('nav.accounts'), icon: WalletCards },
    { to: '/transactions', label: t('nav.transactions'), icon: ReceiptText },
    { to: '/budgets', label: t('nav.budgets'), icon: PieChart },
    { to: '/more', label: t('nav.more'), icon: MoreHorizontal },
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
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-add" type="button" onClick={() => setChoosing(true)}>
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
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon size={21} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {showGlobalFab ? (
        <button className={`global-fab ${choosing ? 'open' : ''}`} type="button" aria-label={t('home.addTransaction')} onClick={() => setChoosing((current) => !current)}>
          <Plus size={25} />
        </button>
      ) : null}
      {showGlobalFab && choosing ? (
        <div className="quick-action-menu" role="menu" aria-label={t('home.addTransaction')}>
          <button type="button" role="menuitem" onClick={() => { setChoosing(false); setEntryMode('income') }}><span className="transaction-type-icon income"><ArrowUp size={20} /></span>{t('quick.income')}</button>
          <button type="button" role="menuitem" onClick={() => { setChoosing(false); setEntryMode('expense') }}><span className="transaction-type-icon expense"><ArrowDown size={20} /></span>{t('quick.expense')}</button>
          <button type="button" role="menuitem" onClick={() => { setChoosing(false); setEntryMode('transfer') }}><span className="transaction-type-icon transfer"><ArrowLeftRight size={20} /></span>{t('quick.transfer')}</button>
          <button type="button" role="menuitem" onClick={() => { setChoosing(false); setEntryMode('adjustment') }}><span className="transaction-type-icon adjustment"><ReceiptText size={20} /></span>{t('quick.adjustment')}</button>
        </div>
      ) : null}
      <TransactionSheet
        key={entryMode ?? 'closed'}
        open={Boolean(entryMode)}
        initialMode={entryMode ?? undefined}
        onClose={() => setEntryMode(null)}
      />
    </div>
  )
}

import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAppStore } from './store/useAppStore'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((module) => ({ default: module.TransactionsPage })))
const PlanPage = lazy(() => import('./pages/PlanPage').then((module) => ({ default: module.PlanPage })))
const InsightPage = lazy(() => import('./pages/InsightPage').then((module) => ({ default: module.InsightPage })))
const MorePage = lazy(() => import('./pages/MorePage').then((module) => ({ default: module.MorePage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const PasswordRecoveryPage = lazy(() => import('./pages/PasswordRecoveryPage').then((module) => ({ default: module.PasswordRecoveryPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then((module) => ({ default: module.TermsPage })))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((module) => ({ default: module.FeedbackPage })))

export function App() {
  const { state, session, authLoading, dataLoading, isCloudMode, passwordRecovery, syncError, reload } = useAppStore()
  const location = useLocation()
  const isPublicLegalPage = location.pathname === '/privacy' || location.pathname === '/terms'

  if (isPublicLegalPage) {
    return (
      <Suspense fallback={<div className="page-loading" role="status">Memuat PocketGo...</div>}>
        {location.pathname === '/privacy' ? <PrivacyPage /> : <TermsPage />}
      </Suspense>
    )
  }
  if (authLoading || (isCloudMode && session && dataLoading)) {
    return <div className="page-loading" role="status">Menyiapkan data PocketGo...</div>
  }
  if (passwordRecovery) {
    return (
      <Suspense fallback={<div className="page-loading" role="status">Memuat PocketGo...</div>}>
        <PasswordRecoveryPage />
      </Suspense>
    )
  }
  if (isCloudMode && !session) {
    return (
      <Suspense fallback={<div className="page-loading" role="status">Memuat PocketGo...</div>}>
        <AuthPage />
      </Suspense>
    )
  }
  if (syncError && isCloudMode && session && state.wallets.length === 0) {
    return (
      <main className="fatal-state">
        <h1>Data belum dapat dimuat</h1>
        <p>{syncError}</p>
        <button className="primary-button" type="button" onClick={() => reload()}>Coba lagi</button>
      </main>
    )
  }
  if (!state.profile.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  if (state.profile.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return (
    <Suspense fallback={<div className="page-loading" role="status">Memuat PocketGo...</div>}>
      <Routes>
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route element={<AppShell />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route index element={<HomePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/insight" element={<InsightPage />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

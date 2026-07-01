import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { BrandedLoading } from './components/BrandedLoading'
import { useAppStore } from './store/useAppStore'
import { useLocalization } from './i18n'
import { applyStoredTheme } from './lib/theme'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((module) => ({ default: module.TransactionsPage })))
const PlanPage = lazy(() => import('./pages/PlanPage').then((module) => ({ default: module.PlanPage })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((module) => ({ default: module.GoalsPage })))
const InsightPage = lazy(() => import('./pages/InsightPage').then((module) => ({ default: module.InsightPage })))
const MorePage = lazy(() => import('./pages/MorePage').then((module) => ({ default: module.MorePage })))
const AccountsPage = lazy(() => import('./pages/AccountsPage').then((module) => ({ default: module.AccountsPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const PasswordRecoveryPage = lazy(() => import('./pages/PasswordRecoveryPage').then((module) => ({ default: module.PasswordRecoveryPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then((module) => ({ default: module.TermsPage })))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((module) => ({ default: module.FeedbackPage })))

export function App() {
  const { state, session, authLoading, dataLoading, isCloudMode, isDemoMode, passwordRecovery, syncError, reload } = useAppStore()
  const { t, setPreferences, language, countryCode, currency } = useLocalization()
  const location = useLocation()
  const isPublicLegalPage = location.pathname === '/privacy' || location.pathname === '/terms'

  useEffect(() => {
    applyStoredTheme()
  }, [])

  useEffect(() => {
    if (!session) return
    if (
      language !== state.profile.preferredLanguage
      || countryCode !== state.profile.countryCode
      || currency !== state.profile.currency
    ) {
      setPreferences({
        language: state.profile.preferredLanguage,
        locale: state.profile.locale,
        countryCode: state.profile.countryCode,
        currency: state.profile.currency,
      })
    }
  }, [countryCode, currency, language, session, setPreferences, state.profile])

  if (isPublicLegalPage) {
    return (
      <Suspense fallback={<BrandedLoading />}>
        {location.pathname === '/privacy' ? <PrivacyPage /> : <TermsPage />}
      </Suspense>
    )
  }
  if ((authLoading && !isDemoMode) || (isCloudMode && session && dataLoading)) {
    return <BrandedLoading variant={location.pathname === '/auth/callback' ? 'dark' : 'light'} />
  }
  if (passwordRecovery) {
    return (
      <Suspense fallback={<BrandedLoading />}>
        <PasswordRecoveryPage />
      </Suspense>
    )
  }
  if (isCloudMode && !session && !isDemoMode) {
    return (
      <Suspense fallback={<BrandedLoading variant="dark" />}>
        <AuthPage />
      </Suspense>
    )
  }
  if (syncError && isCloudMode && session && state.wallets.length === 0) {
    return (
      <main className="fatal-state">
        <h1>{t('error.loadTitle')}</h1>
        <p>{syncError}</p>
        <button className="primary-button" type="button" onClick={() => reload()}>{t('common.retry')}</button>
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
    <Suspense fallback={<BrandedLoading />}>
      <Routes>
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route element={<AppShell />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route index element={<HomePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/budgets" element={<PlanPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/insight" element={<InsightPage />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

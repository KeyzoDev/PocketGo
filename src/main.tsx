import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AppStoreProvider } from './store/AppStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { reportClientError } from './lib/monitoring'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppStoreProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppStoreProvider>
    </BrowserRouter>
  </StrictMode>,
)

window.addEventListener('error', (event) => {
  reportClientError(event.error ?? event.message, 'window_error').catch(() => undefined)
})
window.addEventListener('unhandledrejection', (event) => {
  reportClientError(event.reason, 'unhandled_rejection').catch(() => undefined)
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

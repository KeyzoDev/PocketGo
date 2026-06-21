import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportClientError } from '../lib/monitoring'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void info
    reportClientError(error, 'react_boundary').catch(() => undefined)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="fatal-state">
        <h1>PocketGo perlu dimuat ulang</h1>
        <p>Terjadi gangguan pada tampilan. Data yang sudah tersimpan tetap aman.</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          Muat ulang
        </button>
      </main>
    )
  }
}

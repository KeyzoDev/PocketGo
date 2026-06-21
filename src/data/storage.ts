import { emptyState } from './defaults'
import type { AppState } from '../types'

const STORAGE_KEY = 'pocketgo-state-v1'

export function loadState(): AppState {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return emptyState
    const parsed = JSON.parse(value) as Partial<AppState>
    return {
      ...emptyState,
      ...parsed,
      profile: { ...emptyState.profile, ...parsed.profile },
      categories: parsed.categories?.length ? parsed.categories : emptyState.categories,
    }
  } catch {
    return emptyState
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}

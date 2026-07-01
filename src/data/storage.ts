import { createDemoState, emptyState } from './defaults'
import type { AppState } from '../types'

const STORAGE_KEY = 'pocketgo-state-v1'
const DEMO_STORAGE_KEY = 'pocketgo-demo-state-v1'

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
      categoryRules: parsed.categoryRules ?? emptyState.categoryRules,
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

export function loadDemoState(): AppState {
  try {
    const value = sessionStorage.getItem(DEMO_STORAGE_KEY)
    if (!value) return createDemoState()
    const parsed = JSON.parse(value) as Partial<AppState>
    return {
      ...createDemoState(),
      ...parsed,
      profile: { ...createDemoState().profile, ...parsed.profile },
      categories: parsed.categories?.length ? parsed.categories : createDemoState().categories,
      categoryRules: parsed.categoryRules ?? createDemoState().categoryRules,
    }
  } catch {
    return createDemoState()
  }
}

export function saveDemoState(state: AppState) {
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}

export function clearDemoState() {
  sessionStorage.removeItem(DEMO_STORAGE_KEY)
}

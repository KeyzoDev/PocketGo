export type AppTheme = 'light' | 'dark'

const storageKey = 'pocketgo-theme'

export function readTheme(): AppTheme {
  if (typeof localStorage === 'undefined') return 'light'
  return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(storageKey, theme)
}

export function applyStoredTheme() {
  applyTheme(readTheme())
}

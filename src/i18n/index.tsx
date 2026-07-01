/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { enUS } from './locales/en-US'
import { idID } from './locales/id-ID'
import { regions } from './regions'
import type { CountryCode, SupportedLocale } from '../types'

export type TranslationKey = keyof typeof idID

export interface LocalePreferences {
  language: SupportedLocale
  locale: SupportedLocale
  countryCode: CountryCode
  currency: string
}

const STORAGE_KEY = 'pocketgo-locale-v1'

export function detectLocalePreferences(): LocalePreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<LocalePreferences> | null
    if (saved?.language && saved?.countryCode && saved?.currency) {
      return {
        language: saved.language,
        locale: saved.locale ?? regions[saved.countryCode].locale,
        countryCode: saved.countryCode,
        currency: saved.currency,
      }
    }
  } catch {
    // Use browser detection below.
  }
  return { language: 'id-ID', locale: 'id-ID', countryCode: 'ID', currency: 'IDR' }
}

interface LocalizationValue extends LocalePreferences {
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string
  setPreferences: (next: LocalePreferences) => void
  selectLanguage: (language: SupportedLocale) => void
}

const LocalizationContext = createContext<LocalizationValue | null>(null)

export function translateMessage(
  language: SupportedLocale,
  key: TranslationKey,
  variables?: Record<string, string | number>,
) {
  const messages = language === 'id-ID' ? idID : enUS
  return Object.entries(variables ?? {}).reduce(
    (text, [name, replacement]) => text.replaceAll(`{{${name}}}`, String(replacement)),
    messages[key] ?? idID[key],
  )
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [preferences, setState] = useState<LocalePreferences>(detectLocalePreferences)

  const value = useMemo<LocalizationValue>(() => {
    const setPreferences = (next: LocalePreferences) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      document.documentElement.lang = next.language
      setState(next)
    }
    return {
      ...preferences,
      t: (key, variables) => translateMessage(preferences.language, key, variables),
      setPreferences,
      selectLanguage: (language) => {
        const countryCode = language === 'id-ID' ? 'ID' : 'GLOBAL'
        const region = regions[countryCode]
        setPreferences({ language, locale: language, countryCode, currency: region.defaultCurrency })
      },
    }
  }, [preferences])

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization() {
  const value = useContext(LocalizationContext)
  if (!value) throw new Error('LocalizationProvider is missing.')
  return value
}

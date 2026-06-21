import { useContext } from 'react'
import { AppStoreContext } from './AppStoreContext'

export function useAppStore() {
  const value = useContext(AppStoreContext)
  if (!value) throw new Error('useAppStore harus digunakan di dalam AppStoreProvider.')
  return value
}

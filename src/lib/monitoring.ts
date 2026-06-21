import { isSupabaseConfigured, supabase } from './supabase'

function sanitizeMessage(value: unknown) {
  const raw = value instanceof Error ? value.message : String(value)
  return raw
    .replace(/eyJ[a-zA-Z0-9._-]+/g, '[token]')
    .replace(/https?:\/\/[^\s]+/g, '[url]')
    .slice(0, 500)
}

export async function reportClientError(error: unknown, code = 'client_runtime') {
  if (!isSupabaseConfigured || !supabase) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  await supabase.from('client_errors').insert({
    error_code: code,
    message: sanitizeMessage(error),
    route: window.location.pathname.slice(0, 200),
    app_version: import.meta.env.VITE_APP_VERSION ?? 'development',
    user_agent: navigator.userAgent.slice(0, 300),
  })
}

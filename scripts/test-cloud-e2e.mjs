import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.')
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const email = `pocketgo-e2e-${Date.now()}@example.com`
const password = `PocketGo-${crypto.randomUUID()}!`
let userId = ''

try {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  userId = data.user.id

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'qa:visual'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        BASE_URL: baseURL,
        TEST_EMAIL: email,
        TEST_PASSWORD: password,
      },
    })
    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
  if (exitCode !== 0) throw new Error(`Cloud E2E gagal dengan exit code ${exitCode}.`)
  console.log(JSON.stringify({ status: 'passed', accountCleanup: 'completed' }, null, 2))
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId)
}

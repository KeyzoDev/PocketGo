import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.')
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const password = `PocketGo-${crypto.randomUUID()}!`
const users = [
  { email: `pocketgo-rls-a-${suffix}@example.com`, id: '' },
  { email: `pocketgo-rls-b-${suffix}@example.com`, id: '' },
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function authenticatedClient(email) {
  const instance = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await instance.auth.signInWithPassword({ email, password })
  if (error) throw error
  return instance
}

try {
  for (const user of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
    })
    if (error) throw error
    user.id = data.user.id
  }

  const userA = await authenticatedClient(users[0].email)
  const userB = await authenticatedClient(users[1].email)

  const { data: walletA, error: walletAError } = await userA
    .from('wallets')
    .insert({
      name: 'RLS Wallet A',
      type: 'bank',
      starting_balance: 1000,
      currency: 'IDR',
      include_in_total: true,
    })
    .select()
    .single()
  if (walletAError) throw walletAError

  const { data: walletA2, error: walletA2Error } = await userA
    .from('wallets')
    .insert({
      name: 'RLS Wallet A2',
      type: 'ewallet',
      starting_balance: 500,
      currency: 'IDR',
      include_in_total: true,
    })
    .select()
    .single()
  if (walletA2Error) throw walletA2Error

  const { data: hiddenRows, error: hiddenError } = await userB
    .from('wallets')
    .select('*')
    .eq('id', walletA.id)
  if (hiddenError) throw hiddenError
  assert(hiddenRows.length === 0, 'Akun B dapat membaca wallet akun A.')

  const { data: changedRows, error: changeError } = await userB
    .from('wallets')
    .update({ name: 'Compromised' })
    .eq('id', walletA.id)
    .select()
  if (changeError) throw changeError
  assert(changedRows.length === 0, 'Akun B dapat mengubah wallet akun A.')

  const { error: spoofError } = await userB.from('wallets').insert({
    user_id: users[0].id,
    name: 'Spoofed owner',
    type: 'cash',
    starting_balance: 1,
  })
  assert(Boolean(spoofError), 'Akun B dapat membuat row menggunakan user_id akun A.')

  const today = new Date().toISOString().slice(0, 10)
  const { data: budget, error: budgetError } = await userA
    .from('budgets')
    .insert({
      name: 'RLS Budget',
      period_start: today,
      period_end: today,
      total_limit: 1000,
      mode: 'simple',
    })
    .select()
    .single()
  if (budgetError) throw budgetError
  const { data: updatedBudget, error: updateBudgetError } = await userA
    .from('budgets')
    .update({ total_limit: 1500 })
    .eq('id', budget.id)
    .select()
    .single()
  if (updateBudgetError) throw updateBudgetError
  assert(Number(updatedBudget.total_limit) === 1500, 'Akun A gagal mengubah budget sendiri.')
  const { data: hiddenBudget, error: hiddenBudgetError } = await userB
    .from('budgets')
    .select('*')
    .eq('id', budget.id)
  if (hiddenBudgetError) throw hiddenBudgetError
  assert(hiddenBudget.length === 0, 'Akun B dapat membaca budget akun A.')
  const { error: deleteBudgetError } = await userA.from('budgets').delete().eq('id', budget.id)
  if (deleteBudgetError) throw deleteBudgetError

  const { data: feedback, error: feedbackError } = await userA
    .from('beta_feedback')
    .insert({
      rating: 4,
      category: 'confusing',
      message: 'RLS beta feedback test',
      route: '/more',
    })
    .select()
    .single()
  if (feedbackError) throw feedbackError
  const { data: hiddenFeedback, error: hiddenFeedbackError } = await userB
    .from('beta_feedback')
    .select('*')
    .eq('id', feedback.id)
  if (hiddenFeedbackError) throw hiddenFeedbackError
  assert(hiddenFeedback.length === 0, 'Akun B dapat membaca feedback akun A.')

  const { data: transferGroupId, error: transferError } = await userA.rpc('create_transfer', {
    source_wallet_id: walletA.id,
    destination_wallet_id: walletA2.id,
    transfer_amount: 100,
    transfer_date: new Date().toISOString().slice(0, 10),
    transfer_note: 'RLS transfer test',
  })
  if (transferError) throw transferError

  const { data: transferRows, error: transferRowsError } = await userA
    .from('transactions')
    .select('*')
    .eq('transfer_group_id', transferGroupId)
  if (transferRowsError) throw transferRowsError
  assert(transferRows.length === 2, 'Transfer tidak membuat tepat dua row.')

  const { data: otherUserTransfers, error: otherUserTransfersError } = await userB
    .from('transactions')
    .select('*')
    .eq('transfer_group_id', transferGroupId)
  if (otherUserTransfersError) throw otherUserTransfersError
  assert(otherUserTransfers.length === 0, 'Akun B dapat membaca transfer akun A.')

  const { error: foreignDeleteError } = await userB.rpc('delete_transaction', {
    target_transaction_id: transferRows[0].id,
  })
  if (foreignDeleteError) throw foreignDeleteError
  const { count: remainingAfterForeignDelete, error: countError } = await userA
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('transfer_group_id', transferGroupId)
  if (countError) throw countError
  assert(remainingAfterForeignDelete === 2, 'Akun B dapat menghapus transfer akun A.')

  const { error: ownDeleteError } = await userA.rpc('delete_transaction', {
    target_transaction_id: transferRows[0].id,
  })
  if (ownDeleteError) throw ownDeleteError
  const { data: balances, error: balancesError } = await userA
    .from('wallets')
    .select('id,balance')
    .in('id', [walletA.id, walletA2.id])
  if (balancesError) throw balancesError
  const balanceMap = Object.fromEntries(balances.map((wallet) => [wallet.id, Number(wallet.balance)]))
  assert(balanceMap[walletA.id] === 1000, 'Saldo sumber tidak kembali setelah transfer dihapus.')
  assert(balanceMap[walletA2.id] === 500, 'Saldo tujuan tidak kembali setelah transfer dihapus.')

  console.log(JSON.stringify({
    status: 'passed',
    checks: [
      'akun B tidak dapat membaca wallet akun A',
      'akun B tidak dapat mengubah wallet akun A',
      'user_id tidak dapat dipalsukan',
      'akun A dapat create/update/delete budget sendiri',
      'budget akun A tidak terlihat oleh akun B',
      'feedback akun A tidak terlihat oleh akun B',
      'transfer membuat dua row tertaut',
      'transfer tidak terlihat oleh akun B',
      'RPC akun B tidak dapat menghapus transfer akun A',
      'hapus transfer memulihkan kedua saldo',
    ],
  }, null, 2))
} finally {
  for (const user of users) {
    if (user.id) await admin.auth.admin.deleteUser(user.id)
  }
}

import type { User } from '@supabase/supabase-js'
import { emptyState } from './defaults'
import { createDefaultCategories } from '../i18n/regions'
import { FALLBACK_USD_TO_IDR_RATE } from '../lib/currency'
import { supabase } from '../lib/supabase'
import type {
  AppState,
  Budget,
  CategoryRule,
  Category,
  Debt,
  Goal,
  ImportedTransactionDraft,
  ImportSourceType,
  Profile,
  RecurringRule,
  ScannedDocument,
  Transaction,
  TransactionInput,
  TransferInput,
  Wallet,
} from '../types'

type Row = Record<string, any>

function client() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function safeFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'import-file'
}

function profileFromRow(row?: Row | null): Profile {
  if (!row) return emptyState.profile
  return {
    fullName: row.full_name ?? '',
    preferredLanguage: row.preferred_language ?? 'id-ID',
    locale: row.locale ?? 'id-ID',
    countryCode: row.country_code ?? 'ID',
    currency: row.currency ?? 'IDR',
    usdToIdrRate: Number(row.usd_to_idr_rate ?? FALLBACK_USD_TO_IDR_RATE),
    exchangeRateSource: row.exchange_rate_source ?? 'fallback',
    exchangeRateUpdatedAt: row.exchange_rate_updated_at ?? undefined,
    incomePattern: row.income_pattern ?? 'monthly',
    defaultIncomeDay: row.default_income_day ?? undefined,
    onboardingCompleted: Boolean(row.onboarding_completed),
  }
}

function walletFromRow(row: Row): Wallet {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    startingBalance: Number(row.starting_balance),
    currency: row.currency,
    includeInTotal: row.include_in_total,
    isArchived: row.is_archived,
    color: row.color ?? '#0b2447',
    createdAt: row.created_at,
  }
}

function categoryFromRow(row: Row): Category {
  return {
    id: row.id,
    localizationKey: row.localization_key ?? undefined,
    name: row.name,
    type: row.type === 'system' || row.type === 'transfer' ? 'system' : row.type,
    isDefault: row.is_default,
    isArchived: row.is_archived,
  }
}

function categoryRuleFromRow(row: Row): CategoryRule {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    language: row.language,
    matchType: row.match_type,
    pattern: row.pattern,
    categoryId: row.category_id,
    categoryName: row.category_name,
    priority: row.priority,
    isDefault: row.is_default,
    createdAt: row.created_at,
  }
}

function scannedDocumentFromRow(row: Row): ScannedDocument {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    fileName: row.file_name,
    filePath: row.file_path,
    fileType: row.file_type,
    fileSize: Number(row.file_size),
    sourceType: row.source_type,
    uploadStatus: row.upload_status,
    parseStatus: row.parse_status,
    rawText: row.raw_text ?? undefined,
    ocrProvider: row.ocr_provider ?? undefined,
    ocrConfidence: row.ocr_confidence ? Number(row.ocr_confidence) : undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function importedDraftFromRow(row: Row): ImportedTransactionDraft {
  return {
    id: row.id,
    scannedDocumentId: row.scanned_document_id,
    userId: row.user_id ?? undefined,
    type: row.type,
    amount: row.amount == null ? null : Number(row.amount),
    currency: row.currency,
    date: row.date ?? new Date().toISOString().slice(0, 10),
    merchant: row.merchant ?? undefined,
    description: row.description ?? undefined,
    note: row.note ?? undefined,
    categoryId: row.category_id ?? undefined,
    categoryName: row.category_name ?? undefined,
    accountId: row.account_id ?? undefined,
    confidence: Number(row.confidence ?? 0),
    duplicateCandidate: Boolean(row.duplicate_candidate),
    status: row.status,
    rawText: row.raw_text ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function transactionFromRow(row: Row): Transaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    categoryId: row.category_id ?? undefined,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency ?? undefined,
    exchangeRate: row.exchange_rate ? Number(row.exchange_rate) : undefined,
    amountInBaseCurrency: row.amount_in_base_currency ? Number(row.amount_in_base_currency) : undefined,
    adjustmentDirection: row.adjustment_direction ?? undefined,
    transactionDate: row.transaction_date,
    merchant: row.merchant ?? undefined,
    note: row.note ?? undefined,
    transferGroupId: row.transfer_group_id ?? undefined,
    relatedWalletId: row.related_wallet_id ?? undefined,
    createdAt: row.created_at,
  }
}

function recurringFromRow(row: Row): RecurringRule {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    amount: Number(row.amount),
    walletId: row.wallet_id ?? undefined,
    categoryId: row.category_id ?? undefined,
    frequency: row.frequency,
    nextDueDate: row.next_due_date,
    isActive: row.status === 'active',
  }
}

function budgetFromRow(row: Row, budgetItems: Row[] = []): Budget {
  const item = budgetItems.find((budgetItem) => budgetItem.budget_id === row.id)
  return {
    id: row.id,
    name: row.name,
    categoryId: item?.category_id ?? undefined,
    totalLimit: Number(row.total_limit),
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }
}

function goalFromRow(row: Row): Goal {
  return {
    id: row.id,
    name: row.name,
    walletId: row.linked_wallet_id ?? undefined,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    targetDate: row.target_date,
    monthlyContribution: Number(row.monthly_contribution),
    priority: row.priority,
  }
}

function debtFromRow(row: Row): Debt {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    lender: row.lender ?? undefined,
    originalAmount: Number(row.original_amount),
    remainingBalance: Number(row.remaining_balance),
    installmentAmount: Number(row.installment_amount),
    minimumPayment: Number(row.minimum_payment),
    dueDay: row.due_day,
    status: row.status === 'paid' ? 'paid' : 'active',
  }
}

async function ensureProfile(user: User) {
  const db = client()
  const { data, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (data) return data
  const { data: created, error: createError } = await db
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: user.user_metadata.full_name ?? '',
      preferred_language: user.user_metadata.preferred_language ?? 'en-US',
      locale: user.user_metadata.locale ?? 'en-US',
      country_code: user.user_metadata.country_code ?? 'GLOBAL',
      currency: user.user_metadata.currency ?? 'USD',
      usd_to_idr_rate: FALLBACK_USD_TO_IDR_RATE,
      exchange_rate_source: 'fallback',
      income_pattern: 'monthly',
      onboarding_completed: false,
    })
    .select()
    .single()
  if (createError) throw createError
  return created
}

function dedupeCategories(categories: Category[]) {
  const seen = new Set<string>()
  return categories.filter((category) => {
    const key = `${category.type}:${category.localizationKey ?? category.name.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function loadCloudState(user: User): Promise<AppState> {
  const db = client()
  const profileRow = await ensureProfile(user)
  const profile = profileFromRow(profileRow)
  await syncCloudDefaultCategories(profile.countryCode)
  const [
    wallets,
    categories,
    transactions,
    recurringRules,
    budgets,
    budgetItems,
    goals,
    debts,
    categoryRules,
  ] = await Promise.all([
    db.from('wallets').select('*').order('sort_order').order('created_at'),
    db.from('categories').select('*').order('sort_order').order('name'),
    db.from('transactions').select('*').order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
    db.from('recurring_rules').select('*').order('next_due_date'),
    db.from('budgets').select('*').order('period_start', { ascending: false }),
    db.from('budget_items').select('*'),
    db.from('goals').select('*').order('created_at'),
    db.from('debts').select('*').order('created_at'),
    db.from('category_rules').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('priority', { ascending: false }),
  ])
  const failed = [wallets, categories, transactions, recurringRules, budgets, budgetItems, goals, debts, categoryRules].find(
    (result) => result.error,
  )
  if (failed?.error) throw failed.error
  return {
    profile,
    wallets: (wallets.data ?? []).map(walletFromRow),
    categories: dedupeCategories((categories.data ?? []).map(categoryFromRow)),
    categoryRules: (categoryRules.data ?? []).map(categoryRuleFromRow),
    transactions: (transactions.data ?? []).map(transactionFromRow),
    recurringRules: (recurringRules.data ?? []).map(recurringFromRow),
    budgets: (budgets.data ?? []).map((budget) => budgetFromRow(budget, budgetItems.data ?? [])),
    goals: (goals.data ?? []).map(goalFromRow),
    debts: (debts.data ?? []).map(debtFromRow),
  }
}

export async function saveCloudProfile(userId: string, profile: Profile) {
  const { error } = await client().from('profiles').upsert({
    id: userId,
    full_name: profile.fullName,
    preferred_language: profile.preferredLanguage,
    locale: profile.locale,
    country_code: profile.countryCode,
    currency: profile.currency,
    usd_to_idr_rate: profile.usdToIdrRate,
    exchange_rate_source: profile.exchangeRateSource,
    exchange_rate_updated_at: profile.exchangeRateUpdatedAt ?? null,
    income_pattern: profile.incomePattern,
    default_income_day: profile.defaultIncomeDay ?? null,
    onboarding_completed: profile.onboardingCompleted,
  })
  if (error) throw error
}

export async function uploadCloudImportedDocument(file: File, sourceType: ImportSourceType) {
  const db = client()
  const { data: userData, error: userError } = await db.auth.getUser()
  if (userError || !userData.user) throw new Error('Sesi telah berakhir.')
  const documentId = crypto.randomUUID()
  const month = new Date().toISOString().slice(0, 7)
  const filePath = `${userData.user.id}/${month}/${documentId}-${safeFileName(file.name)}`
  const { error: uploadError } = await db.storage
    .from('transaction-imports')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })
  if (uploadError) throw uploadError
  const { data, error } = await db
    .from('scanned_documents')
    .insert({
      id: documentId,
      user_id: userData.user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
      source_type: sourceType,
      upload_status: 'uploaded',
      parse_status: 'pending',
    })
    .select()
    .single()
  if (error) {
    await db.storage.from('transaction-imports').remove([filePath])
    throw error
  }
  return scannedDocumentFromRow(data)
}

export async function processCloudImportedDocument(documentId: string, sourceType: ImportSourceType) {
  const { data, error } = await client().functions.invoke('process-receipt', {
    body: { documentId, sourceType },
  })
  if (error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json()
        const code = typeof payload?.error === 'string' ? payload.error : error.name
        const message = typeof payload?.message === 'string' ? payload.message : error.message
        throw new Error(`${code}: ${message}`)
      } catch (caught) {
        if (caught instanceof Error && caught.message !== error.message) throw caught
      }
    }
    throw error
  }
  if (data?.error) throw new Error(`${data.error}: ${data.message ?? data.error}`)
  return {
    document: data.document ? scannedDocumentFromRow(data.document) : undefined,
    drafts: ((data.drafts ?? []) as Row[]).map(importedDraftFromRow),
  }
}

export async function saveCloudCategoryRule(rule: CategoryRule) {
  const db = client()
  const { data: userData, error: userError } = await db.auth.getUser()
  if (userError || !userData.user) throw new Error('Sesi telah berakhir.')
  const payload = {
    user_id: userData.user.id,
    language: rule.language,
    match_type: rule.matchType,
    pattern: rule.pattern,
    category_id: rule.categoryId,
    category_name: rule.categoryName,
    priority: rule.priority,
    is_default: false,
  }
  const { data, error } = await db
    .from('category_rules')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return categoryRuleFromRow(data)
}

export async function saveCloudCurrencyConversion(userId: string, state: AppState) {
  const db = client()
  await saveCloudProfile(userId, state.profile)
  const updates = [
    ...state.wallets.filter((wallet) => isUuid(wallet.id)).map((wallet) =>
      db.from('wallets').update({
        starting_balance: wallet.startingBalance,
        currency: wallet.currency,
      }).eq('id', wallet.id),
    ),
    ...state.transactions.filter((transaction) => isUuid(transaction.id)).map((transaction) =>
      db.from('transactions').update({
        amount: Math.abs(transaction.amount),
        currency: transaction.currency ?? state.profile.currency,
        exchange_rate: transaction.exchangeRate ?? state.profile.usdToIdrRate,
        amount_in_base_currency: transaction.amountInBaseCurrency ?? null,
      }).eq('id', transaction.id),
    ),
    ...state.recurringRules.filter((rule) => isUuid(rule.id)).map((rule) =>
      db.from('recurring_rules').update({ amount: rule.amount }).eq('id', rule.id),
    ),
    ...state.budgets.filter((budget) => isUuid(budget.id)).flatMap((budget) => [
      db.from('budgets').update({ total_limit: budget.totalLimit }).eq('id', budget.id),
      db.from('budget_items').update({ planned_amount: budget.totalLimit }).eq('budget_id', budget.id),
    ]),
    ...state.goals.filter((goal) => isUuid(goal.id)).map((goal) =>
      db.from('goals').update({
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        monthly_contribution: goal.monthlyContribution,
      }).eq('id', goal.id),
    ),
    ...state.debts.filter((debt) => isUuid(debt.id)).map((debt) =>
      db.from('debts').update({
        original_amount: debt.originalAmount,
        remaining_balance: debt.remainingBalance,
        installment_amount: debt.installmentAmount,
        minimum_payment: debt.minimumPayment,
      }).eq('id', debt.id),
    ),
  ]
  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}

export async function syncCloudDefaultCategories(countryCode: Profile['countryCode']) {
  const db = client()
  const defaults = createDefaultCategories(countryCode)
  const { data, error } = await db.from('categories').select('id, localization_key').eq('is_default', true)
  if (error) throw error
  const existing = new Map((data ?? []).map((row) => [row.localization_key, row.id]))
  const updates = defaults.flatMap((category, index) => {
    const id = existing.get(category.localizationKey)
    return id ? [{
      id,
      name: category.name,
      localization_key: category.localizationKey,
      type: category.type,
      is_default: true,
      is_archived: false,
      sort_order: index,
    }] : []
  })
  const inserts = defaults.flatMap((category, index) => existing.has(category.localizationKey) ? [] : [{
    name: category.name,
    localization_key: category.localizationKey,
    type: category.type,
    is_default: true,
    is_archived: false,
    sort_order: index,
  }])
  if (updates.length) {
    const { error: updateError } = await db.from('categories').upsert(updates)
    if (updateError) throw updateError
  }
  if (inserts.length) {
    const { error: insertError } = await db.from('categories').upsert(inserts, {
      onConflict: 'user_id,localization_key,type',
      ignoreDuplicates: true,
    })
    if (insertError) throw insertError
  }
}

export async function saveCloudWallet(wallet: Wallet) {
  const payload = {
    name: wallet.name,
    type: wallet.type,
    starting_balance: wallet.startingBalance,
    currency: wallet.currency,
    include_in_total: wallet.includeInTotal,
    is_archived: wallet.isArchived,
    color: wallet.color,
  }
  const query = isUuid(wallet.id)
    ? client().from('wallets').upsert({ id: wallet.id, ...payload })
    : client().from('wallets').insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function createCloudTransaction(input: TransactionInput) {
  const { error } = await client().from('transactions').insert({
    wallet_id: input.walletId,
    category_id: input.categoryId ?? null,
    type: input.type,
    amount: Math.abs(input.amount),
    currency: input.currency ?? null,
    exchange_rate: input.exchangeRate ?? null,
    amount_in_base_currency: input.amountInBaseCurrency ?? null,
    adjustment_direction: input.adjustmentDirection ?? null,
    transaction_date: input.transactionDate,
    merchant: input.merchant ?? null,
    note: input.note ?? null,
  })
  if (error) throw error
}

export async function updateCloudTransaction(id: string, input: TransactionInput) {
  const { error } = await client()
    .from('transactions')
    .update({
      wallet_id: input.walletId,
      category_id: input.categoryId ?? null,
      type: input.type,
      amount: Math.abs(input.amount),
      currency: input.currency ?? null,
      exchange_rate: input.exchangeRate ?? null,
      amount_in_base_currency: input.amountInBaseCurrency ?? null,
      adjustment_direction: input.adjustmentDirection ?? null,
      transaction_date: input.transactionDate,
      merchant: input.merchant ?? null,
      note: input.note ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function createCloudTransfer(input: TransferInput) {
  const { error } = await client().rpc('create_transfer', {
    source_wallet_id: input.sourceWalletId,
    destination_wallet_id: input.destinationWalletId,
    transfer_amount: Math.abs(input.amount),
    transfer_date: input.transactionDate,
    transfer_note: input.note ?? null,
  })
  if (error) throw error
}

export async function updateCloudTransfer(groupId: string, input: TransferInput) {
  const { error } = await client().rpc('update_transfer', {
    target_transfer_group_id: groupId,
    source_wallet_id: input.sourceWalletId,
    destination_wallet_id: input.destinationWalletId,
    transfer_amount: Math.abs(input.amount),
    transfer_date: input.transactionDate,
    transfer_note: input.note ?? null,
  })
  if (error) throw error
}

export async function deleteCloudTransaction(id: string) {
  const { error } = await client().rpc('delete_transaction', {
    target_transaction_id: id,
  })
  if (error) throw error
}

export async function saveCloudRecurring(rule: RecurringRule) {
  const payload = {
    name: rule.name,
    type: rule.type,
    amount: rule.amount,
    wallet_id: rule.walletId ?? null,
    category_id: rule.categoryId ?? null,
    frequency: rule.frequency,
    next_due_date: rule.nextDueDate,
    status: rule.isActive ? 'active' : 'paused',
  }
  const query = isUuid(rule.id)
    ? client().from('recurring_rules').update(payload).eq('id', rule.id)
    : client().from('recurring_rules').insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function saveCloudBudget(budget: Budget) {
  const db = client()
  const payload = {
    name: budget.name,
    total_limit: budget.totalLimit,
    period_start: budget.periodStart,
    period_end: budget.periodEnd,
    mode: 'simple',
  }
  const query = isUuid(budget.id)
    ? db.from('budgets').upsert({ id: budget.id, ...payload }).select('id').single()
    : db.from('budgets').insert(payload).select('id').single()
  const { data, error } = await query
  if (error) throw error
  const budgetId = data.id
  const { error: deleteError } = await db.from('budget_items').delete().eq('budget_id', budgetId)
  if (deleteError) throw deleteError
  if (budget.categoryId) {
    const { error: itemError } = await db.from('budget_items').insert({
      budget_id: budgetId,
      category_id: budget.categoryId,
      planned_amount: budget.totalLimit,
    })
    if (itemError) throw itemError
  }
}

export async function saveCloudGoal(goal: Goal) {
  const payload = {
    name: goal.name,
    type: 'custom',
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    target_date: goal.targetDate,
    monthly_contribution: goal.monthlyContribution,
    linked_wallet_id: goal.walletId ?? null,
    priority: goal.priority,
    status: 'active',
  }
  const query = isUuid(goal.id)
    ? client().from('goals').update(payload).eq('id', goal.id)
    : client().from('goals').insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function saveCloudDebt(debt: Debt) {
  const payload = {
    name: debt.name,
    type: debt.type,
    lender: debt.lender ?? null,
    original_amount: debt.originalAmount,
    remaining_balance: debt.remainingBalance,
    installment_amount: debt.installmentAmount,
    minimum_payment: debt.minimumPayment,
    due_day: debt.dueDay,
    status: debt.status,
  }
  const query = isUuid(debt.id)
    ? client().from('debts').update(payload).eq('id', debt.id)
    : client().from('debts').insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function deleteCloudRecord(
  table: 'budgets' | 'recurring_rules' | 'goals' | 'debts',
  id: string,
) {
  const { error } = await client().from(table).delete().eq('id', id)
  if (error) throw error
}

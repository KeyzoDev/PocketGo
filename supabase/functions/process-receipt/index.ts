import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { OcrError, runOcr } from './ocrProvider.ts'
import { parseReceiptText, parseStatementText } from './receiptParser.ts'

type Row = Record<string, any>

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

function normalizeLanguage(language?: string) {
  if (language?.startsWith('en')) return 'en-US'
  return 'id-ID'
}

async function markFailed(db: any, documentId: string, status: 'failed' | 'unsupported', message: string, provider?: string) {
  await db
    .from('scanned_documents')
    .update({
      parse_status: status,
      error_message: message,
      ocr_provider: provider ?? null,
    })
    .eq('id', documentId)
}

async function isDuplicate(db: any, userId: string, draft: { date?: string; amount?: number | null; merchant?: string; description?: string; account_id?: string | null }) {
  if (!draft.date || !draft.amount) return false
  let query = db
    .from('transactions')
    .select('id, merchant, note')
    .eq('user_id', userId)
    .eq('transaction_date', draft.date)
    .eq('amount', draft.amount)
    .limit(10)
  if (draft.account_id) query = query.eq('wallet_id', draft.account_id)
  const { data } = await query
  const haystack = `${draft.merchant ?? ''} ${draft.description ?? ''}`.toLowerCase()
  return (data ?? []).some((transaction: Row) => {
    const existing = `${transaction.merchant ?? ''} ${transaction.note ?? ''}`.toLowerCase()
    return haystack && existing && (haystack.includes(existing) || existing.includes(haystack))
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405)

  const supabaseUrl = requiredEnv('SUPABASE_URL')
  const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const authHeader = request.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  if (!jwt) return jsonResponse({ error: 'UNAUTHENTICATED' }, 401)

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await db.auth.getUser(jwt)
  if (userError || !userData?.user) return jsonResponse({ error: 'UNAUTHENTICATED' }, 401)
  const userId = userData.user.id

  const { documentId, sourceType } = await request.json().catch(() => ({}))
  if (!documentId || !['receipt', 'bank_statement'].includes(sourceType)) {
    return jsonResponse({ error: 'INVALID_REQUEST' }, 400)
  }

  const { data: document, error: documentError } = await db
    .from('scanned_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .maybeSingle()
  if (documentError) return jsonResponse({ error: documentError.message }, 500)
  if (!document) return jsonResponse({ error: 'DOCUMENT_NOT_FOUND' }, 404)

  await db.from('scanned_documents').update({ parse_status: 'processing', error_message: null }).eq('id', documentId)

  const { data: profile } = await db
    .from('profiles')
    .select('preferred_language, currency')
    .eq('id', userId)
    .maybeSingle()
  const language = normalizeLanguage(profile?.preferred_language)
  const baseCurrency = profile?.currency ?? 'IDR'

  try {
    const { data: fileBlob, error: downloadError } = await db
      .storage
      .from('transaction-imports')
      .download(document.file_path)
    if (downloadError || !fileBlob) throw new OcrError('STORAGE_DOWNLOAD_FAILED', downloadError?.message ?? 'File could not be downloaded.')

    const buffer = new Uint8Array(await fileBlob.arrayBuffer())
    const ocr = await runOcr(buffer, document.file_type)

    const [{ data: categories }, { data: categoryRules }] = await Promise.all([
      db.from('categories').select('id, localization_key, name, type').eq('user_id', userId),
      db.from('category_rules').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('priority', { ascending: false }),
    ])

    const parsed = sourceType === 'receipt'
      ? [parseReceiptText(ocr.rawText, {
        language,
        baseCurrency,
        categories: categories ?? [],
        categoryRules: categoryRules ?? [],
        ocrConfidence: ocr.confidence,
      })]
      : parseStatementText(ocr.rawText, {
        language,
        baseCurrency,
        categories: categories ?? [],
        categoryRules: categoryRules ?? [],
        ocrConfidence: ocr.confidence,
      })

    if (!parsed.length) {
      await markFailed(db, documentId, 'unsupported', 'NO_DRAFTS_CREATED', ocr.provider)
      return jsonResponse({ error: 'NO_DRAFTS_CREATED', drafts: [] }, 422)
    }

    await db.from('imported_transaction_drafts').delete().eq('scanned_document_id', documentId).eq('user_id', userId)

    const rows = []
    for (const item of parsed) {
      const parsedItem = item as any
      const row = {
        user_id: userId,
        scanned_document_id: documentId,
        type: parsedItem.transactionType ?? parsedItem.type ?? 'expense',
        amount: parsedItem.amount,
        currency: parsedItem.currency ?? baseCurrency,
        date: parsedItem.date ?? null,
        merchant: parsedItem.merchant || null,
        description: parsedItem.description ?? parsedItem.items?.[0] ?? null,
        note: parsedItem.noteSuggestion ?? parsedItem.note ?? null,
        category_id: parsedItem.categorySuggestion?.categoryId ?? null,
        category_name: parsedItem.categorySuggestion?.categoryName ?? null,
        account_id: null,
        confidence: parsedItem.confidence ?? 0,
        duplicate_candidate: false,
        status: 'draft',
        raw_text: parsedItem.rawText ?? ocr.rawText,
        warnings: parsedItem.warnings ?? [],
        parsed_payload: parsedItem,
      }
      row.duplicate_candidate = await isDuplicate(db, userId, row)
      rows.push(row)
    }

    const { data: drafts, error: insertError } = await db
      .from('imported_transaction_drafts')
      .insert(rows)
      .select('*')
    if (insertError) throw insertError

    const parseStatus = rows.some((row) => row.amount) ? 'parsed' : 'failed'
    await db
      .from('scanned_documents')
      .update({
        parse_status: parseStatus,
        raw_text: ocr.rawText,
        ocr_provider: ocr.provider,
        ocr_confidence: ocr.confidence ?? null,
        error_message: parseStatus === 'failed' ? 'AMOUNT_NOT_FOUND' : null,
      })
      .eq('id', documentId)

    return jsonResponse({
      document: {
        ...document,
        parse_status: parseStatus,
        raw_text: ocr.rawText,
        ocr_provider: ocr.provider,
        ocr_confidence: ocr.confidence,
      },
      drafts: drafts ?? [],
    })
  } catch (caught) {
    const code = caught instanceof OcrError ? caught.code : 'PROCESSING_FAILED'
    const status = code === 'OCR_NOT_CONFIGURED' || code === 'OCR_UNSUPPORTED_FILE' ? 'unsupported' : 'failed'
    const message = caught instanceof Error ? caught.message : 'Processing failed.'
    await markFailed(db, documentId, status, `${code}: ${message}`, caught instanceof OcrError ? undefined : 'unknown')
    return jsonResponse({ error: code, message }, code === 'OCR_NOT_CONFIGURED' ? 501 : 422)
  }
})

import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Modal } from './Modal'
import { PremiumIcon } from './PremiumIcon'
import { useLocalization } from '../i18n'
import { localizedCategoryName } from '../i18n/regions'
import { formatCurrency, formatNumber } from '../lib/format'
import { createId } from '../lib/id'
import { parseReceiptFile, parseStatementFile } from '../lib/importParser'
import { useAppStore } from '../store/useAppStore'
import type { CategoryRule, ImportedDraftType, ImportedTransactionDraft, ImportSourceType, ScannedDocument } from '../types'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${bytes} B`
}

function confidenceLevel(value: number) {
  if (value >= 0.78) return 'high'
  if (value >= 0.55) return 'medium'
  return 'low'
}

function inputAmount(value: number | null) {
  return value != null && Number.isFinite(value) && value > 0 ? String(value) : ''
}

export function ImportTransactionsModal({
  open,
  initialSource = 'receipt',
  onClose,
  onManualEntry,
}: {
  open: boolean
  initialSource?: ImportSourceType
  onClose: () => void
  onManualEntry?: () => void
}) {
  const {
    state,
    createTransaction,
    saveCategoryRule,
    isDemoMode,
    isCloudMode,
    session,
    uploadImportedDocument,
    processImportedDocument,
  } = useAppStore()
  const { t, locale, currency, language } = useLocalization()
  const categoryLocale = language === 'id-ID' ? 'ID' : 'GLOBAL'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sourceType, setSourceType] = useState<ImportSourceType>(initialSource)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [document, setDocument] = useState<ScannedDocument | null>(null)
  const [drafts, setDrafts] = useState<ImportedTransactionDraft[]>([])
  const [initialCategoryByDraft, setInitialCategoryByDraft] = useState<Record<string, string | undefined>>({})
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [success, setSuccess] = useState('')
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeWallets = state.wallets.filter((wallet) => !wallet.isArchived)
  const accept = useMemo(() => Array.from(SUPPORTED_TYPES).join(','), [])
  const categories = useMemo(
    () => state.categories.filter((category) => !category.isArchived && (category.type === 'income' || category.type === 'expense')),
    [state.categories],
  )

  function resetDrafts() {
    setDocument(null)
    setDrafts([])
    setInitialCategoryByDraft({})
    setSelectedDraftIds(new Set())
    setSuccess('')
  }

  function upload(nextSourceType: ImportSourceType) {
    setSourceType(nextSourceType)
    setError('')
    setStatus('')
    setSuccess('')
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setError('')
    setStatus('')
    resetDrafts()
    if (!file) return
    if (!SUPPORTED_TYPES.has(file.type)) {
      setSelectedFile(null)
      setError(t('import.unsupportedType'))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null)
      setError(t('import.tooLarge'))
      return
    }
    setSelectedFile(file)
    setStatus(t('import.uploading'))
    try {
      const uploaded = await uploadImportedDocument(file, sourceType)
      setDocument(uploaded)
      setSuccess(t('import.previewReady'))
    } catch {
      setSelectedFile(null)
      setDocument(null)
      setError(t('import.uploadFailed'))
    } finally {
      setStatus('')
    }
  }

  async function processFile() {
    if (!selectedFile) {
      setError(t('import.uploadRequired'))
      return
    }
    setError('')
    setSuccess('')
    setProcessing(true)
    setStatus(sourceType === 'receipt' ? t('import.readingReceipt') : t('import.analyzingTransactions'))
    try {
      const useCloudOcr = isCloudMode && !isDemoMode && Boolean(session)
      const result = useCloudOcr && document?.id
        ? await processImportedDocument(document.id, sourceType)
        : sourceType === 'receipt'
          ? await parseReceiptFile(selectedFile, { state, language, currency, isDemoMode })
          : await parseStatementFile(selectedFile, { state, language, currency, isDemoMode })
      setDocument(result.document ?? document)
      setDrafts(result.drafts)
      setInitialCategoryByDraft(Object.fromEntries(result.drafts.map((draft) => [draft.id, draft.categoryId])))
      setSelectedDraftIds(new Set(result.drafts.filter((draft) => !draft.duplicateCandidate && draft.type !== 'unknown').map((draft) => draft.id)))
      if (!result.drafts.length) {
        const unsupportedReason = 'unsupportedReason' in result ? result.unsupportedReason : undefined
        setError(unsupportedReason === 'no_amount' ? t('import.notClear') : t('import.automaticUnavailable'))
      } else {
        setSuccess(t('import.draftCreated'))
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ''
      const detail = message.includes(':') ? message.split(':').slice(1).join(':').trim() : ''
      if (message.includes('OCR_NOT_CONFIGURED')) {
        setError(t('import.ocrNotConfigured'))
      } else if (message.includes('OCR_UNSUPPORTED_FILE')) {
        setError(t('import.ocrUnsupportedFile'))
      } else if (message.includes('OCR_NO_TEXT')) {
        setError(t('import.ocrNoText'))
      } else if (message.includes('OCR_PROVIDER_FAILED')) {
        setError(detail ? `${t('import.ocrProviderFailed')} Detail: ${detail}` : t('import.ocrProviderFailed'))
      } else if (message.includes('STORAGE_DOWNLOAD_FAILED')) {
        setError(t('import.storageDownloadFailed'))
      } else {
        setError(t('import.failedProcess'))
      }
    } finally {
      setStatus('')
      setProcessing(false)
    }
  }

  function updateDraft(id: string, patch: Partial<ImportedTransactionDraft>) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...patch, updatedAt: new Date().toISOString() } : draft))
  }

  function categoryOptions(type: ImportedDraftType) {
    const safeType = type === 'income' ? 'income' : 'expense'
    return categories.filter((category) => category.type === safeType)
  }

  function draftCategoryChanged(draft: ImportedTransactionDraft) {
    return Boolean(draft.categoryId && initialCategoryByDraft[draft.id] && draft.categoryId !== initialCategoryByDraft[draft.id])
  }

  async function rememberRule(draft: ImportedTransactionDraft) {
    const category = state.categories.find((item) => item.id === draft.categoryId)
    if (!category || !(draft.merchant || draft.description)) return
    const rule: CategoryRule = {
      id: createId('rule'),
      language,
      matchType: draft.merchant ? 'merchant_contains' : 'keyword_contains',
      pattern: (draft.merchant || draft.description || '').toLowerCase().slice(0, 80),
      categoryId: category.id,
      categoryName: localizedCategoryName(category.localizationKey, category.name, categoryLocale),
      priority: 90,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    await saveCategoryRule(rule)
    setInitialCategoryByDraft((current) => ({ ...current, [draft.id]: draft.categoryId }))
    setSuccess(t('import.ruleSaved'))
  }

  async function saveDraft(draft: ImportedTransactionDraft) {
    if (draft.type !== 'income' && draft.type !== 'expense') throw new Error(t('import.typeRequired'))
    if (!draft.accountId) throw new Error(t('validation.walletRequired'))
    if (!draft.amount || draft.amount <= 0) throw new Error(t('validation.transactionAmountRequired'))
    if (!draft.categoryId) throw new Error(t('validation.categoryRequired'))
    await createTransaction({
      walletId: draft.accountId,
      categoryId: draft.categoryId,
      type: draft.type,
      amount: Math.abs(draft.amount),
      currency: draft.currency,
      transactionDate: draft.date,
      merchant: draft.merchant || draft.description || undefined,
      note: draft.note || draft.description || undefined,
    })
    updateDraft(draft.id, { status: 'saved' })
  }

  async function saveOne(draft: ImportedTransactionDraft) {
    setError('')
    setSaving(true)
    try {
      await saveDraft(draft)
      setSuccess(t('import.saved'))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('entry.failed'))
    } finally {
      setSaving(false)
    }
  }

  async function saveSelected() {
    setError('')
    setSaving(true)
    try {
      const selected = drafts.filter((draft) => selectedDraftIds.has(draft.id) && draft.status !== 'saved' && draft.status !== 'rejected')
      if (!selected.length) throw new Error(t('import.noSelected'))
      for (const draft of selected) await saveDraft(draft)
      setSuccess(t('import.saved'))
      setSelectedDraftIds(new Set())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('entry.failed'))
    } finally {
      setSaving(false)
    }
  }

  const receiptDraft = sourceType === 'receipt' ? drafts[0] : undefined
  const hasReview = drafts.length > 0

  return (
    <Modal open={open} title={hasReview ? (sourceType === 'receipt' ? t('import.reviewTitle') : t('import.reviewImportTitle')) : t('import.title')} onClose={onClose}>
      <div className="form-stack import-flow">
        {!hasReview ? (
          <>
            <p className="modal-copy">{t('import.body')}</p>
            <input ref={fileInputRef} type="file" accept={accept} className="visually-hidden" onChange={handleFileChange} />
            <div className="import-actions">
              <button className="secondary-button" type="button" onClick={() => upload('receipt')}>
                <PremiumIcon name="scan" variant="utility" tone="purple" size="xs" /> {t('import.scanReceipt')}
              </button>
              <button className="secondary-button" type="button" onClick={() => upload('bank_statement')}>
                <PremiumIcon name="import" variant="utility" tone="blue" size="xs" /> {t('import.uploadStatement')}
              </button>
            </div>
            <button className="primary-button" type="button" onClick={() => upload(sourceType)}>
              <PremiumIcon name="upload" variant="utility" tone="green" size="xs" /> {t('import.uploadFile')}
            </button>
            <small className="import-hint">{t('import.supported')}</small>
            {selectedFile ? (
              <article className="import-preview-card">
                <PremiumIcon name="receipt" variant="transaction" tone="green" size="md" />
                <div>
                  <strong>{selectedFile.name}</strong>
                  <small>{selectedFile.type} · {formatFileSize(selectedFile.size)}</small>
                  <p>{t('import.previewReady')}</p>
                </div>
                <button type="button" aria-label={t('import.removeFile')} onClick={() => { setSelectedFile(null); resetDrafts() }}>
                  <Trash2 size={16} />
                </button>
              </article>
            ) : (
              <div className="inline-notice">{t('import.emptyHint')}</div>
            )}
            {status ? <div className="inline-notice">{status}</div> : null}
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            {success ? <p className="form-success" role="status">{success}</p> : null}
            <div className="action-row sticky-import-actions">
              <button className="secondary-button" type="button" onClick={onManualEntry ?? onClose}>{t('import.addManual')}</button>
              <button className="primary-button" type="button" disabled={!selectedFile || processing} onClick={processFile}>
                {processing ? t('common.processing') : sourceType === 'receipt' ? t('import.processReceipt') : t('import.processStatement')}
              </button>
            </div>
          </>
        ) : receiptDraft ? (
          <>
            <p className="modal-copy">{t('import.reviewSubtitle')}</p>
            <section className="scan-review-hero">
              <small>{t('entry.amount')}</small>
              <strong>{receiptDraft.amount ? formatCurrency(receiptDraft.amount, receiptDraft.currency, locale) : t('import.amountMissing')}</strong>
              <span className={`confidence-badge ${confidenceLevel(receiptDraft.confidence)}`}>{t(`import.confidence.${confidenceLevel(receiptDraft.confidence)}` as Parameters<typeof t>[0])}</span>
            </section>
            {confidenceLevel(receiptDraft.confidence) === 'low' ? <div className="inline-notice danger">{t('import.lowConfidenceWarning')}</div> : null}
            {!receiptDraft.amount ? <div className="inline-notice danger">{t('import.amountMissingWarning')}</div> : null}
            <div className="form-grid">
              <label>{t('entry.type')}
                <select value={receiptDraft.type} onChange={(event) => updateDraft(receiptDraft.id, { type: event.target.value as ImportedDraftType, categoryId: '' })}>
                  <option value="expense">{t('transactions.expense')}</option>
                  <option value="income">{t('transactions.income')}</option>
                </select>
              </label>
              <label>{t('entry.amount')}
                <input inputMode="decimal" value={inputAmount(receiptDraft.amount)} onChange={(event) => updateDraft(receiptDraft.id, { amount: Number(event.target.value.replace(/[^\d.]/g, '')) || null })} />
              </label>
              <label>{t('entry.date')}
                <input type="date" value={receiptDraft.date} onChange={(event) => updateDraft(receiptDraft.id, { date: event.target.value })} />
              </label>
              <label>{t('entry.wallet')}
                <select value={receiptDraft.accountId ?? ''} onChange={(event) => updateDraft(receiptDraft.id, { accountId: event.target.value })}>
                  <option value="">{t('entry.selectWallet')}</option>
                  {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                </select>
              </label>
            </div>
            <label>{t('entry.merchant')}
              <input value={receiptDraft.merchant ?? ''} onChange={(event) => updateDraft(receiptDraft.id, { merchant: event.target.value })} />
            </label>
            <label>{t('entry.category')}
              <select value={receiptDraft.categoryId ?? ''} onChange={(event) => updateDraft(receiptDraft.id, { categoryId: event.target.value, categoryName: state.categories.find((item) => item.id === event.target.value)?.name })}>
                <option value="">{t('validation.categoryRequired')}</option>
                {categoryOptions(receiptDraft.type).map((category) => <option key={category.id} value={category.id}>{localizedCategoryName(category.localizationKey, category.name, categoryLocale)}</option>)}
              </select>
            </label>
            <label>{t('entry.note')}
              <textarea rows={2} value={receiptDraft.note ?? ''} onChange={(event) => updateDraft(receiptDraft.id, { note: event.target.value })} />
            </label>
            <div className="scan-meta">
              <span>{t('import.sourceFile')}: {document?.fileName}</span>
              <span>{t('import.confidenceLabel')}: {formatNumber(Math.round(receiptDraft.confidence * 100), locale)}%</span>
              {receiptDraft.duplicateCandidate ? <b>{t('import.possibleDuplicate')}</b> : null}
            </div>
            {draftCategoryChanged(receiptDraft) ? (
              <div className="learning-rule-card">
                <strong>{t('import.rememberChoice')}</strong>
                <p>{t('import.rememberChoiceBody', { merchant: receiptDraft.merchant ?? receiptDraft.description ?? '-', category: state.categories.find((item) => item.id === receiptDraft.categoryId)?.name ?? '-' })}</p>
                <div className="action-row">
                  <button className="secondary-button" type="button" onClick={() => rememberRule(receiptDraft)}>{t('import.remember')}</button>
                  <button className="secondary-button" type="button" onClick={() => setInitialCategoryByDraft((current) => ({ ...current, [receiptDraft.id]: receiptDraft.categoryId }))}>{t('import.notNow')}</button>
                </div>
              </div>
            ) : null}
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            {success ? <p className="form-success" role="status">{success}</p> : null}
            <div className="action-row sticky-import-actions">
              <button className="secondary-button" type="button" onClick={() => { resetDrafts(); setSelectedFile(null) }}><RotateCcw size={16} /> {t('import.scanAgain')}</button>
              <button className="secondary-button" type="button" onClick={onClose}>{t('common.cancel')}</button>
              <button className="primary-button" type="button" disabled={saving || receiptDraft.status === 'saved' || !receiptDraft.amount} onClick={() => saveOne(receiptDraft)}>{receiptDraft.status === 'saved' ? t('import.saved') : t('import.saveTransaction')}</button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-copy">{t('import.reviewImportSubtitle')}</p>
            <div className="action-row">
              <button className="secondary-button" type="button" onClick={() => setSelectedDraftIds(new Set(drafts.filter((draft) => !draft.duplicateCandidate && draft.type !== 'unknown').map((draft) => draft.id)))}>{t('import.approveAll')}</button>
              <button className="primary-button" type="button" disabled={saving} onClick={saveSelected}>{t('import.saveSelected')}</button>
            </div>
            <div className="import-draft-list">
              {drafts.map((draft) => (
                <article key={draft.id} className={draft.status === 'rejected' ? 'rejected' : ''}>
                  <label className="draft-check">
                    <input
                      type="checkbox"
                      checked={selectedDraftIds.has(draft.id)}
                      disabled={draft.duplicateCandidate || draft.status === 'saved' || draft.status === 'rejected'}
                      onChange={(event) => setSelectedDraftIds((current) => {
                        const next = new Set(current)
                        if (event.target.checked) next.add(draft.id)
                        else next.delete(draft.id)
                        return next
                      })}
                    />
                    <span>
                      <strong>{draft.description || draft.merchant || t('transactions.thisTransaction')}</strong>
                      <small>{draft.date} · {draft.amount ? formatCurrency(draft.amount, draft.currency, locale) : t('import.amountMissing')}</small>
                    </span>
                  </label>
                  <div className="form-grid compact">
                    <select value={draft.type} onChange={(event) => updateDraft(draft.id, { type: event.target.value as ImportedDraftType, categoryId: '' })}>
                      <option value="income">{t('transactions.income')}</option>
                      <option value="expense">{t('transactions.expense')}</option>
                      <option value="unknown">{t('import.unknownType')}</option>
                    </select>
                    <select value={draft.categoryId ?? ''} onChange={(event) => updateDraft(draft.id, { categoryId: event.target.value })}>
                      <option value="">{t('validation.categoryRequired')}</option>
                      {categoryOptions(draft.type).map((category) => <option key={category.id} value={category.id}>{localizedCategoryName(category.localizationKey, category.name, categoryLocale)}</option>)}
                    </select>
                    <select value={draft.accountId ?? ''} onChange={(event) => updateDraft(draft.id, { accountId: event.target.value })}>
                      <option value="">{t('entry.selectWallet')}</option>
                      {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                    </select>
                  </div>
                  <div className="scan-meta">
                    <span className={`confidence-badge ${confidenceLevel(draft.confidence)}`}>{t(`import.confidence.${confidenceLevel(draft.confidence)}` as Parameters<typeof t>[0])}</span>
                    {draft.duplicateCandidate ? <b>{t('import.possibleDuplicate')}</b> : null}
                    {draft.status === 'saved' ? <b><CheckCircle2 size={14} /> {t('import.saved')}</b> : null}
                  </div>
                  <div className="action-row">
                    <button className="secondary-button" type="button" onClick={() => updateDraft(draft.id, { status: 'rejected' })}>{t('import.reject')}</button>
                    <button className="secondary-button" type="button" disabled={draft.status === 'saved'} onClick={() => saveOne(draft)}>{t('import.saveTransaction')}</button>
                  </div>
                </article>
              ))}
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            {success ? <p className="form-success" role="status">{success}</p> : null}
            <div className="action-row sticky-import-actions">
              <button className="secondary-button" type="button" onClick={() => { resetDrafts(); setSelectedFile(null) }}>{t('import.scanAgain')}</button>
              <button className="secondary-button" type="button" onClick={onClose}>{t('common.close')}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

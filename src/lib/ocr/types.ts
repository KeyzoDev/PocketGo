import type { CategoryRule, ImportedTransactionDraft, ScannedDocument } from '../../types'

export type OcrResult = {
  rawText: string
  confidence?: number
  provider: string
  error?: string
}

export type ReceiptParseOutput = {
  document?: ScannedDocument
  drafts: ImportedTransactionDraft[]
}

export type CategoryRuleInput = CategoryRule

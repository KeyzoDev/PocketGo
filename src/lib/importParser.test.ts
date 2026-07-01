import { describe, expect, it } from 'vitest'
import { createDemoState } from '../data/defaults'
import { isDuplicateDraft, parseReceiptFile, parseReceiptText, suggestCategory } from './importParser'

describe('import parser', () => {
  it('suggests Makan & Minum for Nasi Padang receipt keywords', async () => {
    const state = createDemoState({ language: 'id-ID', locale: 'id-ID', countryCode: 'ID', currency: 'IDR' })
    const suggestion = suggestCategory({
      merchant: 'Nasi Padang Sederhana',
      rawText: 'Nasi Padang Sederhana total Rp 28.000',
      type: 'expense',
      language: 'id-ID',
      categories: state.categories,
      userRules: [],
    })

    expect(suggestion.categoryName).toBe('Makan & Minum')

    const file = new File([''], 'nasi-padang-sederhana-rp-28000.jpg', { type: 'image/jpeg' })
    const result = await parseReceiptFile(file, {
      state,
      language: 'id-ID',
      currency: 'IDR',
      isDemoMode: true,
    })

    expect(result.drafts).toHaveLength(1)
    expect(result.drafts[0].type).toBe('expense')
    expect(result.drafts[0].amount).toBe(28000)
    expect(result.drafts[0].categoryName).toBe('Makan & Minum')
  })

  it('marks similar same-date same-amount transactions as duplicate candidates', () => {
    const state = createDemoState({ language: 'id-ID', locale: 'id-ID', countryCode: 'ID', currency: 'IDR' })
    const transaction = state.transactions.find((item) => item.merchant === 'Makan di Cafe')
    expect(transaction).toBeTruthy()
    expect(isDuplicateDraft({
      date: transaction!.transactionDate,
      amount: transaction!.amount,
      merchant: transaction!.merchant,
      description: transaction!.note,
      accountId: transaction!.walletId,
    }, state.transactions)).toBe(true)
  })

  it('parses OCR receipt text totals without using filename as merchant', () => {
    const state = createDemoState({ language: 'id-ID', locale: 'id-ID', countryCode: 'ID', currency: 'IDR' })
    const parsed = parseReceiptText('Nasi Padang Sederhana\n29/06/2026\nTOTAL Rp 28.000', {
      state,
      language: 'id-ID',
      currency: 'IDR',
    })

    expect(parsed.amount).toBe(28000)
    expect(parsed.currency).toBe('IDR')
    expect(parsed.merchant).toBe('Nasi Padang Sederhana')
    expect(parsed.categorySuggestion.categoryName).toBe('Makan & Minum')

    const generic = parseReceiptText('TOTAL Rp 28.000', {
      state,
      language: 'id-ID',
      currency: 'IDR',
    })
    expect(generic.merchant).toBe('')
  })

  it('parses USD receipt total and reports missing amount warning', () => {
    const state = createDemoState({ language: 'en-US', locale: 'en-US', countryCode: 'GLOBAL', currency: 'USD' })
    expect(parseReceiptText('Starbucks\nTOTAL $6.50', {
      state,
      language: 'en-US',
      currency: 'USD',
    }).amount).toBe(6.5)

    const missing = parseReceiptText('Starbucks\nThank you', {
      state,
      language: 'en-US',
      currency: 'USD',
    })
    expect(missing.amount).toBeNull()
    expect(missing.warnings).toContain('AMOUNT_NOT_FOUND')
  })

  it('suggests expected Indonesian OCR categories', () => {
    const state = createDemoState({ language: 'id-ID', locale: 'id-ID', countryCode: 'ID', currency: 'IDR' })
    const base = { language: 'id-ID' as const, categories: state.categories, userRules: [] }
    expect(suggestCategory({ ...base, type: 'expense', rawText: 'Indomie Goreng' }).categoryName).toBe('Makan & Minum')
    expect(suggestCategory({ ...base, type: 'expense', rawText: 'PLN Pascabayar' }).categoryName).toBe('Tagihan')
    expect(suggestCategory({ ...base, type: 'expense', rawText: 'Indihome Internet' }).categoryName).toBe('Internet')
    expect(suggestCategory({ ...base, type: 'expense', rawText: 'Unknown Merchant' }).categoryName).toBe('Lainnya')
  })
})

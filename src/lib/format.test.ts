import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatNumber, parseAmount } from './format'

describe('locale formatting', () => {
  it('formats IDR using Indonesian separators', () => {
    expect(formatCurrency(12_450_000, 'IDR', 'id-ID')).toContain('12.450.000')
  })

  it('formats USD using English separators and decimals', () => {
    expect(formatCurrency(12_450, 'USD', 'en-US')).toBe('$12,450.00')
  })

  it('formats dates and numbers using the selected locale', () => {
    expect(formatDate('2026-06-21', 'id-ID', { dateStyle: 'long' })).toBe('21 Juni 2026')
    expect(formatDate('2026-06-21', 'en-US', { dateStyle: 'long' })).toBe('June 21, 2026')
    expect(formatNumber(12_450.75, 'en-US')).toBe('12,450.75')
  })

  it('parses localized amount input', () => {
    expect(parseAmount('1.250,50', 'id-ID')).toBe(1250.5)
    expect(parseAmount('1,250.50', 'en-US')).toBe(1250.5)
  })
})

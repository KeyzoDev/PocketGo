import type { Category, CountryCode, SupportedLocale } from '../../types'

export interface RegionConfig {
  countryCode: CountryCode
  locale: SupportedLocale
  defaultCurrency: string
  walletExamples: string[]
  expenseCategories: Array<[string, string]>
  incomeCategories: Array<[string, string]>
}

const indonesia: RegionConfig = {
  countryCode: 'ID',
  locale: 'id-ID',
  defaultCurrency: 'IDR',
  walletExamples: ['Cash', 'BCA', 'Mandiri', 'BRI', 'BNI', 'SeaBank', 'Jago', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'Kartu Kredit', 'PayLater', 'Tabungan', 'Investasi', 'Usaha'],
  expenseCategories: [
    ['food_drinks', 'Makan & Minum'], ['groceries', 'Belanja Dapur'], ['transport', 'Transportasi'],
    ['fuel', 'Bensin'], ['bills', 'Tagihan'], ['housing', 'Kontrakan / KPR'], ['utilities', 'Listrik'],
    ['internet', 'Internet'], ['phone', 'Pulsa / Data'], ['family', 'Keluarga'], ['health', 'Kesehatan'],
    ['debt_payment', 'Cicilan'], ['credit_card', 'Kartu Kredit'], ['bnpl', 'PayLater'],
    ['shopping', 'Belanja'], ['online_shopping', 'Belanja Online'], ['entertainment', 'Hiburan'],
    ['social', 'Nongkrong'], ['education', 'Pendidikan'], ['children', 'Anak'],
    ['charity', 'Donasi / Sedekah'], ['business', 'Usaha'], ['maintenance', 'Maintenance'],
    ['subscription', 'Subscription'], ['emergency', 'Darurat'], ['fees', 'Biaya Admin'],
    ['cash_withdrawal', 'Tarik Tunai'], ['other_expense', 'Lainnya'],
  ],
  incomeCategories: [
    ['salary', 'Gaji'], ['business_income', 'Usaha'], ['freelance', 'Freelance'], ['bonus', 'Bonus'],
    ['gift', 'Hadiah'], ['cashback', 'Cashback'], ['investment_income', 'Investasi'],
    ['debt_repayment_received', 'Piutang Dibayar'], ['allowance', 'Uang Saku'], ['other_income', 'Lainnya'],
  ],
}

const globalEnglish: RegionConfig = {
  countryCode: 'GLOBAL',
  locale: 'en-US',
  defaultCurrency: 'USD',
  walletExamples: ['Cash', 'Checking', 'Savings', 'Credit Card', 'Debit Card', 'Digital Wallet', 'Investment', 'Business', 'Loan', 'Other'],
  expenseCategories: [
    ['food_drinks', 'Food & Drinks'], ['groceries', 'Groceries'], ['transport', 'Transport'], ['fuel', 'Fuel'],
    ['bills', 'Bills'], ['housing', 'Rent / Housing'], ['utilities', 'Utilities'], ['internet', 'Internet'],
    ['phone', 'Phone'], ['family', 'Family Support'], ['health', 'Health'], ['debt_payment', 'Debt Payment'],
    ['credit_card', 'Credit Card'], ['bnpl', 'Buy Now Pay Later'], ['shopping', 'Shopping'],
    ['online_shopping', 'Online Shopping'], ['entertainment', 'Entertainment'], ['social', 'Social'],
    ['education', 'Education'], ['children', 'Children'], ['charity', 'Donation / Charity'],
    ['business', 'Business Expense'], ['maintenance', 'Maintenance / Repair'], ['subscription', 'Subscription'],
    ['emergency', 'Emergency'], ['fees', 'Fees'], ['cash_withdrawal', 'Cash Withdrawal'], ['other_expense', 'Other'],
  ],
  incomeCategories: [
    ['salary', 'Salary'], ['business_income', 'Business Income'], ['freelance', 'Freelance'], ['bonus', 'Bonus'],
    ['gift', 'Gift'], ['cashback', 'Cashback'], ['investment_income', 'Investment Income'],
    ['debt_repayment_received', 'Debt Repayment Received'], ['allowance', 'Allowance'], ['other_income', 'Other'],
  ],
}

export const regions: Record<CountryCode, RegionConfig> = {
  ID: indonesia,
  US: { ...globalEnglish, countryCode: 'US' },
  GLOBAL: globalEnglish,
}

export function createDefaultCategories(countryCode: CountryCode): Category[] {
  const region = regions[countryCode]
  return [
    ...region.expenseCategories.map(([localizationKey, name], index) => ({
      id: `expense_${index}`,
      localizationKey,
      name,
      type: 'expense' as const,
      isDefault: true,
      isArchived: false,
    })),
    ...region.incomeCategories.map(([localizationKey, name], index) => ({
      id: `income_${index}`,
      localizationKey,
      name,
      type: 'income' as const,
      isDefault: true,
      isArchived: false,
    })),
    {
      id: 'system_adjustment',
      localizationKey: 'balance_adjustment',
      name: countryCode === 'ID' ? 'Penyesuaian Saldo' : 'Balance Correction',
      type: 'system' as const,
      isDefault: true,
      isArchived: false,
    },
  ]
}

export function localizedCategoryName(key: string | undefined, fallback: string, countryCode: CountryCode) {
  if (!key) return fallback
  const region = regions[countryCode]
  return [...region.expenseCategories, ...region.incomeCategories].find(([item]) => item === key)?.[1]
    ?? (key === 'balance_adjustment' ? (countryCode === 'ID' ? 'Penyesuaian Saldo' : 'Balance Correction') : fallback)
}

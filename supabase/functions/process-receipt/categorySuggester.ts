type Rule = {
  id?: string
  user_id?: string | null
  language: string
  match_type: 'merchant_exact' | 'merchant_contains' | 'keyword_contains' | 'regex'
  pattern: string
  category_id: string
  category_name: string
  priority: number
  is_default?: boolean
}

type Category = {
  id: string
  localization_key?: string | null
  name: string
  type: 'income' | 'expense' | 'system' | 'transfer'
}

const keywordRules: Record<string, Record<'income' | 'expense', Record<string, string[]>>> = {
  'id-ID': {
    income: {
      salary: ['gaji', 'salary', 'payroll'],
      business_income: ['usaha', 'wifi customer', 'pelanggan', 'invoice', 'provider', 'maintenance', 'bisnis', 'revenue'],
      freelance: ['freelance', 'project'],
      bonus: ['bonus'],
      cashback: ['cashback'],
      other_income: [],
    },
    expense: {
      food_drinks: ['nasi', 'nasi padang', 'padang', 'warung', 'restoran', 'resto', 'cafe', 'coffee', 'kopi', 'ayam', 'bakso', 'mie', 'indomie', 'martabak', 'grabfood', 'gofood', 'shopeefood', 'makan', 'minum', 'starbucks', 'fore', 'janji jiwa', 'kfc', 'mcd', 'hokben'],
      transport: ['grab', 'gojek', 'gocar', 'goride', 'maxim', 'taxi', 'tol', 'parkir', 'mrt', 'krl', 'transjakarta'],
      fuel: ['pertamina', 'shell', 'bp akr', 'vivo', 'spbu', 'bensin', 'solar', 'pertamax'],
      groceries: ['alfamart', 'indomaret', 'superindo', 'hypermart', 'lotte', 'ranch market', 'sayur', 'telur', 'beras', 'galon', 'groceries'],
      bills: ['pln', 'listrik', 'pdam', 'bpjs', 'tagihan', 'bill', 'pascabayar', 'kartu kredit'],
      internet: ['internet', 'wifi', 'indihome', 'biznet', 'first media', 'myrepublic', 'iconnet', 'telkomsel', 'xl', 'indosat', 'tri'],
      entertainment: ['netflix', 'spotify', 'youtube premium', 'disney', 'bioskop', 'cinema', 'xxi', 'cgv', 'game'],
      health: ['apotek', 'farmasi', 'dokter', 'klinik', 'rumah sakit', 'obat', 'halodoc', 'vitamin'],
      family: ['transfer istri', 'keluarga', 'orang tua', 'anak', 'rumah', 'household'],
      business: ['usaha', 'wifi customer', 'pelanggan', 'invoice', 'provider', 'maintenance', 'bisnis', 'revenue'],
      other_expense: [],
    },
  },
  'en-US': {
    income: {
      salary: ['salary', 'payroll'],
      business_income: ['business', 'client', 'invoice', 'revenue', 'provider', 'maintenance'],
      freelance: ['freelance', 'project'],
      bonus: ['bonus'],
      cashback: ['cashback'],
      other_income: [],
    },
    expense: {
      food_drinks: ['food', 'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'burger', 'pizza', 'lunch', 'dinner', 'breakfast'],
      transport: ['uber', 'lyft', 'grab', 'taxi', 'bus', 'train', 'parking', 'toll'],
      fuel: ['gas', 'fuel', 'shell', 'bp', 'chevron', 'exxon'],
      groceries: ['supermarket', 'grocery', 'walmart', 'costco', 'target', 'whole foods', 'market'],
      bills: ['bill', 'electricity', 'water', 'utility', 'credit card', 'insurance'],
      internet: ['internet', 'wifi', 'broadband', 'mobile plan', 'telecom'],
      entertainment: ['netflix', 'spotify', 'disney', 'cinema', 'movie', 'game'],
      health: ['pharmacy', 'doctor', 'clinic', 'hospital', 'medicine'],
      family: ['family', 'spouse', 'wife', 'husband', 'parents', 'household'],
      business: ['business', 'client', 'invoice', 'revenue', 'provider', 'maintenance'],
      other_expense: [],
    },
  },
}

function normalize(value = '') {
  return value.toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}\s.$,/:-]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function categoryName(category?: Category, fallback?: string) {
  return category?.name ?? fallback
}

export function suggestCategory({
  merchant,
  description,
  rawText,
  items,
  type,
  language,
  categories,
  userRules,
}: {
  merchant?: string
  description?: string
  rawText?: string
  items?: string[]
  type: 'income' | 'expense'
  language: string
  categories: Category[]
  userRules: Rule[]
}) {
  const lang = language === 'id' ? 'id-ID' : language === 'en' ? 'en-US' : language
  const haystack = normalize(`${merchant ?? ''} ${description ?? ''} ${(items ?? []).join(' ')} ${rawText ?? ''}`)
  const sortedRules = [...userRules]
    .filter((rule) => !rule.is_default && (rule.language === lang || rule.language === lang.slice(0, 2)))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const rule of sortedRules) {
    const pattern = normalize(rule.pattern)
    const matched = rule.match_type === 'merchant_exact'
      ? normalize(merchant) === pattern
      : rule.match_type === 'regex'
        ? new RegExp(rule.pattern, 'i').test(haystack)
        : haystack.includes(pattern)
    if (matched) {
      const category = categories.find((item) => item.id === rule.category_id)
      return { categoryId: rule.category_id, categoryName: categoryName(category, rule.category_name), confidence: 0.94, reason: 'user_rule' }
    }
  }

  const rules = keywordRules[lang] ?? keywordRules['en-US']
  let best: { categoryId?: string; categoryName?: string; confidence: number; reason: string; matchedKeywords: string[] } | undefined
  for (const [key, keywords] of Object.entries(rules[type])) {
    const matched = keywords.filter((keyword) => haystack.includes(normalize(keyword)))
    if (!matched.length) continue
    const category = categories.find((item) => item.localization_key === key && item.type === type)
    const confidence = Math.min(0.9, 0.64 + matched.length * 0.08)
    if (!best || confidence > best.confidence) {
      best = { categoryId: category?.id, categoryName: categoryName(category), confidence, reason: 'keyword', matchedKeywords: matched }
    }
  }
  if (best) return best

  const fallbackKey = type === 'income' ? 'other_income' : 'other_expense'
  const fallback = categories.find((item) => item.localization_key === fallbackKey && item.type === type)
  return { categoryId: fallback?.id, categoryName: categoryName(fallback), confidence: 0.35, reason: 'fallback', matchedKeywords: [] }
}

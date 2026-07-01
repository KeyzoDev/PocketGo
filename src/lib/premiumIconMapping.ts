import type { PremiumIconTone } from '../components/PremiumIcon'

export function categoryPremiumIcon(
  label?: string | null,
  type?: 'income' | 'expense',
): { name: string; tone: PremiumIconTone } {
  const value = (label ?? '').toLowerCase()
  if (type === 'income') {
    if (value.includes('gaji') || value.includes('salary') || value.includes('payroll')) return { name: 'salary', tone: 'green' }
    if (value.includes('usaha') || value.includes('business')) return { name: 'business', tone: 'blue' }
    if (value.includes('freelance') || value.includes('project')) return { name: 'freelance', tone: 'purple' }
    if (value.includes('bonus')) return { name: 'bonus', tone: 'amber' }
    if (value.includes('hadiah') || value.includes('gift')) return { name: 'gift', tone: 'amber' }
    if (value.includes('cashback') || value.includes('refund')) return { name: 'cashback', tone: 'green' }
    if (value.includes('invest') || value.includes('dividend') || value.includes('bunga')) return { name: 'investment', tone: 'green' }
    if (value.includes('debt') || value.includes('piutang') || value.includes('repayment')) return { name: 'debtPaid', tone: 'teal' }
    if (value.includes('allowance') || value.includes('uang saku')) return { name: 'pocketMoney', tone: 'green' }
    return { name: 'coins', tone: 'green' }
  }
  if (value.includes('coffee') || value.includes('cafe') || value.includes('kopi')) return { name: 'coffee', tone: 'green' }
  if (value.includes('makan') || value.includes('food') || value.includes('minum') || value.includes('drink')) return { name: 'food', tone: 'green' }
  if (value.includes('paylater') || value.includes('pay later') || value.includes('cicilan')) return { name: 'paylater', tone: 'coral' }
  if (value.includes('debt') || value.includes('utang')) return { name: 'debt', tone: 'coral' }
  if (value.includes('credit')) return { name: 'credit', tone: 'coral' }
  if (value.includes('bensin') || value.includes('fuel')) return { name: 'fuel', tone: 'teal' }
  if (value.includes('transport') || value.includes('car')) return { name: 'car', tone: 'blue' }
  if (value.includes('online shopping')) return { name: 'onlineShopping', tone: 'green' }
  if (value.includes('shopping') || value.includes('belanja')) return { name: 'shoppingBag', tone: 'green' }
  if (value.includes('grocer') || value.includes('dapur')) {
    return { name: 'groceries', tone: 'green' }
  }
  if (value.includes('subscription') || value.includes('langganan')) return { name: 'subscription', tone: 'amber' }
  if (value.includes('internet') || value.includes('wifi') || value.includes('data')) return { name: 'internet', tone: 'purple' }
  if (value.includes('phone') || value.includes('pulsa') || value.includes('telepon')) return { name: 'phone', tone: 'blue' }
  if (value.includes('utility') || value.includes('utilities')) return { name: 'utilities', tone: 'teal' }
  if (value.includes('tagihan') || value.includes('bill') || value.includes('listrik')) {
    return { name: 'bills', tone: 'amber' }
  }
  if (value.includes('hiburan') || value.includes('entertainment') || value.includes('movie') || value.includes('game')) return { name: 'entertainment', tone: 'purple' }
  if (value.includes('health') || value.includes('kesehatan')) return { name: 'health', tone: 'coral' }
  if (value.includes('family') || value.includes('keluarga')) return { name: 'family', tone: 'purple' }
  if (value.includes('social') || value.includes('hangout') || value.includes('nongkrong')) return { name: 'social', tone: 'purple' }
  if (value.includes('children') || value.includes('anak')) return { name: 'baby', tone: 'purple' }
  if (value.includes('donation') || value.includes('charity') || value.includes('donasi')) return { name: 'donation', tone: 'teal' }
  if (value.includes('business') || value.includes('usaha')) return { name: 'business', tone: 'blue' }
  if (value.includes('pendidikan') || value.includes('education') || value.includes('school')) {
    return { name: 'education', tone: 'amber' }
  }
  if (value.includes('travel') || value.includes('jalan') || value.includes('liburan')) return { name: 'travel', tone: 'blue' }
  if (value.includes('rumah') || value.includes('home') || value.includes('housing') || value.includes('rent')) return { name: 'house', tone: 'teal' }
  if (value.includes('maintenance') || value.includes('repair') || value.includes('servis')) return { name: 'maintenance', tone: 'gray' }
  if (value.includes('emergency') || value.includes('darurat')) return { name: 'emergency', tone: 'coral' }
  if (value.includes('fees') || value.includes('fee') || value.includes('admin')) return { name: 'fees', tone: 'amber' }
  if (value.includes('cash withdrawal') || value.includes('tarik tunai')) return { name: 'banknote', tone: 'green' }
  if (value.includes('other') || value.includes('lain')) return { name: 'more', tone: 'gray' }
  return { name: 'grid', tone: 'gray' }
}

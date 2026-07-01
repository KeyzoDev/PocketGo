import {
  AirplaneTilt,
  ArrowDown,
  ArrowUp,
  ArrowsLeftRight,
  Basket,
  Bell,
  Briefcase,
  CalendarBlank,
  Car,
  CaretRight,
  ChartPieSlice,
  CheckCircle,
  Coins,
  CurrencyDollar,
  DotsThree,
  DownloadSimple,
  EnvelopeSimple,
  ForkKnife,
  Funnel,
  GasPump,
  Gear,
  Gift,
  GlobeHemisphereEast,
  GraduationCap,
  HandCoins,
  Heart,
  House,
  HouseLine,
  Laptop,
  ListBullets,
  LockKey,
  MagnifyingGlass,
  MicrosoftExcelLogo,
  Percent,
  Plus,
  Question,
  Receipt,
  Scan,
  ShieldCheck,
  ShoppingBag,
  SignOut,
  SlidersHorizontal,
  SquaresFour,
  Tag,
  Target,
  TrendUp,
  TrayArrowDown,
  TrayArrowUp,
  UploadSimple,
  UserCircle,
  UsersThree,
  Wallet,
  WifiHigh,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'

export type NativeAppIconTone = 'green' | 'blue' | 'amber' | 'purple' | 'coral' | 'teal' | 'navy' | 'gray'
export type NativeAppIconVariant = 'nav' | 'quickAction' | 'category' | 'transaction' | 'settings' | 'empty' | 'emptyState' | 'utility'
export type NativeAppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type NativeGlyphProps = {
  size?: number | string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  className?: string
}

type NativeAppIconProps = {
  name: string
  tone?: NativeAppIconTone
  size?: NativeAppIconSize
  active?: boolean
  variant?: NativeAppIconVariant
  theme?: 'light' | 'dark'
  className?: string
  'aria-hidden'?: boolean
}

const glyphs: Record<string, ComponentType<NativeGlyphProps>> = {
  add: Plus,
  adjustment: SlidersHorizontal,
  analytics: TrendUp,
  baby: UsersThree,
  banknote: Coins,
  bell: Bell,
  bills: Receipt,
  bonus: Gift,
  budget: ChartPieSlice,
  business: Briefcase,
  calendar: CalendarBlank,
  cashback: Coins,
  car: Car,
  transport: Car,
  category: Tag,
  chart: TrendUp,
  check: CheckCircle,
  chevronRight: CaretRight,
  coffee: ForkKnife,
  coins: Coins,
  credit: Percent,
  currency: CurrencyDollar,
  debt: HandCoins,
  debtPaid: HandCoins,
  donation: Heart,
  download: DownloadSimple,
  education: GraduationCap,
  emergency: Bell,
  entertainment: Receipt,
  expense: ArrowDown,
  excel: MicrosoftExcelLogo,
  export: TrayArrowUp,
  family: UsersThree,
  fees: CurrencyDollar,
  filter: Funnel,
  food: ForkKnife,
  freelance: Laptop,
  fuel: GasPump,
  gift: Gift,
  goals: Target,
  groceries: Basket,
  grid: SquaresFour,
  handshake: HandCoins,
  health: Heart,
  help: Question,
  home: House,
  homePlace: HouseLine,
  house: HouseLine,
  housing: HouseLine,
  housePlug: HouseLine,
  import: TrayArrowDown,
  income: ArrowUp,
  investment: TrendUp,
  internet: WifiHigh,
  language: GlobeHemisphereEast,
  lightbulb: Question,
  lock: LockKey,
  logout: SignOut,
  maintenance: Gear,
  mail: EnvelopeSimple,
  more: DotsThree,
  list: ListBullets,
  notification: Bell,
  onlineShopping: ShoppingBag,
  other: DotsThree,
  paylater: Percent,
  phone: UserCircle,
  pocketMoney: Wallet,
  profile: UserCircle,
  question: Question,
  receipt: Receipt,
  salary: Wallet,
  scan: Scan,
  search: MagnifyingGlass,
  security: ShieldCheck,
  settings: Gear,
  shoppingBag: ShoppingBag,
  social: UsersThree,
  subscription: CalendarBlank,
  transactions: ListBullets,
  transfer: ArrowsLeftRight,
  travel: AirplaneTilt,
  upload: UploadSimple,
  utilities: CheckCircle,
  wallet: Wallet,
  web: GlobeHemisphereEast,
}

export function NativeAppIcon({
  name,
  tone = 'blue',
  size = 'md',
  active = false,
  variant = 'settings',
  theme,
  className = '',
  'aria-hidden': ariaHidden = true,
}: NativeAppIconProps) {
  const Glyph = glyphs[name] ?? DotsThree
  const isInactiveNav = variant === 'nav' && !active
  return (
    <span
      className={[
        'native-app-icon',
        'premium-icon',
        `native-app-icon-${variant === 'emptyState' ? 'empty' : variant}`,
        `premium-icon-${variant === 'empty' ? 'emptyState' : variant}`,
        `native-app-icon-${size}`,
        `premium-icon-${size}`,
        `native-app-icon-tone-${tone}`,
        `premium-icon-tone-${tone}`,
        active ? 'is-active' : '',
        theme ? `native-app-icon-mode-${theme}` : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-hidden={ariaHidden}
    >
      <Glyph className="native-app-icon-glyph" weight={isInactiveNav ? 'fill' : 'fill'} />
    </span>
  )
}

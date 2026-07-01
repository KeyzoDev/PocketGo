import { NativeAppIcon, type NativeAppIconSize, type NativeAppIconTone, type NativeAppIconVariant } from './icons/NativeAppIcon'

export type PremiumIconTone = NativeAppIconTone
export type PremiumIconVariant = 'nav' | 'quickAction' | 'category' | 'settings' | 'transaction' | 'emptyState' | 'utility'
export type PremiumIconSize = NativeAppIconSize

type PremiumIconProps = {
  name: string
  variant?: PremiumIconVariant
  tone?: PremiumIconTone
  active?: boolean
  size?: PremiumIconSize
  mode?: 'light' | 'dark'
  className?: string
  'aria-hidden'?: boolean
}

export function PremiumIcon({
  name,
  variant = 'settings',
  tone = 'blue',
  active = false,
  size = 'md',
  mode,
  className,
  'aria-hidden': ariaHidden,
}: PremiumIconProps) {
  return (
    <NativeAppIcon
      name={name}
      tone={tone}
      active={active}
      size={size}
      variant={variant as NativeAppIconVariant}
      theme={mode}
      className={className}
      aria-hidden={ariaHidden}
    />
  )
}

import { Check, X, Minus } from 'lucide-react'

type Variant = 'success' | 'warning' | 'neutral'

interface Props {
  variant: Variant
  label: string
}

const VARIANT_STYLES: Record<Variant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

const VARIANT_ICONS: Record<Variant, typeof Check> = {
  success: Check,
  warning: X,
  neutral: Minus,
}

export function StatusBadge({ variant, label }: Props) {
  const Icon = VARIANT_ICONS[variant]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]}`}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  )
}

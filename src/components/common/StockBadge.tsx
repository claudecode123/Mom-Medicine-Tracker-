import { AlertTriangle, AlertCircle, XCircle, CheckCircle } from 'lucide-react'
import { cn, stockStatusColor } from '@/lib/utils'

interface StockBadgeProps {
  daysRemaining: number | null
  stockUnit?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function StockBadge({ daysRemaining, stockUnit = 'supply', showIcon = true, size = 'sm' }: StockBadgeProps) {
  const status = stockStatusColor(daysRemaining)

  const configs = {
    ok:     { icon: CheckCircle,   bg: 'bg-brand-50',  text: 'text-brand-700',  label: daysRemaining !== null ? `~${daysRemaining}d` : 'OK' },
    low:    { icon: AlertTriangle, bg: 'bg-amber-50',  text: 'text-amber-700',  label: `${daysRemaining}d left` },
    urgent: { icon: AlertCircle,   bg: 'bg-orange-50', text: 'text-orange-700', label: `${daysRemaining}d left!` },
    out:    { icon: XCircle,       bg: 'bg-red-50',    text: 'text-red-700',    label: 'Out of stock' },
  }

  const { icon: Icon, bg, text, label } = configs[status]

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      bg, text,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
    )}>
      {showIcon && <Icon size={size === 'sm' ? 11 : 13} />}
      {label}
    </span>
  )
}

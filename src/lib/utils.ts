import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMM yyyy')
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, h:mm a')
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export type TimePeriod = 'early_morning' | 'morning' | 'afternoon' | 'evening'

export const TIME_PERIODS: { value: TimePeriod; label: string; time: string; icon: string }[] = [
  { value: 'early_morning', label: 'Early Morning', time: '5:00 – 7:00 AM', icon: '🌅' },
  { value: 'morning',       label: 'Morning',       time: '7:00 – 12:00 PM', icon: '☀️' },
  { value: 'afternoon',     label: 'Afternoon',     time: '12:00 – 6:00 PM', icon: '🌤' },
  { value: 'evening',       label: 'Evening',       time: '6:00 PM – 10:00 PM', icon: '🌙' },
]

export function getPeriodLabel(period: TimePeriod): string {
  return TIME_PERIODS.find(p => p.value === period)?.label ?? period
}

export function getPeriodIcon(period: TimePeriod): string {
  return TIME_PERIODS.find(p => p.value === period)?.icon ?? '💊'
}

export function stockStatusColor(daysRemaining: number | null): 'ok' | 'low' | 'urgent' | 'out' {
  if (daysRemaining === null) return 'ok'
  if (daysRemaining <= 0) return 'out'
  if (daysRemaining <= 2) return 'urgent'
  if (daysRemaining <= 5) return 'low'
  return 'ok'
}

export function stockStatusLabel(daysRemaining: number | null, stockUnit: string): string {
  if (daysRemaining === null) return 'Stock unknown'
  if (daysRemaining <= 0) return 'Out of stock'
  if (daysRemaining <= 2) return `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left — refill urgently`
  if (daysRemaining <= 5) return `${daysRemaining} days of ${stockUnit} remaining`
  return `~${daysRemaining} days remaining`
}

export function compressImage(file: File, maxWidthPx = 1200, quality = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidthPx / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => {
          if (!blob) { resolve(file); return }
          const compressed = new File([blob], file.name, { type: 'image/jpeg' })
          resolve(compressed)
        },
        'image/jpeg',
        quality
      )
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

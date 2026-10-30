import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-8 h-8 border-3 border-warm-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-warm-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-warm-400 text-sm">Loading…</p>
      </div>
    </div>
  )
}

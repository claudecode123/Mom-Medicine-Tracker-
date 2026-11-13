import { cn } from '@/lib/utils'

/**
 * Uses the memoji sprite sheet (public/avatars/memoji-grid.png).
 * Grid layout: 7 columns × 7 rows, 45 avatars total.
 * Original frame: 5014×5014 px. Each avatar: 682×682 px with 40 px gap → 722 px pitch.
 */
function getAvatarIndex(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return Math.abs(h) % 45
}

interface MemojiAvatarProps {
  seed: string
  size?: number
  className?: string
  rounded?: 'full' | 'xl' | '2xl' | '3xl'
  avatarIndex?: number | null
}

export function MemojiAvatar({ seed, size = 56, className, rounded = '2xl', avatarIndex }: MemojiAvatarProps) {
  const index = (avatarIndex != null && avatarIndex >= 0 && avatarIndex <= 44) ? avatarIndex : getAvatarIndex(seed)
  const col = index % 7
  const row = Math.floor(index / 7)
  const scaleFactor = size / 682
  const gridPx = Math.round(5014 * scaleFactor)
  const pitchPx = Math.round(722 * scaleFactor)

  const radiusMap: Record<string, number> = {
    full: size / 2,
    xl:   size * 0.22,
    '2xl': size * 0.3,
    '3xl': size * 0.38,
  }

  return (
    <div
      className={cn('flex-shrink-0', className)}
      style={{
        width: size,
        height: size,
        backgroundImage: 'url(/avatars/memoji-grid.png)',
        backgroundSize: `${gridPx}px ${gridPx}px`,
        backgroundPosition: `${-(col * pitchPx)}px ${-(row * pitchPx)}px`,
        backgroundRepeat: 'no-repeat',
        borderRadius: radiusMap[rounded] ?? radiusMap['2xl'],
      }}
      role="img"
      aria-label={`Avatar for ${seed}`}
    />
  )
}

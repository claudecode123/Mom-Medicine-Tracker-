import { getMedicineIcon } from '@/lib/medicineIcons'

interface Props {
  name: string
  size?: number
  radius?: number
}

export function OrganIconChip({ name, size = 36, radius = 10 }: Props) {
  const icon = getMedicineIcon(name)
  const imgSize = Math.round(size * 0.56)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: icon.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon.src ? (
        <img src={icon.src} width={imgSize} height={imgSize} alt={icon.label} style={{ objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: imgSize * 0.9, lineHeight: 1 }}>{icon.emoji}</span>
      )}
    </div>
  )
}

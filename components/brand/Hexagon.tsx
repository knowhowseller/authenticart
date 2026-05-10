import { cn } from '@/lib/utils/cn'

interface HexagonProps {
  color?: 'deep' | 'amber' | 'blush' | 'sage'
  size?: number
  className?: string
  rotate?: number
}

const colorMap = {
  deep: '#1F4145',
  amber: '#FFBF00',
  blush: '#EBCDC4',
  sage: '#7F9593',
}

export default function Hexagon({ color = 'amber', size = 24, className, rotate = 10 }: HexagonProps) {
  const fill = colorMap[color]
  const r = size / 2
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${r + r * Math.cos(angle)},${r + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('inline-block', className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <polygon points={points} fill={fill} />
    </svg>
  )
}

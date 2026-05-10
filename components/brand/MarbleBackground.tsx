import { cn } from '@/lib/utils/cn'

interface MarbleBackgroundProps {
  children?: React.ReactNode
  opacity?: number
  className?: string
}

export default function MarbleBackground({ children, opacity = 0.3, className }: MarbleBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Marble texture via CSS gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity,
          background: `
            radial-gradient(ellipse at 20% 20%, #EBCDC4 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, #BEC9C9 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, #7F9593 0%, transparent 60%),
            linear-gradient(135deg, #F3F4F7 0%, #EBCDC4 40%, #BEC9C9 70%, #F3F4F7 100%)
          `,
        }}
      />
      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: opacity * 0.5,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}

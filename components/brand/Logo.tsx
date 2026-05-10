import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 24, md: 32, lg: 48 }

export default function Logo({ variant = 'default', size = 'md', className }: LogoProps) {
  const h = sizeMap[size]
  const src = variant === 'white' ? '/logo/symbol-dark.png' : '/logo/symbol-light.png'

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={src}
        alt="오센틱아트 로고"
        width={h}
        height={Math.round(h * 1.2)}
        className="object-contain"
        style={{ width: h, height: 'auto' }}
        priority
      />
      <span
        className={cn(
          'font-light tracking-widest text-sm uppercase',
          variant === 'white' ? 'text-white' : 'text-brand-deep'
        )}
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.15em' }}
      >
        Authentic Art
      </span>
    </span>
  )
}

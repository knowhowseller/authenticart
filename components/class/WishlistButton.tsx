'use client'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface WishlistButtonProps {
  classId: string
  initialWishlisted: boolean
  size?: number
  className?: string
}

export default function WishlistButton({
  classId,
  initialWishlisted,
  size = 18,
  className = '',
}: WishlistButtonProps) {
  const router = useRouter()
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    const res = await fetch('/api/wishlists/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId }),
    })
    setLoading(false)

    if (res.status === 401) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }
    if (!res.ok) return

    const data = await res.json()
    setWishlisted(data.wishlisted)
    toast.success(data.wishlisted ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다')
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={wishlisted ? '찜 해제' : '찜하기'}
      className={`transition-all disabled:opacity-50 ${className}`}
    >
      <Heart
        size={size}
        className={`transition-colors ${
          wishlisted
            ? 'fill-red-500 text-red-500'
            : 'fill-transparent text-brand-grey hover:text-red-400'
        }`}
      />
    </button>
  )
}

'use client'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart, type CartItem } from '@/lib/cart'
import { toast } from 'sonner'

interface CartButtonProps {
  product: Pick<CartItem, 'product_id' | 'name' | 'price'> & { image?: string }
}

export default function CartButton({ product }: CartButtonProps) {
  const [added, setAdded] = useState(false)
  const router = useRouter()

  function handleAdd() {
    addToCart({ ...product, quantity: 1 })
    setAdded(true)
    toast.success('장바구니에 담았습니다', {
      action: { label: '장바구니 보기', onClick: () => router.push('/cart') },
    })
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      className="flex items-center gap-2 text-sm font-medium border border-brand-deep text-brand-deep px-4 py-2.5 rounded-full hover:bg-brand-deep/5 transition-colors"
    >
      {added ? <Check size={15} /> : <ShoppingCart size={15} />}
      {added ? '담김!' : '장바구니 담기'}
    </button>
  )
}

import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'

interface ProductCardProps {
  id: string
  name: string
  category: string | null
  price: number
  isWholesale?: boolean
  stock: number
  images: string[]
  status: string
  isInstructorOnly: boolean
  userRole?: string
}

export default function ProductCard({
  id, name, category, price, isWholesale, stock, images, status, isInstructorOnly, userRole,
}: ProductCardProps) {
  const isSoldOut = status === 'soldout' || stock === 0
  const canBuy = !isInstructorOnly || ['instructor', 'admin'].includes(userRole ?? '')

  return (
    <Link
      href={canBuy ? `/shop/${id}` : '#'}
      className={`group block bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md transition-all ${!canBuy ? 'opacity-80' : ''}`}
    >
      <div className="aspect-square bg-brand-bg overflow-hidden relative">
        {images.length > 0 ? (
          <img src={images[0]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-brand-ink/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">품절</span>
          </div>
        )}
        {isInstructorOnly && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-medium bg-brand-deep text-white px-2 py-0.5 rounded-full">
              강사 전용
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        {category && (
          <p className="text-xs text-brand-grey mb-1">{category}</p>
        )}
        <h3 className="text-sm font-semibold text-brand-ink line-clamp-2 mb-2 group-hover:text-brand-deep transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-brand-deep">{formatPrice(price)}</span>
            {isWholesale && (
              <span className="ml-2 text-xs font-medium bg-brand-amber text-brand-ink px-1.5 py-0.5 rounded-full">
                강사가
              </span>
            )}
          </div>
          {stock > 0 && stock <= 5 && (
            <span className="text-xs text-red-500 font-medium">잔여 {stock}개</span>
          )}
        </div>
        {!canBuy && (
          <p className="text-xs text-brand-grey mt-1.5">강사 인증 후 구매 가능</p>
        )}
      </div>
    </Link>
  )
}

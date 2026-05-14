'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  thumbnail_url: string | null
  is_active: boolean
  category: string | null
}

export default function VendorProductEditForm({
  product,
  productId,
  commissionRate,
}: {
  product: Product
  productId: string
  commissionRate: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName]           = useState(product.name)
  const [desc, setDesc]           = useState(product.description ?? '')
  const [price, setPrice]         = useState(String(product.price))
  const [stock, setStock]         = useState(String(product.stock_quantity))
  const [category, setCategory]   = useState(product.category ?? '')
  const [isActive, setIsActive]   = useState(product.is_active)
  const [thumbUrl, setThumbUrl]   = useState(product.thumbnail_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `products/${productId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (error) { toast.error(error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    setThumbUrl(publicUrl)
    setUploading(false)
    toast.success('이미지가 업로드되었습니다')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('상품명을 입력해주세요'); return }
    const parsedPrice = parseInt(price)
    const parsedStock = parseInt(stock)
    if (isNaN(parsedPrice) || parsedPrice < 0) { toast.error('유효한 가격을 입력해주세요'); return }
    if (isNaN(parsedStock) || parsedStock < 0) { toast.error('유효한 재고를 입력해주세요'); return }

    setSaving(true)
    const res = await fetch(`/api/vendor/products/${productId}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: desc.trim() || null,
        price: parsedPrice,
        stock_quantity: parsedStock,
        category: category.trim() || null,
        is_active: isActive,
        thumbnail_url: thumbUrl || null,
      }),
    })
    setSaving(false)
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? '저장 실패'); return }
    toast.success('상품이 수정되었습니다')
    router.push('/my/vendor')
  }

  const netPrice = Math.round(parseInt(price || '0') * (1 - commissionRate / 100))

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 썸네일 */}
      <div>
        <label className="block text-sm font-medium text-brand-ink mb-2">상품 이미지</label>
        <div className="flex items-start gap-4">
          <div
            className="w-24 h-24 rounded-xl bg-brand-bg border border-brand-mist flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-deep/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {thumbUrl
              ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl">📷</span>}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              이미지 변경
            </Button>
            <p className="text-xs text-brand-grey mt-1.5">권장: 600×600px 이상 정방형</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <Input label="상품명 *" value={name} onChange={e => setName(e.target.value)} placeholder="상품명을 입력하세요" maxLength={100} />

      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">상품 설명</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={4}
          placeholder="상품 특징, 재질, 용도 등을 설명해주세요"
          className="w-full px-3 py-2.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="판매가 (원) *"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            min="0"
          />
          {parseInt(price) > 0 && (
            <p className="text-xs text-brand-grey mt-1">
              수수료 {commissionRate}% 제외 후 정산: <strong className="text-brand-deep">{netPrice.toLocaleString()}원</strong>
            </p>
          )}
        </div>
        <Input
          label="재고 수량 *"
          type="number"
          value={stock}
          onChange={e => setStock(e.target.value)}
          min="0"
        />
      </div>

      <Input label="카테고리" value={category} onChange={e => setCategory(e.target.value)} placeholder="예: 레진아트, 캔들, 자수" />

      <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-brand-mist/30">
        <input
          id="is_active"
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className="w-4 h-4 accent-brand-deep"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-brand-ink cursor-pointer">
          판매 활성화
        </label>
        <p className="text-xs text-brand-grey ml-auto">비활성화 시 쇼핑몰에 노출되지 않습니다</p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>취소</Button>
        <Button type="submit" variant="primary" className="flex-1" loading={saving}>저장하기</Button>
      </div>
    </form>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface ProductFormProps {
  mode: 'new' | 'edit'
  product?: {
    id: string
    name: string
    category: string
    description: string | null
    retail_price: number
    wholesale_price: number
    stock_qty: number
    is_active: boolean
    thumbnail_url: string | null
  }
}

const categories = ['레진', '몰드', '색소', '도구', '패키지', '기타']

export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [retailPrice, setRetailPrice] = useState(product?.retail_price ?? 0)
  const [wholesalePrice, setWholesalePrice] = useState(product?.wholesale_price ?? 0)
  const [stockQty, setStockQty] = useState(product?.stock_qty ?? 0)
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnail_url ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !category || retailPrice <= 0) {
      toast.error('상품명, 카테고리, 소비자가를 입력해주세요')
      return
    }

    setLoading(true)
    const url = mode === 'new' ? '/api/admin/products/create' : '/api/admin/products/update'
    const body: any = {
      name, category, description: description || null,
      retail_price: retailPrice,
      wholesale_price: wholesalePrice,
      stock_qty: stockQty,
      is_active: isActive,
      thumbnail_url: thumbnailUrl || null,
    }
    if (mode === 'edit' && product) body.product_id = product.id

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(json.error ?? '저장 실패')
      return
    }
    toast.success(mode === 'new' ? '상품이 등록되었습니다' : '상품이 수정되었습니다')
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="상품명"
            placeholder="UV 레진 (100ml)"
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-brand-ink">카테고리 <span className="text-brand-amber">*</span></label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <option value="">선택</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="accent-brand-amber w-4 h-4"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-brand-ink cursor-pointer">
            판매 활성
          </label>
        </div>
      </div>

      <Input
        label="썸네일 URL"
        placeholder="https://..."
        value={thumbnailUrl}
        onChange={e => setThumbnailUrl(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-brand-ink">상품 설명</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="상품 설명을 입력해주세요"
          className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="소비자가 (원)"
          type="number"
          placeholder="15000"
          required
          value={retailPrice || ''}
          onChange={e => setRetailPrice(Number(e.target.value))}
        />
        <Input
          label="강사 도매가 (원)"
          type="number"
          placeholder="10000"
          value={wholesalePrice || ''}
          onChange={e => setWholesalePrice(Number(e.target.value))}
        />
        <Input
          label="재고 수량"
          type="number"
          placeholder="100"
          value={stockQty || ''}
          onChange={e => setStockQty(Number(e.target.value))}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {mode === 'new' ? '등록하기' : '저장하기'}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  )
}

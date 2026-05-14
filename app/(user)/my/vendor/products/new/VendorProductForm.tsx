'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, ImageIcon, Sparkles } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function VendorProductForm({ categories }: { categories: string[] }) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [retailPrice, setRetailPrice] = useState(0)
  const [stockQty, setStockQty] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [preview, setPreview] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('파일 크기는 5MB 이하여야 합니다'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true })

    if (error) { toast.error('이미지 업로드 실패: ' + error.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    setThumbnailUrl(publicUrl)
    setPreview(publicUrl)
    setUploading(false)
    toast.success('이미지 업로드 완료')
  }

  async function generateDescription() {
    if (!thumbnailUrl) { toast.error('먼저 이미지를 업로드해주세요'); return }
    setAiLoading(true)
    const res = await fetch('/api/ai/describe-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: thumbnailUrl, type: 'product' }),
    })
    const data = await res.json()
    setAiLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'AI 생성 실패'); return }
    setDescription(data.description)
    toast.success('AI 설명이 생성되었습니다. 내용을 확인하고 수정해주세요.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !category || retailPrice <= 0) {
      toast.error('상품명, 카테고리, 소비자가를 입력해주세요')
      return
    }

    setLoading(true)
    const res = await fetch('/api/vendor/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, category,
        description: description || null,
        retail_price: retailPrice,
        stock_qty: stockQty,
        is_active: isActive,
        thumbnail_url: thumbnailUrl || null,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error(json.error ?? '등록 실패'); return }
    toast.success('상품이 등록되었습니다')
    router.push('/my/vendor')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="상품명" placeholder="UV 레진 (100ml)" required value={name} onChange={e => setName(e.target.value)} />
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
            바로 판매 시작
          </label>
        </div>
      </div>

      {/* 이미지 업로드 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-brand-ink">상품 이미지</label>
        {preview ? (
          <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-brand-mist group">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { setThumbnailUrl(''); setPreview(''); if (fileRef.current) fileRef.current.value = '' }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-40 h-40 rounded-xl border-2 border-dashed border-brand-mist flex flex-col items-center justify-center gap-2 text-brand-grey hover:border-brand-amber hover:text-brand-amber transition-colors disabled:opacity-50"
          >
            {uploading ? <span className="text-xs">업로드 중...</span> : (
              <>
                <ImageIcon size={24} />
                <span className="text-xs">이미지 추가</span>
                <span className="text-xs opacity-60">최대 5MB</span>
              </>
            )}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-brand-ink">상품 설명</label>
          <button
            type="button"
            onClick={generateDescription}
            disabled={aiLoading || !thumbnailUrl}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-amber hover:text-brand-amber/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles size={13} />
            {aiLoading ? 'AI 생성 중...' : 'AI 설명 자동 생성'}
          </button>
        </div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="상품 설명을 입력하거나 AI로 자동 생성하세요"
          className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="소비자가 (원)" type="number" placeholder="15000" required
          value={retailPrice || ''} onChange={e => setRetailPrice(Number(e.target.value))} />
        <Input label="재고 수량" type="number" placeholder="100"
          value={stockQty || ''} onChange={e => setStockQty(Number(e.target.value))} />
      </div>

      <div className="bg-brand-amber/5 rounded-xl px-4 py-3 text-xs text-brand-grey">
        플랫폼 수수료 {'{commission_rate}'}%가 자동 공제되며, 나머지 금액이 월별 정산됩니다.
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">등록하기</Button>
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

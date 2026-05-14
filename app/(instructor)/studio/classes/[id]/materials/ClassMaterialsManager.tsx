'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'
import { Trash2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  retail_price: number
  image_url: string | null
}

interface Material {
  id: string
  note: string | null
  sort_order: number
  products: Product | null
}

export default function ClassMaterialsManager({
  classId,
  initialMaterials,
  allProducts,
}: {
  classId: string
  initialMaterials: Material[]
  allProducts: Product[]
}) {
  const supabase = createClient()
  const [materials, setMaterials] = useState(initialMaterials)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const linkedIds = new Set(materials.map(m => m.products?.id))
  const availableProducts = allProducts.filter(p => !linkedIds.has(p.id))

  async function addMaterial() {
    if (!selectedProductId) { toast.error('상품을 선택해주세요'); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('class_materials')
      .insert({
        class_id: classId,
        product_id: selectedProductId,
        note: note.trim() || null,
        sort_order: materials.length,
      })
      .select('id, note, sort_order, products!product_id(id, name, retail_price, image_url)')
      .single()
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setMaterials(prev => [...prev, data as any])
    setSelectedProductId('')
    setNote('')
    toast.success('재료가 추가되었습니다')
  }

  async function removeMaterial(materialId: string) {
    setLoading(true)
    const { error } = await supabase.from('class_materials').delete().eq('id', materialId)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setMaterials(prev => prev.filter(m => m.id !== materialId))
    toast.success('재료가 제거되었습니다')
  }

  return (
    <div className="space-y-4">
      {/* 연결된 재료 목록 */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-mist/30 py-12 text-center text-brand-grey text-sm">
          <p className="text-2xl mb-2">📦</p>
          <p>연결된 재료가 없습니다</p>
          <p className="text-xs mt-1">아래에서 재료를 추가해보세요</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-mist/30 divide-y divide-brand-mist/20">
          {materials.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="text-xs text-brand-grey w-5">{i + 1}</span>
              {m.products?.image_url && (
                <img src={m.products.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-ink truncate">{m.products?.name}</p>
                <p className="text-xs text-brand-amber font-semibold">{formatPrice(m.products?.retail_price ?? 0)}</p>
                {m.note && <p className="text-xs text-brand-grey mt-0.5">{m.note}</p>}
              </div>
              <button
                onClick={() => removeMaterial(m.id)}
                disabled={loading}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 재료 추가 폼 */}
      <div className="bg-white rounded-2xl border border-brand-mist/30 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-brand-ink">재료 추가</h3>
        {availableProducts.length === 0 ? (
          <p className="text-xs text-brand-grey">추가할 수 있는 상품이 없습니다. 먼저 상품을 등록해주세요.</p>
        ) : (
          <>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
            >
              <option value="">상품 선택</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.retail_price)}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="추가 안내 (선택) — 예: 500ml 이상 권장"
              className="w-full px-3 py-2.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
            />
            <button
              onClick={addMaterial}
              disabled={loading || !selectedProductId}
              className="w-full py-2.5 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
            >
              재료 추가
            </button>
          </>
        )}
      </div>

      <div className="bg-brand-amber/5 rounded-xl px-4 py-3 text-xs text-brand-grey">
        수강생은 예약 완료 후 이 목록에서 바로 재료를 구매할 수 있습니다.
        플랫폼 쇼핑몰에 등록된 상품만 연결 가능합니다.
      </div>
    </div>
  )
}

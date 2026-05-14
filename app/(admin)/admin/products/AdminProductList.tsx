'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  category: string
  retail_price: number
  wholesale_price: number
  stock_qty: number
  is_active: boolean
  thumbnail_url: string | null
}

export default function AdminProductList({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const allChecked = products.length > 0 && selected.size === products.length
  const someChecked = selected.size > 0 && selected.size < products.length

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`선택한 ${selected.size}개 상품을 삭제하시겠습니까?\n연결된 주문 데이터가 있으면 일부 삭제되지 않을 수 있습니다.`)) return

    setDeleting(true)
    const res = await fetch('/api/admin/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    })
    const data = await res.json()
    setDeleting(false)

    if (!res.ok) { toast.error(data.error ?? '삭제 실패'); return }
    toast.success(`${data.deleted}개 상품이 삭제되었습니다`)
    setProducts(prev => prev.filter(p => !selected.has(p.id)))
    setSelected(new Set())
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/products/${id}/delete`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? '삭제 실패'); return }
    toast.success('상품이 삭제되었습니다')
    setProducts(prev => prev.filter(p => p.id !== id))
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  return (
    <div className="space-y-3">
      {/* 일괄 작업 툴바 */}
      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-brand-mist/30 flex items-center gap-4">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            ref={el => { if (el) el.indeterminate = someChecked }}
            onChange={toggleAll}
            className="w-4 h-4 accent-brand-amber rounded cursor-pointer"
          />
          <span className="text-sm text-brand-grey">
            {selected.size > 0 ? `${selected.size}개 선택됨` : `전체 선택 (${products.length}개)`}
          </span>
        </label>

        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={13} />
            {deleting ? '삭제 중...' : `선택 삭제 (${selected.size})`}
          </button>
        )}
      </div>

      {/* 상품 목록 */}
      {products.map(p => (
        <div
          key={p.id}
          onClick={() => toggleOne(p.id)}
          className={`bg-white rounded-2xl p-4 shadow-sm border transition-all cursor-pointer flex items-center gap-4 ${
            selected.has(p.id)
              ? 'border-brand-amber bg-brand-amber/5'
              : 'border-brand-mist/30 hover:border-brand-mist'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.has(p.id)}
            onChange={() => toggleOne(p.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 accent-brand-amber rounded flex-shrink-0 cursor-pointer"
          />

          <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🛍️</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-brand-ink text-sm">{p.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-grey border border-brand-mist/40">{p.category}</span>
              {!p.is_active && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500">비활성</span>}
            </div>
            <p className="text-xs text-brand-grey mt-0.5">
              소비자가 {formatPrice(p.retail_price)} · 강사가 {formatPrice(p.wholesale_price)} · 재고 {p.stock_qty}개
            </p>
          </div>

          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <Link
              href={`/admin/products/${p.id}/edit`}
              className="text-xs font-medium text-brand-deep hover:underline px-3 py-1.5 rounded-lg border border-brand-deep/20 hover:bg-brand-deep/5 transition-colors"
            >
              수정
            </Link>
            <button
              onClick={() => handleDelete(p.id, p.name)}
              disabled={deleting}
              className="p-2 rounded-lg text-brand-grey hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="삭제"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

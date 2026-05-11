'use client'
import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

export default function ShopFilterBar({ categories }: { categories: string[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')

  const set = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/shop?${params.toString()}`)
  }, [sp, router])

  return (
    <div className="bg-white border-b border-brand-mist/30 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
        {/* 검색 + 정렬 */}
        <div className="flex items-center gap-2">
          <form
            className="flex-1 relative"
            onSubmit={e => { e.preventDefault(); set('q', q || null) }}
          >
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="상품명 검색"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-brand-bg"
            />
            {q && (
              <button
                type="button"
                onClick={() => { setQ(''); set('q', null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-ink"
              >
                <X size={13} />
              </button>
            )}
          </form>

          <select
            value={sp.get('sort') ?? 'newest'}
            onChange={e => set('sort', e.target.value === 'newest' ? null : e.target.value)}
            className="text-sm border border-brand-mist rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white text-brand-ink"
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 카테고리 탭 */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => set('category', null)}
              className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                !sp.get('category') ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep'
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => set('category', sp.get('category') === cat ? null : cat)}
                className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  sp.get('category') === cat ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 활성 필터 표시 */}
        {(sp.get('q')) && (
          <div className="flex flex-wrap gap-1.5">
            {sp.get('q') && (
              <span className="inline-flex items-center gap-1 text-xs bg-brand-amber/10 border border-brand-amber/30 text-brand-ink px-2 py-0.5 rounded-full">
                "{sp.get('q')}"
                <button onClick={() => { set('q', null); setQ('') }}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

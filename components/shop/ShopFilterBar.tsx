'use client'
import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

export interface CategoryNode {
  name: string
  children: string[]
}

const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

export default function ShopFilterBar({ categories }: { categories: CategoryNode[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')

  const activeParent = sp.get('parent') ?? ''
  const activeSub = sp.get('sub') ?? ''
  const activeParentNode = categories.find(c => c.name === activeParent)

  const setParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`/shop?${params.toString()}`)
  }, [sp, router])

  return (
    <div className="bg-white border-b border-brand-mist/30 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 space-y-2.5">
        {/* 검색 + 정렬 */}
        <div className="flex items-center gap-2">
          <form
            className="flex-1 relative"
            onSubmit={e => { e.preventDefault(); setParams({ q: q || null }) }}
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
                onClick={() => { setQ(''); setParams({ q: null }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-ink"
              >
                <X size={13} />
              </button>
            )}
          </form>

          <select
            value={sp.get('sort') ?? 'newest'}
            onChange={e => setParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
            className="text-sm border border-brand-mist rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white text-brand-ink"
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 대카테고리 */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setParams({ parent: null, sub: null })}
              className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                !activeParent
                  ? 'bg-brand-deep text-white border-brand-deep'
                  : 'border-brand-mist text-brand-ink hover:border-brand-deep/40'
              }`}
            >
              전체
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setParams({
                  parent: activeParent === cat.name ? null : cat.name,
                  sub: null,
                })}
                className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  activeParent === cat.name
                    ? 'bg-brand-deep text-white border-brand-deep'
                    : 'border-brand-mist text-brand-ink hover:border-brand-deep/40'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* 소카테고리 — 대카테고리 선택 시만 표시 */}
        {activeParentNode && activeParentNode.children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="flex-shrink-0 text-xs text-brand-grey self-center mr-0.5">└</span>
            <button
              onClick={() => setParams({ sub: null })}
              className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                !activeSub
                  ? 'bg-brand-amber text-brand-ink border-brand-amber'
                  : 'border-brand-mist text-brand-grey hover:border-brand-amber/50'
              }`}
            >
              전체
            </button>
            {activeParentNode.children.map(child => (
              <button
                key={child}
                onClick={() => setParams({ sub: activeSub === child ? null : child })}
                className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeSub === child
                    ? 'bg-brand-amber text-brand-ink border-brand-amber'
                    : 'border-brand-mist text-brand-grey hover:border-brand-amber/50'
                }`}
              >
                {child}
              </button>
            ))}
          </div>
        )}

        {/* 활성 필터 태그 */}
        {sp.get('q') && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs bg-brand-amber/10 border border-brand-amber/30 text-brand-ink px-2 py-0.5 rounded-full">
              "{sp.get('q')}"
              <button onClick={() => { setParams({ q: null }); setQ('') }}><X size={10} /></button>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

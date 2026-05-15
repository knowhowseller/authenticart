'use client'
import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export interface CraftL3 { code: string; name: string }
export interface CraftL2 { code: string; name: string; children: CraftL3[] }
export interface CraftL1 { code: string; name: string; children: CraftL2[] }

const sortOptions = [
  { value: 'newest',     label: '최신순' },
  { value: 'price_asc',  label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

export default function ShopFilterBar({ categories }: { categories: CraftL1[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')

  const lv1 = sp.get('lv1') ?? ''
  const lv2 = sp.get('lv2') ?? ''
  const lv3 = sp.get('lv3') ?? ''

  const activeLv1 = categories.find(c => c.code === lv1)
  const activeLv2 = activeLv1?.children.find(c => c.code === lv2)

  const push = useCallback((updates: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    router.push(`/shop?${p.toString()}`)
  }, [sp, router])

  return (
    <div className="bg-white border-b border-brand-mist/30 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 space-y-2">

        {/* 검색 + 정렬 */}
        <div className="flex items-center gap-2">
          <form className="flex-1 relative"
            onSubmit={e => { e.preventDefault(); push({ q: q || null }) }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="상품명 검색"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-brand-bg" />
            {q && <button type="button" onClick={() => { setQ(''); push({ q: null }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-ink">
              <X size={13} />
            </button>}
          </form>
          <select value={sp.get('sort') ?? 'newest'}
            onChange={e => push({ sort: e.target.value === 'newest' ? null : e.target.value })}
            className="text-sm border border-brand-mist rounded-xl px-3 py-2 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-amber">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* 대카테고리 (Level 1) */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button onClick={() => push({ lv1: null, lv2: null, lv3: null })}
              className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                !lv1 ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep/40'}`}>
              전체
            </button>
            {categories.map(c => (
              <button key={c.code}
                onClick={() => push({ lv1: lv1 === c.code ? null : c.code, lv2: null, lv3: null })}
                className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  lv1 === c.code ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep/40'}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* 중카테고리 (Level 2) — lv1 선택 시 표시 */}
        {activeLv1 && activeLv1.children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="flex-shrink-0 text-xs text-brand-grey/50 self-center">└</span>
            <button onClick={() => push({ lv2: null, lv3: null })}
              className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                !lv2 ? 'bg-brand-deep/10 text-brand-deep border-brand-deep/30 font-medium' : 'border-brand-mist text-brand-grey hover:border-brand-deep/30'}`}>
              전체
            </button>
            {activeLv1.children.map(c => (
              <button key={c.code}
                onClick={() => push({ lv2: lv2 === c.code ? null : c.code, lv3: null })}
                className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  lv2 === c.code ? 'bg-brand-deep/10 text-brand-deep border-brand-deep/30 font-medium' : 'border-brand-mist text-brand-grey hover:border-brand-deep/30'}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* 소카테고리 (Level 3) — lv2 선택 시 표시 */}
        {activeLv2 && activeLv2.children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="flex-shrink-0 text-xs text-brand-grey/50 self-center ml-3">└</span>
            <button onClick={() => push({ lv3: null })}
              className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                !lv3 ? 'bg-brand-amber text-brand-ink border-brand-amber' : 'border-brand-mist text-brand-grey hover:border-brand-amber/50'}`}>
              전체
            </button>
            {activeLv2.children.map(c => (
              <button key={c.code}
                onClick={() => push({ lv3: lv3 === c.code ? null : c.code })}
                className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  lv3 === c.code ? 'bg-brand-amber text-brand-ink border-brand-amber' : 'border-brand-mist text-brand-grey hover:border-brand-amber/50'}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* 활성 검색어 태그 */}
        {sp.get('q') && (
          <div className="flex gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs bg-brand-amber/10 border border-brand-amber/30 text-brand-ink px-2 py-0.5 rounded-full">
              "{sp.get('q')}"
              <button onClick={() => { push({ q: null }); setQ('') }}><X size={10} /></button>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

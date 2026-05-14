'use client'
import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, Search } from 'lucide-react'

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주']
const crafts = [
  { value: 'resin', label: '레진아트' },
  { value: 'candle', label: '캔들' },
  { value: 'flower', label: '플라워' },
  { value: 'ceramic', label: '도자기' },
  { value: 'jewelry', label: '주얼리' },
  { value: 'fabric', label: '패브릭' },
]
const difficulties = [
  { value: 'beginner', label: '입문', color: 'bg-brand-amber' },
  { value: 'intermediate', label: '중급', color: 'bg-pink-400' },
  { value: 'advanced', label: '고급', color: 'bg-purple-400' },
]
const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

export default function ClassesFilterBar() {
  const router = useRouter()
  const sp = useSearchParams()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(sp.get('q') ?? '')

  const set = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/classes?${params.toString()}`)
  }, [sp, router])

  const toggle = useCallback((key: string, value: string) => {
    set(key, sp.get(key) === value ? null : value)
  }, [sp, set])

  const activeCount = ['region', 'craft', 'difficulty', 'min_price', 'max_price', 'q']
    .filter(k => sp.get(k)).length

  const handleSortChange = (val: string) => {
    const params = new URLSearchParams(sp.toString())
    params.delete('limit')
    if (val === 'newest') params.delete('sort')
    else params.set('sort', val)
    router.push(`/classes?${params.toString()}`)
  }

  return (
    <div className="bg-white border-b border-brand-mist/30 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* 상단 바 */}
        <div className="flex items-center gap-2">
          {/* 검색 */}
          <form
            className="flex-1 relative"
            onSubmit={e => { e.preventDefault(); set('q', q || null) }}
          >
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="클래스명 검색"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber bg-brand-bg"
            />
          </form>

          {/* 정렬 */}
          <select
            value={sp.get('sort') ?? 'newest'}
            onChange={e => handleSortChange(e.target.value)}
            className="text-sm border border-brand-mist rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white text-brand-ink"
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* 필터 토글 */}
          <button
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              open || activeCount > 0
                ? 'bg-brand-deep text-white border-brand-deep'
                : 'border-brand-mist text-brand-ink hover:border-brand-deep'
            }`}
          >
            <SlidersHorizontal size={14} />
            필터
            {activeCount > 0 && (
              <span className="bg-brand-amber text-brand-ink text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* 확장 필터 패널 */}
        {open && (
          <div className="mt-3 pt-3 border-t border-brand-mist/30 space-y-4">
            {/* 지역 */}
            <div>
              <p className="text-xs font-semibold text-brand-grey mb-2">지역</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => set('region', null)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    !sp.get('region') ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep'
                  }`}
                >전체</button>
                {regions.map(r => (
                  <button
                    key={r}
                    onClick={() => toggle('region', r)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      sp.get('region') === r ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-ink hover:border-brand-deep'
                    }`}
                  >{r}</button>
                ))}
              </div>
            </div>

            {/* 공예 종류 */}
            <div>
              <p className="text-xs font-semibold text-brand-grey mb-2">공예 종류</p>
              <div className="flex flex-wrap gap-1.5">
                {crafts.map(c => (
                  <button
                    key={c.value}
                    onClick={() => toggle('craft', c.value)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      sp.get('craft') === c.value ? 'bg-brand-amber/20 text-brand-ink border-brand-amber font-medium' : 'border-brand-mist text-brand-ink hover:border-brand-amber'
                    }`}
                  >{c.label}</button>
                ))}
              </div>
            </div>

            {/* 난이도 */}
            <div>
              <p className="text-xs font-semibold text-brand-grey mb-2">난이도</p>
              <div className="flex flex-wrap gap-1.5">
                {difficulties.map(d => (
                  <button
                    key={d.value}
                    onClick={() => toggle('difficulty', d.value)}
                    className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                      sp.get('difficulty') === d.value ? 'border-brand-amber bg-brand-amber/10 font-medium' : 'border-brand-mist text-brand-ink hover:border-brand-amber'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${d.color}`} />
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 가격대 */}
            <div>
              <p className="text-xs font-semibold text-brand-grey mb-2">가격대</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="최소"
                  defaultValue={sp.get('min_price') ?? ''}
                  onBlur={e => set('min_price', e.target.value || null)}
                  className="w-28 px-3 py-1.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
                <span className="text-brand-grey text-sm">~</span>
                <input
                  type="number"
                  placeholder="최대"
                  defaultValue={sp.get('max_price') ?? ''}
                  onBlur={e => set('max_price', e.target.value || null)}
                  className="w-28 px-3 py-1.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
                <span className="text-brand-grey text-sm">원</span>
              </div>
            </div>

            {/* 초기화 */}
            {activeCount > 0 && (
              <button
                onClick={() => { router.push('/classes'); setOpen(false); setQ('') }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
              >
                <X size={12} /> 필터 초기화
              </button>
            )}
          </div>
        )}

        {/* 활성 필터 칩 */}
        {!open && activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sp.get('q') && (
              <span className="inline-flex items-center gap-1 text-xs bg-brand-amber/10 border border-brand-amber/30 text-brand-ink px-2 py-0.5 rounded-full">
                "{sp.get('q')}"
                <button onClick={() => { set('q', null); setQ('') }}><X size={10} /></button>
              </span>
            )}
            {sp.get('region') && (
              <span className="inline-flex items-center gap-1 text-xs bg-brand-deep/5 border border-brand-deep/20 text-brand-ink px-2 py-0.5 rounded-full">
                {sp.get('region')}
                <button onClick={() => set('region', null)}><X size={10} /></button>
              </span>
            )}
            {sp.get('craft') && (
              <span className="inline-flex items-center gap-1 text-xs bg-brand-deep/5 border border-brand-deep/20 text-brand-ink px-2 py-0.5 rounded-full">
                {crafts.find(c => c.value === sp.get('craft'))?.label}
                <button onClick={() => set('craft', null)}><X size={10} /></button>
              </span>
            )}
            {sp.get('difficulty') && (
              <span className="inline-flex items-center gap-1 text-xs bg-brand-deep/5 border border-brand-deep/20 text-brand-ink px-2 py-0.5 rounded-full">
                {difficulties.find(d => d.value === sp.get('difficulty'))?.label}
                <button onClick={() => set('difficulty', null)}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

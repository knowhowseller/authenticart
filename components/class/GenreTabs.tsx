'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const GENRE_ICONS: Record<string, string> = {
  resin:    '🫧',
  candle:   '🕯️',
  flower:   '🌸',
  ceramic:  '🏺',
  jewelry:  '💎',
  textile:  '🧵',
  painting: '🎨',
  craft:    '🪵',
}

interface Category { id: string; code: string; name: string }

export default function GenreTabs({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const current = sp.get('category') ?? ''

  const select = useCallback((code: string) => {
    const params = new URLSearchParams(sp.toString())
    params.delete('limit')
    if (!code) params.delete('category')
    else params.set('category', code)
    router.push(`/classes?${params.toString()}`)
  }, [sp, router])

  return (
    <div className="bg-white border-b border-brand-mist/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => select('')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              !current
                ? 'border-brand-amber text-brand-deep'
                : 'border-transparent text-brand-grey hover:text-brand-ink'
            }`}
          >
            전체
          </button>
          {categories.map(cat => (
            <button
              key={cat.code}
              onClick={() => select(cat.code)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                current === cat.code
                  ? 'border-brand-amber text-brand-deep'
                  : 'border-transparent text-brand-grey hover:text-brand-ink'
              }`}
            >
              <span>{GENRE_ICONS[cat.code] ?? '✦'}</span>
              <span className="whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

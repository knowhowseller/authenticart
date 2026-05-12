import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '작품 마켓 | 오센틱아트',
  description: '수강생들이 직접 만든 작품을 만나보세요',
}

const CATEGORIES = ['전체', '레진아트', '비즈공예', '자수', '석고아트', '캔들', '페인팅', '기타']

async function getArtworks(category?: string) {
  const supabase = await createClient()
  let q = supabase
    .from('artworks')
    .select('id, title, price, images, category, status, stock, seller_id, users!seller_id(name)')
    .in('status', ['active', 'sold_out'])
    .order('created_at', { ascending: false })
  if (category && category !== '전체') q = q.eq('category', category)
  const { data } = await q
  return data ?? []
}

export default async function ArtworksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const artworks = await getArtworks(category)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-ink mb-1">작품 마켓</h1>
          <p className="text-brand-grey text-sm">수강생들이 직접 만든 핸드메이드 작품을 만나보세요</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(c => (
            <Link
              key={c}
              href={c === '전체' ? '/artworks' : `/artworks?category=${encodeURIComponent(c)}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (c === '전체' && !category) || c === category
                  ? 'bg-brand-deep text-white'
                  : 'bg-white text-brand-grey border border-brand-mist hover:border-brand-deep/30'
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {artworks.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-brand-grey">아직 등록된 작품이 없습니다</p>
            <Link href="/my/artworks/new" className="mt-4 inline-block text-sm text-brand-deep hover:underline">
              첫 작품을 등록해보세요
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((a: any) => (
              <Link key={a.id} href={`/artworks/${a.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md transition-all">
                <div className="aspect-square bg-brand-bg relative overflow-hidden">
                  {a.images?.[0] ? (
                    <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                  )}
                  {a.status === 'sold_out' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-brand-ink text-xs font-bold px-3 py-1 rounded-full">판매 완료</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-brand-bg/90 text-brand-grey text-[10px] px-2 py-0.5 rounded-full">{a.category}</span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-brand-ink truncate">{a.title}</p>
                  <p className="text-xs text-brand-grey mt-0.5">{(a.users as any)?.name ?? '작가'}</p>
                  <p className="text-sm font-bold text-brand-deep mt-1">{formatPrice(a.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 내 작품 등록 버튼 */}
        <div className="mt-10 text-center">
          <Link
            href="/my/artworks/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-deep text-white rounded-full text-sm font-medium hover:bg-brand-deep/90 transition-colors"
          >
            🎨 내 작품 판매하기
          </Link>
        </div>
      </div>
    </div>
  )
}

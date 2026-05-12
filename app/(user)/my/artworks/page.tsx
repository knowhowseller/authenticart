import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import { Plus } from 'lucide-react'
import ArtworkActions from './ArtworkActions'

export default async function MyArtworksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-brand-ink">내 작품 관리</h1>
          <Link href="/my/artworks/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-deep text-white rounded-full text-sm font-medium hover:bg-brand-deep/90 transition-colors">
            <Plus size={14} /> 작품 등록
          </Link>
        </div>

        {(artworks ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-brand-grey mb-4">아직 등록한 작품이 없습니다</p>
            <Link href="/my/artworks/new" className="text-sm text-brand-deep hover:underline">첫 작품 등록하기</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(artworks ?? []).map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                  {a.images?.[0] ? (
                    <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-ink text-sm truncate">{a.title}</p>
                  <p className="text-xs text-brand-grey mt-0.5">{a.category} · {formatPrice(a.price)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                    a.status === 'active' ? 'bg-green-50 text-green-600' :
                    a.status === 'sold_out' ? 'bg-orange-50 text-orange-500' : 'bg-brand-bg text-brand-grey'
                  }`}>
                    {a.status === 'active' ? '판매 중' : a.status === 'sold_out' ? '판매 완료' : '숨김'}
                  </span>
                </div>
                <ArtworkActions artworkId={a.id} currentStatus={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

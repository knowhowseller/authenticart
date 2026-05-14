import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ArtworkOrdersClient from './ArtworkOrdersClient'

export const metadata = { title: '작품 구매 내역 | 오센틱아트' }

export default async function MyArtworkOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('artwork_orders')
    .select(`
      id, status, total_price, receipt_url,
      tracking_carrier, tracking_number,
      escrow_status, confirmed_at, created_at,
      artworks!artwork_id(id, title, thumbnail_url, users!seller_id(name))
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">작품 구매 내역</h1>
        <p className="text-brand-grey text-sm mb-6">구매한 작품 주문을 확인하세요</p>
        <ArtworkOrdersClient orders={(orders ?? []) as any} />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import AdminArtworkOrdersClient from './AdminArtworkOrdersClient'

export const metadata = { title: '작품 주문 관리 | Admin' }

export default async function AdminArtworkOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: orders } = await supabase
    .from('artwork_orders')
    .select(`
      id, status, total_price, escrow_status,
      tracking_carrier, tracking_number, auto_confirm_at, created_at,
      artworks!artwork_id(title, thumbnail_url),
      buyer:users!buyer_id(name, email),
      seller:users!seller_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">작품 주문 관리</h1>
        <AdminArtworkOrdersClient orders={(orders ?? []) as any} />
      </div>
    </div>
  )
}

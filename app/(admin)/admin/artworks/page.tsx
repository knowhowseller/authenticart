import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import AdminArtworkList from './AdminArtworkList'

export default async function AdminArtworksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, title, price, images, category, status, created_at, seller_id, users!seller_id(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">작품 마켓 관리</h1>
        <AdminArtworkList initialArtworks={artworks ?? []} />
      </div>
    </div>
  )
}

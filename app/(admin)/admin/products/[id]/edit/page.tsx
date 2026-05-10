import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import ProductForm from '../../ProductForm'

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: product } = await supabase
    .from('products')
    .select('id, name, category, description, retail_price, wholesale_price, stock_qty, is_active, thumbnail_url')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">상품 수정</h1>
        <ProductForm mode="edit" product={product as any} />
      </div>
    </div>
  )
}

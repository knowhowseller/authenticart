import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import VendorProductEditForm from './VendorProductEditForm'

export default async function VendorProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, commission_rate, status')
    .eq('user_id', user.id)
    .single()

  if (!vendor || vendor.status !== 'approved') redirect('/my/vendor')

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, price, stock_quantity, thumbnail_url, images, is_active, category')
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="sage" size={16} />
          <Link href="/my/vendor" className="text-xs text-brand-grey hover:text-brand-ink">← 내 상점</Link>
        </div>
        <h1 className="text-xl font-bold text-brand-ink mb-6">상품 수정</h1>
        <VendorProductEditForm product={product as any} productId={id} commissionRate={vendor.commission_rate} />
      </div>
    </div>
  )
}

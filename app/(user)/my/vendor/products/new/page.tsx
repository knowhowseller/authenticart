import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import VendorProductForm from './VendorProductForm'

export const metadata = { title: '상품 등록 | 벤더' }

export default async function VendorProductNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, status, commission_rate')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/my/vendor/apply')
  if (vendor.status !== 'approved') redirect('/my/vendor')

  const { data: catRows } = await supabase
    .from('product_categories')
    .select('name')
    .order('id')
  const categories = (catRows ?? []).map((r: any) => r.name as string)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/my/vendor"
          className="inline-flex items-center gap-1 text-sm text-brand-grey hover:text-brand-ink mb-4"
        >
          ← 벤더 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-brand-ink mt-2 mb-1">상품 등록</h1>
        <p className="text-xs text-brand-grey mb-6">
          수수료 {vendor.commission_rate}% 공제 후 정산됩니다.
        </p>
        <VendorProductForm categories={categories} />
      </div>
    </div>
  )
}

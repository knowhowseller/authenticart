import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import Link from 'next/link'
import CouponManager from './CouponManager'

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*, coupon_uses(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-brand-grey hover:text-brand-ink">← 대시보드</Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">쿠폰 관리</h1>
        <CouponManager initialCoupons={coupons ?? []} adminId={user.id} />
      </div>
    </div>
  )
}

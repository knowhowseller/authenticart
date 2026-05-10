import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import { Users, BookOpen, ShoppingBag, TrendingUp } from 'lucide-react'

async function getAdminStats() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [userCount, instructorCount, gmv, pendingPayouts] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true })
      .then(r => r.count ?? 0),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'instructor')
      .then(r => r.count ?? 0),
    supabase.from('bookings').select('gross_amount').eq('status', 'paid').gte('created_at', monthStart)
      .then(({ data }) => (data ?? []).reduce((s: number, b: any) => s + b.gross_amount, 0)),
    supabase.from('payouts').select('total_payout').eq('status', 'pending')
      .then(({ data }) => (data ?? []).reduce((s: number, p: any) => s + p.total_payout, 0)),
  ])

  return { userCount, instructorCount, gmv, pendingPayouts }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const stats = await getAdminStats()

  const kpis = [
    { title: '전체 사용자', value: `${stats.userCount}명`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/instructors' },
    { title: '활성 강사', value: `${stats.instructorCount}명`, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/instructors' },
    { title: '이번달 GMV', value: formatPrice(stats.gmv), icon: TrendingUp, color: 'text-brand-deep', bg: 'bg-brand-deep/5', href: '/admin/bookings' },
    { title: '정산 예정', value: formatPrice(stats.pendingPayouts), icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', href: '/admin/payouts' },
  ]

  const menus = [
    { href: '/admin/instructors', label: '강사 승인 관리', icon: '👩‍🎨', desc: '신규 강사 신청 검토 및 승인' },
    { href: '/admin/classes', label: '클래스 검수', icon: '📋', desc: 'draft 클래스 검수 및 게시' },
    { href: '/admin/bookings', label: '예약 관리', icon: '📅', desc: '전체 예약 현황 조회' },
    { href: '/admin/orders', label: '주문 관리', icon: '📦', desc: '전체 주문 현황 및 배송' },
    { href: '/admin/payouts', label: '정산 실행', icon: '💰', desc: '월별 정산 처리 및 입금' },
    { href: '/admin/products', label: '상품 관리', icon: '🛍️', desc: '상품 등록 및 재고 관리' },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">관리자 대시보드</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => (
            <Link key={k.title} href={k.href} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon size={18} className={k.color} />
              </div>
              <p className="text-xs text-brand-grey mb-1">{k.title}</p>
              <p className="text-lg font-bold text-brand-ink">{k.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {menus.map(m => (
            <Link key={m.href} href={m.href} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-deep/30 transition-all">
              <div className="text-2xl mb-2">{m.icon}</div>
              <h3 className="font-semibold text-brand-ink text-sm">{m.label}</h3>
              <p className="text-xs text-brand-grey mt-0.5">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

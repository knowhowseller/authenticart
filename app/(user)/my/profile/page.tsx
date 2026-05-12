import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import ProfileEditForm from './ProfileEditForm'
import { formatPrice } from '@/lib/utils/format'
import { Calendar, Heart, ShoppingBag, BookOpen, ChevronRight } from 'lucide-react'

async function getMyStats(userId: string) {
  const supabase = await createClient()
  const [bookingCount, totalSpend, wishlistCount, orderCount] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('student_id', userId).in('status', ['paid', 'completed'])
      .then(r => r.count ?? 0),
    supabase.from('bookings').select('gross_amount')
      .eq('student_id', userId).in('status', ['paid', 'completed'])
      .then(({ data }) => (data ?? []).reduce((s: number, b: any) => s + b.gross_amount, 0)),
    supabase.from('wishlists').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count ?? 0),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .eq('buyer_id', userId).in('status', ['paid', 'shipped', 'delivered'])
      .then(r => r.count ?? 0),
  ])
  return { bookingCount, totalSpend, wishlistCount, orderCount }
}

export default async function MyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: userData }, stats, { data: instructorProfile }] = await Promise.all([
    supabase.from('users').select('name, phone, region, email, role, created_at').eq('id', user.id).single(),
    getMyStats(user.id),
    supabase.from('instructor_profiles').select('status').eq('instructor_id', user.id).maybeSingle(),
  ])

  const memberSince = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : null

  const statItems = [
    { icon: Calendar, label: '수강한 클래스', value: `${stats.bookingCount}개`, href: '/my/bookings', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: ShoppingBag, label: '총 지출', value: formatPrice(stats.totalSpend), href: '/my/bookings', color: 'text-brand-deep', bg: 'bg-brand-deep/5' },
    { icon: Heart, label: '찜 목록', value: `${stats.wishlistCount}개`, href: '/my/wishlist', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: BookOpen, label: '주문 내역', value: `${stats.orderCount}건`, href: '/my/orders', color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="sage" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">프로필</h1>
        </div>

        {/* 프로필 헤더 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blush to-brand-mist flex items-center justify-center text-2xl flex-shrink-0">
              👤
            </div>
            <div>
              <p className="text-lg font-bold text-brand-ink">{userData?.name}</p>
              <p className="text-sm text-brand-grey">{userData?.email}</p>
              {memberSince && <p className="text-xs text-brand-grey mt-0.5">{memberSince}부터 함께함</p>}
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statItems.map(({ icon: Icon, label, value, href, color, bg }) => (
            <a key={label} href={href}
              className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 hover:shadow-md transition-all"
            >
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <p className="text-xs text-brand-grey mb-0.5">{label}</p>
              <p className="text-base font-bold text-brand-ink">{value}</p>
            </a>
          ))}
        </div>

        {/* 강사 신청 현황 링크 */}
        {userData?.role !== 'instructor' && (
          <div className="mb-4">
            <Link
              href="/my/instructor-status"
              className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-brand-mist/30 hover:border-brand-deep/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👩‍🎨</span>
                <div>
                  <p className="text-sm font-medium text-brand-ink">강사 신청</p>
                  <p className="text-xs text-brand-grey">
                    {instructorProfile?.status === 'pending'
                      ? '심사 중 — 현황 확인'
                      : instructorProfile?.status === 'rejected'
                      ? '반려됨 — 재신청 가능'
                      : '나만의 클래스를 열어보세요'}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-brand-grey" />
            </Link>
          </div>
        )}

        <ProfileEditForm user={userData} userId={user.id} />
      </div>
    </div>
  )
}

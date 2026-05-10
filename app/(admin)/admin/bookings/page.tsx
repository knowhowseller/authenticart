import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending_approval: { label: '승인 대기', color: 'bg-yellow-50 text-yellow-600' },
  approved:         { label: '결제 대기', color: 'bg-blue-50 text-blue-600' },
  paid:             { label: '결제 완료', color: 'bg-green-50 text-green-600' },
  cancelled:        { label: '취소됨', color: 'bg-brand-bg text-brand-grey' },
  expired:          { label: '만료됨', color: 'bg-brand-bg text-brand-grey' },
  refunded:         { label: '환불됨', color: 'bg-red-50 text-red-500' },
}

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, gross_amount, instructor_payout, created_at, payment_id,
      users!student_id(name, email),
      class_schedules!schedule_id(
        start_at,
        classes!class_id(title, users!instructor_id(name))
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">예약 관리</h1>

        {!bookings || bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey">예약이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b: any) => {
              const s = statusLabel[b.status] ?? { label: b.status, color: '' }
              return (
                <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink text-sm truncate">
                        {b.class_schedules?.classes?.title ?? '-'}
                      </p>
                      <p className="text-xs text-brand-grey mt-0.5">
                        수강생: {b.users?.name} · 강사: {b.class_schedules?.classes?.users?.name}
                      </p>
                      <p className="text-xs text-brand-grey mt-0.5">
                        {b.class_schedules?.start_at
                          ? new Date(b.class_schedules.start_at).toLocaleString('ko-KR')
                          : '-'}
                        {' · '}{formatPrice(b.gross_amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-brand-grey hidden sm:block">
                        {new Date(b.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

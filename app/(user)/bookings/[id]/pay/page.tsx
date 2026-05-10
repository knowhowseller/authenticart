import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import BookingPaySection from './BookingPaySection'

export default async function BookingPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, status, gross_amount, approval_expires_at,
      class_schedules!schedule_id(
        start_at,
        classes!class_id(title, price)
      )
    `)
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!booking) notFound()
  if (booking.status !== 'approved') redirect('/my/bookings')

  const { data: userData } = await supabase
    .from('users')
    .select('name, email, phone')
    .eq('id', user.id)
    .single()

  const cls = (booking as any).class_schedules?.classes
  const startAt = (booking as any).class_schedules?.start_at

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="amber" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">예약 결제</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-5">
          <h2 className="font-semibold text-brand-ink mb-1">{cls?.title}</h2>
          {startAt && (
            <p className="text-sm text-brand-grey">
              {new Date(startAt).toLocaleString('ko-KR')}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-brand-mist/30 flex items-center justify-between">
            <span className="text-sm text-brand-grey">결제 금액</span>
            <span className="text-lg font-bold text-brand-ink">{formatPrice(booking.gross_amount)}</span>
          </div>
          {booking.approval_expires_at && (
            <p className="text-xs text-orange-500 mt-2">
              결제 기한: {new Date(booking.approval_expires_at).toLocaleString('ko-KR')}
            </p>
          )}
        </div>

        <BookingPaySection
          bookingId={booking.id}
          amount={booking.gross_amount}
          className={cls?.title ?? '클래스'}
          userName={userData?.name ?? ''}
          userEmail={userData?.email ?? user.email ?? ''}
          userPhone={userData?.phone ?? ''}
        />
      </div>
    </div>
  )
}

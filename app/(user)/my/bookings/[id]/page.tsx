import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import { Calendar, MapPin, User, Receipt, BookOpen } from 'lucide-react'

const statusLabel: Record<string, string> = {
  pending:   '결제 대기',
  paid:      '예약 확정',
  completed: '수강 완료',
  cancelled: '취소됨',
  refunded:  '환불됨',
}
const statusColor: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-600',
  paid:      'bg-green-50 text-green-600',
  completed: 'bg-blue-50 text-blue-600',
  cancelled: 'bg-gray-100 text-gray-500',
  refunded:  'bg-red-50 text-red-500',
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, status, gross_amount, discount_amount, refund_amount,
      created_at, receipt_url, coupon_id,
      class_schedules!schedule_id(
        start_at, end_at, location,
        classes!class_id(
          id, title, region, price,
          users!instructor_id(name)
        )
      )
    `)
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!booking) notFound()

  const schedule = (booking as any).class_schedules
  const cls = schedule?.classes
  const instructor = cls?.users

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link href="/my/bookings" className="text-sm text-brand-grey hover:text-brand-deep mb-6 block">
          ← 예약 목록
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-brand-ink">{cls?.title ?? '클래스'}</h1>
            <p className="text-sm text-brand-grey mt-0.5">예약 ID: {booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[booking.status] ?? ''}`}>
            {statusLabel[booking.status] ?? booking.status}
          </span>
        </div>

        {/* 수업 정보 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-brand-ink mb-1">수업 정보</h2>
          {schedule?.start_at && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-brand-grey flex-shrink-0" />
              <span className="text-brand-ink">{formatDateTime(schedule.start_at)}</span>
            </div>
          )}
          {(schedule?.location || cls?.region) && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={15} className="text-brand-grey flex-shrink-0" />
              <span className="text-brand-ink">{schedule?.location ?? cls?.region}</span>
            </div>
          )}
          {instructor?.name && (
            <div className="flex items-center gap-3 text-sm">
              <User size={15} className="text-brand-grey flex-shrink-0" />
              <span className="text-brand-ink">{instructor.name} 강사</span>
            </div>
          )}
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 mb-4">
          <h2 className="text-sm font-semibold text-brand-ink mb-3">결제 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-grey">수강료</span>
              <span className="text-brand-ink">{formatPrice(cls?.price ?? booking.gross_amount)}</span>
            </div>
            {(booking as any).discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-brand-grey">쿠폰 할인</span>
                <span className="text-green-600">-{formatPrice((booking as any).discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t border-brand-mist/30">
              <span className="text-brand-ink">실 결제액</span>
              <span className="text-brand-deep">{formatPrice(booking.gross_amount)}</span>
            </div>
            {(booking as any).refund_amount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>환불액</span>
                <span>-{formatPrice((booking as any).refund_amount)}</span>
              </div>
            )}
          </div>
          {booking.receipt_url && (
            <a
              href={booking.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-xs text-brand-deep hover:underline"
            >
              <Receipt size={13} />
              영수증 보기
            </a>
          )}
        </div>

        {/* 수강 재료 */}
        {(booking.status === 'paid' || booking.status === 'completed') && cls?.id && (
          <Link
            href={`/my/bookings/${booking.id}/materials`}
            className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-brand-mist/30 hover:border-brand-deep/30 transition-all mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-deep/10 flex items-center justify-center">
                <BookOpen size={15} className="text-brand-deep" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-ink">수강 재료 확인</p>
                <p className="text-xs text-brand-grey">준비물 및 재료 목록</p>
              </div>
            </div>
            <span className="text-brand-grey text-xs">→</span>
          </Link>
        )}

        <p className="text-xs text-center text-brand-grey">
          예약일: {new Date(booking.created_at).toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingsList from './BookingsList'

async function getMyBookings(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, status, gross_amount, refund_amount, created_at, receipt_url,
      class_schedules!schedule_id(
        start_at, end_at,
        classes!class_id(title, region, price, instructor_id)
      )
    `)
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bookings = await getMyBookings(user.id)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">내 예약</h1>
        <p className="text-brand-grey text-sm mb-6">클래스 예약 내역을 확인하세요</p>
        <BookingsList bookings={bookings as any[]} />
      </div>
    </div>
  )
}

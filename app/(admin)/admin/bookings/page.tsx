import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import AdminBookingsClient from './AdminBookingsClient'

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
    .limit(500)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">예약 관리</h1>

        <AdminBookingsClient bookings={(bookings ?? []) as any} />
      </div>
    </div>
  )
}

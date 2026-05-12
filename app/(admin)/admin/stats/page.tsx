import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import StatsCharts from './StatsCharts'

async function getStatsData() {
  const supabase = await createClient()
  const now = new Date()

  // Last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: `${d.getMonth() + 1}월`,
      start: d.toISOString(),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
    }
  })

  const [bookingsByMonth, ordersByMonth, topClassesRaw] = await Promise.all([
    supabase
      .from('bookings')
      .select('gross_amount, created_at')
      .in('status', ['paid', 'completed'])
      .gte('created_at', months[0].start),

    supabase
      .from('orders')
      .select('total_amount, created_at')
      .in('status', ['paid', 'shipped', 'delivered'])
      .gte('created_at', months[0].start),

    supabase
      .from('bookings')
      .select('gross_amount, class_schedules!schedule_id(classes!class_id(id, title))')
      .in('status', ['paid', 'completed'])
      .gte('created_at', months[0].start),
  ])

  const monthlyData = months.map(m => {
    const booksInMonth = (bookingsByMonth.data ?? []).filter(b =>
      b.created_at >= m.start && b.created_at < m.end
    )
    const ordersInMonth = (ordersByMonth.data ?? []).filter(o =>
      o.created_at >= m.start && o.created_at < m.end
    )
    return {
      month: m.label,
      bookingRevenue: booksInMonth.reduce((s, b) => s + b.gross_amount, 0),
      orderRevenue: ordersInMonth.reduce((s, o) => s + o.total_amount, 0),
      bookings: booksInMonth.length,
    }
  })

  // Class rankings
  const classMap = new Map<string, { title: string; count: number; revenue: number }>()
  for (const b of (topClassesRaw.data ?? [])) {
    const cls = (b as any).class_schedules?.classes
    if (!cls) continue
    const key = cls.id
    const existing = classMap.get(key) ?? { title: cls.title, count: 0, revenue: 0 }
    classMap.set(key, { title: existing.title, count: existing.count + 1, revenue: existing.revenue + b.gross_amount })
  }
  const topClasses = Array.from(classMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return { monthlyData, topClasses }
}

export default async function AdminStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { monthlyData, topClasses } = await getStatsData()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">통계 차트</h1>

        <StatsCharts monthlyData={monthlyData} topClasses={topClasses} />
      </div>
    </div>
  )
}

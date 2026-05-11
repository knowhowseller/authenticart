import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import ScheduleManager from './ScheduleManager'

export default async function StudioSchedulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) redirect('/')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, title')
    .eq('instructor_id', user.id)
    .eq('status', 'published')
    .order('title')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: schedules } = await supabase
    .from('class_schedules')
    .select(`
      id, start_at, end_at, max_students, booked_count,
      classes!class_id(id, title, instructor_id)
    `)
    .gte('start_at', thirtyDaysAgo)
    .order('start_at', { ascending: false })
    .limit(100)
    .then(({ data }) => ({
      data: (data ?? []).filter((s: any) => s.classes?.instructor_id === user.id),
    }))

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Studio</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">회차 관리</h1>

        <ScheduleManager classes={classes ?? []} schedules={schedules ?? []} />
      </div>
    </div>
  )
}

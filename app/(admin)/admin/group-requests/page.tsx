import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GroupRequestManager from './GroupRequestManager'

export default async function AdminGroupRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) redirect('/')

  const [{ data: requests }, { data: instructors }] = await Promise.all([
    supabase.from('group_lesson_requests')
      .select('*, users!assigned_instructor_id(name)')
      .order('created_at', { ascending: false }),
    supabase.from('users').select('id, name').eq('role', 'instructor').order('name'),
  ])

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-brand-ink mb-6">단체 출강 요청 관리</h1>
        <GroupRequestManager initialRequests={requests ?? []} instructors={instructors ?? []} />
      </div>
    </div>
  )
}

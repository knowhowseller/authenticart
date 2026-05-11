import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClassEditForm from './ClassEditForm'
import Hexagon from '@/components/brand/Hexagon'

export default async function ClassEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isPrivileged = ['admin', 'branch_manager'].includes(userRow?.role ?? '')

  const baseQuery = supabase.from('classes').select('*').eq('id', id)
  const finalQuery = isPrivileged ? baseQuery : baseQuery.eq('instructor_id', user.id)
  const { data: cls } = await finalQuery.single()

  if (!cls) notFound()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="deep" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">클래스 수정</h1>
        </div>
        <ClassEditForm cls={cls} />
      </div>
    </div>
  )
}

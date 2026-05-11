import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import AdminClassEditForm from './AdminClassEditForm'

export default async function AdminClassEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) redirect('/')

  const { data: cls } = await supabase
    .from('classes')
    .select('*, users!instructor_id(name)')
    .eq('id', id)
    .single()

  if (!cls) notFound()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">클래스 편집</h1>
        <AdminClassEditForm cls={cls} instructorName={(cls.users as any)?.name ?? ''} />
      </div>
    </div>
  )
}

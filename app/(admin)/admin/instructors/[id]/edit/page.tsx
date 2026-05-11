import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import InstructorEditForm from './InstructorEditForm'

export default async function AdminInstructorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) redirect('/')

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('bio, region, profile_image, instructor_id, users!instructor_id(name, email)')
    .eq('instructor_id', id)
    .single()

  if (!profile) notFound()

  const userData = profile.users as any

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">강사 프로필 편집</h1>
        <InstructorEditForm
          instructorId={profile.instructor_id}
          name={userData?.name ?? ''}
          email={userData?.email ?? ''}
          bio={profile.bio ?? ''}
          region={profile.region ?? ''}
          profileImage={profile.profile_image ?? ''}
        />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import ProfileEditForm from './ProfileEditForm'

export default async function MyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('name, phone, region, email, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="sage" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">프로필</h1>
        </div>
        <ProfileEditForm user={userData} userId={user.id} />
      </div>
    </div>
  )
}

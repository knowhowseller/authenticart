'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProfileData {
  bio?: string
  region?: string
  profile_image?: string
}

export async function updateInstructorProfile(instructorId: string, data: ProfileData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isAdmin = me?.role === 'admin' || me?.role === 'branch_manager'
  const isSelf = user.id === instructorId

  if (!isAdmin && !isSelf) return { error: '권한이 없습니다.' }

  const client = isAdmin ? await createAdminClient() : supabase

  const { error } = await client
    .from('instructor_profiles')
    .update({
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.region !== undefined && { region: data.region }),
      ...(data.profile_image !== undefined && { profile_image: data.profile_image }),
    })
    .eq('instructor_id', instructorId)

  if (error) return { error: error.message }

  revalidatePath('/studio/settings')
  revalidatePath('/admin/instructors')
  revalidatePath(`/admin/instructors/${instructorId}/edit`)
  return { success: true }
}

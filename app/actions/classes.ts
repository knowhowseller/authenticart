'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClass(classId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isPrivileged = ['admin', 'branch_manager'].includes(me?.role ?? '')

  const client = isPrivileged ? await createAdminClient() : supabase

  const { error } = await client.from('classes').update(data).eq('id', classId)
  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${classId}/edit`)
  revalidatePath('/studio/classes')
  revalidatePath(`/studio/classes/${classId}/edit`)
  revalidatePath('/classes')
  return { success: true }
}

'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, adminClient: null, me: null }
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return { supabase: null, adminClient: null, me: null }
  const adminClient = await createAdminClient()
  return { supabase, adminClient, me: user }
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { adminClient } = await requireAdmin()
  if (!adminClient) return { error: '권한이 없습니다.' }

  const { error } = await adminClient
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { supabase, me } = await requireAdmin()
  if (!supabase) return { error: '권한이 없습니다.' }
  if (me?.id === userId) return { error: '자신의 계정은 삭제할 수 없습니다.' }

  // public.users 먼저 삭제 (FK 제약 해결)
  const { error: pubErr } = await supabase.from('users').delete().eq('id', userId)
  if (pubErr) return { error: pubErr.message }

  // auth.users 삭제 — Supabase Auth Admin REST API 직접 호출
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
  })

  if (!res.ok && res.status !== 404) {
    const body = await res.text()
    return { error: `auth 삭제 실패: ${body}` }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

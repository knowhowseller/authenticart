'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

async function getCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from('product_categories').select('name').order('id')
  return (data ?? []).map((r: any) => r.name as string)
}

export async function manageCategory(
  action: 'add' | 'delete' | 'rename',
  name: string,
  newName?: string,
) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: '권한이 없습니다.' }

  if (action === 'add') {
    const { error } = await supabase.from('product_categories').insert({ name })
    if (error) return { error: error.message }
  } else if (action === 'delete') {
    const { error } = await supabase.from('product_categories').delete().eq('name', name)
    if (error) return { error: error.message }
  } else if (action === 'rename' && newName) {
    const { error } = await supabase.from('product_categories').update({ name: newName }).eq('name', name)
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/products')
  const categories = await getCategories(supabase)
  return { categories }
}

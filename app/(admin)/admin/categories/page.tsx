import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CraftCategoryManager from './CraftCategoryManager'

export const metadata = { title: '카테고리 관리 | 어드민' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/admin')

  const { data: categories } = await supabase
    .from('craft_categories')
    .select('id, code, name, name_en, parent_id, sort_order, is_active')
    .order('sort_order')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">카테고리 관리</h1>
        <p className="text-sm text-brand-grey mb-6">
          클래스·상품·작품·강사 프로필이 공유하는 공예·예술 장르 카테고리를 관리합니다.
        </p>
        <CraftCategoryManager initialCategories={categories ?? []} />
      </div>
    </div>
  )
}

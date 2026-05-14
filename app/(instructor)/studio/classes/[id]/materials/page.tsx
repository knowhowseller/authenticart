import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClassMaterialsManager from './ClassMaterialsManager'

export const metadata = { title: '준비물 관리 | 스튜디오' }

export default async function ClassMaterialsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase
    .from('classes')
    .select('id, title, instructor_id')
    .eq('id', id)
    .single()

  if (!cls || cls.instructor_id !== user.id) redirect('/studio/classes')

  // 기존 연결된 재료
  const { data: materials } = await supabase
    .from('class_materials')
    .select('id, note, sort_order, products!product_id(id, name, retail_price, image_url)')
    .eq('class_id', id)
    .order('sort_order')

  // 등록 가능한 전체 상품 (활성 상품)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, retail_price, image_url')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">준비물 관리</h1>
        <p className="text-sm text-brand-grey mb-2">
          <strong className="text-brand-deep">{cls.title}</strong>
        </p>
        <p className="text-xs text-brand-grey mb-6">
          클래스에 필요한 재료를 연결하면 수강생이 예약 후 원스톱으로 구매할 수 있습니다.
        </p>
        <ClassMaterialsManager
          classId={id}
          initialMaterials={(materials ?? []) as any}
          allProducts={(products ?? []) as any}
        />
      </div>
    </div>
  )
}

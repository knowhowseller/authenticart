import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorApplyForm from './VendorApplyForm'

export const metadata = { title: '벤더 입점 신청 | 오센틱아트' }

export default async function VendorApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('vendors')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (existing) redirect('/my/vendor')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">벤더 입점 신청</h1>
        <p className="text-sm text-brand-grey mb-6">
          오센틱아트에 상품을 공급하는 벤더로 신청합니다. 관리자 승인 후 상품 등록이 가능합니다.
          기본 수수료는 <strong>판매가의 15%</strong>입니다.
        </p>
        <VendorApplyForm />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorManager from './VendorManager'

export const metadata = { title: '벤더 관리 | 어드민' }

export default async function VendorAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/admin')

  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      id, business_name, business_no, contact_email, contact_phone,
      commission_rate, status, description, rejection_reason,
      created_at, approved_at,
      users!user_id(name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">벤더 관리</h1>
        <p className="text-sm text-brand-grey mb-6">상품 입점사 신청 검토 및 수수료 설정</p>
        <VendorManager initialVendors={(vendors ?? []) as any} adminId={user.id} />
      </div>
    </div>
  )
}

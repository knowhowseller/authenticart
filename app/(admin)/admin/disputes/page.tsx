import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DisputeManager from './DisputeManager'

export const metadata = { title: '분쟁 관리 | 어드민' }

export default async function DisputeAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/admin')

  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      id, category, title, description, status, resolution,
      created_at, resolved_at,
      reporter:users!reporter_id(name, email),
      order_id, artwork_order_id, booking_id
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">분쟁 관리</h1>
        <p className="text-sm text-brand-grey mb-6">소비자 분쟁 접수 건을 검토하고 처리하세요</p>
        <DisputeManager initialDisputes={(disputes ?? []) as any} adminId={user.id} />
      </div>
    </div>
  )
}

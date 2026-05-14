import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyOrdersClient from './MyOrdersClient'

export default async function MyOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, quantity, total_amount, status, receipt_url,
      tracking_number, shipping_name, shipping_address, created_at,
      escrow_status, confirmed_at,
      products!product_id(name, thumbnail_url)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">주문 내역</h1>
        <p className="text-brand-grey text-sm mb-6">재료 구매 내역을 확인하세요</p>
        <MyOrdersClient orders={(orders ?? []) as any} />
      </div>
    </div>
  )
}

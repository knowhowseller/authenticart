import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DisputeForm from './DisputeForm'

export const metadata = { title: '분쟁 신청 | 오센틱아트' }

export default async function NewDisputePage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; artwork_order_id?: string; booking_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">분쟁 신청</h1>
        <p className="text-sm text-brand-grey mb-6">
          주문 관련 문제 발생 시 신청해주세요. 관리자가 검토 후 처리합니다.
        </p>
        <DisputeForm
          userId={user.id}
          orderId={params.order_id}
          artworkOrderId={params.artwork_order_id}
          bookingId={params.booking_id}
        />
      </div>
    </div>
  )
}

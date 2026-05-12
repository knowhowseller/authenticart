'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface RequestInfo {
  id: string
  title: string
  price_per_person: number
  target_capacity: number
  current_count: number
  schedule_date: string | null
  preferred_region: string
  instructor: { name: string } | null
}

export default function ClassRequestPayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [req, setReq] = useState<RequestInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('class_open_requests')
        .select('id, title, price_per_person, target_capacity, current_count, schedule_date, preferred_region, instructor:users!instructor_id(name)')
        .eq('id', id)
        .eq('status', 'payment_pending')
        .single()
      if (data) setReq(data as any)
      else router.push('/class-requests')
    }
    load()
  }, [id])

  async function handlePay() {
    if (!req?.price_per_person) { toast.error('결제 금액 정보가 없습니다'); return }
    setLoading(true)
    try {
      const { loadTossPayments } = await import('@tosspayments/payment-sdk')
      const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      await toss.requestPayment('카드', {
        amount: req.price_per_person,
        orderId: `class-req-${id}-${Date.now()}`,
        orderName: req.title,
        successUrl: `${window.location.origin}/api/payments/toss-success?type=class_request&requestId=${id}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (e: any) {
      if (e?.code !== 'USER_CANCEL') toast.error('결제 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-grey text-sm">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-md mx-auto px-4 py-10">
        <Link href="/class-requests" className="text-sm text-brand-grey hover:text-brand-deep mb-6 block">← 클래스 요청 목록</Link>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <h1 className="text-lg font-bold text-brand-ink mb-1">{req.title}</h1>
          <div className="space-y-2 text-sm text-brand-grey mt-3">
            <div className="flex justify-between">
              <span>지역</span>
              <span className="text-brand-ink font-medium">{req.preferred_region}</span>
            </div>
            {req.instructor && (
              <div className="flex justify-between">
                <span>강사</span>
                <span className="text-brand-ink font-medium">{(req.instructor as any).name}</span>
              </div>
            )}
            {req.schedule_date && (
              <div className="flex justify-between">
                <span>일정</span>
                <span className="text-brand-ink font-medium">{new Date(req.schedule_date).toLocaleDateString('ko-KR')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>참여 인원</span>
              <span className="text-brand-ink font-medium">{req.current_count}/{req.target_capacity}명</span>
            </div>
          </div>
        </div>

        <div className="bg-brand-amber/10 rounded-2xl p-5 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-brand-ink">결제 금액</span>
            <span className="text-xl font-bold text-brand-ink">{req.price_per_person?.toLocaleString()}원</span>
          </div>
          <p className="text-xs text-brand-grey mt-1">1인 수강료</p>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 bg-brand-deep text-white rounded-2xl font-semibold text-base hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
        >
          {loading ? '결제 진행 중...' : `${req.price_per_person?.toLocaleString()}원 결제하기`}
        </button>
        <p className="text-xs text-center text-brand-grey mt-3">토스페이먼츠 안전결제</p>
      </div>
    </div>
  )
}

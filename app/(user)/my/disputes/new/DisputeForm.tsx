'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'

const CATEGORIES = [
  { value: 'non_delivery',   label: '미배송 / 배송지연' },
  { value: 'item_mismatch',  label: '상품 불일치' },
  { value: 'defective',      label: '불량 / 파손' },
  { value: 'refund_dispute', label: '환불 분쟁' },
  { value: 'other',          label: '기타' },
]

export default function DisputeForm({
  userId,
  orderId,
  artworkOrderId,
  bookingId,
}: {
  userId: string
  orderId?: string
  artworkOrderId?: string
  bookingId?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [category, setCategory] = useState('')
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) { toast.error('분쟁 유형을 선택해주세요'); return }
    if (!title.trim()) { toast.error('제목을 입력해주세요'); return }
    if (desc.trim().length < 20) { toast.error('내용을 20자 이상 입력해주세요'); return }

    setLoading(true)
    const { error } = await supabase.from('disputes').insert({
      reporter_id:      userId,
      order_id:         orderId ?? null,
      artwork_order_id: artworkOrderId ?? null,
      booking_id:       bookingId ?? null,
      category,
      title:            title.trim(),
      description:      desc.trim(),
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('분쟁이 접수되었습니다. 1~3 영업일 내 처리됩니다.')
    router.push('/my/disputes')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-brand-mist/30 p-6 space-y-5">
      {(orderId || artworkOrderId || bookingId) && (
        <div className="bg-brand-amber/10 rounded-lg px-4 py-2.5 text-sm text-brand-deep">
          {orderId && <span>주문 ID: <code className="text-xs">{orderId}</code></span>}
          {artworkOrderId && <span>작품주문 ID: <code className="text-xs">{artworkOrderId}</code></span>}
          {bookingId && <span>예약 ID: <code className="text-xs">{bookingId}</code></span>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">분쟁 유형 *</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
        >
          <option value="">선택해주세요</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">제목 *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="분쟁 제목을 간략히 입력해주세요"
          className="w-full px-3 py-2.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">상세 내용 *</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={6}
          placeholder="문제 상황을 구체적으로 설명해주세요 (20자 이상)"
          className="w-full px-3 py-2.5 text-sm border border-brand-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
        />
        <p className="text-xs text-brand-grey mt-1 text-right">{desc.length}자</p>
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-brand-grey space-y-1">
        <p>• 분쟁 접수 후 1~3 영업일 내 담당자가 검토합니다.</p>
        <p>• 허위 분쟁 신청 시 서비스 이용이 제한될 수 있습니다.</p>
        <p>• 필요시 추가 증빙 자료 제출을 요청드릴 수 있습니다.</p>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        분쟁 신청하기
      </Button>
    </form>
  )
}

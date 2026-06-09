'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [artwork, setArtwork] = useState<any>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [shipping, setShipping] = useState({ name: '', phone: '', address: '' })

  useEffect(() => {
    async function load() {
      const [{ data: a }, { data: { user } }] = await Promise.all([
        supabase.from('artworks')
          .select('*, users!seller_id(id, name)')
          .eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      setArtwork(a)
      setMyId(user?.id ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  function loadTossScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).TossPayments) { resolve(); return }
      const script = document.createElement('script')
      script.src = 'https://js.tosspayments.com/v1/payment'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('결제 모듈 로드 실패'))
      document.head.appendChild(script)
    })
  }

  async function handleBuy() {
    if (!myId) { toast.error('로그인 후 구매 가능합니다'); router.push('/login'); return }
    if (!shipping.name || !shipping.phone || !shipping.address) {
      toast.error('배송 정보를 입력해주세요'); return
    }
    setBuying(true)
    const res = await fetch(`/api/artworks/${id}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shipping),
    })
    const data = await res.json()
    setBuying(false)
    if (!res.ok) { toast.error(data.error ?? '오류'); return }

    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!tossClientKey) { toast.error('결제 설정 오류'); return }

    await loadTossScript()
    const tossPayments = (window as any).TossPayments(tossClientKey)
    await tossPayments.requestPayment('카드', {
      amount: data.amount,
      orderId: data.order_id,
      orderName: artwork?.title ?? '작품',
      successUrl: `${window.location.origin}/api/payments/toss-success?type=artwork`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  }

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><p className="text-brand-grey text-sm">불러오는 중...</p></div>
  if (!artwork) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center flex-col gap-4">
      <p className="text-brand-grey">작품을 찾을 수 없습니다</p>
      <Link href="/artworks" className="text-sm text-brand-deep hover:underline">← 작품 마켓으로 돌아가기</Link>
    </div>
  )

  const seller = artwork.users
  const images: string[] = artwork.images ?? []
  const shippingFee: number = artwork.shipping_fee ?? 0
  const total: number = (artwork.price ?? 0) + shippingFee

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/artworks" className="flex items-center gap-1 text-sm text-brand-grey hover:text-brand-deep mb-6">
          <ChevronLeft size={16} /> 작품 마켓으로
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이미지 */}
          <div>
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 relative">
              {images[imgIdx] ? (
                <img src={images[imgIdx]} alt={artwork.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🎨</div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-brand-deep' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div>
            <span className="text-xs bg-brand-amber/10 text-brand-amber px-2 py-1 rounded-full font-medium">{artwork.category}</span>
            <h1 className="text-2xl font-bold text-brand-ink mt-3 mb-1">{artwork.title}</h1>
            <p className="text-sm text-brand-grey mb-4">
              by <Link href={`/instructors`} className="hover:text-brand-deep">{seller?.name ?? '작가'}</Link>
            </p>

            {artwork.material && <p className="text-sm text-brand-grey mb-1">소재: {artwork.material}</p>}
            {artwork.size_info && <p className="text-sm text-brand-grey mb-1">크기: {artwork.size_info}</p>}
            {artwork.description && (
              <p className="text-sm text-brand-ink/80 leading-relaxed mt-3 mb-6 whitespace-pre-line">{artwork.description}</p>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
              <div className="mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-sm text-brand-grey">
                  <span>작품가</span><span>{formatPrice(artwork.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-brand-grey">
                  <span>배송비</span>
                  <span>{shippingFee > 0 ? formatPrice(shippingFee) : <span className="text-brand-sage font-medium">무료</span>}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-brand-mist/30">
                  <span className="text-sm font-semibold text-brand-ink">합계</span>
                  <span className="text-2xl font-bold text-brand-deep">{formatPrice(total)}</span>
                </div>
              </div>
              <p className="text-xs text-brand-grey mb-4">재고 {artwork.stock}개 · 핸드메이드 작품</p>

              {artwork.status === 'sold_out' ? (
                <div className="w-full py-3 bg-brand-bg rounded-xl text-center text-brand-grey text-sm font-medium">판매 완료</div>
              ) : myId === seller?.id ? (
                <Link href="/my/artworks" className="block w-full py-3 bg-brand-bg rounded-xl text-center text-brand-grey text-sm font-medium">내 작품 관리</Link>
              ) : (
                <>
                  {!showForm ? (
                    <button onClick={() => setShowForm(true)}
                      className="w-full py-3 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 transition-colors">
                      구매하기
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">배송 정보</p>
                      <input placeholder="받는 분 이름" value={shipping.name} onChange={e => setShipping(s => ({ ...s, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
                      <input placeholder="연락처" value={shipping.phone} onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
                      <input placeholder="배송 주소" value={shipping.address} onChange={e => setShipping(s => ({ ...s, address: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
                      <button onClick={handleBuy} disabled={buying}
                        className="w-full py-3 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
                        {buying ? '결제 중...' : `${formatPrice(total)} 결제하기`}
                      </button>
                      <button onClick={() => setShowForm(false)} className="w-full py-2 text-sm text-brand-grey hover:text-brand-ink">취소</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

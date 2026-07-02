import Link from 'next/link'

// 결제 유형별 "다시 시도" 경로 — 실패 시 원래 맥락으로 되돌려 전환 손실을 줄인다.
const RETRY: Record<string, { label: string; href: string }> = {
  booking: { label: '클래스 다시 보기', href: '/classes' },
  order: { label: '쇼핑 계속하기', href: '/shop' },
  cart: { label: '장바구니로 돌아가기', href: '/cart' },
  artwork: { label: '작품 마켓으로', href: '/artworks' },
  class_request: { label: '내 클래스 요청', href: '/my/class-requests' },
}

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; type?: string }>
}) {
  const { reason, type } = await searchParams
  const retry = (type && RETRY[type]) || { label: '클래스 목록', href: '/classes' }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-brand-ink mb-2">결제에 실패했습니다</h1>
        <p className="text-sm text-brand-grey mb-2">
          {reason ? decodeURIComponent(reason) : '결제 처리 중 오류가 발생했습니다.'}
        </p>
        <p className="text-xs text-brand-grey mb-6">동일한 문제가 반복되면 고객센터로 문의해주세요.</p>
        <div className="flex gap-3">
          <Link
            href={retry.href}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors text-center"
          >
            {retry.label}
          </Link>
          <Link
            href="/"
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 transition-colors text-center"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}

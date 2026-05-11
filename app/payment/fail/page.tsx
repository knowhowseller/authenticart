import Link from 'next/link'

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
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
            href="/classes"
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors text-center"
          >
            클래스 목록
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

'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 런타임 에러를 콘솔에 남겨 Vercel 런타임 로그에서 추적 가능하게 한다.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h1 className="text-xl font-bold text-brand-ink mb-2">일시적인 오류가 발생했습니다</h1>
        <p className="text-sm text-brand-grey mb-6">
          잠시 후 다시 시도해주세요. 문제가 계속되면 채널톡으로 문의해주세요.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-brand-grey/30 rounded-xl text-sm text-brand-grey hover:bg-white transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}

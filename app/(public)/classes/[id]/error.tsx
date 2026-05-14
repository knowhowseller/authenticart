'use client'
import Link from 'next/link'

export default function ClassError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🎨</div>
        <h2 className="text-lg font-semibold text-brand-ink mb-2">클래스를 불러올 수 없습니다</h2>
        <p className="text-sm text-brand-grey mb-6">잠시 후 다시 시도해주세요</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 transition-colors"
          >
            다시 시도
          </button>
          <Link href="/classes" className="px-4 py-2 border border-brand-mist rounded-xl text-sm text-brand-grey hover:bg-brand-bg transition-colors">
            목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}

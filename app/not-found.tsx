import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-sm font-medium text-brand-amber uppercase tracking-wider mb-2">404</p>
        <h1 className="text-xl font-bold text-brand-ink mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-brand-grey mb-6">
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 transition-colors"
          >
            홈으로
          </Link>
          <Link
            href="/classes"
            className="px-4 py-2 border border-brand-grey/30 rounded-xl text-sm text-brand-grey hover:bg-white transition-colors"
          >
            클래스 둘러보기
          </Link>
        </div>
      </div>
    </div>
  )
}

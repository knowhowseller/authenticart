'use client'

import { useEffect } from 'react'

// 루트 레이아웃(app/layout.tsx) 자체에서 발생한 에러를 잡는 최종 방어선.
// 이 컴포넌트는 layout을 대체하므로 자체 <html>/<body>를 포함하고,
// 전역 CSS 로드 실패 상황까지 대비해 인라인 스타일을 사용한다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F3F4F7',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#292929',
        }}
      >
        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            일시적인 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: 14, color: '#9D9D9D', margin: '0 0 24px' }}>
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              background: '#1F4145',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}

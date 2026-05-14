'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink } from 'lucide-react'

function detectInAppBrowser() {
  if (typeof window === 'undefined') return { isInApp: false, isKakao: false }
  const ua = navigator.userAgent
  const isKakao = /KAKAOTALK/i.test(ua)
  const isInApp = isKakao || /Instagram|FBAN|FBAV|Line|NaverApp|wv;|WebView/i.test(ua)
  return { isInApp, isKakao }
}

export default function SocialLoginButtons() {
  const supabase = createClient()
  const [kakaoLoading, setKakaoLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [inAppInfo, setInAppInfo] = useState({ isInApp: false, isKakao: false })

  useEffect(() => {
    setInAppInfo(detectInAppBrowser())
  }, [])

  async function handleKakao() {
    setKakaoLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'profile_nickname profile_image account_email',
      },
    })
    if (error) {
      toast.error('카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setKakaoLoading(false)
    }
  }

  async function handleGoogle() {
    if (inAppInfo.isInApp) return
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      toast.error('구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setGoogleLoading(false)
    }
  }

  function openInDefaultBrowser() {
    const currentUrl = window.location.href
    const ua = navigator.userAgent
    if (/Android/i.test(ua)) {
      window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`
    } else {
      // iOS — 복사 안내
      toast.info('주소창의 URL을 복사해서 Safari로 열어주세요', { duration: 5000 })
    }
  }

  return (
    <div className="space-y-3">
      {/* 내장 브라우저 안내 배너 */}
      {inAppInfo.isInApp && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 leading-relaxed">
          <p className="font-semibold mb-1">⚠️ 구글 로그인 안내</p>
          <p>카카오톡·인스타그램 등 앱 내 브라우저에서는 구글 로그인이 차단됩니다.</p>
          <button
            onClick={openInDefaultBrowser}
            className="mt-2 flex items-center gap-1.5 text-yellow-700 font-medium underline"
          >
            <ExternalLink size={12} />
            기본 브라우저(Safari·Chrome)에서 열기
          </button>
        </div>
      )}

      <button
        onClick={handleKakao}
        disabled={kakaoLoading}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm bg-[#FEE500] text-[#191919] hover:bg-[#F0D800] transition-colors disabled:opacity-60"
      >
        {kakaoLoading ? (
          <span className="w-4 h-4 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.5 1.5 4.7 3.8 6.1l-1 3.7 4.3-2.8c.9.1 1.9.2 2.9.2 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
          </svg>
        )}
        카카오로 계속하기
      </button>

      <button
        onClick={handleGoogle}
        disabled={googleLoading || inAppInfo.isInApp}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm bg-white border border-brand-mist hover:bg-brand-bg text-brand-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <span className="w-4 h-4 border-2 border-brand-mist border-t-brand-ink rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {inAppInfo.isInApp ? 'Google 로그인 (기본 브라우저 필요)' : 'Google로 계속하기'}
      </button>
    </div>
  )
}

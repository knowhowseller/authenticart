'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Hexagon from '@/components/brand/Hexagon'
import { CheckCircle } from 'lucide-react'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('이메일을 입력해주세요'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const origin = window.location.origin
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/api/auth/callback` },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 max-w-sm w-full text-center">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-brand-ink mb-2">인증 메일을 보냈어요</h2>
          <p className="text-sm text-brand-grey mb-6 leading-relaxed">
            <strong>{email}</strong>으로 인증 링크를 발송했습니다.<br />
            메일함을 확인해주세요. (스팸함도 확인해보세요)
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-brand-grey hover:text-brand-deep"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="amber" size={16} />
          <h1 className="text-xl font-bold text-brand-ink">이메일 인증 재발송</h1>
        </div>
        <p className="text-sm text-brand-grey mb-6 leading-relaxed">
          가입할 때 사용한 이메일 주소를 입력하면 인증 링크를 다시 보내드립니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="가입 이메일 주소"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-deep text-white font-semibold py-2.5 rounded-full hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
          >
            {loading ? '발송 중...' : '인증 메일 재발송'}
          </button>
        </form>
      </div>
    </div>
  )
}

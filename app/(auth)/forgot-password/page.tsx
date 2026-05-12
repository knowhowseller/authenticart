'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error('오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="text-xl font-bold text-brand-ink">비밀번호 찾기</h1>
            <p className="text-sm text-brand-grey mt-1">
              {sent ? '이메일을 확인해주세요' : '가입한 이메일을 입력하면 재설정 링크를 보내드립니다'}
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📧</span>
              </div>
              <p className="text-sm text-brand-grey mb-1">
                <span className="font-medium text-brand-ink">{email}</span>로
              </p>
              <p className="text-sm text-brand-grey mb-6">비밀번호 재설정 링크를 발송했습니다.</p>
              <p className="text-xs text-brand-grey">
                메일이 오지 않으면 스팸함을 확인하거나{' '}
                <button onClick={() => setSent(false)} className="text-brand-deep hover:underline">
                  다시 시도
                </button>
                해주세요.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="이메일"
                type="email"
                placeholder="example@email.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                재설정 링크 발송
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-brand-grey mt-6">
            <Link href="/login" className="text-brand-deep font-medium hover:underline">
              ← 로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

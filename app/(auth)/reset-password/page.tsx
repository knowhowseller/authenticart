'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash on page load
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다')
      return
    }
    if (password !== confirm) {
      toast.error('비밀번호가 일치하지 않습니다')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error(error.message ?? '비밀번호 변경에 실패했습니다')
      return
    }
    toast.success('비밀번호가 변경되었습니다')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="text-xl font-bold text-brand-ink">새 비밀번호 설정</h1>
            <p className="text-sm text-brand-grey mt-1">새로 사용할 비밀번호를 입력해주세요</p>
          </div>

          {!ready ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-brand-mist border-t-brand-deep rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-brand-grey">링크 확인 중...</p>
              <p className="text-xs text-brand-grey mt-2">
                링크가 만료됐다면{' '}
                <Link href="/forgot-password" className="text-brand-deep hover:underline">
                  다시 요청
                </Link>
                해주세요.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="새 비밀번호"
                type="password"
                placeholder="8자 이상"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Input
                label="비밀번호 확인"
                type="password"
                placeholder="비밀번호 재입력"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                비밀번호 변경
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

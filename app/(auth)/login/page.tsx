'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [kakaoLoading, setKakaoLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다'
        : error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  async function handleKakao() {
    setKakaoLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      toast.error('카카오 로그인에 실패했습니다')
      setKakaoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="text-xl font-bold text-brand-ink">로그인</h1>
            <p className="text-sm text-brand-grey mt-1">오센틱아트에 오신 것을 환영합니다</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="이메일"
              type="email"
              placeholder="example@email.com"
              required
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="비밀번호 입력"
              required
              {...register('password')}
              error={errors.password?.message}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              로그인
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-mist/50" />
            </div>
            <div className="relative flex justify-center text-xs text-brand-grey bg-white px-2">
              또는
            </div>
          </div>

          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={handleKakao}
            loading={kakaoLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.5 1.5 4.7 3.8 6.1l-1 3.7 4.3-2.8c.9.1 1.9.2 2.9.2 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
            </svg>
            카카오로 계속하기
          </Button>

          <p className="text-center text-sm text-brand-grey mt-6">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-brand-deep font-medium hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

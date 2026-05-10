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
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '영문을 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  region: z.string().optional(),
  marketing_agreed: z.boolean().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone ?? null,
          region: data.region ?? null,
          marketing_agreed: data.marketing_agreed ?? false,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('인증 이메일을 발송했습니다. 이메일을 확인해주세요.')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-bg">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="text-xl font-bold text-brand-ink">회원가입</h1>
            <p className="text-sm text-brand-grey mt-1">예술적 삶을 시작해보세요</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="이름"
              placeholder="홍길동"
              required
              {...register('name')}
              error={errors.name?.message}
            />
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
              placeholder="영문+숫자 8자 이상"
              required
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호 재입력"
              required
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <Input
              label="연락처"
              type="tel"
              placeholder="010-0000-0000"
              {...register('phone')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-ink">지역</label>
              <select
                {...register('region')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                <option value="">선택 안함</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...register('marketing_agreed')} className="mt-0.5 accent-brand-amber" />
              <span className="text-sm text-brand-grey">마케팅 정보 수신에 동의합니다 (선택)</span>
            </label>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              회원가입
            </Button>
          </form>

          <div className="text-center mt-4 space-y-2">
            <p className="text-xs text-brand-grey">
              가입 시{' '}
              <Link href="/terms" className="underline">이용약관</Link> 및{' '}
              <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다
            </p>
            <p className="text-sm text-brand-grey">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-brand-deep font-medium hover:underline">로그인</Link>
            </p>
            <p className="text-sm text-brand-grey">
              강사로 활동하고 싶으신가요?{' '}
              <Link href="/signup/instructor" className="text-brand-amber font-medium hover:underline">강사 신청</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

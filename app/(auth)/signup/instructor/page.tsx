'use client'
import { useState, useEffect } from 'react'
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
import Hexagon from '@/components/brand/Hexagon'

const schema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  phone: z.string().min(10, '연락처를 입력해주세요'),
  region: z.string().min(1, '활동 지역을 선택해주세요'),
  branch_id: z.string().optional(),
  bio: z.string().min(30, '자기소개는 30자 이상 입력해주세요').max(500),
  agree_terms: z.literal(true, { error: '약관에 동의해주세요' }),
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

const benefits = [
  '도매가로 레진 재료 구매',
  '클래스 등록 및 운영',
  '매월 자동 정산 (86.7%)',
  '강사 전용 커뮤니티',
]

export default function InstructorSignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<{ id: string; name: string; region: string }[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    supabase
      .from('branches')
      .select('id, name, region')
      .order('region', { ascending: true })
      .then(({ data }) => setBranches(data ?? []))
  }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, phone: data.phone, region: data.region },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (signupError || !authData.user) {
      toast.error(signupError?.message ?? '회원가입에 실패했습니다')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('instructor_profiles')
      .insert({
        instructor_id: authData.user.id,
        bio: data.bio,
        region: data.region,
        branch_id: data.branch_id || null,
      })

    setLoading(false)
    if (profileError) {
      toast.error('강사 프로필 생성에 실패했습니다. 고객센터에 문의해주세요.')
      return
    }

    toast.success('강사 신청이 완료되었습니다! 인증 이메일과 승인 안내를 기다려주세요.')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-ink">강사 신청</h1>
          <p className="text-sm text-brand-grey mt-1">오센틱아트 강사로 활동하고 제2의 삶을 시작하세요</p>
        </div>

        {/* 혜택 */}
        <div className="bg-brand-deep/5 border border-brand-deep/10 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-brand-deep mb-3">강사 혜택</p>
          <div className="grid grid-cols-2 gap-2">
            {benefits.map(b => (
              <div key={b} className="flex items-center gap-2 text-sm text-brand-ink">
                <Hexagon color="amber" size={14} rotate={10} />
                {b}
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-grey mt-3">
            * 관리자 검토 후 1~3 영업일 내 승인 처리됩니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="이름" placeholder="홍길동" required {...register('name')} error={errors.name?.message} />
              <Input label="연락처" type="tel" placeholder="010-0000-0000" required {...register('phone')} error={errors.phone?.message} />
            </div>
            <Input label="이메일" type="email" placeholder="example@email.com" required {...register('email')} error={errors.email?.message} />
            <Input label="비밀번호" type="password" placeholder="8자 이상, 영문+숫자" required {...register('password')} error={errors.password?.message} />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-ink">
                  주요 활동 지역 <span className="text-brand-amber">*</span>
                </label>
                <select
                  {...register('region')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                >
                  <option value="">선택해주세요</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.region && <p className="text-xs text-red-500">{errors.region.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-ink">소속 지부</label>
                <select
                  {...register('branch_id')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                >
                  <option value="">없음 (미정)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.region})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-ink">
                자기소개 <span className="text-brand-amber">*</span>
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder="강사 경력, 전문 분야, 강의 스타일을 소개해주세요 (30자 이상)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...register('agree_terms')} className="mt-0.5 accent-brand-amber" />
              <span className="text-sm text-brand-grey">
                <Link href="/terms" className="underline text-brand-ink">이용약관</Link>,{' '}
                <Link href="/privacy" className="underline text-brand-ink">개인정보처리방침</Link>,{' '}
                강사 정산 약관에 동의합니다 <span className="text-brand-amber">*</span>
              </span>
            </label>
            {errors.agree_terms && <p className="text-xs text-red-500">{errors.agree_terms.message}</p>}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              강사 신청하기
            </Button>
          </form>

          <p className="text-center text-sm text-brand-grey mt-4">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-brand-deep font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

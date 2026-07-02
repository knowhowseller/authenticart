'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Hexagon from '@/components/brand/Hexagon'

const CRAFT_TYPES = [
  { value: 'resin', label: '레진아트' },
  { value: 'candle', label: '캔들' },
  { value: 'flower', label: '플라워' },
  { value: 'ceramic', label: '도자기' },
  { value: 'jewelry', label: '주얼리' },
  { value: 'fabric', label: '패브릭' },
  { value: 'other', label: '기타' },
]

// 로그인 회원 전용 — 계정은 이미 있으므로 이메일/비밀번호 없이 강사 프로필만 신청한다.
const schema = z.object({
  region: z.string().min(1, '활동 지역을 선택해주세요'),
  branch_id: z.string().optional(),
  craft_types: z.array(z.string()).min(1, '전문 공예 분야를 1개 이상 선택해주세요'),
  bio: z.string().min(30, '자기소개는 30자 이상 입력해주세요').max(500),
  agree_terms: z.literal(true, { error: '약관에 동의해주세요' }),
  agree_payout: z.literal(true, { error: '정산 약관에 동의해주세요' }),
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

type Phase = 'loading' | 'form' | 'already_applied' | 'already_instructor'

export default function InstructorApplyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [phase, setPhase] = useState<Phase>('loading')
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<{ id: string; name: string; region: string }[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login?redirect=/my/instructor/apply'); return }

      // 이미 강사이거나 신청(프로필 존재)한 경우 중복 신청을 막는다.
      const [{ data: u }, { data: profile }] = await Promise.all([
        supabase.from('users').select('role').eq('id', user.id).single(),
        supabase.from('instructor_profiles').select('instructor_id').eq('instructor_id', user.id).maybeSingle(),
      ])
      if (u?.role === 'instructor') { setPhase('already_instructor'); return }
      if (profile) { setPhase('already_applied'); return }

      const { data: b } = await supabase.from('branches').select('id, name, region').order('region', { ascending: true })
      setBranches(b ?? [])
      setPhase('form')
    })()
  }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login?redirect=/my/instructor/apply'); return }

    const { error } = await supabase
      .from('instructor_profiles')
      .insert({
        instructor_id: user.id,
        bio: data.bio,
        region: data.region,
        branch_id: data.branch_id || null,
        craft_types: data.craft_types,
      } as any)

    setLoading(false)
    if (error) {
      toast.error('강사 신청에 실패했습니다. 잠시 후 다시 시도하거나 고객센터에 문의해주세요.')
      return
    }
    toast.success('강사 신청이 완료되었습니다! 관리자 승인 안내를 기다려주세요.')
    setPhase('already_applied')
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-grey/30 border-t-brand-deep animate-spin" />
      </div>
    )
  }

  if (phase === 'already_instructor') {
    return (
      <div className="min-h-[60vh] bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🎨</div>
          <h1 className="text-lg font-bold text-brand-ink mb-2">이미 강사로 활동 중입니다</h1>
          <p className="text-sm text-brand-grey mb-6">스튜디오에서 클래스를 관리하세요.</p>
          <Link href="/studio" className="inline-block px-5 py-2.5 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 transition-colors">
            스튜디오로 이동
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'already_applied') {
    return (
      <div className="min-h-[60vh] bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">📮</div>
          <h1 className="text-lg font-bold text-brand-ink mb-2">강사 신청이 접수되었습니다</h1>
          <p className="text-sm text-brand-grey mb-6">관리자 검토 후 1~3 영업일 내 승인 처리됩니다. 승인되면 이메일과 알림으로 안내드립니다.</p>
          <Link href="/my" className="inline-block px-5 py-2.5 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 transition-colors">
            마이페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-ink">강사 신청</h1>
          <p className="text-sm text-brand-grey mt-1">이미 가입된 계정으로 강사 활동을 신청합니다</p>
        </div>

        <div className="bg-brand-deep/5 border border-brand-deep/10 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-brand-deep mb-3">강사 혜택</p>
          <div className="grid grid-cols-2 gap-2">
            {['도매가로 레진 재료 구매', '클래스 등록 및 운영', '매월 자동 정산 (86.7%)', '강사 전용 커뮤니티'].map(b => (
              <div key={b} className="flex items-center gap-2 text-sm text-brand-ink">
                <Hexagon color="amber" size={14} rotate={10} />
                {b}
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-grey mt-3">* 관리자 검토 후 1~3 영업일 내 승인 처리됩니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                전문 공예 분야 <span className="text-brand-amber">*</span>
                <span className="text-xs font-normal text-brand-grey ml-1">(복수 선택 가능)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CRAFT_TYPES.map(ct => (
                  <label key={ct.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" value={ct.value} {...register('craft_types')} className="accent-brand-amber" />
                    <span className="text-sm text-brand-ink">{ct.label}</span>
                  </label>
                ))}
              </div>
              {errors.craft_types && <p className="text-xs text-red-500">{errors.craft_types.message}</p>}
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

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" {...register('agree_terms')} className="mt-0.5 accent-brand-amber" />
                <span className="text-sm text-brand-grey">
                  <Link href="/terms" className="underline text-brand-ink">이용약관</Link>,{' '}
                  <Link href="/privacy" className="underline text-brand-ink">개인정보처리방침</Link>에 동의합니다
                  <span className="text-brand-amber"> *</span>
                </span>
              </label>
              {errors.agree_terms && <p className="text-xs text-red-500">{errors.agree_terms.message}</p>}

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" {...register('agree_payout')} className="mt-0.5 accent-brand-amber" />
                <span className="text-sm text-brand-grey">
                  강사 정산 약관에 동의합니다
                  <span className="text-brand-amber"> *</span>
                </span>
              </label>
              <div className="ml-5 bg-brand-bg rounded-xl p-3 text-xs text-brand-grey space-y-0.5">
                <p>• 정산율: <strong className="text-brand-ink">결제금액의 86.7%</strong> (PG수수료 3.3% + 플랫폼수수료 10% 공제)</p>
                <p>• 정산 주기: 매월 1일 마감 → 당월 5일 등록 계좌 입금</p>
                <p>• 환불 발생 시 해당 정산액에서 차감</p>
              </div>
              {errors.agree_payout && <p className="text-xs text-red-500">{errors.agree_payout.message}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              강사 신청하기
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

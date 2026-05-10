'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Hexagon from '@/components/brand/Hexagon'

const schema = z.object({
  title: z.string().min(5, '제목은 5자 이상 입력해주세요'),
  description: z.string().min(20, '설명은 20자 이상 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  location_address: z.string().optional(),
  price: z.number().min(1000, '최소 1,000원 이상이어야 합니다'),
  capacity: z.number().min(1).max(50),
  confirmation_mode: z.enum(['instant', 'request']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration_active: z.number().min(30).optional(),
  duration_curing: z.number().optional(),
  pickup_method: z.enum(['shipping', 'pickup', 'both']).optional(),
  min_age: z.number().optional(),
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

export default function NewClassPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { confirmation_mode: 'instant', capacity: 8 },
  })

  async function onSubmit(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인 필요'); return }

    setLoading(true)
    const { error } = await supabase.from('classes').insert({
      instructor_id: user.id,
      title: data.title,
      description: data.description,
      region: data.region,
      location_address: data.location_address || null,
      price: data.price,
      capacity: data.capacity,
      confirmation_mode: data.confirmation_mode,
      status: 'draft',
      attributes: {
        difficulty: data.difficulty,
        duration_active: data.duration_active,
        duration_curing: data.duration_curing,
        pickup_method: data.pickup_method,
        min_age: data.min_age,
      },
    })
    setLoading(false)

    if (error) { toast.error(error.message); return }
    toast.success('클래스가 등록되었습니다. 관리자 검수 후 게시됩니다.')
    router.push('/studio/classes')
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="amber" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">새 클래스 등록</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">기본 정보</h2>
            <Input label="클래스 제목" placeholder="레진 코스터 만들기 — 초보자 완성 클래스" required
              {...register('title')} error={errors.title?.message} />
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">
                클래스 설명 <span className="text-brand-amber">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="클래스 내용, 준비물, 진행 방식을 자세히 설명해주세요"
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">지역 <span className="text-brand-amber">*</span></label>
                <select {...register('region')} className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                  <option value="">선택</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Input label="장소 주소" placeholder="인천시 연수구..." {...register('location_address')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">수강료 (원) <span className="text-brand-amber">*</span></label>
                <input
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="45000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
                {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">정원 <span className="text-brand-amber">*</span></label>
                <input
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  min={1} max={50}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">예약 설정</h2>
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-2">예약 방식</label>
              <div className="flex gap-4">
                {[
                  { value: 'instant', label: '바로 결제', desc: '수강생이 즉시 결제' },
                  { value: 'request', label: '강사 승인', desc: '강사 확인 후 결제' },
                ].map(opt => (
                  <label key={opt.value} className="flex-1 cursor-pointer">
                    <div className={`border rounded-xl p-3 transition-all ${watch('confirmation_mode') === opt.value ? 'border-brand-amber bg-brand-amber/5' : 'border-brand-mist'}`}>
                      <input type="radio" {...register('confirmation_mode')} value={opt.value} className="hidden" />
                      <p className="text-sm font-medium text-brand-ink">{opt.label}</p>
                      <p className="text-xs text-brand-grey mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">공예 속성</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">난이도</label>
                <select {...register('difficulty')} className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                  <option value="">선택</option>
                  <option value="beginner">입문</option>
                  <option value="intermediate">중급</option>
                  <option value="advanced">고급</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">수령 방식</label>
                <select {...register('pickup_method')} className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                  <option value="">선택</option>
                  <option value="pickup">방문 수령</option>
                  <option value="shipping">택배 수령</option>
                  <option value="both">택배/방문</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">작업 시간 (분)</label>
                <input type="number" {...register('duration_active', { valueAsNumber: true })} placeholder="90"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">경화 시간 (분)</label>
                <input type="number" {...register('duration_curing', { valueAsNumber: true })} placeholder="1440"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            클래스 등록 (검수 요청)
          </Button>
        </form>
      </div>
    </div>
  )
}

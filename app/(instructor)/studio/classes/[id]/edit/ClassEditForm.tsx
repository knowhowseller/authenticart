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

const schema = z.object({
  title: z.string().min(5, '제목은 5자 이상'),
  description: z.string().min(20, '설명은 20자 이상'),
  region: z.string().min(1, '지역 선택'),
  location_address: z.string().optional(),
  price: z.number().min(1000),
  capacity: z.number().min(1).max(50),
  confirmation_mode: z.enum(['instant', 'request']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration_active: z.number().optional(),
  duration_curing: z.number().optional(),
  pickup_method: z.enum(['shipping', 'pickup', 'both']).optional(),
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

export default function ClassEditForm({ cls }: { cls: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: cls.title,
      description: cls.description,
      region: cls.region,
      location_address: cls.location_address ?? '',
      price: cls.price,
      capacity: cls.capacity,
      confirmation_mode: cls.confirmation_mode,
      difficulty: cls.attributes?.difficulty,
      duration_active: cls.attributes?.duration_active,
      duration_curing: cls.attributes?.duration_curing,
      pickup_method: cls.attributes?.pickup_method,
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.from('classes').update({
      title: data.title,
      description: data.description,
      region: data.region,
      location_address: data.location_address || null,
      price: data.price,
      capacity: data.capacity,
      confirmation_mode: data.confirmation_mode,
      attributes: {
        difficulty: data.difficulty,
        duration_active: data.duration_active,
        duration_curing: data.duration_curing,
        pickup_method: data.pickup_method,
      },
    }).eq('id', cls.id)
    setLoading(false)

    if (error) { toast.error(error.message); return }
    toast.success('수정되었습니다')
    router.push('/studio/classes')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {cls.status === 'published' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          게시 중인 클래스입니다. 수정 후 저장하면 즉시 반영됩니다.
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">기본 정보</h2>
        <Input label="클래스 제목" {...register('title')} error={errors.title?.message} required />
        <div>
          <label className="text-sm font-medium text-brand-ink block mb-1.5">
            클래스 설명 <span className="text-brand-amber">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
          {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">지역</label>
            <select {...register('region')} className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Input label="장소 주소" {...register('location_address')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">수강료 (원)</label>
            <input type="number" {...register('price', { valueAsNumber: true })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">정원</label>
            <input type="number" {...register('capacity', { valueAsNumber: true })} min={1} max={50}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">예약 방식</h2>
        <div className="flex gap-4">
          {[
            { value: 'instant', label: '바로 결제' },
            { value: 'request', label: '강사 승인' },
          ].map(opt => (
            <label key={opt.value} className="flex-1 cursor-pointer">
              <div className={`border rounded-xl p-3 transition-all ${watch('confirmation_mode') === opt.value ? 'border-brand-amber bg-brand-amber/5' : 'border-brand-mist'}`}>
                <input type="radio" {...register('confirmation_mode')} value={opt.value} className="hidden" />
                <p className="text-sm font-medium text-brand-ink">{opt.label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">저장</Button>
    </form>
  )
}

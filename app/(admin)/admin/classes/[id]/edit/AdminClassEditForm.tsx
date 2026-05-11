'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { X, ImagePlus } from 'lucide-react'
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
  status: z.enum(['draft', 'published', 'closed']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration_active: z.number().optional(),
  duration_curing: z.number().optional(),
  pickup_method: z.enum(['shipping', 'pickup', 'both']).optional(),
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']
const statusOptions = [
  { value: 'draft', label: '검수 대기' },
  { value: 'published', label: '게시 중' },
  { value: 'closed', label: '마감됨' },
]

export default function AdminClassEditForm({ cls, instructorName }: { cls: any; instructorName: string }) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>((cls.images as string[]) ?? (cls.thumbnail_url ? [cls.thumbnail_url] : []))
  const [thumbnailIdx, setThumbnailIdx] = useState(0)
  const [uploading, setUploading] = useState(false)

  async function handleImageFiles(files: FileList) {
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `classes/${cls.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('class-images').upload(path, file, { upsert: true })
      if (error) { toast.error('이미지 업로드 실패: ' + error.message); continue }
      const { data } = supabase.storage.from('class-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    setImages(prev => [...prev, ...urls])
    setUploading(false)
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
    if (thumbnailIdx >= idx && thumbnailIdx > 0) setThumbnailIdx(t => t - 1)
  }

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
      status: cls.status,
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
      status: data.status,
      thumbnail_url: images[thumbnailIdx] ?? null,
      images: images,
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
    router.push('/admin/classes')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 강사 정보 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
        <p className="text-xs text-brand-grey mb-1">강사</p>
        <p className="text-sm font-semibold text-brand-ink">{instructorName}</p>
      </div>

      {/* 이미지 업로드 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">클래스 이미지</h2>
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-mist group">
              <img src={url} alt={`이미지 ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button type="button" onClick={() => setThumbnailIdx(i)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${thumbnailIdx === i ? 'bg-brand-amber text-white' : 'bg-white text-brand-ink'}`}>
                  {thumbnailIdx === i ? '대표' : '대표 설정'}
                </button>
                <button type="button" onClick={() => removeImage(i)} className="text-white"><X size={16} /></button>
              </div>
              {thumbnailIdx === i && (
                <span className="absolute top-1 left-1 bg-brand-amber text-white text-xs px-1.5 py-0.5 rounded-full font-medium">대표</span>
              )}
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-brand-mist flex flex-col items-center justify-center gap-1 hover:border-brand-amber transition-colors disabled:opacity-50">
            <ImagePlus size={24} className="text-brand-grey" />
            <span className="text-xs text-brand-grey">{uploading ? '업로드 중...' : '이미지 추가'}</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={e => { if (e.target.files) { handleImageFiles(e.target.files); e.target.value = '' } }} />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">기본 정보</h2>
        <Input label="클래스 제목" {...register('title')} error={errors.title?.message} required />
        <div>
          <label className="text-sm font-medium text-brand-ink block mb-1.5">
            클래스 설명 <span className="text-brand-amber">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={5}
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
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">상태 & 예약 방식</h2>
        <div>
          <label className="text-sm font-medium text-brand-ink block mb-1.5">게시 상태</label>
          <select {...register('status')} className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-brand-ink block mb-2">예약 방식</label>
          <div className="flex gap-4">
            {[{ value: 'instant', label: '바로 결제' }, { value: 'request', label: '강사 승인' }].map(opt => (
              <label key={opt.value} className="flex-1 cursor-pointer">
                <div className={`border rounded-xl p-3 transition-all ${watch('confirmation_mode') === opt.value ? 'border-brand-amber bg-brand-amber/5' : 'border-brand-mist'}`}>
                  <input type="radio" {...register('confirmation_mode')} value={opt.value} className="hidden" />
                  <p className="text-sm font-medium text-brand-ink">{opt.label}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/classes')}
          className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
        >
          취소
        </button>
        <Button type="submit" loading={loading} className="flex-1">
          저장하기
        </Button>
      </div>
    </form>
  )
}

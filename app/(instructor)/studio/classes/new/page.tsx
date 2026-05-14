'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Hexagon from '@/components/brand/Hexagon'
import { X, ImagePlus, Sparkles } from 'lucide-react'

const schema = z.object({
  title: z.string().min(5, '제목은 5자 이상 입력해주세요'),
  description: z.string().min(20, '설명은 20자 이상 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  location_address: z.string().optional(),
  price: z.number().min(1000, '최소 1,000원 이상이어야 합니다'),
  capacity: z.number().min(1).max(50),
  confirmation_mode: z.enum(['instant', 'request']),
  category_id: z.string().min(1, '장르를 선택해주세요'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration_active: z.number().min(30).optional(),
  duration_curing: z.number().optional(),
  pickup_method: z.enum(['shipping', 'pickup', 'both']).optional(),
  min_age: z.number().optional(),
})
type FormData = z.infer<typeof schema>

interface CraftCategory {
  id: string
  code: string
  name: string
  parent_id: string | null
}

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

export default function NewClassPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [thumbnailIdx, setThumbnailIdx] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [craftCategories, setCraftCategories] = useState<CraftCategory[]>([])
  const [selectedParent, setSelectedParent] = useState('')
  const tempId = useRef(crypto.randomUUID())

  useEffect(() => {
    supabase
      .from('craft_categories')
      .select('id, code, name, parent_id')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCraftCategories(data ?? []))
  }, [])

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { confirmation_mode: 'instant', capacity: 8 },
  })

  async function handleImageFiles(files: FileList) {
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `classes/${tempId.current}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('class-images').upload(path, file, { upsert: true })
      if (error) { toast.error('이미지 업로드 실패: ' + error.message); continue }
      const { data } = supabase.storage.from('class-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    setImages(prev => [...prev, ...urls])
    setUploading(false)
  }

  async function generateDescription() {
    if (images.length === 0) { toast.error('먼저 이미지를 업로드해주세요'); return }
    setAiLoading(true)
    const res = await fetch('/api/ai/describe-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: images[0], type: 'class' }),
    })
    const data = await res.json()
    setAiLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'AI 생성 실패'); return }
    setValue('description', data.description, { shouldValidate: false })
    toast.success('AI 설명이 생성되었습니다. 내용을 확인하고 수정해주세요.')
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
    if (thumbnailIdx >= idx && thumbnailIdx > 0) setThumbnailIdx(t => t - 1)
  }

  async function onSubmit(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인 필요'); return }

    setLoading(true)
    const selectedCat = craftCategories.find(c => c.id === data.category_id)
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
      thumbnail_url: images[thumbnailIdx] ?? null,
      images: images,
      category_id: data.category_id,
      attributes: {
        craft_type: selectedCat?.code ?? data.category_id,
        difficulty: data.difficulty,
        duration_active: data.duration_active,
        duration_curing: data.duration_curing,
        pickup_method: data.pickup_method,
        min_age: data.min_age,
      },
    })
    setLoading(false)

    if (error) { toast.error(error.message); return }
    toast.success('클래스가 등록되었습니다. 보통 1~2 영업일 내 검수 완료 후 공개됩니다.')
    router.push('/studio/classes')
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Hexagon color="amber" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">새 클래스 등록</h1>
        </div>
        <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-xl px-4 py-3 mb-6 text-xs text-brand-ink space-y-0.5">
          <p className="font-semibold text-brand-amber mb-1">📋 검수 안내</p>
          <p>• 등록 후 <strong>1~2 영업일 내</strong> 관리자 검수 완료 시 자동 공개됩니다</p>
          <p>• 검수 기준: 클래스명, 이미지, 설명, 공예 종류, 가격 적정성</p>
          <p>• 미승인 시 스튜디오 클래스 목록에서 사유를 확인할 수 있습니다</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 이미지 업로드 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">클래스 이미지</h2>
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-mist group">
                  <img src={url} alt={`이미지 ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setThumbnailIdx(i)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${thumbnailIdx === i ? 'bg-brand-amber text-white' : 'bg-white text-brand-ink'}`}
                    >
                      {thumbnailIdx === i ? '대표' : '대표 설정'}
                    </button>
                    <button type="button" onClick={() => removeImage(i)} className="text-white">
                      <X size={16} />
                    </button>
                  </div>
                  {thumbnailIdx === i && (
                    <span className="absolute top-1 left-1 bg-brand-amber text-white text-xs px-1.5 py-0.5 rounded-full font-medium">대표</span>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-brand-mist flex flex-col items-center justify-center gap-1 hover:border-brand-amber transition-colors disabled:opacity-50"
              >
                <ImagePlus size={24} className="text-brand-grey" />
                <span className="text-xs text-brand-grey">{uploading ? '업로드 중...' : '이미지 추가'}</span>
              </button>
            </div>
            <p className="text-xs text-brand-grey">첫 번째 이미지가 대표 이미지입니다. 여러 장 선택 가능.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) { handleImageFiles(e.target.files); e.target.value = '' } }}
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">기본 정보</h2>
            <Input label="클래스 제목" placeholder="레진 코스터 만들기 — 초보자 완성 클래스" required
              {...register('title')} error={errors.title?.message} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-brand-ink">
                  클래스 설명 <span className="text-brand-amber">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={aiLoading || images.length === 0}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-amber hover:text-brand-amber/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles size={13} />
                  {aiLoading ? 'AI 생성 중...' : 'AI 설명 자동 생성'}
                </button>
              </div>
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
                <input type="number" {...register('price', { valueAsNumber: true })} placeholder="45000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
                {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">정원 <span className="text-brand-amber">*</span></label>
                <input type="number" {...register('capacity', { valueAsNumber: true })} min={1} max={50}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">예약 설정</h2>
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

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
            <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">공예 속성</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-brand-ink block mb-1.5">
                  장르 <span className="text-brand-amber">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedParent}
                    onChange={e => { setSelectedParent(e.target.value); setValue('category_id', '', { shouldValidate: false }) }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  >
                    <option value="">대장르 선택</option>
                    {craftCategories.filter(c => !c.parent_id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    {...register('category_id')}
                    disabled={!selectedParent}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber disabled:opacity-50"
                  >
                    <option value="">소장르 선택</option>
                    {craftCategories.filter(c => c.parent_id === selectedParent).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {errors.category_id && <p className="text-xs text-red-500 mt-0.5">{errors.category_id.message}</p>}
              </div>
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

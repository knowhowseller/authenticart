'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, ImageIcon } from 'lucide-react'

export default function NewClassRequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title: '', preferred_region: '', preferred_date: '', message: '' })
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleImageUpload(file: File) {
    if (images.length >= 5) { toast.error('참고 사진은 최대 5장까지 업로드할 수 있습니다'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `class-requests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('request-images').upload(path, file, { upsert: false })
    if (error) { toast.error('업로드 실패: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('request-images').getPublicUrl(path)
    setImages(prev => [...prev, data.publicUrl])
    setUploading(false)
  }

  function removeImage(url: string) {
    setImages(prev => prev.filter(u => u !== url))
  }

  async function handleSubmit() {
    if (!form.title || !form.preferred_region) { toast.error('제목과 희망 지역을 입력해주세요'); return }
    setSaving(true)
    const res = await fetch('/api/class-requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, reference_images: images }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error ?? '오류'); return }
    toast.success('클래스 요청이 등록되었습니다. 강사 매칭 후 알림을 드립니다.')
    router.push('/class-requests')
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/class-requests" className="text-sm text-brand-grey hover:text-brand-deep">클래스 요청</Link>
          <span className="text-brand-grey">/</span>
          <span className="text-sm text-brand-ink font-medium">새 요청</span>
        </div>
        <h1 className="text-xl font-bold text-brand-ink mb-2">클래스 요청하기</h1>
        <p className="text-sm text-brand-grey mb-6">원하는 클래스를 요청하면 강사가 수락 후 모집을 시작합니다.<br/>정원이 차면 결제 안내 후 클래스가 확정됩니다.</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">요청 클래스명 *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="예: 레진아트 키링 만들기 클래스"
              className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">희망 지역 *</label>
              <input value={form.preferred_region} onChange={e => setForm(f => ({ ...f, preferred_region: e.target.value }))}
                placeholder="예: 서울 강남구"
                className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">희망 일정</label>
              <input value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                placeholder="예: 주말 오후"
                className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">추가 요청사항</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={3} placeholder="배우고 싶은 내용이나 특별한 요청사항을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none" />
          </div>

          {/* 참고 사진 업로드 */}
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">
              <span className="flex items-center gap-1"><ImageIcon size={12} /> 참고 사진 (선택, 최대 5장)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={url} alt={`참고 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-brand-mist hover:border-brand-amber flex flex-col items-center justify-center gap-1 text-brand-grey hover:text-brand-amber transition-colors disabled:opacity-50"
                >
                  {uploading ? <span className="text-[10px]">업로드 중</span> : <><Plus size={16} /><span className="text-[10px]">사진 추가</span></>}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
            />
            <p className="text-[11px] text-brand-grey mt-1">원하는 스타일, 작품 예시 등 참고 사진을 첨부하면 더 정확한 매칭에 도움됩니다</p>
          </div>
        </div>

        <div className="mt-4 bg-brand-amber/5 rounded-2xl p-4 text-xs text-brand-grey">
          <p className="font-semibold text-brand-ink mb-1">진행 순서</p>
          <p>① 요청 등록 → ② 강사 매칭 → ③ 모집 시작 → ④ 정원 충족 시 결제 → ⑤ 클래스 확정</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl border border-brand-mist text-brand-grey text-sm">취소</button>
          <button onClick={handleSubmit} disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
            {saving ? '등록 중...' : '요청 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

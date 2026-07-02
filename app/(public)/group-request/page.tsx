'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, ImageIcon } from 'lucide-react'

const THEMES = ['레진아트', '비즈공예', '자수', '석고아트', '캔들', '페인팅', '미정 (상담 후 결정)']

export default function GroupRequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    org_name: '', contact_name: '', contact_email: '', contact_phone: '',
    region: '', lesson_theme: '', preferred_date: '', participant_count: '',
    message: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleImageUpload(file: File) {
    if (images.length >= 5) { toast.error('참고 사진은 최대 5장까지 업로드할 수 있습니다'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `group-requests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('request-images').upload(path, file, { upsert: false })
    if (error) { toast.error('업로드 실패: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('request-images').getPublicUrl(path)
    setImages(prev => [...prev, data.publicUrl])
    setUploading(false)
  }

  function removeImage(url: string) { setImages(prev => prev.filter(u => u !== url)) }

  async function handleSubmit() {
    if (!form.org_name || !form.contact_name || !form.contact_email || !form.contact_phone || !form.region || !form.participant_count) {
      toast.error('필수 항목을 모두 입력해주세요')
      return
    }
    setSaving(true)
    const res = await fetch('/api/group-requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, reference_images: images }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? '오류'); return }
    toast.success('단체 출강 신청이 접수되었습니다.')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 text-center max-w-md w-full">
          <div className="text-5xl mb-4">📮</div>
          <h1 className="text-xl font-bold text-brand-ink mb-2">단체 출강 문의가 접수되었습니다</h1>
          <p className="text-sm text-brand-grey mb-1">입력하신 이메일로 접수 확인 메일을 보내드렸습니다.</p>
          <p className="text-sm text-brand-grey mb-6"><strong className="text-brand-deep">24시간 내</strong>에 담당자가 연락드립니다.</p>
          <div className="bg-brand-amber/5 rounded-xl p-4 text-xs text-brand-grey text-left mb-6">
            <p className="font-semibold text-brand-ink mb-1">다음 단계</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>담당자가 지역·인원·테마를 확인해 강사를 배정합니다</li>
              <li>재료비·강사비는 상담 시 안내드립니다</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg text-center">홈으로</Link>
            <Link href="/classes" className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 text-center">클래스 둘러보기</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-brand-ink">단체 출강 신청</h1>
          <p className="text-brand-grey text-sm mt-2">학교, 기업, 기관 등 단체 클래스를 신청하세요.<br />신청 후 24시간 내 담당자가 연락드립니다.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
          <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">신청 기관 정보</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-brand-grey block mb-1">기관/단체명 *</label>
              <input value={form.org_name} onChange={e => set('org_name', e.target.value)}
                placeholder="○○초등학교"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs text-brand-grey block mb-1">담당자명 *</label>
              <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                placeholder="홍길동"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs text-brand-grey block mb-1">이메일 *</label>
              <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                placeholder="contact@school.kr"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs text-brand-grey block mb-1">연락처 *</label>
              <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
          </div>

          <div className="border-t border-brand-mist/20 pt-4">
            <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-3">수업 정보</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-brand-grey block mb-1">지역 *</label>
                <input value={form.region} onChange={e => set('region', e.target.value)}
                  placeholder="예: 서울 강남구"
                  className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
              </div>
              <div>
                <label className="text-xs text-brand-grey block mb-1">참여 인원 *</label>
                <input type="number" min={5} value={form.participant_count} onChange={e => set('participant_count', e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
              </div>
              <div>
                <label className="text-xs text-brand-grey block mb-1">수업 테마</label>
                <select value={form.lesson_theme} onChange={e => set('lesson_theme', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                  <option value="">선택 (선택사항)</option>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-brand-grey block mb-1">희망 일정</label>
                <input value={form.preferred_date} onChange={e => set('preferred_date', e.target.value)}
                  placeholder="예: 6월 중순 오후"
                  className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-grey block mb-1">추가 요청사항</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)}
              rows={3} placeholder="특별한 요청이나 질문이 있으시면 입력해주세요"
              className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none" />
          </div>

          {/* 참고 사진 업로드 */}
          <div className="border-t border-brand-mist/20 pt-4">
            <label className="text-xs font-semibold text-brand-grey uppercase tracking-wider flex items-center gap-1 mb-3">
              <ImageIcon size={11} /> 참고 사진 (선택, 최대 5장)
            </label>
            <div className="grid grid-cols-5 gap-2">
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
                  {uploading ? <span className="text-[9px]">업로드 중</span> : <><Plus size={14} /><span className="text-[9px]">추가</span></>}
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
            <p className="text-[11px] text-brand-grey mt-2">원하는 수업 스타일, 공간 사진 등 참고 이미지를 첨부해주시면 적합한 강사 배정에 도움이 됩니다</p>
          </div>
        </div>

        <div className="mt-4 bg-brand-amber/5 rounded-2xl p-4 text-xs text-brand-grey">
          <p className="font-semibold text-brand-ink mb-1">안내사항</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>신청 후 24시간 내에 담당자가 연락드립니다</li>
            <li>단체 클래스는 최소 5인 이상부터 신청 가능합니다</li>
            <li>출장 지역에 따라 강사 배정이 달라질 수 있습니다</li>
            <li>재료비 및 강사비는 별도 협의합니다</li>
          </ul>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl border border-brand-mist text-brand-grey text-sm">취소</button>
          <button onClick={handleSubmit} disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl bg-brand-amber text-brand-ink text-sm font-medium hover:bg-brand-amber/90 disabled:opacity-50 transition-colors">
            {saving ? '신청 중...' : '출강 신청하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

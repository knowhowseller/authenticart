'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Plus, Sparkles } from 'lucide-react'

const CATEGORIES = ['레진아트', '비즈공예', '자수', '석고아트', '캔들', '페인팅', '기타']

export default function NewArtworkPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '레진아트', material: '', size_info: '', stock: '1' })
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  async function handleImages(files: FileList) {
    if (images.length + files.length > 8) { toast.error('이미지는 최대 8장까지 가능합니다'); return }
    setUploading(true)
    const urls: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: 10MB 이하 파일만 업로드 가능합니다`)
        continue
      }
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/artwork-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(`업로드 실패: ${data.error ?? res.statusText}`)
        continue
      }
      urls.push(data.url)
    }
    setImages(prev => [...prev, ...urls])
    setUploading(false)
    if (urls.length > 0) toast.success(`${urls.length}장 업로드 완료`)
  }

  async function generateDescription() {
    if (images.length === 0) { toast.error('먼저 이미지를 업로드해주세요'); return }
    setAiLoading(true)
    const res = await fetch('/api/ai/describe-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: images[0], type: 'artwork' }),
    })
    const data = await res.json()
    setAiLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'AI 생성 실패'); return }
    setForm(f => ({ ...f, description: data.description }))
    toast.success('AI 설명이 생성되었습니다. 내용을 확인하고 수정해주세요.')
  }

  async function handleSubmit() {
    if (!form.title || !form.price) { toast.error('제목과 가격을 입력해주세요'); return }
    if (images.length === 0) { toast.error('이미지를 최소 1장 등록해주세요'); return }
    setSaving(true)
    const res = await fetch('/api/artworks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock), images }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error ?? '등록 실패'); return }
    toast.success('작품이 등록되었습니다')
    router.push('/my/artworks')
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-brand-ink mb-6">작품 등록</h1>

        {/* 이미지 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <label className="text-sm font-semibold text-brand-grey uppercase tracking-wider block mb-3">작품 사진 (최대 8장)</label>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 8 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-brand-mist hover:border-brand-amber flex flex-col items-center justify-center gap-1 text-brand-grey hover:text-brand-amber transition-colors disabled:opacity-50">
                {uploading ? <span className="text-xs">업로드 중</span> : <><Plus size={20} /><span className="text-xs">추가</span></>}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { if (e.target.files) handleImages(e.target.files); e.target.value = '' }} />
        </div>

        {/* 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4 space-y-4">
          <label className="text-sm font-semibold text-brand-grey uppercase tracking-wider block">작품 정보</label>
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">제목 *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="작품 제목을 입력하세요"
              className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">카테고리 *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">가격 (원) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="30000"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">소재</label>
              <input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                placeholder="예: UV레진, 비즈"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">크기</label>
              <input value={form.size_info} onChange={e => setForm(f => ({ ...f, size_info: e.target.value }))}
                placeholder="예: 10x10cm"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey block mb-1.5">재고 수량</label>
              <input type="number" min={1} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-brand-grey">작품 설명</label>
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
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="작품에 대한 설명을 입력하거나 AI로 자동 생성하세요"
              className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl border border-brand-mist text-brand-grey text-sm">취소</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
            {saving ? '등록 중...' : '작품 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

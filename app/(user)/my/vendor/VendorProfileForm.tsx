'use client'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Store, Globe, X, ImagePlus } from 'lucide-react'

interface Props {
  vendorId: string
  current: {
    logo_url: string | null
    banner_url: string | null
    description: string | null
    website_url: string | null
  }
}

export default function VendorProfileForm({ vendorId, current }: Props) {
  const [open, setOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState(current.logo_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(current.banner_url ?? '')
  const [description, setDescription] = useState(current.description ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(current.website_url ?? '')
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null)
  const [saving, setSaving] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  async function uploadImage(file: File, type: 'logo' | 'banner') {
    setUploading(type)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', type)
      const res = await fetch('/api/upload/vendor-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '업로드 실패')
      if (type === 'logo') setLogoUrl(data.url)
      else setBannerUrl(data.url)
      toast.success(`${type === 'logo' ? '로고' : '배너'} 이미지가 업로드됐습니다`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUploading(null)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          description: description || null,
          website_url: websiteUrl || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('스토어 프로필이 저장됐습니다')
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/20">
        <div className="flex items-center gap-2">
          <Store size={14} className="text-brand-grey" />
          <span className="text-sm font-semibold text-brand-ink">스토어 프로필</span>
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-xs text-brand-deep hover:underline">
          {open ? '닫기' : '편집'}
        </button>
      </div>

      {!open ? (
        /* 미리보기 */
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-bg border border-brand-mist/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? <img src={logoUrl} alt="로고" className="w-full h-full object-contain p-1" /> : <Store size={20} className="text-brand-grey/40" />}
          </div>
          <div className="flex-1 min-w-0">
            {description ? (
              <p className="text-sm text-brand-ink line-clamp-1">{description}</p>
            ) : (
              <p className="text-sm text-brand-grey italic">스토어 소개글이 없습니다</p>
            )}
            {websiteUrl && <p className="text-xs text-brand-deep mt-0.5 truncate">{websiteUrl}</p>}
          </div>
        </div>
      ) : (
        <div className="px-5 py-5 space-y-5">

          {/* 배너 업로드 */}
          <div>
            <label className="text-xs font-medium text-brand-grey mb-2 block">배너 이미지 <span className="text-brand-grey/60">(1200×300 권장, 최대 5MB)</span></label>
            <div
              onClick={() => bannerRef.current?.click()}
              className="relative h-24 rounded-xl border-2 border-dashed border-brand-mist hover:border-brand-deep/40 cursor-pointer overflow-hidden transition-colors group"
            >
              {bannerUrl ? (
                <>
                  <img src={bannerUrl} alt="배너" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImagePlus size={20} className="text-white" />
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setBannerUrl('') }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1.5 text-brand-grey">
                  {uploading === 'banner' ? (
                    <p className="text-xs">업로드 중...</p>
                  ) : (
                    <>
                      <Upload size={18} />
                      <p className="text-xs">클릭해서 배너 이미지 업로드</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'banner'); e.target.value = '' }} />
          </div>

          {/* 로고 업로드 */}
          <div>
            <label className="text-xs font-medium text-brand-grey mb-2 block">로고 이미지 <span className="text-brand-grey/60">(200×200 권장, 최대 5MB)</span></label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => logoRef.current?.click()}
                className="relative w-16 h-16 rounded-xl border-2 border-dashed border-brand-mist hover:border-brand-deep/40 cursor-pointer overflow-hidden transition-colors group flex-shrink-0"
              >
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="로고" className="w-full h-full object-contain p-1" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <ImagePlus size={16} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1 text-brand-grey">
                    {uploading === 'logo' ? <p className="text-[10px]">업로드중</p> : <><Upload size={14} /><p className="text-[10px]">로고</p></>}
                  </div>
                )}
              </div>
              <p className="text-xs text-brand-grey leading-relaxed">정사각형 이미지를 권장합니다.<br />투명 배경 PNG가 가장 잘 어울립니다.</p>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'logo'); e.target.value = '' }} />
          </div>

          {/* 소개글 */}
          <div>
            <label className="text-xs font-medium text-brand-grey mb-1.5 block">스토어 소개</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="스토어를 간략히 소개해주세요 (최대 300자)"
              className="w-full text-sm border border-brand-mist/50 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
            <p className="text-right text-xs text-brand-grey mt-0.5">{description.length}/300</p>
          </div>

          {/* 웹사이트 */}
          <div>
            <label className="text-xs font-medium text-brand-grey mb-1.5 block flex items-center gap-1">
              <Globe size={11} /> 공식 웹사이트 <span className="text-brand-grey/60">(선택)</span>
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://your-store.com"
              className="w-full text-sm border border-brand-mist/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !!uploading}
              className="flex-1 py-2.5 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 bg-brand-bg text-brand-grey rounded-xl text-sm font-medium hover:bg-brand-mist/30 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

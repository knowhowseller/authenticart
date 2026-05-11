'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { updateInstructorProfile } from '@/app/actions/instructor-profile'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Props {
  instructorId: string
  name: string
  email: string
  bio: string
  region: string
  profileImage: string
}

export default function InstructorEditForm({ instructorId, name, email, bio, region, profileImage }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ bio, region, profile_image: profileImage })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `instructors/${instructorId}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('instructor-profiles')
      .upload(path, file, { upsert: true })
    if (upErr) { toast.error('이미지 업로드 실패: ' + upErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('instructor-profiles').getPublicUrl(path)
    setForm(f => ({ ...f, profile_image: urlData.publicUrl }))
    setUploading(false)
    toast.success('사진이 변경되었습니다')
  }

  async function handleSave() {
    setSaving(true)
    const result = await updateInstructorProfile(instructorId, {
      bio: form.bio,
      region: form.region,
      profile_image: form.profile_image,
    })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('저장되었습니다')
    router.push('/admin/instructors')
  }

  return (
    <div className="space-y-5">
      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
        <h2 className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-3">회원 정보</h2>
        <p className="text-sm font-semibold text-brand-ink">{name}</p>
        <p className="text-xs text-brand-grey">{email}</p>
      </div>

      {/* 프로필 편집 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-xs font-semibold text-brand-grey uppercase tracking-wider">프로필 편집</h2>

        {/* 사진 */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-brand-blush to-brand-mist flex-shrink-0 cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {form.profile_image ? (
              <img src={form.profile_image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👩‍🎨</div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-brand-deep hover:underline disabled:opacity-50"
            >
              {uploading ? '업로드 중...' : '사진 변경'}
            </button>
            <p className="text-xs text-brand-grey mt-0.5">JPG, PNG, WEBP (최대 5MB)</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handlePhotoUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        <Input
          label="활동 지역"
          value={form.region}
          onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
          placeholder="예: 서울 강남구"
        />

        <div>
          <label className="text-sm font-medium text-brand-ink block mb-1.5">자기소개</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={5}
            placeholder="강사 소개를 입력하세요"
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/admin/instructors')}
          className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
        >
          취소
        </button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          저장하기
        </Button>
      </div>
    </div>
  )
}

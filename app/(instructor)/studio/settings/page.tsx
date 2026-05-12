'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Hexagon from '@/components/brand/Hexagon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { updateInstructorProfile } from '@/app/actions/instructor-profile'

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'IBK기업은행',
  'NH농협은행', '카카오뱅크', '토스뱅크', '케이뱅크', 'SC제일은행',
  '씨티은행', '대구은행', '부산은행', '광주은행', '전북은행',
  '경남은행', '제주은행', '수협은행', '우체국',
]

interface Branch { id: string; name: string; region: string }

interface Profile {
  bio: string
  region: string
  profile_image: string
  branch_id: string | null
  payout_account: { bank: string; account: string; holder: string } | null
}

export default function StudioSettingsPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({
    bio: '', region: '', profile_image: '', branch_id: null,
    payout_account: null,
  })
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setInstructorId(user.id)
      const [{ data }, { data: branchList }] = await Promise.all([
        supabase
          .from('instructor_profiles')
          .select('bio, region, profile_image, branch_id, payout_account')
          .eq('instructor_id', user.id)
          .single(),
        supabase.from('branches').select('id, name, region').order('region'),
      ])
      setBranches(branchList ?? [])
      if (data) {
        setProfile({
          bio: data.bio ?? '',
          region: data.region ?? '',
          profile_image: data.profile_image ?? '',
          branch_id: (data as any).branch_id ?? null,
          payout_account: (data.payout_account as any) ?? null,
        })
        const pa = (data.payout_account as any)
        if (pa) { setBank(pa.bank ?? ''); setAccount(pa.account ?? ''); setHolder(pa.holder ?? '') }
      }
      setLoaded(true)
    }
    load()
  }, [])

  async function handlePhotoUpload(file: File) {
    if (!instructorId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `instructors/${instructorId}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('instructor-profiles')
      .upload(path, file, { upsert: true })
    if (upErr) { toast.error('이미지 업로드 실패: ' + upErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('instructor-profiles').getPublicUrl(path)
    const url = urlData.publicUrl
    setProfile(p => ({ ...p, profile_image: url }))
    const result = await updateInstructorProfile(instructorId, { profile_image: url })
    setUploading(false)
    if (result.error) toast.error(result.error)
    else toast.success('프로필 사진이 변경되었습니다')
  }

  async function handleSave() {
    if (!instructorId) return
    setSaving(true)
    const result = await updateInstructorProfile(instructorId, {
      bio: profile.bio,
      region: profile.region,
    })
    const extraUpdate: Record<string, unknown> = {}
    if (bank || account || holder) {
      extraUpdate.payout_account = { bank, account: account.replace(/\D/g, ''), holder }
    }
    extraUpdate.branch_id = profile.branch_id || null
    if (!result.error) {
      await supabase.from('instructor_profiles').update(extraUpdate).eq('instructor_id', instructorId)
    }
    setSaving(false)
    if (result.error) toast.error(result.error)
    else toast.success('설정이 저장되었습니다')
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-grey text-sm">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Studio</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">프로필 & 계좌 설정</h1>

        {/* 프로필 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">강사 프로필</h2>

          {/* 프로필 사진 */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-brand-blush to-brand-mist flex-shrink-0 cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="프로필" className="w-full h-full object-cover" />
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

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">활동 지역</label>
                <Input
                  value={profile.region}
                  onChange={e => setProfile(p => ({ ...p, region: e.target.value }))}
                  placeholder="예: 서울 강남구"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">소속 지부</label>
                <select
                  value={profile.branch_id ?? ''}
                  onChange={e => setProfile(p => ({ ...p, branch_id: e.target.value || null }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                >
                  <option value="">없음</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.region})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">자기소개</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={4}
                placeholder="강사 소개를 입력하세요"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
              />
            </div>
          </div>
        </div>

        {/* 정산 계좌 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-6">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-1">정산 계좌</h2>
          <p className="text-xs text-brand-grey mb-4">정산 입금을 받을 계좌를 등록해주세요. 매월 5일 입금됩니다.</p>

          {profile.payout_account && (
            <div className="bg-brand-deep/5 rounded-xl p-3 mb-4 flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">
                  {profile.payout_account.bank} {profile.payout_account.account}
                </p>
                <p className="text-xs text-brand-grey">{profile.payout_account.holder}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">은행</label>
              <select
                value={bank}
                onChange={e => setBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                <option value="">은행 선택</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">계좌번호</label>
              <Input
                value={account}
                onChange={e => setAccount(e.target.value.replace(/[^0-9-]/g, ''))}
                placeholder="숫자만 입력 (예: 123456789012)"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">예금주</label>
              <Input
                value={holder}
                onChange={e => setHolder(e.target.value)}
                placeholder="예금주 실명"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full">
          저장하기
        </Button>
      </div>
    </div>
  )
}

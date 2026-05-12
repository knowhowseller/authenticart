'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
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
  portfolio_images: string[]
  service_regions: string[]
  group_lesson_available: boolean
  group_lesson_min: number
  group_lesson_max: number
  group_lesson_base_price: number
  group_lesson_note: string
}

export default function StudioSettingsPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const portfolioRef = useRef<HTMLInputElement>(null)
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({
    bio: '', region: '', profile_image: '', branch_id: null,
    payout_account: null, portfolio_images: [],
    service_regions: [], group_lesson_available: false,
    group_lesson_min: 5, group_lesson_max: 30,
    group_lesson_base_price: 0, group_lesson_note: '',
  })
  const [newRegion, setNewRegion] = useState('')
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [portfolioUploading, setPortfolioUploading] = useState(false)
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
          .select('bio, region, profile_image, branch_id, payout_account, portfolio_images, service_regions, group_lesson_available, group_lesson_min, group_lesson_max, group_lesson_base_price, group_lesson_note')
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
          portfolio_images: (data as any).portfolio_images ?? [],
          service_regions: (data as any).service_regions ?? [],
          group_lesson_available: (data as any).group_lesson_available ?? false,
          group_lesson_min: (data as any).group_lesson_min ?? 5,
          group_lesson_max: (data as any).group_lesson_max ?? 30,
          group_lesson_base_price: (data as any).group_lesson_base_price ?? 0,
          group_lesson_note: (data as any).group_lesson_note ?? '',
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

  async function handlePortfolioUpload(file: File) {
    if (!instructorId) return
    if (profile.portfolio_images.length >= 10) {
      toast.error('포트폴리오 이미지는 최대 10장까지 등록 가능합니다')
      return
    }
    setPortfolioUploading(true)
    const ext = file.name.split('.').pop()
    const path = `instructors/${instructorId}/portfolio/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('instructor-profiles')
      .upload(path, file, { upsert: false })
    if (upErr) { toast.error('이미지 업로드 실패: ' + upErr.message); setPortfolioUploading(false); return }
    const { data: urlData } = supabase.storage.from('instructor-profiles').getPublicUrl(path)
    const newImages = [...profile.portfolio_images, urlData.publicUrl]
    setProfile(p => ({ ...p, portfolio_images: newImages }))
    await supabase.from('instructor_profiles')
      .update({ portfolio_images: newImages } as any)
      .eq('instructor_id', instructorId)
    setPortfolioUploading(false)
    toast.success('포트폴리오 이미지가 추가되었습니다')
  }

  async function handlePortfolioRemove(url: string) {
    if (!instructorId) return
    const newImages = profile.portfolio_images.filter(u => u !== url)
    setProfile(p => ({ ...p, portfolio_images: newImages }))
    await supabase.from('instructor_profiles')
      .update({ portfolio_images: newImages } as any)
      .eq('instructor_id', instructorId)
    toast.success('이미지가 삭제되었습니다')
  }

  function addServiceRegion() {
    const r = newRegion.trim()
    if (!r || profile.service_regions.includes(r)) return
    setProfile(p => ({ ...p, service_regions: [...p.service_regions, r] }))
    setNewRegion('')
  }
  function removeServiceRegion(r: string) {
    setProfile(p => ({ ...p, service_regions: p.service_regions.filter(x => x !== r) }))
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
    extraUpdate.service_regions = profile.service_regions
    extraUpdate.group_lesson_available = profile.group_lesson_available
    extraUpdate.group_lesson_min = profile.group_lesson_min
    extraUpdate.group_lesson_max = profile.group_lesson_max
    extraUpdate.group_lesson_base_price = profile.group_lesson_base_price
    extraUpdate.group_lesson_note = profile.group_lesson_note || null
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

        {/* 포트폴리오 이미지 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-6">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-1">포트폴리오</h2>
          <p className="text-xs text-brand-grey mb-4">작품 이미지를 등록하면 강사 프로필 페이지에 표시됩니다 (최대 10장)</p>
          <div className="grid grid-cols-3 gap-3">
            {profile.portfolio_images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={url} alt={`포트폴리오 ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handlePortfolioRemove(url)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {profile.portfolio_images.length < 10 && (
              <button
                onClick={() => portfolioRef.current?.click()}
                disabled={portfolioUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-brand-mist hover:border-brand-amber flex flex-col items-center justify-center gap-1 text-brand-grey hover:text-brand-amber transition-colors disabled:opacity-50"
              >
                {portfolioUploading ? (
                  <span className="text-xs">업로드 중...</span>
                ) : (
                  <>
                    <Plus size={20} />
                    <span className="text-xs">추가</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={portfolioRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handlePortfolioUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        {/* 출강 범위 설정 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-1">활동 지역 & 출강 범위</h2>
          <p className="text-xs text-brand-grey mb-4">활동 가능한 지역을 추가하면 클래스 요청 매칭에 활용됩니다</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">활동 지역 추가</label>
              <div className="flex gap-2">
                <input
                  value={newRegion}
                  onChange={e => setNewRegion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addServiceRegion())}
                  placeholder="예: 서울 강남구"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
                <button
                  onClick={addServiceRegion}
                  className="px-4 py-2.5 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90"
                >
                  추가
                </button>
              </div>
              {profile.service_regions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.service_regions.map(r => (
                    <span key={r} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-deep/10 text-brand-deep rounded-full text-sm">
                      {r}
                      <button onClick={() => removeServiceRegion(r)} className="hover:text-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-brand-mist/30">
              <button
                onClick={() => setProfile(p => ({ ...p, group_lesson_available: !p.group_lesson_available }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${profile.group_lesson_available ? 'bg-brand-deep' : 'bg-brand-mist'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${profile.group_lesson_available ? 'left-5' : 'left-1'}`} />
              </button>
              <label className="text-sm font-medium text-brand-ink">단체 출강 수락 가능</label>
            </div>

            {profile.group_lesson_available && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-brand-ink block mb-1.5">최소 인원</label>
                  <input
                    type="number" min={2}
                    value={profile.group_lesson_min}
                    onChange={e => setProfile(p => ({ ...p, group_lesson_min: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink block mb-1.5">최대 인원</label>
                  <input
                    type="number" min={2}
                    value={profile.group_lesson_max}
                    onChange={e => setProfile(p => ({ ...p, group_lesson_max: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink block mb-1.5">기본 출강 단가 (원/인)</label>
                  <input
                    type="number" min={0}
                    value={profile.group_lesson_base_price}
                    onChange={e => setProfile(p => ({ ...p, group_lesson_base_price: parseInt(e.target.value) || 0 }))}
                    placeholder="예: 30000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink block mb-1.5">출강 안내 메모</label>
                  <input
                    value={profile.group_lesson_note}
                    onChange={e => setProfile(p => ({ ...p, group_lesson_note: e.target.value }))}
                    placeholder="예: 재료비 별도, 강남 이남 가능"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full">
          저장하기
        </Button>
      </div>
    </div>
  )
}

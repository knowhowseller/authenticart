'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Hexagon from '@/components/brand/Hexagon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'IBK기업은행',
  'NH농협은행', '카카오뱅크', '토스뱅크', '케이뱅크', 'SC제일은행',
  '씨티은행', '대구은행', '부산은행', '광주은행', '전북은행',
  '경남은행', '제주은행', '수협은행', '우체국',
]

interface Profile {
  bio: string
  region: string
  profile_image: string
  payout_account: { bank: string; account: string; holder: string } | null
}

export default function StudioSettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>({
    bio: '', region: '', profile_image: '',
    payout_account: null,
  })
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('instructor_profiles')
        .select('bio, region, profile_image, payout_account')
        .eq('instructor_id', user.id)
        .single()
      if (data) {
        setProfile({
          bio: data.bio ?? '',
          region: data.region ?? '',
          profile_image: data.profile_image ?? '',
          payout_account: (data.payout_account as any) ?? null,
        })
        const pa = (data.payout_account as any)
        if (pa) { setBank(pa.bank ?? ''); setAccount(pa.account ?? ''); setHolder(pa.holder ?? '') }
      }
      setLoaded(true)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const body: Record<string, unknown> = {
      bio: profile.bio,
      region: profile.region,
    }
    if (bank || account || holder) {
      body.payout_account = { bank, account: account.replace(/\D/g, ''), holder }
    }
    const res = await fetch('/api/studio/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) toast.success('설정이 저장되었습니다')
    else {
      const json = await res.json()
      toast.error(json.error ?? '저장 실패')
    }
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
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">활동 지역</label>
              <Input
                value={profile.region}
                onChange={e => setProfile(p => ({ ...p, region: e.target.value }))}
                placeholder="예: 서울 강남구"
              />
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

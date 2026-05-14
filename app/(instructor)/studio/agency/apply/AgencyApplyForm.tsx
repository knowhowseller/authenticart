'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AgencyApplyForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    agency_name: '',
    business_no: '',
    contact_email: '',
    contact_phone: '',
    description: '',
  })

  function set(k: keyof typeof form, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.agency_name.trim() || !form.contact_email.trim()) {
      toast.error('에이전시명과 담당자 이메일을 입력해주세요')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인이 필요합니다'); setLoading(false); return }

    const { error } = await supabase.from('agencies').insert({
      user_id: user.id,
      agency_name: form.agency_name.trim(),
      business_no: form.business_no.trim() || null,
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim() || null,
      description: form.description.trim() || null,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('에이전시 신청이 완료되었습니다. 관리자 승인 후 강사 초대가 가능합니다.')
    router.push('/studio/agency')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">에이전시 정보</h2>
        <Input
          label="에이전시명 / 공방명"
          required
          placeholder="○○ 공예 스튜디오"
          value={form.agency_name}
          onChange={e => set('agency_name', e.target.value)}
        />
        <Input
          label="사업자등록번호"
          placeholder="123-45-67890"
          value={form.business_no}
          onChange={e => set('business_no', e.target.value)}
        />
        <Input
          label="담당자 이메일"
          type="email"
          required
          placeholder="agency@example.com"
          value={form.contact_email}
          onChange={e => set('contact_email', e.target.value)}
        />
        <Input
          label="담당자 연락처"
          placeholder="010-1234-5678"
          value={form.contact_phone}
          onChange={e => set('contact_phone', e.target.value)}
        />
        <div>
          <label className="text-sm font-medium text-brand-ink block mb-1.5">에이전시 소개</label>
          <textarea
            rows={4}
            placeholder="운영 장르, 소속 강사 수, 공방 특징 등을 자유롭게 작성해주세요"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
      </div>

      <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-xl px-4 py-3 text-xs text-brand-ink space-y-1">
        <p className="font-semibold text-brand-amber">💡 에이전시 안내</p>
        <p>• 수수료: 어드민이 협의 후 <strong>5~15%</strong> 설정</p>
        <p>• 정산: 플랫폼이 강사·에이전시 계좌로 <strong>각각 직접 송금</strong></p>
        <p>• 강사 초대: 승인 후 초대 링크 발급 → 강사가 링크로 소속 연결</p>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        에이전시 신청하기
      </Button>
    </form>
  )
}

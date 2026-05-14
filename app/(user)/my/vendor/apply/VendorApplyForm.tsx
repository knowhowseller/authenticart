'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function VendorApplyForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
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
    if (!form.business_name.trim() || !form.contact_email.trim()) {
      toast.error('업체명과 담당자 이메일을 입력해주세요')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인이 필요합니다'); setLoading(false); return }

    const { error } = await supabase.from('vendors').insert({
      user_id: user.id,
      business_name: form.business_name.trim(),
      business_no: form.business_no.trim() || null,
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim() || null,
      description: form.description.trim() || null,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('입점 신청이 완료되었습니다. 관리자 검토 후 승인 이메일이 발송됩니다.')
    router.push('/my/vendor')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">업체 정보</h2>
        <Input
          label="업체명 / 브랜드명"
          required
          placeholder="오센틱아트 공방"
          value={form.business_name}
          onChange={e => set('business_name', e.target.value)}
        />
        <Input
          label="사업자등록번호"
          placeholder="123-45-67890 (개인사업자/법인)"
          value={form.business_no}
          onChange={e => set('business_no', e.target.value)}
        />
        <Input
          label="담당자 이메일"
          type="email"
          required
          placeholder="vendor@example.com"
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
          <label className="text-sm font-medium text-brand-ink block mb-1.5">업체 소개</label>
          <textarea
            rows={4}
            placeholder="취급 상품, 브랜드 소개, 납품 가능 물량 등을 자유롭게 작성해주세요"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
      </div>

      <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-xl px-4 py-3 text-xs text-brand-ink space-y-1">
        <p className="font-semibold text-brand-amber">💡 입점 안내</p>
        <p>• 기본 수수료: <strong>판매가의 15%</strong> (협의 가능)</p>
        <p>• 정산: 매월 1일 전월 판매 내역 자동 정산</p>
        <p>• 승인 완료 후 상품 직접 등록 가능 (관리자 검수 후 노출)</p>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        입점 신청하기
      </Button>
    </form>
  )
}

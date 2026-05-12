'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewClassRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', preferred_region: '', preferred_date: '', message: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.title || !form.preferred_region) { toast.error('제목과 희망 지역을 입력해주세요'); return }
    setSaving(true)
    const res = await fetch('/api/class-requests/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
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
              rows={4} placeholder="배우고 싶은 내용이나 특별한 요청사항을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none" />
          </div>
        </div>

        <div className="mt-4 bg-brand-amber/5 rounded-2xl p-4 text-xs text-brand-grey">
          <p className="font-semibold text-brand-ink mb-1">진행 순서</p>
          <div className="space-y-1">
            <p>① 요청 등록 → ② 강사 매칭 → ③ 모집 시작 → ④ 정원 충족 시 결제 → ⑤ 클래스 확정</p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl border border-brand-mist text-brand-grey text-sm">취소</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
            {saving ? '등록 중...' : '요청 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

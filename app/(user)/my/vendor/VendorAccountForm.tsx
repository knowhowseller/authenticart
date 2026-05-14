'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export default function VendorAccountForm({ current }: { current: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!value.trim()) { toast.error('계좌 정보를 입력해주세요'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_account: value }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? '오류') }
      toast.success('계좌 정보가 저장되었습니다')
      setEditing(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/20">
        <span className="text-sm font-semibold text-brand-ink">정산 계좌</span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-brand-deep hover:underline">
            {current ? '수정' : '등록'}
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="은행명 계좌번호 예금주 (예: 신한은행 110-123-456789 홍길동)"
              className="w-full text-sm border border-brand-mist/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => { setEditing(false); setValue(current ?? '') }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-ink">
            {current ?? <span className="text-brand-grey italic">등록된 계좌 없음</span>}
          </p>
        )}
      </div>
    </div>
  )
}

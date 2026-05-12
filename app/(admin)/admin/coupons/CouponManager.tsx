'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Tag, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Coupon {
  id: string
  code: string
  type: 'fixed' | 'percent'
  value: number
  min_amount: number
  max_uses: number | null
  used_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  description: string | null
}

export default function CouponManager({ initialCoupons, adminId }: { initialCoupons: Coupon[]; adminId: string }) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '', type: 'fixed' as 'fixed' | 'percent', value: '',
    min_amount: '0', max_uses: '', valid_until: '', description: '',
  })

  async function handleCreate() {
    if (!form.code || !form.value) { toast.error('코드와 할인값을 입력하세요'); return }
    if (form.type === 'percent' && Number(form.value) > 100) {
      toast.error('퍼센트 할인은 100% 이하만 가능합니다')
      return
    }
    setLoading(true)
    const res = await fetch('/api/admin/coupons/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        min_amount: Number(form.min_amount),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_until: form.valid_until || null,
        description: form.description || null,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? '생성 실패'); return }
    setCoupons(prev => [data.coupon, ...prev])
    setShowForm(false)
    setForm({ code: '', type: 'fixed', value: '', min_amount: '0', max_uses: '', valid_until: '', description: '' })
    toast.success('쿠폰이 생성되었습니다')
  }

  async function handleToggle(couponId: string, currentActive: boolean) {
    const res = await fetch('/api/admin/coupons/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_id: couponId, is_active: !currentActive }),
    })
    if (!res.ok) { toast.error('상태 변경 실패'); return }
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_active: !currentActive } : c))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="accent" size="md" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} className="mr-1" />
          새 쿠폰 생성
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-6">
          <h3 className="font-semibold text-brand-ink mb-4">쿠폰 생성</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-brand-grey mb-1 block">쿠폰 코드 *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER2026"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey mb-1 block">할인 방식 *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as 'fixed' | 'percent' }))}
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                <option value="fixed">정액 (원)</option>
                <option value="percent">정률 (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey mb-1 block">
                할인값 * ({form.type === 'fixed' ? '원' : '%'})
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'fixed' ? '5000' : '10'}
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey mb-1 block">최소 주문금액 (원)</label>
              <input
                type="number"
                value={form.min_amount}
                onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey mb-1 block">최대 사용 횟수</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="무제한"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-grey mb-1 block">만료일</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-brand-grey mb-1 block">설명 (쿠폰 적용 시 표시)</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="신규 회원 5,000원 할인"
                className="w-full px-3 py-2 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="accent" size="md" loading={loading} onClick={handleCreate}>생성</Button>
            <Button variant="outline" size="md" onClick={() => setShowForm(false)}>취소</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <Tag size={32} className="text-brand-grey mx-auto mb-3" />
            <p className="text-brand-grey">생성된 쿠폰이 없습니다</p>
          </div>
        ) : coupons.map(c => (
          <div key={c.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${c.is_active ? 'border-brand-mist/30' : 'border-brand-mist/20 opacity-60'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-amber/10 flex items-center justify-center">
                  <Tag size={16} className="text-brand-amber" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-brand-ink text-sm">{c.code}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-brand-bg text-brand-grey'}`}>
                      {c.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                  <p className="text-xs text-brand-grey mt-0.5">
                    {c.type === 'fixed' ? `${c.value.toLocaleString()}원 할인` : `${c.value}% 할인`}
                    {c.min_amount > 0 && ` · ${c.min_amount.toLocaleString()}원 이상`}
                    {c.max_uses !== null && ` · 사용 ${c.used_count}/${c.max_uses}`}
                    {c.valid_until && ` · ~${new Date(c.valid_until).toLocaleDateString('ko-KR')}`}
                  </p>
                  {c.description && <p className="text-xs text-brand-grey mt-0.5">{c.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(c.id, c.is_active)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    c.is_active
                      ? 'border-red-200 text-red-500 hover:bg-red-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {c.is_active ? '비활성화' : '활성화'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/format'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Vendor {
  id: string
  business_name: string
  business_no: string | null
  contact_email: string
  contact_phone: string | null
  commission_rate: number
  status: string
  description: string | null
  rejection_reason: string | null
  created_at: string
  approved_at: string | null
  users: { name: string; email: string } | null
}

const statusLabel: Record<string, string> = {
  pending:   '심사 중',
  approved:  '승인됨',
  rejected:  '반려됨',
  suspended: '정지됨',
}
const statusColor: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-600 border-yellow-200',
  approved:  'bg-green-50 text-green-600 border-green-200',
  rejected:  'bg-red-50 text-red-500 border-red-200',
  suspended: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function VendorManager({
  initialVendors,
  adminId,
}: {
  initialVendors: Vendor[]
  adminId: string
}) {
  const supabase = createClient()
  const [vendors, setVendors] = useState(initialVendors)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Record<string, string>>({})
  const [rejections, setRejections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function approve(id: string) {
    setLoading(true)
    const { error } = await supabase
      .from('vendors')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: adminId })
      .eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setVendors(prev => prev.map(v => v.id === id ? { ...v, status: 'approved', approved_at: new Date().toISOString() } : v))
    toast.success('벤더가 승인되었습니다')
  }

  async function reject(id: string) {
    const reason = rejections[id]?.trim()
    if (!reason) { toast.error('반려 사유를 입력해주세요'); return }
    setLoading(true)
    const { error } = await supabase
      .from('vendors')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setVendors(prev => prev.map(v => v.id === id ? { ...v, status: 'rejected', rejection_reason: reason } : v))
    toast.success('벤더가 반려되었습니다')
  }

  async function updateCommission(id: string) {
    const rate = parseFloat(commissions[id] ?? '')
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error('0~100 사이 값을 입력하세요'); return }
    setLoading(true)
    const { error } = await supabase
      .from('vendors')
      .update({ commission_rate: rate })
      .eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setVendors(prev => prev.map(v => v.id === id ? { ...v, commission_rate: rate } : v))
    toast.success('수수료율이 변경되었습니다')
  }

  async function suspend(id: string) {
    if (!confirm('해당 벤더를 정지하시겠습니까?')) return
    setLoading(true)
    const { error } = await supabase.from('vendors').update({ status: 'suspended' }).eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setVendors(prev => prev.map(v => v.id === id ? { ...v, status: 'suspended' } : v))
    toast.success('벤더가 정지되었습니다')
  }

  const pendingCount = vendors.filter(v => v.status === 'pending').length

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
          ⏳ 승인 대기 중인 벤더 신청 <strong>{pendingCount}건</strong>
        </div>
      )}

      {vendors.length === 0 && (
        <div className="text-center py-16 text-brand-grey">
          <p>벤더 신청이 없습니다</p>
        </div>
      )}

      {vendors.map(vendor => (
        <div key={vendor.id}
          className="bg-white rounded-2xl border border-brand-mist/30 shadow-sm overflow-hidden"
        >
          <div
            className="flex items-center gap-4 px-5 py-4 cursor-pointer"
            onClick={() => setExpanded(expanded === vendor.id ? null : vendor.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-brand-ink">{vendor.business_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[vendor.status]}`}>
                  {statusLabel[vendor.status]}
                </span>
              </div>
              <p className="text-xs text-brand-grey">
                {vendor.users?.name} · {vendor.contact_email}
                {vendor.business_no && ` · 사업자 ${vendor.business_no}`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-brand-grey">수수료</p>
              <p className="text-sm font-bold text-brand-deep">{vendor.commission_rate}%</p>
            </div>
            {expanded === vendor.id ? <ChevronUp size={16} className="text-brand-grey" /> : <ChevronDown size={16} className="text-brand-grey" />}
          </div>

          {expanded === vendor.id && (
            <div className="border-t border-brand-mist/20 px-5 py-4 bg-brand-bg/40 space-y-4">
              {vendor.description && (
                <p className="text-sm text-brand-grey leading-relaxed">{vendor.description}</p>
              )}
              <p className="text-xs text-brand-grey">신청일: {formatDateTime(vendor.created_at)}</p>

              {/* 수수료 변경 */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-brand-grey font-medium flex-shrink-0">수수료율 (%)</label>
                <input
                  type="number"
                  min={0} max={100} step={0.5}
                  defaultValue={vendor.commission_rate}
                  onChange={e => setCommissions(p => ({ ...p, [vendor.id]: e.target.value }))}
                  className="w-20 px-2.5 py-1.5 text-sm border border-brand-mist rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-amber"
                />
                <button
                  onClick={() => updateCommission(vendor.id)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                >
                  변경
                </button>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 flex-wrap">
                {vendor.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approve(vendor.id)}
                      disabled={loading}
                      className="text-xs px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      ✓ 승인
                    </button>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        placeholder="반려 사유 (필수)"
                        value={rejections[vendor.id] ?? ''}
                        onChange={e => setRejections(p => ({ ...p, [vendor.id]: e.target.value }))}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-brand-mist focus:outline-none focus:ring-1 focus:ring-red-400"
                      />
                      <button
                        onClick={() => reject(vendor.id)}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        반려
                      </button>
                    </div>
                  </>
                )}
                {vendor.status === 'approved' && (
                  <button
                    onClick={() => suspend(vendor.id)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    정지
                  </button>
                )}
                {vendor.status === 'rejected' && vendor.rejection_reason && (
                  <p className="text-xs text-red-500">반려 사유: {vendor.rejection_reason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/format'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Agency {
  id: string
  agency_name: string
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

export default function AgencyManager({
  initialAgencies,
  adminId,
}: {
  initialAgencies: Agency[]
  adminId: string
}) {
  const supabase = createClient()
  const [agencies, setAgencies] = useState(initialAgencies)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Record<string, string>>({})
  const [rejections, setRejections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function approve(id: string) {
    setLoading(true)
    const { error } = await supabase
      .from('agencies')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: adminId })
      .eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, status: 'approved', approved_at: new Date().toISOString() } : a))
    toast.success('에이전시가 승인되었습니다')
  }

  async function reject(id: string) {
    const reason = rejections[id]?.trim()
    if (!reason) { toast.error('반려 사유를 입력해주세요'); return }
    setLoading(true)
    const { error } = await supabase
      .from('agencies')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected', rejection_reason: reason } : a))
    toast.success('에이전시가 반려되었습니다')
  }

  async function updateCommission(id: string) {
    const rate = parseFloat(commissions[id] ?? '')
    if (isNaN(rate) || rate < 0 || rate > 15) { toast.error('0~15 사이 값을 입력하세요'); return }
    setLoading(true)
    const { error } = await supabase.from('agencies').update({ commission_rate: rate }).eq('id', id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, commission_rate: rate } : a))
    toast.success('수수료율이 변경되었습니다')
  }

  const pendingCount = agencies.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
          ⏳ 승인 대기 중인 에이전시 신청 <strong>{pendingCount}건</strong>
        </div>
      )}
      {agencies.length === 0 && (
        <div className="text-center py-16 text-brand-grey"><p>에이전시 신청이 없습니다</p></div>
      )}
      {agencies.map(agency => (
        <div key={agency.id}
          className="bg-white rounded-2xl border border-brand-mist/30 shadow-sm overflow-hidden"
        >
          <div
            className="flex items-center gap-4 px-5 py-4 cursor-pointer"
            onClick={() => setExpanded(expanded === agency.id ? null : agency.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-brand-ink">{agency.agency_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[agency.status]}`}>
                  {statusLabel[agency.status]}
                </span>
              </div>
              <p className="text-xs text-brand-grey">
                {agency.users?.name} · {agency.contact_email}
                {agency.business_no && ` · 사업자 ${agency.business_no}`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-brand-grey">에이전시 수수료</p>
              <p className="text-sm font-bold text-brand-deep">{agency.commission_rate}%</p>
            </div>
            {expanded === agency.id ? <ChevronUp size={16} className="text-brand-grey" /> : <ChevronDown size={16} className="text-brand-grey" />}
          </div>

          {expanded === agency.id && (
            <div className="border-t border-brand-mist/20 px-5 py-4 bg-brand-bg/40 space-y-4">
              {agency.description && <p className="text-sm text-brand-grey">{agency.description}</p>}
              <p className="text-xs text-brand-grey">신청일: {formatDateTime(agency.created_at)}</p>

              <div className="bg-brand-amber/5 rounded-lg px-3 py-2 text-xs text-brand-grey">
                에이전시 수수료는 <strong>0~15%</strong> 범위 내에서 협의 후 설정하세요.
                강사 수령 = 86.7% − 에이전시 수수료율
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-brand-grey font-medium flex-shrink-0">에이전시 수수료 (%)</label>
                <input
                  type="number"
                  min={0} max={15} step={0.5}
                  defaultValue={agency.commission_rate}
                  onChange={e => setCommissions(p => ({ ...p, [agency.id]: e.target.value }))}
                  className="w-20 px-2.5 py-1.5 text-sm border border-brand-mist rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-amber"
                />
                <button
                  onClick={() => updateCommission(agency.id)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                >
                  변경
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {agency.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approve(agency.id)}
                      disabled={loading}
                      className="text-xs px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      ✓ 승인
                    </button>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        placeholder="반려 사유 (필수)"
                        value={rejections[agency.id] ?? ''}
                        onChange={e => setRejections(p => ({ ...p, [agency.id]: e.target.value }))}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-brand-mist focus:outline-none"
                      />
                      <button
                        onClick={() => reject(agency.id)}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        반려
                      </button>
                    </div>
                  </>
                )}
                {agency.status === 'rejected' && agency.rejection_reason && (
                  <p className="text-xs text-red-500">반려 사유: {agency.rejection_reason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

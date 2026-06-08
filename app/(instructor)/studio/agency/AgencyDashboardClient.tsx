'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import { Users, TrendingUp, Copy, Plus, RefreshCw, UserMinus, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  agency: any
  instructors: any[]
  invites: any[]
  payouts: any[]
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

export default function AgencyDashboardClient({ agency, instructors: initialInstructors, invites: initialInvites, payouts }: Props) {
  const supabase = createClient()
  const [invites, setInvites] = useState(initialInvites)
  const [instructors, setInstructors] = useState(initialInstructors)
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [reissuingId, setReissuingId] = useState<string | null>(null)
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

  async function createInvite() {
    setLoading(true)
    const { data, error } = await supabase
      .from('agency_invites')
      .insert({ agency_id: agency.id })
      .select('id, token, expires_at, used_at')
      .single()
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setInvites(prev => [{ ...data, users: null }, ...prev])
    toast.success('초대 링크가 생성되었습니다')
  }

  function copyInviteLink(token: string) {
    const url = `${siteUrl}/studio/agency/join?token=${token}`
    navigator.clipboard.writeText(url)
    toast.success('초대 링크가 복사되었습니다')
  }

  async function reissueInvite(inviteId: string) {
    setReissuingId(inviteId)
    try {
      const res = await fetch('/api/agency/invites/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_invite_id: inviteId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? '오류')
      setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, expires_at: new Date().toISOString() } : i).concat([{ ...d.invite, users: null }]))
      toast.success('초대 링크가 재발급되었습니다')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setReissuingId(null)
    }
  }

  async function removeInstructor(instructorId: string, name: string) {
    if (!window.confirm(`${name} 강사를 에이전시에서 제거하시겠습니까?`)) return
    setRemovingId(instructorId)
    try {
      const res = await fetch(`/api/agency/instructors/${instructorId}/remove`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? '오류')
      setInstructors(prev => prev.filter(i => i.instructor_id !== instructorId))
      toast.success(`${name} 강사가 제거되었습니다`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setRemovingId(null)
    }
  }

  const totalPayout = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.agency_fee, 0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={14} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Agency</span>
        </div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">{agency.agency_name}</h1>
            <p className="text-sm text-brand-grey mt-0.5">에이전시 수수료 {agency.commission_rate}%</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor[agency.status]}`}>
            {statusLabel[agency.status]}
          </span>
        </div>

        {agency.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-700">
            <p className="font-semibold mb-1">⏳ 심사 진행 중</p>
            <p>관리자가 신청을 검토 중입니다. 승인 후 강사 초대 링크를 발급할 수 있습니다.</p>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: '소속 강사', value: `${instructors.length}명`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '누적 에이전시 수익', value: formatPrice(totalPayout), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon size={16} className={k.color} />
              </div>
              <p className="text-xs text-brand-grey">{k.label}</p>
              <p className="text-lg font-bold text-brand-ink">{k.value}</p>
            </div>
          ))}
        </div>

        {/* 소속 강사 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/20">
            <span className="text-sm font-semibold text-brand-ink">소속 강사</span>
            {agency.status === 'approved' && (
              <button
                onClick={createInvite}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-brand-deep hover:underline disabled:opacity-50"
              >
                <Plus size={12} /> 초대 링크 생성
              </button>
            )}
          </div>
          {instructors.length === 0 ? (
            <p className="text-xs text-brand-grey text-center py-8">소속 강사가 없습니다</p>
          ) : (
            <div className="divide-y divide-brand-mist/20">
              {instructors.map((inst: any) => (
                <div key={inst.instructor_id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-ink">{inst.users?.name ?? '-'}</p>
                    <p className="text-xs text-brand-grey">{inst.users?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${inst.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                      {inst.status === 'approved' ? '활성' : '심사 중'}
                    </span>
                    <button
                      onClick={() => removeInstructor(inst.instructor_id, inst.users?.name ?? '강사')}
                      disabled={removingId === inst.instructor_id}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                      title="에이전시에서 제거"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 초대 링크 */}
        {agency.status === 'approved' && invites.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
            <div className="px-5 py-4 border-b border-brand-mist/20">
              <span className="text-sm font-semibold text-brand-ink">초대 링크</span>
            </div>
            <div className="divide-y divide-brand-mist/20">
              {invites.map((inv: any) => {
                const expired = new Date(inv.expires_at) < new Date()
                return (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-xs font-mono text-brand-grey">{inv.token.slice(0, 12)}...</p>
                      <p className="text-xs text-brand-grey">
                        {inv.used_at ? `사용됨 · ${inv.users?.name ?? ''}` : expired ? '만료됨' : `${new Date(inv.expires_at).toLocaleDateString('ko-KR')} 까지`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!inv.used_at && !expired && (
                        <button
                          onClick={() => copyInviteLink(inv.token)}
                          className="flex items-center gap-1 text-xs text-brand-deep hover:underline"
                        >
                          <Copy size={12} /> 복사
                        </button>
                      )}
                      {expired && !inv.used_at && (
                        <button
                          onClick={() => reissueInvite(inv.id)}
                          disabled={reissuingId === inv.id}
                          className="flex items-center gap-1 text-xs text-orange-500 hover:underline disabled:opacity-50"
                        >
                          <RefreshCw size={12} /> 재발급
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 정산 내역 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30">
          <div className="px-5 py-4 border-b border-brand-mist/20">
            <span className="text-sm font-semibold text-brand-ink">에이전시 정산 내역</span>
          </div>
          {payouts.length === 0 ? (
            <p className="text-xs text-brand-grey text-center py-8">정산 내역이 없습니다</p>
          ) : (
            <div className="divide-y divide-brand-mist/20">
              {payouts.map((p: any) => (
                <div key={p.id}>
                  <button
                    onClick={() => setExpandedPayout(expandedPayout === p.id ? null : p.id)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-brand-bg/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-brand-ink">{p.period_year}년 {p.period_month}월</p>
                      <p className="text-xs text-brand-grey">강사 {p.instructor_count}명 · 총매출 {formatPrice(p.total_gross)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-deep">{formatPrice(p.agency_fee)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${p.status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                          {p.status === 'paid' ? '지급 완료' : '대기'}
                        </span>
                      </div>
                      {expandedPayout === p.id ? <ChevronUp size={14} className="text-brand-grey" /> : <ChevronDown size={14} className="text-brand-grey" />}
                    </div>
                  </button>
                  {expandedPayout === p.id && p.instructor_details && (
                    <div className="bg-brand-bg/50 px-5 pb-3">
                      <p className="text-xs font-medium text-brand-grey mb-2 pt-2">강사별 수익</p>
                      <div className="space-y-1.5">
                        {(p.instructor_details as any[]).map((d: any) => (
                          <div key={d.instructor_id} className="flex justify-between text-xs">
                            <span className="text-brand-ink">{d.name}</span>
                            <span className="text-brand-grey">매출 {formatPrice(d.gross)} · 수수료 <span className="text-brand-deep font-medium">{formatPrice(d.fee)}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
